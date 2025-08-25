// middleware/requireRole.js

/**
 * يسمح بتمرير رقم دور واحد أو مصفوفة أدوار
 * مثال:
 *   app.get('/x', authenticateToken, requireRole(1), handler)          // سوبر أدمن فقط
 *   app.get('/y', authenticateToken, requireRole([1,3]), handler)      // سوبر أدمن أو أدمن
 */
function requireRole(required) {
    const allowed = Array.isArray(required) ? required.map(Number) : [Number(required)];
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthenticated' });
      }
      const roleId = Number(req.user.RoleID);
      if (!allowed.includes(roleId)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      next();
    };
  }
  
  /**
   * يحصر الأدمن (RoleID = 3) على قسمه فقط عبر وضع scope في req
   * لن يقيّد السوبر أدمن
   */
  function limitAdminScope(req, res, next) {
    if (req.user && Number(req.user.RoleID) === 3) {
      req.scope = { departmentOnly: true, departmentId: req.user.DepartmentID ?? null };
    }
    next();
  }
  
  module.exports = { requireRole, limitAdminScope };
  