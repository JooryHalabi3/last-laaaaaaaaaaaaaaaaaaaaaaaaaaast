const express = require('express');
const router = express.Router();
const { authenticateToken, requirePermission } = require('../middleware/auth');
const {
    addResponse,
    getComplaintResponses,
    updateComplaintStatus,
    getComplaintHistory,
    getAvailableStatuses,
    getResponseTypes,
    updateResponse,
    deleteResponse,
    getResponseStats
} = require('../controllers/responseController');

// تطبيق المصادقة على جميع المسارات
router.use(authenticateToken);

// إضافة رد على شكوى
router.post('/add', 
    requirePermission('complaint.reply'),
    addResponse
);

// جلب جميع الردود لشكوى محددة
router.get('/responses/:complaintId', 
    requirePermission('complaint.view_own'), // أو complaint.view_all حسب الدور
    getComplaintResponses
);

// تغيير حالة الشكوى
router.put('/status/:complaintId', 
    requirePermission('complaint.status'),
    updateComplaintStatus
);

// جلب سجل التاريخ لشكوى محددة
router.get('/history/:complaintId', 
    requirePermission('complaint.view_own'),
    getComplaintHistory
);

// جلب الحالات المتاحة (عام - لا يحتاج صلاحيات خاصة)
router.get('/statuses', getAvailableStatuses);

// جلب أنواع الردود المتاحة (عام - لا يحتاج صلاحيات خاصة)
router.get('/response-types', getResponseTypes);

// تحديث رد موجود
router.put('/responses/:responseId', 
    requirePermission('complaint.reply'),
    updateResponse
);

// حذف رد
router.delete('/responses/:responseId', 
    requirePermission('complaint.reply'),
    deleteResponse
);

// جلب إحصائيات الردود (للمدراء)
router.get('/stats', 
    requirePermission('complaint.view_all'),
    getResponseStats
);

module.exports = router;