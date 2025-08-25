// middleware/auth.js
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

async function authenticateToken(req, res, next) {
  try {
    // أولوية للسِشن (مثلاً بعد impersonation)
    if (req.session?.user) {
      req.user = req.session.user;
      return next();
    }

    const header = req.headers['authorization'] || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Token مطلوب للمصادقة' });
    }

    // ملاحظة: اسم الحقل داخل التوكن قد يكون employeeID
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const employeeId = decoded.EmployeeID || decoded.employeeID;

    const [rows] = await pool.execute(
      'SELECT * FROM Employees WHERE EmployeeID = ?',
      [employeeId]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'المستخدم غير موجود' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(403).json({ success: false, message: 'Token غير صالح' });
  }
}

// يدعم طريقتين للاستيراد: الافتراضي وبالاسم
module.exports = authenticateToken;
module.exports.authenticateToken = authenticateToken;
