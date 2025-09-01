const express = require('express');
const router = express.Router();
const { authenticateToken, requireAnyRole } = require('../middleware/auth');
const {
    getEmployeeProfile,
    createComplaint,
    getEmployeeComplaints,
    getComplaintDetails,
    addComplaintReply,
    updateComplaintStatus,
    getEmployeeStats,
    getDepartments,
    getComplaintReasons,
    getComplaintSubtypes
} = require('../controllers/employeeController');

// تطبيق middleware المصادقة أولاً
router.use(authenticateToken);
// السماح للموظفين والمدراء بالوصول
router.use(requireAnyRole([2, 3])); // Employee, Admin

// الملف الشخصي للموظف
router.get('/profile', getEmployeeProfile);

// إحصائيات الموظف
router.get('/stats', getEmployeeStats);

// الأقسام وأسباب الشكاوى
router.get('/departments', getDepartments);
router.get('/departments/:departmentID/reasons', getComplaintReasons);
router.get('/reasons/:reasonID/subtypes', getComplaintSubtypes);

// الشكاوى
router.post('/complaints', createComplaint);
router.get('/complaints', getEmployeeComplaints);
router.get('/complaints/:complaintID', getComplaintDetails);
router.post('/complaints/:complaintID/replies', addComplaintReply);
router.put('/complaints/:complaintID/status', updateComplaintStatus);

// سجلات النشاط للموظف
router.get('/activity-logs', async (req, res) => {
    try {
        const userID = req.user.UserID;
        const limit = parseInt(req.query.limit) || 10;
        
        const [logs] = await require('../config/database').execute(
            `SELECT al.LogID, al.Action, al.Details, al.CreatedAt,
                    actor.FullName as ActorName
             FROM activitylogs al
             LEFT JOIN users actor ON al.ActorUserID = actor.UserID
             WHERE al.ActorUserID = ? OR al.EffectiveUserID = ?
             ORDER BY al.CreatedAt DESC 
             LIMIT ?`,
            [userID, userID, limit]
        );
        
        res.json({
            success: true,
            data: logs.map(log => ({
                ...log,
                Details: typeof log.Details === 'string' ? JSON.parse(log.Details) : log.Details
            }))
        });
    } catch (error) {
        console.error('خطأ في جلب سجلات النشاط:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
});

module.exports = router;