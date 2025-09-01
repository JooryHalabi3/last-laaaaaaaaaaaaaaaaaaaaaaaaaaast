// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { logActivity } = require('./logsController');

// ===== helpers =====
async function ensureCoreTables() {
  // تأكد من وجود الجداول الأساسية (roles, departments, users)
  // هذه الجداول موجودة بالفعل في قاعدة البيانات الجديدة
  console.log('✅ Core tables (roles, departments, users) already exist in new database');
}

// إعداد جدول المستخدمين (التحقق من الجداول الجديدة)
const setupEmployeesTable = async () => {
  try {
    await ensureCoreTables();
    console.log('✅ Users table ready (using new database schema)');
  } catch (error) {
    console.error('❌ setupEmployeesTable error:', error);
  }
};

// تسجيل الدخول
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'اسم المستخدم وكلمة المرور مطلوبان'
      });
    }

    // البحث عن المستخدم في الجدول الجديد
    const [users] = await pool.execute(
      `SELECT u.UserID, u.FullName, u.Username, u.Email, u.Phone, u.NationalID, 
              u.EmployeeNumber, u.PasswordHash, u.RoleID, u.DepartmentID, u.IsActive,
              r.RoleName, d.DepartmentName
       FROM users u 
       JOIN roles r ON u.RoleID = r.RoleID 
       LEFT JOIN departments d ON u.DepartmentID = d.DepartmentID
       WHERE (u.Username = ? OR u.Email = ?) AND u.IsActive = 1`,
      [username, username]
    );

    if (users.length === 0) {
      await logActivity(null, null, 'LOGIN_FAILED', { username, reason: 'User not found' });
      return res.status(401).json({
        success: false,
        message: 'اسم المستخدم أو كلمة المرور غير صحيحة'
      });
    }

    const user = users[0];

    // التحقق من كلمة المرور
    const isPasswordValid = await bcrypt.compare(password, user.PasswordHash);

    if (!isPasswordValid) {
      await logActivity(user.UserID, null, 'LOGIN_FAILED', { username, reason: 'Invalid password' });
      return res.status(401).json({
        success: false,
        message: 'اسم المستخدم أو كلمة المرور غير صحيحة'
      });
    }

    // إنشاء JWT token
    const token = jwt.sign(
      {
        UserID: user.UserID,
        EmployeeID: user.UserID, // للتوافق مع الكود القديم
        FullName: user.FullName,
        Username: user.Username,
        Email: user.Email,
        RoleID: user.RoleID,
        RoleName: user.RoleName,
        DepartmentID: user.DepartmentID,
        DepartmentName: user.DepartmentName
      },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '24h' }
    );

    await logActivity(user.UserID, null, 'LOGIN_SUCCESS', { username });

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      token,
      user: {
        UserID: user.UserID,
        EmployeeID: user.UserID, // للتوافق مع الكود القديم
        FullName: user.FullName,
        Username: user.Username,
        Email: user.Email,
        Phone: user.Phone,
        RoleID: user.RoleID,
        RoleName: user.RoleName,
        DepartmentID: user.DepartmentID,
        DepartmentName: user.DepartmentName
      }
    });

  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};

// تسجيل مستخدم جديد (للمدير الأعلى فقط)
const register = async (req, res) => {
  try {
    const { fullName, username, email, phone, nationalID, employeeNumber, password, roleID, departmentID } = req.body;

    // التحقق من البيانات المطلوبة
    if (!fullName || !username || !email || !phone || !nationalID || !employeeNumber || !password || !roleID) {
      return res.status(400).json({
        success: false,
        message: 'جميع البيانات مطلوبة'
      });
    }

    // التحقق من عدم وجود المستخدم مسبقاً
    const [existingUsers] = await pool.execute(
      `SELECT UserID FROM users 
       WHERE Username = ? OR Email = ? OR Phone = ? OR NationalID = ? OR EmployeeNumber = ?`,
      [username, email, phone, nationalID, employeeNumber]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'المستخدم موجود مسبقاً (اسم المستخدم، البريد الإلكتروني، رقم الهاتف، الهوية الوطنية، أو رقم الموظف)'
      });
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 12);

    // إدراج المستخدم الجديد
    const [result] = await pool.execute(
      `INSERT INTO users (FullName, Username, Email, Phone, NationalID, EmployeeNumber, 
                         PasswordHash, RoleID, DepartmentID, IsActive) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [fullName, username, email, phone, nationalID, employeeNumber, hashedPassword, roleID, departmentID]
    );

    await logActivity(req.user?.UserID, result.insertId, 'USER_CREATED', { 
      username, email, roleID, departmentID 
    });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء المستخدم بنجاح',
      data: {
        UserID: result.insertId,
        FullName: fullName,
        Username: username,
        Email: email
      }
    });

  } catch (error) {
    console.error('خطأ في تسجيل المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};

// تغيير كلمة المرور
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userID = req.user.UserID;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور الحالية والجديدة مطلوبتان'
      });
    }

    // جلب كلمة المرور الحالية
    const [users] = await pool.execute(
      'SELECT PasswordHash FROM users WHERE UserID = ?',
      [userID]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // التحقق من كلمة المرور الحالية
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, users[0].PasswordHash);

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'كلمة المرور الحالية غير صحيحة'
      });
    }

    // تشفير كلمة المرور الجديدة
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // تحديث كلمة المرور
    await pool.execute(
      'UPDATE users SET PasswordHash = ?, UpdatedAt = CURRENT_TIMESTAMP WHERE UserID = ?',
      [hashedNewPassword, userID]
    );

    await logActivity(userID, userID, 'PASSWORD_CHANGED', {});

    res.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح'
    });

  } catch (error) {
    console.error('خطأ في تغيير كلمة المرور:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};

// طلب إعادة تعيين كلمة المرور
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني مطلوب'
      });
    }

    // التحقق من وجود المستخدم
    const [users] = await pool.execute(
      'SELECT UserID, FullName FROM users WHERE Email = ? AND IsActive = 1',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    const user = users[0];

    // إنشاء رمز إعادة التعيين
    const resetToken = jwt.sign(
      { UserID: user.UserID, purpose: 'password_reset' },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '1h' }
    );

    // حفظ رمز إعادة التعيين في قاعدة البيانات
    const tokenHash = await bcrypt.hash(resetToken, 10);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // ساعة واحدة

    await pool.execute(
      `INSERT INTO password_resets (UserID, TokenHash, ExpiresAt) VALUES (?, ?, ?)`,
      [user.UserID, tokenHash, expiresAt]
    );

    await logActivity(user.UserID, user.UserID, 'PASSWORD_RESET_REQUESTED', { email });

    // في التطبيق الحقيقي، يجب إرسال البريد الإلكتروني هنا
    res.json({
      success: true,
      message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني',
      // في البيئة التطويرية فقط
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    });

  } catch (error) {
    console.error('خطأ في طلب إعادة تعيين كلمة المرور:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};

// إعادة تعيين كلمة المرور
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'الرمز وكلمة المرور الجديدة مطلوبان'
      });
    }

    // التحقق من صحة الرمز
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'رمز إعادة التعيين غير صحيح أو منتهي الصلاحية'
      });
    }

    if (decoded.purpose !== 'password_reset') {
      return res.status(401).json({
        success: false,
        message: 'رمز غير صحيح'
      });
    }

    // التحقق من وجود الرمز في قاعدة البيانات وأنه لم يُستخدم
    const [resetRequests] = await pool.execute(
      `SELECT ResetID FROM password_resets 
       WHERE UserID = ? AND ExpiresAt > NOW() AND UsedAt IS NULL`,
      [decoded.UserID]
    );

    if (resetRequests.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'رمز إعادة التعيين غير صحيح أو منتهي الصلاحية'
      });
    }

    // تشفير كلمة المرور الجديدة
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // تحديث كلمة المرور
    await pool.execute(
      'UPDATE users SET PasswordHash = ?, UpdatedAt = CURRENT_TIMESTAMP WHERE UserID = ?',
      [hashedPassword, decoded.UserID]
    );

    // تحديد الرمز كمستخدم
    await pool.execute(
      'UPDATE password_resets SET UsedAt = NOW() WHERE UserID = ? AND UsedAt IS NULL',
      [decoded.UserID]
    );

    await logActivity(decoded.UserID, decoded.UserID, 'PASSWORD_RESET_COMPLETED', {});

    res.json({
      success: true,
      message: 'تم إعادة تعيين كلمة المرور بنجاح'
    });

  } catch (error) {
    console.error('خطأ في إعادة تعيين كلمة المرور:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};

// جلب معلومات المستخدم الحالي
const getProfile = async (req, res) => {
  try {
    const userID = req.user.UserID;

    const [users] = await pool.execute(
      `SELECT u.UserID, u.FullName, u.Username, u.Email, u.Phone, u.NationalID, 
              u.EmployeeNumber, u.RoleID, u.DepartmentID, u.IsActive, u.CreatedAt,
              r.RoleName, d.DepartmentName
       FROM users u 
       JOIN roles r ON u.RoleID = r.RoleID 
       LEFT JOIN departments d ON u.DepartmentID = d.DepartmentID
       WHERE u.UserID = ?`,
      [userID]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    const user = users[0];
    delete user.PasswordHash; // إزالة كلمة المرور من الاستجابة

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('خطأ في جلب معلومات المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};

// تحديث معلومات المستخدم
const updateProfile = async (req, res) => {
  try {
    const userID = req.user.UserID;
    const { fullName, email, phone } = req.body;

    if (!fullName || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'الاسم الكامل والبريد الإلكتروني ورقم الهاتف مطلوبة'
      });
    }

    // التحقق من عدم تضارب البريد الإلكتروني أو رقم الهاتف مع مستخدمين آخرين
    const [existingUsers] = await pool.execute(
      `SELECT UserID FROM users 
       WHERE (Email = ? OR Phone = ?) AND UserID != ?`,
      [email, phone, userID]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'البريد الإلكتروني أو رقم الهاتف مستخدم من قبل مستخدم آخر'
      });
    }

    // تحديث المعلومات
    await pool.execute(
      `UPDATE users SET FullName = ?, Email = ?, Phone = ?, UpdatedAt = CURRENT_TIMESTAMP 
       WHERE UserID = ?`,
      [fullName, email, phone, userID]
    );

    await logActivity(userID, userID, 'PROFILE_UPDATED', { fullName, email, phone });

    res.json({
      success: true,
      message: 'تم تحديث المعلومات بنجاح'
    });

  } catch (error) {
    console.error('خطأ في تحديث معلومات المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};

module.exports = {
  setupEmployeesTable,
  login,
  register,
  changePassword,
  requestPasswordReset,
  resetPassword,
  getProfile,
  updateProfile
};