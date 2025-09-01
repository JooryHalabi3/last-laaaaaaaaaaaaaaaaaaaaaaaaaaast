// controllers/userManagementController.js
const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const { logActivity } = require('./logsController');

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
      where.push(`(u.FullName LIKE ? OR u.Username LIKE ? OR u.Email LIKE ? OR u.Phone LIKE ?)`);
      const s = `%${search}%`;
      args.push(s, s, s, s);
    }
    if (roleId) { where.push(`u.RoleID = ?`); args.push(roleId); }
    if (deptId) { where.push(`u.DepartmentID = ?`); args.push(deptId); }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `
      SELECT u.UserID, u.FullName, u.Username, u.Email, u.Phone,
             u.NationalID, u.EmployeeNumber, u.IsActive,
             u.RoleID, r.RoleName,
             u.DepartmentID, d.DepartmentName,
             u.CreatedAt, u.UpdatedAt
      FROM users u
      LEFT JOIN roles r ON u.RoleID = r.RoleID
      LEFT JOIN departments d ON u.DepartmentID = d.DepartmentID
      ${whereSql}
      ORDER BY u.UserID DESC
      LIMIT ? OFFSET ?
      `,
      [...args, limit, offset]
    );

    const [[{ total }]] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM users u
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
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('listUsers error:', err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

// POST /api/users
exports.createUser = async (req, res) => {
  try {
    const { 
      fullName, 
      username, 
      email, 
      phone, 
      nationalID, 
      employeeNumber, 
      password, 
      roleID, 
      departmentID 
    } = req.body;

    // التحقق من البيانات المطلوبة
    if (!fullName || !username || !email || !phone || !nationalID || 
        !employeeNumber || !password || !roleID) {
      return res.status(400).json({
        success: false,
        message: 'جميع البيانات الأساسية مطلوبة'
      });
    }

    // التحقق من عدم تكرار البيانات الفريدة
    const [existing] = await pool.query(
      `SELECT UserID FROM users 
       WHERE Username = ? OR Email = ? OR Phone = ? OR NationalID = ? OR EmployeeNumber = ?`,
      [username, email, phone, nationalID, employeeNumber]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'يوجد مستخدم بنفس اسم المستخدم، البريد الإلكتروني، رقم الهاتف، الهوية الوطنية، أو رقم الموظف'
      });
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 12);

    // إنشاء المستخدم
    const [result] = await pool.query(
      `INSERT INTO users (FullName, Username, Email, Phone, NationalID, EmployeeNumber, 
                         PasswordHash, RoleID, DepartmentID, IsActive) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [fullName, username, email, phone, nationalID, employeeNumber, 
       hashedPassword, roleID, departmentID]
    );

    // تسجيل النشاط
    await logActivity(req.user.UserID, result.insertId, 'USER_CREATED', {
      fullName, username, email, roleID, departmentID
    });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء المستخدم بنجاح',
      data: { UserID: result.insertId }
    });

  } catch (err) {
    console.error('createUser error:', err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

// PUT /api/users/:id
exports.updateUser = async (req, res) => {
  try {
    const userID = parseInt(req.params.id, 10);
    const { 
      fullName, 
      username, 
      email, 
      phone, 
      nationalID, 
      employeeNumber, 
      roleID, 
      departmentID, 
      isActive 
    } = req.body;

    // التحقق من وجود المستخدم
    const [existingUser] = await pool.query(
      'SELECT UserID, FullName FROM users WHERE UserID = ?',
      [userID]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // التحقق من عدم تكرار البيانات الفريدة مع مستخدمين آخرين
    if (username || email || phone || nationalID || employeeNumber) {
      const [duplicates] = await pool.query(
        `SELECT UserID FROM users 
         WHERE (Username = ? OR Email = ? OR Phone = ? OR NationalID = ? OR EmployeeNumber = ?) 
         AND UserID != ?`,
        [username || '', email || '', phone || '', nationalID || '', employeeNumber || '', userID]
      );

      if (duplicates.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'البيانات متكررة مع مستخدم آخر'
        });
      }
    }

    // تحديث البيانات
    const updates = [];
    const values = [];

    if (fullName) { updates.push('FullName = ?'); values.push(fullName); }
    if (username) { updates.push('Username = ?'); values.push(username); }
    if (email) { updates.push('Email = ?'); values.push(email); }
    if (phone) { updates.push('Phone = ?'); values.push(phone); }
    if (nationalID) { updates.push('NationalID = ?'); values.push(nationalID); }
    if (employeeNumber) { updates.push('EmployeeNumber = ?'); values.push(employeeNumber); }
    if (roleID) { updates.push('RoleID = ?'); values.push(roleID); }
    if (departmentID !== undefined) { updates.push('DepartmentID = ?'); values.push(departmentID); }
    if (isActive !== undefined) { updates.push('IsActive = ?'); values.push(isActive ? 1 : 0); }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'لا توجد بيانات للتحديث'
      });
    }

    updates.push('UpdatedAt = CURRENT_TIMESTAMP');
    values.push(userID);

    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE UserID = ?`,
      values
    );

    // تسجيل النشاط
    await logActivity(req.user.UserID, userID, 'USER_UPDATED', req.body);

    res.json({
      success: true,
      message: 'تم تحديث المستخدم بنجاح'
    });

  } catch (err) {
    console.error('updateUser error:', err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

// DELETE /api/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const userID = parseInt(req.params.id, 10);

    // التحقق من وجود المستخدم
    const [existingUser] = await pool.query(
      'SELECT UserID, FullName, Username FROM users WHERE UserID = ?',
      [userID]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // منع حذف المستخدم الحالي
    if (userID === req.user.UserID) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكنك حذف نفسك'
      });
    }

    // حذف المستخدم (تعطيل بدلاً من الحذف الفعلي)
    await pool.query(
      'UPDATE users SET IsActive = 0, UpdatedAt = CURRENT_TIMESTAMP WHERE UserID = ?',
      [userID]
    );

    // تسجيل النشاط
    await logActivity(req.user.UserID, userID, 'USER_DELETED', {
      deletedUser: existingUser[0]
    });

    res.json({
      success: true,
      message: 'تم حذف المستخدم بنجاح'
    });

  } catch (err) {
    console.error('deleteUser error:', err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

// GET /api/users/:id
exports.getUserById = async (req, res) => {
  try {
    const userID = parseInt(req.params.id, 10);

    const [rows] = await pool.query(
      `SELECT u.UserID, u.FullName, u.Username, u.Email, u.Phone,
              u.NationalID, u.EmployeeNumber, u.IsActive,
              u.RoleID, r.RoleName,
              u.DepartmentID, d.DepartmentName,
              u.CreatedAt, u.UpdatedAt
       FROM users u
       LEFT JOIN roles r ON u.RoleID = r.RoleID
       LEFT JOIN departments d ON u.DepartmentID = d.DepartmentID
       WHERE u.UserID = ?`,
      [userID]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });

  } catch (err) {
    console.error('getUserById error:', err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

// PUT /api/users/:id/password
exports.changeUserPassword = async (req, res) => {
  try {
    const userID = parseInt(req.params.id, 10);
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور الجديدة مطلوبة'
      });
    }

    // التحقق من وجود المستخدم
    const [existingUser] = await pool.query(
      'SELECT UserID, FullName FROM users WHERE UserID = ?',
      [userID]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // تشفير كلمة المرور الجديدة
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // تحديث كلمة المرور
    await pool.query(
      'UPDATE users SET PasswordHash = ?, UpdatedAt = CURRENT_TIMESTAMP WHERE UserID = ?',
      [hashedPassword, userID]
    );

    // تسجيل النشاط
    await logActivity(req.user.UserID, userID, 'USER_PASSWORD_CHANGED', {
      targetUser: existingUser[0].FullName
    });

    res.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح'
    });

  } catch (err) {
    console.error('changeUserPassword error:', err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

// GET /api/users/roles
exports.getRoles = async (req, res) => {
  try {
    const [roles] = await pool.query(
      'SELECT RoleID, RoleName FROM roles ORDER BY RoleID'
    );

    res.json({
      success: true,
      data: roles
    });

  } catch (err) {
    console.error('getRoles error:', err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

// GET /api/users/departments
exports.getDepartments = async (req, res) => {
  try {
    const [departments] = await pool.query(
      'SELECT DepartmentID, DepartmentName FROM departments ORDER BY DepartmentName'
    );

    res.json({
      success: true,
      data: departments
    });

  } catch (err) {
    console.error('getDepartments error:', err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

// GET /api/users/stats
exports.getUserStats = async (req, res) => {
  try {
    // إحصائيات المستخدمين
    const [userStats] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN IsActive = 0 THEN 1 ELSE 0 END) as inactive
      FROM users
    `);

    // إحصائيات حسب الأدوار
    const [roleStats] = await pool.query(`
      SELECT r.RoleName, COUNT(u.UserID) as count
      FROM roles r
      LEFT JOIN users u ON r.RoleID = u.RoleID AND u.IsActive = 1
      GROUP BY r.RoleID, r.RoleName
      ORDER BY count DESC
    `);

    // إحصائيات حسب الأقسام
    const [deptStats] = await pool.query(`
      SELECT d.DepartmentName, COUNT(u.UserID) as count
      FROM departments d
      LEFT JOIN users u ON d.DepartmentID = u.DepartmentID AND u.IsActive = 1
      GROUP BY d.DepartmentID, d.DepartmentName
      ORDER BY count DESC
    `);

    res.json({
      success: true,
      data: {
        users: userStats[0],
        byRole: roleStats,
        byDepartment: deptStats
      }
    });

  } catch (err) {
    console.error('getUserStats error:', err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};