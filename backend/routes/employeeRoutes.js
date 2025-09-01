const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { 
    checkEmployeePermissions, 
    checkComplaintOwnership, 
    logEmployeeActivity 
} = require('../middleware/permissions');
const {
    getEmployeeProfile,
    createComplaint,
    getEmployeeComplaints,
    getComplaintDetails,
    addResponse,
    updateComplaintStatus,
    getNotifications,
    markNotificationAsRead
} = require('../controllers/employeeController');

// تطبيق middleware المصادقة أولاً، ثم الصلاحيات
router.use(authenticateToken);
router.use(checkEmployeePermissions);

// الملف الشخصي للموظف
router.get('/profile', 
    logEmployeeActivity('view_profile', 'عرض الملف الشخصي'),
    getEmployeeProfile
);

// الشكاوى
router.post('/complaints', 
    logEmployeeActivity('create_complaint', 'إنشاء شكوى جديدة'),
    createComplaint
);

router.get('/complaints', 
    logEmployeeActivity('view_complaints', 'عرض قائمة الشكاوى'),
    getEmployeeComplaints
);

router.get('/complaints/:complaintId', 
    checkComplaintOwnership,
    logEmployeeActivity('view_complaint_details', 'عرض تفاصيل الشكوى', 'params.complaintId', 'complaint'),
    getComplaintDetails
);

router.post('/complaints/:complaintId/responses', 
    checkComplaintOwnership,
    logEmployeeActivity('add_response', 'إضافة رد على الشكوى', 'params.complaintId', 'complaint'),
    addResponse
);

router.put('/complaints/:complaintId/status', 
    checkComplaintOwnership,
    logEmployeeActivity('update_status', 'تحديث حالة الشكوى', 'params.complaintId', 'complaint'),
    updateComplaintStatus
);

// سجلات النشاط
router.get('/activity-logs', 
    logEmployeeActivity('view_activity_logs', 'عرض سجلات النشاط'),
    async (req, res) => {
        try {
            const employeeId = req.user.EmployeeID;
            const limit = parseInt(req.query.limit) || 10;
            
            const [logs] = await require('../config/database').execute(
                `SELECT * FROM activitylogs 
                 WHERE EmployeeID = ? 
                 ORDER BY CreatedAt DESC 
                 LIMIT ?`,
                [employeeId, limit]
            );
            
            res.json({
                success: true,
                data: { logs }
            });
        } catch (error) {
            console.error('خطأ في جلب سجلات النشاط:', error);
            res.status(500).json({
                success: false,
                message: 'حدث خطأ في الخادم'
            });
        }
    }
);

// الإشعارات
router.get('/notifications', 
    logEmployeeActivity('view_notifications', 'عرض الإشعارات'),
    getNotifications
);

router.put('/notifications/:notificationId/read', 
    logEmployeeActivity('mark_notification_read', 'تحديث حالة الإشعار كمقروء', 'params.notificationId', 'notification'),
    markNotificationAsRead
);

module.exports = router;
