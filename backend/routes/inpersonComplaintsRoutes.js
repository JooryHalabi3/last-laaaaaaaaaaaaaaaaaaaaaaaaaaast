const express = require('express');
const router = express.Router();
const { authenticateToken, requireAnyRole } = require('../middleware/auth');
const {
    getInPersonComplaintsStats,
    exportInPersonComplaintsData,
    getInPersonComplaintDetails,
    getInPersonComplaintsPerformance
} = require('../controllers/inpersonComplaintsController');

// تطبيق المصادقة على جميع المسارات
router.use(authenticateToken);

// السماح للسوبر أدمن والأدمن بالوصول
router.use(requireAnyRole([1, 3])); // SuperAdmin, Admin

// جلب إحصائيات الشكاوى الحضورية
router.get('/stats', getInPersonComplaintsStats);

// تصدير بيانات الشكاوى الحضورية
router.get('/export-data', exportInPersonComplaintsData);

// جلب تفاصيل شكوى حضورية محددة
router.get('/details/:complaintId', getInPersonComplaintDetails);

// جلب إحصائيات الأداء للشكاوى الحضورية
router.get('/performance', getInPersonComplaintsPerformance);

module.exports = router;