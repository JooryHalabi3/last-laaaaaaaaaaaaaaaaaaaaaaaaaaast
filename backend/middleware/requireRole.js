// middleware/requireRole.js

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

// يحصر الأدمن (RoleID = 3) على قسمه فقط — اختياري
function limitAdminScope(req, res, next) {
  if (req.user && Number(req.user.RoleID) === 3) {
    req.scope = { departmentOnly: true, departmentId: req.user.DepartmentID ?? null };
  }
  next();
}

module.exports = { requireRole, limitAdminScope };
