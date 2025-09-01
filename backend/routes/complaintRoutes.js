const express = require('express');
const router = express.Router();
const { authenticateToken, requireAnyRole, requirePermission } = require('../middleware/auth');
const {
    upload,
    getDepartments,
    getComplaintReasons,
    getSubTypes,
    createComplaint,
    getAllComplaints,
    getComplaintById,
    updateComplaintStatus,
    assignComplaint,
    addReply,
    getComplaintStats,
    searchComplaints
} = require('../controllers/complaintController');

// مسارات عامة (لا تحتاج مصادقة)
router.get('/departments', getDepartments);

// مسارات تحتاج مصادقة
router.use(authenticateToken);

// مسارات الأقسام وأسباب الشكاوى
router.get('/departments/:departmentID/reasons', getComplaintReasons);
router.get('/reasons/:reasonID/subtypes', getSubTypes);

// إنشاء شكوى جديدة (مع رفع الملفات)
router.post('/create', 
    requirePermission('complaint.create'),
    upload.array('attachments', 5), 
    createComplaint
);

// جلب جميع الشكاوى (للمدراء والمشرفين)
router.get('/all', 
    requireAnyRole([1, 3]), // SuperAdmin, Admin
    getAllComplaints
);

// البحث في الشكاوى
router.get('/search', 
    requireAnyRole([1, 3]), // SuperAdmin, Admin
    searchComplaints
);

// إحصائيات الشكاوى
router.get('/stats', 
    requireAnyRole([1, 3]), // SuperAdmin, Admin
    getComplaintStats
);

// جلب تفاصيل شكوى محددة
router.get('/:complaintID', 
    requirePermission('complaint.view_own'), // أو complaint.view_all حسب الدور
    getComplaintById
);

// تحديث حالة الشكوى
router.put('/:complaintID/status', 
    requirePermission('complaint.status'),
    updateComplaintStatus
);

// تكليف شكوى لمستخدم
router.post('/:complaintID/assign', 
    requirePermission('complaint.assign'),
    assignComplaint
);

// إضافة رد على الشكوى
router.post('/:complaintID/replies', 
    requirePermission('complaint.reply'),
    addReply
);

module.exports = router;