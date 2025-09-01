// routes/departmentComplaintsRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateToken, requireAnyRole } = require('../middleware/auth');
const {
    getComplaintsByDepartment,
    getDepartmentStats,
    assignComplaint,
    updateComplaintStatus,
    getDepartmentEmployees
} = require('../controllers/departmentComplaintsController');

// تطبيق المصادقة على جميع المسارات
router.use(authenticateToken);

// السماح للسوبر أدمن (1) والأدمن (3)
router.use(requireAnyRole([1, 3]));

// GET /api/department-complaints/by-department
router.get('/by-department', getComplaintsByDepartment);

// GET /api/department-complaints/stats
router.get('/stats', getDepartmentStats);

// GET /api/department-complaints/employees
router.get('/employees', getDepartmentEmployees);

// POST /api/department-complaints/assign
router.post('/assign', assignComplaint);

// PUT /api/department-complaints/:complaintID/status
router.put('/:complaintID/status', updateComplaintStatus);

module.exports = router;