// middleware/requireRole.js

function requireRole(...allowedRoles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthenticated' });
      }
      if (!allowedRoles.includes(req.user.RoleID)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      next();
    };
  }
  
  // يحصر الأدمن (RoleID=3) على قسمه فقط
  function limitAdminScope(req, res, next) {
    if (req.user?.RoleID === 3) {
      req.scope = { departmentOnly: true, departmentId: req.user.DepartmentID };
    }
    next();
  }
  
  module.exports = { requireRole, limitAdminScope };
  