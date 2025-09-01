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
  const userID = decoded.UserID || decoded.employeeID;
  
  const [rows] = await pool.execute(
    `SELECT u.*, r.RoleName 
     FROM users u 
     LEFT JOIN roles r ON r.RoleID = u.RoleID
     WHERE u.UserID = ? AND u.IsActive = 1`,
    [userID]
  );
  if (rows.length === 0) throw new Error('NO_USER');
  
  // إضافة خصائص للتوافق
  const user = rows[0];
  user.EmployeeID = user.UserID;
  
  return user;
};

// يتحقق أن المستخدم "موظف" (RoleID = 2)
const checkEmployeePermissions = async (req, res, next) => {
  try {
    const user = await ensureReqUserOrDecode(req);
    if (Number(user.RoleID) !== 2) {
      // سجّل محاولة وصول غير مصرح بها
      try {
        await logActivity(
          user.UserID,
          null,
          'UNAUTHORIZED_ACCESS_ATTEMPT',
          {
            attemptedUrl: req.originalUrl,
            userRole: user.RoleID,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          }
        );
      } catch (e) { /* لا توقف الطلب بسبب اللوق */ }

      return res.status(403).json({ 
        success: false, 
        message: 'ليس لديك صلاحية للوصول لهذه الصفحة' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('checkEmployeePermissions error:', error);
    if (error.message === 'NO_TOKEN') {
      return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول أولاً' });
    }
    if (error.message === 'NO_USER') {
      return res.status(401).json({ success: false, message: 'المستخدم غير موجود' });
    }
    res.status(500).json({ success: false, message: 'خطأ في التحقق من الصلاحيات' });
  }
};

// يتحقق من ملكية الشكوى (أن المستخدم هو منشئ الشكوى أو مكلف بها)
const checkComplaintOwnership = async (req, res, next) => {
  try {
    const user = await ensureReqUserOrDecode(req);
    const complaintId = req.params.complaintId || req.params.complaintID;

    if (!complaintId) {
      return res.status(400).json({ 
        success: false, 
        message: 'معرف الشكوى مطلوب' 
      });
    }

    // التحقق من ملكية الشكوى أو التكليف بها
    const [ownership] = await pool.execute(`
      SELECT c.ComplaintID
      FROM complaints c
      LEFT JOIN complaint_assignments ca ON c.ComplaintID = ca.ComplaintID
      WHERE c.ComplaintID = ? 
      AND (c.CreatedBy = ? OR ca.AssignedToUserID = ?)
    `, [complaintId, user.UserID, user.UserID]);

    if (ownership.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'ليس لديك صلاحية للوصول لهذه الشكوى' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('checkComplaintOwnership error:', error);
    res.status(500).json({ success: false, message: 'خطأ في التحقق من ملكية الشكوى' });
  }
};

// تسجيل نشاط الموظف
const logEmployeeActivity = (activityType, description, paramPath = null, paramType = null) => {
  return async (req, res, next) => {
    try {
      const user = await ensureReqUserOrDecode(req);
      
      let logDescription = description;
      let relatedID = null;
      
      // استخراج معرف العنصر المرتبط إذا كان محدداً
      if (paramPath && paramType) {
        const pathParts = paramPath.split('.');
        let value = req;
        for (const part of pathParts) {
          value = value[part];
        }
        relatedID = value;
        
        if (relatedID) {
          logDescription += ` (${paramType}: ${relatedID})`;
        }
      }
      
      // تسجيل النشاط باستخدام النظام الجديد
      await logActivity(user.UserID, null, activityType, {
        description: logDescription,
        relatedType: paramType,
        relatedID: relatedID,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      req.user = user;
      next();
    } catch (error) {
      console.error('logEmployeeActivity error:', error);
      // لا نوقف الطلب بسبب خطأ في التسجيل
      next();
    }
  };
};

/**
 * التحقق من صلاحية محددة للمستخدم
 */
const checkPermission = (permissionCode) => {
  return async (req, res, next) => {
    try {
      const user = await ensureReqUserOrDecode(req);

      // السوبر أدمن لديه جميع الصلاحيات
      if (user.RoleID === 1) {
        req.user = user;
        return next();
      }

      // التحقق من الصلاحية في النظام الجديد
      const [result] = await pool.execute(`
        SELECT 
          CASE 
            WHEN up.Allowed IS NOT NULL THEN up.Allowed
            ELSE COALESCE(rp.Allowed, 0)
          END as has_permission
        FROM users u
        LEFT JOIN permissions p ON p.Code = ?
        LEFT JOIN role_permissions rp ON p.PermissionID = rp.PermissionID AND rp.RoleID = u.RoleID
        LEFT JOIN user_permissions up ON p.PermissionID = up.PermissionID AND up.UserID = u.UserID
        WHERE u.UserID = ?
      `, [permissionCode, user.UserID]);

      const hasPermission = result.length > 0 && result[0].has_permission === 1;

      if (!hasPermission) {
        // تسجيل محاولة وصول غير مصرح بها
        await logActivity(user.UserID, null, 'PERMISSION_DENIED', {
          permissionCode,
          attemptedUrl: req.originalUrl
        });

        return res.status(403).json({
          success: false,
          message: 'ليس لديك صلاحية للوصول لهذه الميزة'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('checkPermission error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'خطأ في التحقق من الصلاحيات' 
      });
    }
  };
};

/**
 * التحقق من الدور مع إمكانية الوصول لأدوار متعددة
 */
const checkRole = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  return async (req, res, next) => {
    try {
      const user = await ensureReqUserOrDecode(req);
      
      if (!roles.includes(user.RoleID)) {
        // تسجيل محاولة وصول غير مصرح بها
        await logActivity(user.UserID, null, 'ROLE_ACCESS_DENIED', {
          requiredRoles: roles,
          userRole: user.RoleID,
          attemptedUrl: req.originalUrl
        });

        return res.status(403).json({
          success: false,
          message: 'ليس لديك الدور المطلوب للوصول لهذه الميزة'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('checkRole error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'خطأ في التحقق من الدور' 
      });
    }
  };
};

/**
 * التحقق من أن المستخدم في نفس القسم (للمدراء)
 */
const checkDepartmentAccess = async (req, res, next) => {
  try {
    const user = await ensureReqUserOrDecode(req);
    
    // السوبر أدمن يمكنه الوصول لجميع الأقسام
    if (user.RoleID === 1) {
      req.user = user;
      return next();
    }
    
    // التحقق من وجود DepartmentID للمستخدم
    if (!user.DepartmentID) {
      return res.status(403).json({
        success: false,
        message: 'المستخدم غير مرتبط بأي قسم'
      });
    }
    
    // إضافة معلومات القسم للطلب
    req.userDepartment = user.DepartmentID;
    req.user = user;
    next();
  } catch (error) {
    console.error('checkDepartmentAccess error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في التحقق من صلاحية القسم' 
    });
  }
};

module.exports = {
  ensureReqUserOrDecode,
  checkEmployeePermissions,
  checkComplaintOwnership,
  logEmployeeActivity,
  checkPermission,
  checkRole,
  checkDepartmentAccess
};