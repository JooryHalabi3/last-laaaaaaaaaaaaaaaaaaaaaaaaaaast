const express = require('express');
const router = express.Router();
const { authenticateToken, requireAnyRole } = require('../middleware/auth');
const {
    getGeneralComplaintsStats,
    getGeneralComplaintsForExport,
    getComplaintDetails,
    getFilterOptions
} = require('../controllers/generalComplaintsController');

// تطبيق المصادقة على جميع المسارات
router.use(authenticateToken);

// السماح للسوبر أدمن والأدمن بالوصول
router.use(requireAnyRole([1, 3])); // SuperAdmin, Admin

// جلب إحصائيات الشكاوى العامة
router.get('/stats', getGeneralComplaintsStats);

// تصدير بيانات الشكاوى العامة
router.get('/export-data', getGeneralComplaintsForExport);

// جلب تفاصيل شكوى محددة
router.get('/details/:complaintId', getComplaintDetails);

// جلب خيارات الفلاتر (الأقسام، أنواع الشكاوى، إلخ)
router.get('/filter-options', getFilterOptions);

module.exports = router;