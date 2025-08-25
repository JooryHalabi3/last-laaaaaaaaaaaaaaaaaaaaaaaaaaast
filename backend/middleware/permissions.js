// middleware/permissions.js
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { logActivity } = require('../controllers/logsController');

/**
 * لو ما كان عندك auth قبل هذا الميدلوير، يقرأ التوكن سريعاً كـ fallback
 * لكن الأفضل تستخدم authenticateToken قبله.
 */
const ensureReqUserOrDecode = async (req) => {
  if (req.user) return req.user;

  const authHeader = req.headers['authorization'] || '';
  const token = (authHeader.startsWith('Bearer ') && authHeader.split(' ')[1]) || null;
  if (!token) throw new Error('NO_TOKEN');

  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  const [rows] = await pool.execute(
    `SELECT e.*, r.RoleName 
     FROM Employees e 
     LEFT JOIN Roles r ON r.RoleID = e.RoleID
     WHERE e.EmployeeID = ?`,
    [decoded.employeeID]
  );
  if (rows.length === 0) throw new Error('NO_USER');
  return rows[0];
};

// يتحقق أن المستخدم "موظف" (RoleID = 2)
const checkEmployeePermissions = async (req, res, next) => {
  try {
    const user = await ensureReqUserOrDecode(req);
    if (Number(user.RoleID) !== 2) {
      // سجّل محاولة وصول غير مصرح بها
      try {
        await logActivity(
          user.EmployeeID,
          user.Username,
          'unauthorized_access',
          `محاولة وصول غير مصرح: ${req.originalUrl}`,
          req.ip,
          req.get('User-Agent'),
          null,
          'employee_panel'
        );
      } catch (e) { /* لا توقف الطلب بسبب اللوق */ }

      return res.status(403).json({ success: false, message: 'ليس لديك صلاحية للوصول لهذه الصفحة' });
    }

    req.user = user;
    next();
  } catch (error) {
    const msg =
      error.message === 'NO_TOKEN' ? 'Token مطلوب للمصادقة' :
      error.message === 'NO_USER'  ? 'المستخدم غير موجود' : 'Token غير صالح';
    const code = error.message === 'NO_TOKEN' || error.message === 'NO_USER' ? 401 : 403;
    console.error('خطأ في التحقق من صلاحيات الموظف:', error);
    return res.status(code).json({ success: false, message: msg });
  }
};

// يتحقق أن الشكوى تخص الموظف أو مسندة له
const checkComplaintOwnership = async (req, res, next) => {
  try {
    const { complaintId } = req.params;
    const employeeId = req.user?.EmployeeID;

    const [complaints] = await pool.execute(
      `SELECT * FROM Complaints 
       WHERE ComplaintID = ? AND (EmployeeID = ? OR AssignedTo = ?)`,
      [complaintId, employeeId, employeeId]
    );

    if (complaints.length === 0) {
      try {
        await logActivity(
          req.user.EmployeeID,
          req.user.Username,
          'unauthorized_complaint_access',
          `محاولة وصول لشكوى غير مصرح: ${complaintId}`,
          req.ip,
          req.get('User-Agent'),
          complaintId,
          'complaint'
        );
      } catch (e) {}

      return res.status(403).json({ success: false, message: 'ليس لديك صلاحية للوصول لهذه الشكوى' });
    }

    req.complaint = complaints[0];
    next();
  } catch (error) {
    console.error('خطأ في التحقق من ملكية الشكوى:', error);
    return res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};

// صفحات محجوبة على الموظفين
const checkBlockedPages = async (req, res, next) => {
  const blockedPages = [
  '/general-complaints.html',
  '/dashboard.html',
  '/dept-admin/department-management.html',
  '/recycle-bin.html',
  '/dept-admin/logs.html'
];

// Admin-specific pages that should only be accessible to Department Admins (RoleID=3) or Super Admins (RoleID=1)
const adminOnlyPages = [
  '/dept-admin/logs.html',
  '/dept-admin/department-management.html',
  '/superadmin/permissions.html'
];

// Pages blocked for specific roles
const roleBlockedPages = {
  2: [ // Employee (RoleID = 2) blocked pages
    '/dept-admin/logs.html',
    '/dept-admin/department-management.html',
    '/superadmin/manage-users.html',
    '/superadmin/permissions.html',
    '/superadmin/logs.html'
  ]
};

  const currentPath = req.path || req.originalUrl || '';
  
  // Check if user is authenticated
  const token = req.headers.authorization?.replace('Bearer ', '');
  let userRole = null;
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const [users] = await pool.execute('SELECT RoleID FROM employees WHERE EmployeeID = ?', [decoded.EmployeeID]);
      if (users.length > 0) {
        userRole = users[0].RoleID;
      }
    } catch (err) {
      // Token invalid, will be handled by other middleware
    }
  }
  
  // Check admin-only pages
  if (adminOnlyPages.some(p => currentPath.includes(p))) {
    if (!userRole || (userRole !== 1 && userRole !== 3)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
  }
  
  // Check role-specific blocked pages
  if (userRole && roleBlockedPages[userRole]) {
    if (roleBlockedPages[userRole].some(p => currentPath.includes(p))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient privileges.'
      });
    }
  }
  
  if (blockedPages.some(p => currentPath.includes(p))) {
    try {
      await logActivity(
        req.user?.EmployeeID || null,
        req.user?.Username || null,
        'blocked_page_access',
        `محاولة وصول لصفحة محجوبة: ${currentPath}`,
        req.ip,
        req.get('User-Agent'),
        null,
        'page_access'
      );
    } catch (e) {}

    return res.status(403).json({ success: false, message: 'هذه الصفحة محجوبة على الموظفين' });
  }

  next();
};

// فاكتوري لتسجيل نشاط معيّن
const logEmployeeActivity = (activityType, description, relatedIDPath = null, relatedType = null) => {
  return async (req, res, next) => {
    try {
      let relatedID = null;

      // استخراج relatedID من مسار مثل "params.complaintId"
      if (relatedIDPath) {
        const parts = relatedIDPath.split('.');
        let cur = req;
        for (const p of parts) {
          cur = cur?.[p];
          if (cur == null) break;
        }
        relatedID = cur ?? null;
      }

      await logActivity(
        req.user?.EmployeeID || null,
        req.user?.Username || null,
        activityType,
        description,
        req.ip,
        req.get('User-Agent'),
        relatedID,
        relatedType
      );
    } catch (e) {
      console.error('خطأ في تسجيل نشاط الموظف:', e);
    } finally {
      next();
    }
  };
};

module.exports = {
  checkEmployeePermissions,
  checkComplaintOwnership,
  checkBlockedPages,
  logEmployeeActivity,
};
