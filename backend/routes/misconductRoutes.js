const express = require('express');
const router = express.Router();
const { authenticateToken, requireAnyRole, requirePermission } = require('../middleware/auth');
const {
    getMisconductStats,
    exportMisconductData,
    uploadMisconductData,
    getMisconductImports,
    deleteMisconductImport,
    getMisconductImportDetails
} = require('../controllers/misconductController');

// تطبيق المصادقة على جميع المسارات
router.use(authenticateToken);

// السماح للسوبر أدمن والأدمن بالوصول
router.use(requireAnyRole([1, 3])); // SuperAdmin, Admin

// جلب إحصائيات بلاغات سوء التعامل
router.get('/stats', getMisconductStats);

// تصدير بيانات بلاغات سوء التعامل
router.get('/export-data', exportMisconductData);

// جلب قائمة عمليات الاستيراد
router.get('/imports', getMisconductImports);

// جلب تفاصيل عملية استيراد محددة
router.get('/imports/:importID', getMisconductImportDetails);

// رفع ملف بيانات سوء التعامل الجديد (يتطلب صلاحية الاستيراد)
router.post('/upload', 
    requirePermission('reports.import'),
    uploadMisconductData
);

// حذف عملية استيراد ومحتوياتها (السوبر أدمن فقط)
router.delete('/imports/:importID', 
    requirePermission('reports.import'),
    deleteMisconductImport
);

module.exports = router;