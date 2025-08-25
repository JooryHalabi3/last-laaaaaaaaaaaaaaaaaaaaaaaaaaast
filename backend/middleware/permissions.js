// middleware/permissions.js
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { logActivity } = require('../controllers/logsController');

// التحقق من صلاحيات "الموظف" فقط (RoleID = 2)
async function checkEmployeePermissions(req, res, next) {
  try {
    // لو فيه سِشن من auth، استخدمه
    if (req.session?.user) {
      req.user = req.session.user;
    } else {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) return res.status(401).json({ success: false, message: 'Token مطلوب للمصادقة' });

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const employeeId = decoded.EmployeeID || decoded.employeeID;

      const [users] = await pool.execute(
        `SELECT e.*, r.RoleName 
         FROM Employees e 
         JOIN Roles r ON e.RoleID = r.RoleID 
         WHERE e.EmployeeID = ?`,
        [employeeId]
      );
      if (!users.length) return res.status(401).json({ success: false, message: 'المستخدم غير موجود' });
      req.user = users[0];
    }

    if (req.user.RoleID !== 2) {
      await logActivity(
        req.user.EmployeeID,
        req.user.Username,
        'unauthorized_access',
        `محاولة وصول غير مصرح: ${req.originalUrl}`,
        req.ip,
        req.get('User-Agent'),
        null,
        'employee_panel'
      );
      return res.status(403).json({ success: false, message: 'ليس لديك صلاحية للوصول لهذه الصفحة' });
    }

    next();
  } catch (error) {
    console.error('خطأ في التحقق من صلاحيات الموظف:', error);
    return res.status(403).json({ success: false, message: 'Token غير صالح' });
  }
}

// التحقق من ملكية الشكوى
async function checkComplaintOwnership(req, res, next) {
  try {
    const { complaintId } = req.params;
    const employeeId = req.user.EmployeeID;

    const [complaints] = await pool.execute(
      `SELECT * FROM Complaints 
       WHERE ComplaintID = ? AND (EmployeeID = ? OR AssignedTo = ?)`,
      [complaintId, employeeId, employeeId]
    );

    if (!complaints.length) {
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
      return res.status(403).json({ success: false, message: 'ليس لديك صلاحية للوصول لهذه الشكوى' });
    }

    req.complaint = complaints[0];
    next();
  } catch (error) {
    console.error('خطأ في التحقق من ملكية الشكوى:', error);
    return res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

// الصفحات المحجوبة على الموظفين
async function checkBlockedPages(req, res, next) {
  const blockedPages = [
    '/general-complaints.html',
    '/dashboard.html',
    '/admin.html',
    '/admin/',
    '/department-management.html',
    '/recycle-bin.html',
    '/employee-data.html',
    '/logs.html'
  ];

  const currentPath = req.path || req.originalUrl || '';

  for (const blockedPage of blockedPages) {
    if (currentPath.includes(blockedPage)) {
      await logActivity(
        req.user.EmployeeID,
        req.user.Username,
        'blocked_page_access',
        `محاولة وصول لصفحة محجوبة: ${currentPath}`,
        req.ip,
        req.get('User-Agent'),
        null,
        'page_access'
      );
      return res.status(403).json({ success: false, message: 'هذه الصفحة محجوبة على الموظفين' });
    }
  }

  next();
}

// لوج نشاط عام قابل لإعادة الاستخدام
function logEmployeeActivity(activityType, description, relatedIDPath = null, relatedType = null) {
  return async (req, res, next) => {
    try {
      let relatedID = null;

      if (relatedIDPath && req.params) {
        const parts = relatedIDPath.split('.');
        let value = req;
        for (const p of parts) {
          value = value?.[p];
        }
        relatedID = value ?? null;
      }

      await logActivity(
        req.user.EmployeeID,
        req.user.Username,
        activityType,
        description,
        req.ip,
        req.get('User-Agent'),
        relatedID,
        relatedType
      );
      next();
    } catch (err) {
      console.error('خطأ في تسجيل نشاط الموظف:', err);
      next();
    }
  };
}

module.exports = {
  checkEmployeePermissions,
  checkComplaintOwnership,
  checkBlockedPages,
  logEmployeeActivity
};
