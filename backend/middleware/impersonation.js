// Impersonation middleware
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

/**
 * Enhanced authentication middleware that handles impersonation
 * When a Super Admin is impersonating another user, they see data as that user
 */
const authenticateWithImpersonation = async (req, res, next) => {
  try {
    let token = req.header('Authorization');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    // Remove 'Bearer ' prefix
    if (token.startsWith('Bearer ')) {
      token = token.slice(7);
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userID = decoded.UserID || decoded.EmployeeID;
    
    // Get user data from database to ensure it's current
    const [users] = await pool.execute(`
      SELECT u.UserID, u.FullName, u.Username, u.Email, u.RoleID, u.DepartmentID, u.IsActive,
             r.RoleName, d.DepartmentName
      FROM users u
      LEFT JOIN roles r ON u.RoleID = r.RoleID
      LEFT JOIN departments d ON u.DepartmentID = d.DepartmentID
      WHERE u.UserID = ? AND u.IsActive = 1
    `, [userID]);

    if (!users.length) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token. User not found.' 
      });
    }

    const user = users[0];
    
    // إضافة خصائص للتوافق مع الكود القديم
    user.EmployeeID = user.UserID;
    
    // Set user in request
    req.user = user;
    req.originalUser = user; // Keep track of original user
    
    // Check if this is an impersonation scenario
    // This happens when Super Admin (RoleID=1) is viewing department admin pages
    const userAgent = req.headers['user-agent'] || '';
    const referer = req.headers['referer'] || '';
    
    // If user is Super Admin but accessing dept-admin pages
    const isDeptAdminRequest = referer.includes('/dept-admin/') || 
                              req.originalUrl.includes('/dept-admin/');
    
    if (user.RoleID === 1 && isDeptAdminRequest) {
      // في النظام الجديد، يمكن للسوبر أدمن الوصول مباشرة دون impersonation
      // أو يمكن تطبيق نظام impersonation إذا كان مطلوباً
      
      // للآن، سنسمح للسوبر أدمن بالوصول مباشرة
      console.log(`Super Admin ${user.FullName} accessing dept-admin interface`);
      
      // يمكن إضافة منطق impersonation هنا لاحقاً إذا كان مطلوباً
    }
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Authentication error' 
    });
  }
};

/**
 * Middleware to check if user is Department Admin (with impersonation support)
 */
const requireDepartmentAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Allow if user is Department Admin (RoleID = 3) or Super Admin (RoleID = 1)
  if (req.user.RoleID === 3 || req.user.RoleID === 1) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. Department Admin role required.'
  });
};

/**
 * Middleware to log activities with impersonation context
 */
const logActivityWithImpersonation = async (activityType, description) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];
      
      // Determine who to log the activity for
      let logUserID = user.UserID;
      let logUsername = user.Username;
      let logDescription = description;
      
      // If impersonating, log for the impersonated user but note the super admin
      if (user.isImpersonating) {
        logDescription = `[بواسطة السوبر أدمن] ${description}`;
      }
      
      // استخدام دالة logActivity الجديدة
      const { logActivity } = require('../controllers/logsController');
      await logActivity(logUserID, null, activityType, {
        description: logDescription,
        ip,
        userAgent
      });
      
      next();
    } catch (error) {
      console.error('Error logging activity:', error);
      next(); // Continue even if logging fails
    }
  };
};

/**
 * إنشاء جلسة impersonation جديدة (للسوبر أدمن فقط)
 */
const startImpersonation = async (req, res) => {
  try {
    const { targetUserID } = req.body;
    const superAdminID = req.user.UserID;

    // التحقق من أن المستخدم سوبر أدمن
    if (req.user.RoleID !== 1) {
      return res.status(403).json({
        success: false,
        message: 'فقط السوبر أدمن يمكنه استخدام هذه الميزة'
      });
    }

    // التحقق من وجود المستخدم المستهدف
    const [targetUser] = await pool.execute(
      'SELECT UserID, FullName, RoleID FROM users WHERE UserID = ? AND IsActive = 1',
      [targetUserID]
    );

    if (targetUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم المستهدف غير موجود'
      });
    }

    // يمكن إضافة جدول impersonations إذا كان مطلوباً
    // للآن، سنعيد token جديد للمستخدم المستهدف
    
    const impersonationToken = jwt.sign(
      {
        UserID: targetUserID,
        EmployeeID: targetUserID, // للتوافق
        isImpersonating: true,
        originalSuperAdminID: superAdminID
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' } // جلسة impersonation لمدة ساعتين
    );

    res.json({
      success: true,
      message: 'تم بدء جلسة التمثيل بنجاح',
      impersonationToken,
      targetUser: targetUser[0]
    });

  } catch (error) {
    console.error('Error starting impersonation:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};

/**
 * إنهاء جلسة impersonation
 */
const endImpersonation = async (req, res) => {
  try {
    // إرجاع token السوبر أدمن الأصلي
    const originalSuperAdminID = req.user.originalSuperAdminID;
    
    if (!originalSuperAdminID) {
      return res.status(400).json({
        success: false,
        message: 'لا توجد جلسة تمثيل نشطة'
      });
    }

    // إنشاء token جديد للسوبر أدمن
    const [superAdmin] = await pool.execute(
      `SELECT u.UserID, u.FullName, u.Username, u.Email, u.RoleID, u.DepartmentID,
              r.RoleName, d.DepartmentName
       FROM users u
       LEFT JOIN roles r ON u.RoleID = r.RoleID
       LEFT JOIN departments d ON u.DepartmentID = d.DepartmentID
       WHERE u.UserID = ?`,
      [originalSuperAdminID]
    );

    if (superAdmin.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'السوبر أدمن الأصلي غير موجود'
      });
    }

    const originalToken = jwt.sign(
      {
        UserID: superAdmin[0].UserID,
        EmployeeID: superAdmin[0].UserID,
        FullName: superAdmin[0].FullName,
        Username: superAdmin[0].Username,
        Email: superAdmin[0].Email,
        RoleID: superAdmin[0].RoleID,
        RoleName: superAdmin[0].RoleName,
        DepartmentID: superAdmin[0].DepartmentID,
        DepartmentName: superAdmin[0].DepartmentName
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'تم إنهاء جلسة التمثيل',
      originalToken,
      user: superAdmin[0]
    });

  } catch (error) {
    console.error('Error ending impersonation:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};

module.exports = {
  authenticateWithImpersonation,
  requireDepartmentAdmin,
  logActivityWithImpersonation,
  startImpersonation,
  endImpersonation
};