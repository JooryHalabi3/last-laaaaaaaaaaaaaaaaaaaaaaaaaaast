const pool = require('../config/database');

// جلب جميع الموظفين مع أدوارهم
exports.getAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT e.EmployeeID, e.FullName, e.Username, e.Email, e.PhoneNumber,
             r.RoleName, d.DepartmentName
      FROM employees e
      LEFT JOIN roles r ON e.RoleID = r.RoleID
      LEFT JOIN departments d ON e.DepartmentID = d.DepartmentID
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching users', error: err.message });
  }
};

// تحديث دور موظف
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { RoleID } = req.body;
    await pool.query(`UPDATE employees SET RoleID = ? WHERE EmployeeID = ?`, [RoleID, id]);
    res.json({ success: true, message: 'Role updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating role', error: err.message });
  }
};

// حذف موظف
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM employees WHERE EmployeeID = ?`, [id]);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting user', error: err.message });
  }
};

// سويتش يوزر (Impersonation)
exports.impersonateUser = async (req, res) => {
  try {
    const superAdminId = req.user.EmployeeID;
    const { id: targetEmployeeID } = req.params;

    // سجل عملية الـ impersonation
    await pool.query(
      `INSERT INTO impersonations (SuperAdminID, TargetEmployeeID) VALUES (?, ?)`,
      [superAdminId, targetEmployeeID]
    );

    // بدل الجلسة مؤقتاً
    req.session.impersonatedUser = targetEmployeeID;

    res.json({ success: true, message: 'Now impersonating user', impersonatedUser: targetEmployeeID });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error impersonating user', error: err.message });
  }
};

// إنهاء الـ impersonation
exports.endImpersonation = async (req, res) => {
  try {
    req.session.impersonatedUser = null;
    await pool.query(`UPDATE impersonations SET EndedAt = NOW() WHERE EndedAt IS NULL`);
    res.json({ success: true, message: 'Impersonation ended' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error ending impersonation', error: err.message });
  }
};
