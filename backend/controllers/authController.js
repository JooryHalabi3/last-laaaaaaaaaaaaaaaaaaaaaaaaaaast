// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { logActivity } = require('./logsController');

// ===== helpers =====
async function ensureCoreTables() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS Roles (
      RoleID INT PRIMARY KEY,
      RoleName VARCHAR(64) UNIQUE NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.execute(`
    INSERT INTO Roles (RoleID, RoleName) VALUES
    (1,'SUPER_ADMIN'), (2,'EMPLOYEE'), (3,'ADMIN')
    ON DUPLICATE KEY UPDATE RoleName = VALUES(RoleName);
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS Departments (
      DepartmentID INT PRIMARY KEY AUTO_INCREMENT,
      DepartmentName VARCHAR(100) NOT NULL UNIQUE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // نضيف NationalID في المخطط الجديد مباشرة
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS Employees (
      EmployeeID INT PRIMARY KEY AUTO_INCREMENT,
      FullName VARCHAR(150) NOT NULL,
      Username VARCHAR(80) NOT NULL UNIQUE,
      PasswordHash VARCHAR(255) NOT NULL,
      Email VARCHAR(150),
      PhoneNumber VARCHAR(40),
      NationalID VARCHAR(20) UNIQUE,
      RoleID INT NOT NULL,
      Specialty VARCHAR(150),
      JoinDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      DepartmentID INT NULL,
      CONSTRAINT fk_employees_role FOREIGN KEY (RoleID) REFERENCES Roles(RoleID)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

// إعداد جدول الموظفين (إضافة أعمدة/فهرس/مفتاح أجنبي إن لزم)
const setupEmployeesTable = async () => {
  try {
    await ensureCoreTables();

    // تأكد من NationalID
    const [nidCol] = await pool.execute(`
      SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Employees' AND COLUMN_NAME = 'NationalID'
    `);
    if (!nidCol[0].cnt) {
      await pool.execute(`ALTER TABLE Employees ADD COLUMN NationalID VARCHAR(20) NULL AFTER PhoneNumber;`);
      await pool.execute(`ALTER TABLE Employees ADD UNIQUE KEY uniq_employees_nationalid (NationalID);`);
      console.log('➕ NationalID added + unique index');
    }

    // تأكد من DepartmentID + الفهرس + FK
    const [depCol] = await pool.execute(`
      SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Employees' AND COLUMN_NAME = 'DepartmentID'
    `);
    if (!depCol[0].cnt) {
      await pool.execute(`ALTER TABLE Employees ADD COLUMN DepartmentID INT NULL;`);
      console.log('➕ DepartmentID added');
    }

    const [idxRows] = await pool.execute(`SHOW INDEX FROM Employees WHERE Key_name = 'idx_employees_departmentid'`);
    if (!idxRows.length) {
      await pool.execute(`ALTER TABLE Employees ADD INDEX idx_employees_departmentid (DepartmentID);`);
      console.log('➕ idx_employees_departmentid added');
    }

    const [fkRows] = await pool.execute(`
      SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Employees'
      AND COLUMN_NAME = 'DepartmentID' AND REFERENCED_TABLE_NAME = 'Departments'
    `);
    if (!fkRows[0].cnt) {
      await pool.execute(`
        ALTER TABLE Employees
        ADD CONSTRAINT fk_employees_department
        FOREIGN KEY (DepartmentID) REFERENCES Departments(DepartmentID)
        ON DELETE SET NULL ON UPDATE CASCADE;
      `);
      console.log('🔗 fk_employees_department added');
    }

    console.log('✅ Employees table ready (NationalID + DepartmentID)');
  } catch (error) {
    console.error('❌ setupEmployeesTable error:', error);
  }
};

// ===== Controllers =====

// التسجيل العام = موظف فقط + قسم موجود
const register = async (req, res) => {
  try {
    console.log('=== بدء عملية التسجيل ===');
    console.log('Request Body:', req.body);
    
    const {
      fullName, username, password, email, phoneNumber,
      specialty, departmentID, nationalID
    } = req.body;
    
    console.log('Parsed Data:', {
      fullName, username, password: password ? '***' : 'MISSING', 
      email, phoneNumber, specialty, departmentID, nationalID
    });

    // التحقق من الحقول المطلوبة
    if (!fullName || !username || !password || !departmentID || !nationalID) {
      return res.status(400).json({ 
        success: false, 
        message: 'الاسم، اسم المستخدم، كلمة المرور، القسم، والهوية الوطنية مطلوبة',
        missing: {
          fullName: !fullName,
          username: !username,
          password: !password,
          departmentID: !departmentID,
          nationalID: !nationalID
        }
      });
    }

    const [dept] = await pool.execute('SELECT 1 FROM Departments WHERE DepartmentID = ?', [departmentID]);
    if (!dept.length) {
      return res.status(400).json({ success: false, message: 'القسم المحدد غير موجود' });
    }

    const [exists] = await pool.execute('SELECT EmployeeID FROM Employees WHERE Username = ?', [username]);
    if (exists.length) {
      return res.status(400).json({ success: false, message: 'اسم المستخدم موجود مسبقاً' });
    }

    // التحقق من عدم تكرار الهوية الوطنية
    const [nidExists] = await pool.execute('SELECT EmployeeID FROM Employees WHERE NationalID = ?', [nationalID]);
    if (nidExists.length) {
      return res.status(400).json({ success: false, message: 'رقم الهوية الوطنية مستخدم مسبقاً' });
    }

    const enforcedRoleID = 2; // EMPLOYEE
    const passwordHash = await bcrypt.hash(password, 10);
    
    console.log('=== بيانات الإدراج ===');
    console.log('SQL Query:', `
      INSERT INTO Employees (
        FullName, Username, PasswordHash, Email, PhoneNumber, NationalID, RoleID, Specialty, DepartmentID
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    console.log('Values:', [
      fullName, username, '***HASHED***', email || null, phoneNumber || null, 
      nationalID, enforcedRoleID, specialty || null, departmentID
    ]);

    const [ins] = await pool.execute(`
      INSERT INTO Employees (
        FullName, Username, PasswordHash, Email, PhoneNumber, NationalID, RoleID, Specialty, DepartmentID
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [fullName, username, passwordHash, email || null, phoneNumber || null, nationalID, enforcedRoleID, specialty || null, departmentID]
    );
    
    console.log('=== تم الإدراج بنجاح ===');
    console.log('Insert Result:', ins);
    console.log('New Employee ID:', ins.insertId);

    const [rows] = await pool.execute(`
      SELECT e.EmployeeID, e.FullName, e.Username, e.Email, e.PhoneNumber, e.NationalID, e.Specialty, e.JoinDate,
             e.DepartmentID, r.RoleName, r.RoleID, d.DepartmentName
      FROM Employees e
      JOIN Roles r ON e.RoleID = r.RoleID
      LEFT JOIN Departments d ON e.DepartmentID = d.DepartmentID
      WHERE e.EmployeeID = ?`, [ins.insertId]
    );

    const employee = rows[0];
    const token = jwt.sign(
      { employeeID: employee.EmployeeID, username: employee.Username, roleID: employee.RoleID, roleName: employee.RoleName },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    try {
      await logActivity(
        employee.EmployeeID,
        employee.Username,
        'register',
        `تم إنشاء حساب جديد: ${employee.FullName} (${employee.RoleName}) - القسم: ${employee.DepartmentName}`,
        req.ip, req.get('User-Agent')
      );
    } catch (e) {
      console.error('logActivity(register) error:', e);
    }

    res.status(201).json({ success: true, message: 'تم إنشاء الحساب بنجاح', data: { employee, token } });
  } catch (error) {
    console.error('register error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: 'اسم المستخدم وكلمة المرور مطلوبان' });

    const [rows] = await pool.execute(`
      SELECT e.EmployeeID, e.FullName, e.Username, e.PasswordHash, e.Email, e.PhoneNumber, e.NationalID, e.Specialty, e.JoinDate,
             e.DepartmentID, r.RoleName, r.RoleID, d.DepartmentName
      FROM Employees e
      JOIN Roles r ON e.RoleID = r.RoleID
      LEFT JOIN Departments d ON e.DepartmentID = d.DepartmentID
      WHERE e.Username = ?`, [username]
    );
    if (!rows.length) return res.status(401).json({ success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });

    const employee = rows[0];
    const ok = await bcrypt.compare(password, employee.PasswordHash);
    if (!ok) return res.status(401).json({ success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });

    delete employee.PasswordHash;

    const token = jwt.sign(
      { employeeID: employee.EmployeeID, username: employee.Username, roleID: employee.RoleID, roleName: employee.RoleName },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    try {
      await logActivity(
        employee.EmployeeID,
        employee.Username,
        'login',
        `تم تسجيل الدخول بنجاح - القسم: ${employee.DepartmentName || 'غير محدد'}`,
        req.ip, req.get('User-Agent')
      );
    } catch (e) {
      console.error('logActivity(login) error:', e);
    }

    res.json({ success: true, message: 'تم تسجيل الدخول بنجاح', data: { employee, token } });
  } catch (error) {
    console.error('login error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const auth = req.headers['authorization'];
    const token = auth && auth.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'التوكن مطلوب' });

    let decoded;
    try { decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key'); }
    catch (e) { return res.status(401).json({ success: false, message: 'التوكن غير صالح أو منتهي الصلاحية' }); }

    const [rows] = await pool.execute(`
      SELECT e.EmployeeID, e.FullName, e.Username, e.Email, e.PhoneNumber, e.NationalID, e.Specialty, e.JoinDate,
             e.DepartmentID, r.RoleName, r.RoleID, d.DepartmentName
      FROM Employees e
      JOIN Roles r ON e.RoleID = r.RoleID
      LEFT JOIN Departments d ON e.DepartmentID = d.DepartmentID
      WHERE e.EmployeeID = ?`, [decoded.employeeID]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('getCurrentUser error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};

const getRoles = async (req, res) => {
  try {
    const [roles] = await pool.execute('SELECT * FROM Roles ORDER BY RoleName');
    res.json({ success: true, data: roles });
  } catch (error) {
    console.error('getRoles error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const employeeID = req.user.EmployeeID;
    const { name, phone, idNumber, empNumber, email } = req.body;

    await pool.execute(
      `UPDATE Employees 
       SET FullName = ?, PhoneNumber = ?, Email = ?, NationalID = ?, EmployeeNumber = ?
       WHERE EmployeeID = ?`,
      [name, phone, email, idNumber, empNumber, employeeID]
    );

    try {
      await logActivity(employeeID, req.user.Username, 'profile_update', 'تم تحديث بيانات البروفايل', req.ip, req.get('User-Agent'));
    } catch (e) {
      console.error('logActivity(profile_update) error:', e);
    }

    res.json({ success: true, message: 'تم تحديث البيانات بنجاح' });
  } catch (error) {
    console.error('خطأ في تحديث البروفايل:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

const getDepartments = async (req, res) => {
  try {
    const [departments] = await pool.execute(
      'SELECT DepartmentID, DepartmentName FROM Departments ORDER BY DepartmentName'
    );
    res.json({ success: true, data: departments });
  } catch (error) {
    console.error('getDepartments error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};

module.exports = {
  setupEmployeesTable,
  register,
  login,
  getCurrentUser,
  getRoles,
  getDepartments,
  updateProfile
};
 
