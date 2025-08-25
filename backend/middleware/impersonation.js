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
    
    // Get user data from database to ensure it's current
    const [users] = await pool.execute(`
      SELECT e.EmployeeID, e.FullName, e.Username, e.Email, e.RoleID, e.DepartmentID,
             r.RoleName, d.DepartmentName
      FROM employees e
      LEFT JOIN roles r ON e.RoleID = r.RoleID
      LEFT JOIN departments d ON e.DepartmentID = d.DepartmentID
      WHERE e.EmployeeID = ?
    `, [decoded.EmployeeID]);

    if (!users.length) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token. User not found.' 
      });
    }

    const user = users[0];
    
    // Set user in request
    req.user = user;
    req.originalUser = user; // Keep track of original user
    
    // Check if this is an impersonation scenario
    // This happens when Super Admin (RoleID=1) is viewing department admin pages
    const userAgent = req.headers['user-agent'] || '';
    const referer = req.headers['referer'] || '';
    
    // If user is Super Admin but accessing dept-admin or admin pages
    const isDeptAdminRequest = referer.includes('/dept-admin/') || 
                              referer.includes('/admin/') || 
                              req.originalUrl.includes('/dept-admin/') ||
                              req.originalUrl.includes('/admin/');
    
    if (user.RoleID === 1 && isDeptAdminRequest) {
      // Check if there's an active impersonation session
      const [impersonations] = await pool.execute(`
        SELECT i.TargetEmployeeID, e.FullName, e.Username, e.Email, e.RoleID, e.DepartmentID,
               r.RoleName, d.DepartmentName
        FROM impersonations i
        JOIN employees e ON i.TargetEmployeeID = e.EmployeeID
        LEFT JOIN roles r ON e.RoleID = r.RoleID
        LEFT JOIN departments d ON e.DepartmentID = d.DepartmentID
        WHERE i.SuperAdminID = ? AND i.EndedAt IS NULL
        ORDER BY i.StartedAt DESC
        LIMIT 1
      `, [user.EmployeeID]);
      
      if (impersonations.length > 0) {
        // Use impersonated user's context for data access
        const impersonatedUser = impersonations[0];
        req.user = {
          ...impersonatedUser,
          EmployeeID: impersonatedUser.TargetEmployeeID,
          // Keep track that this is impersonation
          isImpersonating: true,
          originalSuperAdminId: user.EmployeeID
        };
        
        console.log(`Super Admin ${user.FullName} accessing as ${impersonatedUser.FullName}`);
      }
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

  // Allow if user is Department Admin (RoleID = 3)
  if (req.user.RoleID === 3) {
    return next();
  }

  // Allow if Super Admin is impersonating a Department Admin
  if (req.user.isImpersonating && req.originalUser?.RoleID === 1) {
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
      let logEmployeeId = user.EmployeeID;
      let logUsername = user.Username;
      let logDescription = description;
      
      // If impersonating, log for the impersonated user but note the super admin
      if (user.isImpersonating) {
        logDescription = `[بواسطة السوبر أدمن] ${description}`;
      }
      
      await pool.execute(`
        INSERT INTO ActivityLogs (EmployeeID, Username, ActivityType, Description, IPAddress, UserAgent)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [logEmployeeId, logUsername, activityType, logDescription, ip, userAgent]);
      
      next();
    } catch (error) {
      console.error('Error logging activity:', error);
      next(); // Continue even if logging fails
    }
  };
};

module.exports = {
  authenticateWithImpersonation,
  requireDepartmentAdmin,
  logActivityWithImpersonation
};
