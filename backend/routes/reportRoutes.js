const express = require('express');
const router = express.Router();
const { authenticateToken, requireAnyRole, requirePermission } = require('../middleware/auth');
const { 
    getComplaintStats, 
    getComplaintsForExport
} = require('../controllers/reportController');
const {
    getInPersonComplaintsStats,
    exportInPersonComplaintsData
} = require('../controllers/inpersonComplaintsController');

// تطبيق المصادقة على جميع المسارات
router.use(authenticateToken);

// السماح للسوبر أدمن والأدمن بالوصول
router.use(requireAnyRole([1, 3])); // SuperAdmin, Admin

// Routes for complaint reports
router.get('/stats', getComplaintStats);

router.get('/export-data', 
    requirePermission('reports.export'),
    getComplaintsForExport
);

// Routes for in-person complaints (استخدام controller منفصل)
router.get('/inperson-complaints', getInPersonComplaintsStats);

router.get('/inperson-complaints-export', 
    requirePermission('reports.export'),
    exportInPersonComplaintsData
);

module.exports = router;