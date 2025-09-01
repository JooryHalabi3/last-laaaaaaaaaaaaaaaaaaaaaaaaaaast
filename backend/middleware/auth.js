// middleware/auth.js
const jwt = require('jsonwebtoken');
const db = require('../config/database');

/**
 * يتحقق من الـ JWT ويحمّل بيانات المستخدم ويضعها في req.user
 * يضيف حقول مساعدة: isSuperAdmin, isAdmin, isEmployee
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'] || '';
    const token = (authHeader.startsWith('Bearer ') && authHeader.split(' ')[1]) || null;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Token مطلوب للمصادقة' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const userID = decoded.UserID || decoded.employeeID;
    
    if (!userID) {
      return res.status(403).json({ success: false, message: 'Token غير صالح' });
    }

    // اجلب المستخدم + اسم الدور من الجداول الجديدة
    const [rows] = await db.execute(
      `SELECT u.UserID, u.FullName, u.Username, u.Email, u.Phone, 
              u.NationalID, u.EmployeeNumber, u.RoleID, u.DepartmentID, u.IsActive,
              r.RoleName, d.DepartmentName
       FROM users u
       LEFT JOIN roles r ON r.RoleID = u.RoleID
       LEFT JOIN departments d ON d.DepartmentID = u.DepartmentID
       WHERE u.UserID = ? AND u.IsActive = 1`,
      [userID]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'المستخدم غير موجود أو غير نشط' });
    }

    const user = rows[0];

    // تأكد الأرقام أرقام
    user.RoleID = Number(user.RoleID);
    user.DepartmentID = user.DepartmentID != null ? Number(user.DepartmentID) : null;

    // إضافة خصائص للتوافق مع الكود القديم
    user.EmployeeID = user.UserID;

    // فلاتر مساعدة سريعة (حسب الأدوار الجديدة)
    user.isSuperAdmin = user.RoleID === 1; // SuperAdmin
    user.isEmployee   = user.RoleID === 2; // Employee
    user.isAdmin      = user.RoleID === 3; // Admin

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ success: false, message: 'Token غير صالح' });
  }
};

/**
 * middleware للتحقق من صلاحية معينة
 */
const requirePermission = (permissionCode) => {
  return async (req, res, next) => {
    try {
      const userID = req.user.UserID;

      // جلب صلاحية المستخدم
      const [result] = await db.execute(`
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
      `, [permissionCode, userID]);

      const hasPermission = result.length > 0 && result[0].has_permission === 1;

      if (!hasPermission) {
        return res.status(403).json({ 
          success: false, 
          message: 'ليس لديك صلاحية للوصول لهذه الميزة' 
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'خطأ في التحقق من الصلاحيات' 
      });
    }
  };
};

/**
 * middleware للتحقق من دور معين
 */
const requireRole = (roleID) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'يجب تسجيل الدخول أولاً' 
      });
    }

    if (req.user.RoleID !== roleID) {
      return res.status(403).json({ 
        success: false, 
        message: 'ليس لديك صلاحية للوصول لهذه الميزة' 
      });
    }

    next();
  };
};

/**
 * middleware للتحقق من أدوار متعددة
 */
const requireAnyRole = (roleIDs) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'يجب تسجيل الدخول أولاً' 
      });
    }

    if (!roleIDs.includes(req.user.RoleID)) {
      return res.status(403).json({ 
        success: false, 
        message: 'ليس لديك صلاحية للوصول لهذه الميزة' 
      });
    }

    next();
  };
};

module.exports = { 
  authenticateToken, 
  requirePermission,
  requireRole,
  requireAnyRole
};