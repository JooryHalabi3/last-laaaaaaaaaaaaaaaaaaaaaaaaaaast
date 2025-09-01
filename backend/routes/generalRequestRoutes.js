const express = require('express');
const router = express.Router();
const { authenticateToken, requireAnyRole } = require('../middleware/auth');
const {
    getGeneralRequestStats,
    exportGeneralRequestData,
    getRequestDetails,
    updateRequestStatus,
    assignRequest
} = require('../controllers/generalRequestController');

// تطبيق المصادقة على جميع المسارات
router.use(authenticateToken);

// السماح للسوبر أدمن والأدمن بالوصول
router.use(requireAnyRole([1, 3])); // SuperAdmin, Admin

// جلب إحصائيات الطلبات العامة
router.get('/stats', getGeneralRequestStats);

// جلب بيانات الطلبات العامة للتصدير
router.get('/export-data', exportGeneralRequestData);

// جلب تفاصيل طلب محدد
router.get('/details/:requestId', getRequestDetails);

// تحديث حالة الطلب
router.put('/:requestId/status', updateRequestStatus);

// تكليف طلب لمسؤول
router.post('/:requestId/assign', assignRequest);

module.exports = router;