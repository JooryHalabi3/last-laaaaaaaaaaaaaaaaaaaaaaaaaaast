// routes/departmentComplaintsRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getMyDepartmentComplaints } = require('../controllers/departmentComplaintsController');

// سماح للسوبر أدمن (1) والأدمن (3)
function allowAdminAndSuper(req, res, next) {
  const roleId = Number(req.user?.RoleID || req.user?.role || req.user?.roleId);
  if ([1, 3].includes(roleId)) return next();
  return res.status(403).json({ success: false, message: 'Forbidden: role not allowed' });
}

// GET /api/department-complaints/by-department
router.get('/by-department', authenticateToken, allowAdminAndSuper, getMyDepartmentComplaints);

module.exports = router;
