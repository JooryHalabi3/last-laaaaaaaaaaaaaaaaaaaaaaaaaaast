const express = require('express');
const router = express.Router();
const { authenticateToken, requirePermission } = require('../middleware/auth');
const {
    getActivityLogs,
    getActivityStats,
    getActivityTypes,
    cleanupOldLogs,
    exportLogs
} = require('../controllers/logsController');

// تطبيق المصادقة والصلاحيات على جميع المسارات
router.use(authenticateToken);
router.use(requirePermission('logs.view'));

// جلب سجلات النشاط مع الفلاتر والتصفح
router.get('/', getActivityLogs);

// جلب إحصائيات النشاط
router.get('/stats', getActivityStats);

// جلب أنواع الأنشطة المتاحة
router.get('/types', getActivityTypes);

// تصدير سجلات النشاط
router.get('/export', exportLogs);

// تنظيف السجلات القديمة (SuperAdmin فقط)
router.delete('/cleanup', 
    requirePermission('logs.manage'), 
    cleanupOldLogs
);

module.exports = router;