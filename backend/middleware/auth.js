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
    if (!decoded?.employeeID) {
      return res.status(403).json({ success: false, message: 'Token غير صالح' });
    }

    // اجلب المستخدم + اسم الدور (اختياري)
    const [rows] = await db.execute(
      `SELECT e.*, r.RoleName
       FROM Employees e
       LEFT JOIN Roles r ON r.RoleID = e.RoleID
       WHERE e.EmployeeID = ?`,
      [decoded.employeeID]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'المستخدم غير موجود' });
    }

    const user = rows[0];

    // تأكد الأرقام أرقام
    user.RoleID = Number(user.RoleID);
    user.DepartmentID = user.DepartmentID != null ? Number(user.DepartmentID) : null;

    // فلاتر مساعدة سريعة
    user.isSuperAdmin = user.RoleID === 1;
    user.isEmployee   = user.RoleID === 2;
    user.isAdmin      = user.RoleID === 3;

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ success: false, message: 'Token غير صالح' });
  }
};

module.exports = { authenticateToken };
