// controllers/userManagementController.js
const pool = require('../config/database');
const jwt = require('jsonwebtoken');


// GET /api/users?page=1&limit=10&search=&roleId=&deptId=
exports.listUsers = async (req, res) => {
  try {
    const page  = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
    const offset = (page - 1) * limit;

    const search  = (req.query.search || '').trim();
    const roleId  = req.query.roleId ? parseInt(req.query.roleId, 10) : null;
    const deptId  = req.query.deptId ? parseInt(req.query.deptId, 10) : null;

    const where = [];
    const args  = [];

    if (search) {
      where.push(`(e.FullName LIKE ? OR e.Username LIKE ? OR e.Email LIKE ? OR e.PhoneNumber LIKE ?)`);
      const s = `%${search}%`;
      args.push(s, s, s, s);
    }
    if (roleId) { where.push(`e.RoleID = ?`); args.push(roleId); }
    if (deptId) { where.push(`e.DepartmentID = ?`); args.push(deptId); }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `
      SELECT e.EmployeeID, e.FullName, e.Username, e.Email, e.PhoneNumber,
             e.RoleID, r.RoleName,
             e.DepartmentID, d.DepartmentName
      FROM employees e
      LEFT JOIN roles r ON e.RoleID = r.RoleID
      LEFT JOIN departments d ON e.DepartmentID = d.DepartmentID
      ${whereSql}
      ORDER BY e.EmployeeID DESC
      LIMIT ? OFFSET ?
      `,
      [...args, limit, offset]
    );

    const [[{ total }]] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM employees e
      ${whereSql}
      `,
      args
    );

    res.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    });
  } catch (err) {
    console.error('listUsers error:', err);
    res.status(500).json({ success: false, message: 'Error fetching users', error: err.message });
  }
};

// GET /api/users/stats
exports.getStats = async (_req, res) => {
  try {
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM employees`);
    const [[{ superAdmins }]] = await pool.query(`SELECT COUNT(*) AS superAdmins FROM employees WHERE RoleID = 1`);
    const [[{ admins }]] = await pool.query(`SELECT COUNT(*) AS admins FROM employees WHERE RoleID = 3`);
    const [[{ employees }]] = await pool.query(`SELECT COUNT(*) AS employees FROM employees WHERE RoleID = 2`);

    res.json({
      success: true,
      data: { total, superAdmins, admins, employees },
    });
  } catch (err) {
    console.error('getStats error:', err);
    res.status(500).json({ success: false, message: 'Error fetching stats', error: err.message });
  }
};

// PUT /api/users/:id - تحديث بيانات المستخدم
exports.updateUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { FullName, Email, RoleID, DepartmentID } = req.body;

    // التحقق من صحة البيانات
    if (!FullName || !Email) {
      return res.status(400).json({ success: false, message: 'الاسم والبريد الإلكتروني مطلوبان' });
    }

    if (RoleID && ![1,2,3].includes(Number(RoleID))) {
      return res.status(400).json({ success: false, message: 'الدور غير صالح' });
    }

    // تحديث البيانات
    const updateFields = [];
    const updateValues = [];

    if (FullName) {
      updateFields.push('FullName = ?');
      updateValues.push(FullName);
    }
    if (Email) {
      updateFields.push('Email = ?');
      updateValues.push(Email);
    }
    if (RoleID) {
      updateFields.push('RoleID = ?');
      updateValues.push(Number(RoleID));
    }
    if (DepartmentID !== undefined) {
      updateFields.push('DepartmentID = ?');
      updateValues.push(DepartmentID || null);
    }

    updateFields.push('UpdatedAt = NOW()');
    updateValues.push(id);

    await pool.query(
      `UPDATE employees SET ${updateFields.join(', ')} WHERE EmployeeID = ?`,
      updateValues
    );

    res.json({ success: true, message: 'تم تحديث بيانات المستخدم بنجاح' });
  } catch (err) {
    console.error('updateUser error:', err);
    res.status(500).json({ success: false, message: 'خطأ في تحديث بيانات المستخدم', error: err.message });
  }
};

// PUT /api/users/:id/role  { roleId }
exports.updateUserRole = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { roleId } = req.body;
    if (![1,2,3].includes(Number(roleId))) {
      return res.status(400).json({ success: false, message: 'roleId غير صالح' });
    }

    await pool.query(`UPDATE employees SET RoleID = ?, UpdatedAt = NOW(), UpdatedBy = ? WHERE EmployeeID = ?`,
      [roleId, req.user?.EmployeeID || null, id]);

    res.json({ success: true, message: 'تم تحديث الدور بنجاح' });
  } catch (err) {
    console.error('updateUserRole error:', err);
    res.status(500).json({ success: false, message: 'Error updating role', error: err.message });
  }
};

// DELETE /api/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await pool.query(`DELETE FROM employees WHERE EmployeeID = ?`, [id]);
    res.json({ success: true, message: 'تم حذف المستخدم' });
  } catch (err) {
    console.error('deleteUser error:', err);
    res.status(500).json({ success: false, message: 'Error deleting user', error: err.message });
  }
};

// POST /api/users/impersonate/:id  { reason? }

exports.impersonateUser = async (req, res) => {
  try {
    if (req.user.RoleID !== 1) {
      return res.status(403).json({ success: false, message: 'السماح للسوبر أدمن فقط' });
    }

    const targetId = parseInt(req.params.id, 10);
    const reason = (req.body?.reason || '').slice(0, 500);

    await pool.query(
      `INSERT INTO impersonations (SuperAdminID, TargetEmployeeID, Reason) VALUES (?, ?, ?)`,
      [req.user.EmployeeID, targetId, reason || null]
    );

    // اجلب بيانات الهدف (موظف أو أدمن)
    const [[target]] = await pool.query(
      `SELECT EmployeeID, FullName, Username, Email, RoleID, DepartmentID
       FROM employees WHERE EmployeeID = ? LIMIT 1`,
      [targetId]
    );
    if (!target) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    // (اختياري) منع التقمص إلى سوبر أدمن آخر
    if (Number(target.RoleID) === 1) {
      return res.status(403).json({ success:false, message:'لا يمكن التقمص إلى Super Admin' });
    }

    // جهّز توكن بهوية الهدف
    const token = jwt.sign(
      {
        employeeID: target.EmployeeID,
        username: target.Username,
        roleID: target.RoleID,
        roleName: null,
        departmentID: target.DepartmentID
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '2h' }
    );

    // (لو تستخدم سيشن، ممكن تترك السطرين الحاليين كما هم)
    req.session = req.session || {};
    req.session.impersonatedUser = targetId;

    return res.json({
      success: true,
      message: 'تم تفعيل السويتش يوزر',
      impersonating: targetId,
      token,
      user: target
    });
  } catch (err) {
    console.error('impersonateUser error:', err);
    res.status(500).json({ success: false, message: 'Error impersonating user', error: err.message });
  }
};


// POST /api/users/impersonate/end
exports.endImpersonation = async (req, res) => {
  try {
    req.session = req.session || {};
    req.session.impersonatedUser = null;
    // أنهِ فقط جلسات السوبر أدمن الحالي
    const superAdminId = req.user?.EmployeeID || req.user?.employeeID || null;
    if (superAdminId) {
      await pool.query(`UPDATE impersonations SET EndedAt = NOW() WHERE EndedAt IS NULL AND SuperAdminID = ?`, [superAdminId]);
    } else {
      await pool.query(`UPDATE impersonations SET EndedAt = NOW() WHERE EndedAt IS NULL`);
    }
    res.json({ success: true, message: 'تم إنهاء السويتش يوزر' });
  } catch (err) {
    console.error('endImpersonation error:', err);
    res.status(500).json({ success: false, message: 'Error ending impersonation', error: err.message });
  }
};
