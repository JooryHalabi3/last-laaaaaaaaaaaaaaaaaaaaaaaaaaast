// routes/overviewRoutes.js
const express = require('express');
const router = express.Router();

// ✅ اربطي /stats و /export-data بالكنترولر الذي يُرجِع { success, data }
const { getOverviewStats, exportOverviewData } =
  require('../controllers/overviewController');

// ✅ مسارات الـ Overview (المستخدمة في overview.js)
router.get('/stats', getOverviewStats);          // يتوقع result.success && result.data ✔
router.get('/export-data', exportOverviewData);

// ✅ أبقي مسارات السوبر أدمن منفصلة وبشكلها الخاص (لا تلمسي /stats)
const pool = require('../config/database');

router.get('/summary', async (req, res) => {
  try {
    const [[totals]] = await pool.execute(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN CurrentStatus = 'جديدة' THEN 1 ELSE 0 END) AS open,
        SUM(CASE WHEN CurrentStatus IN ('قيد المعالجة','قيد المراجعة') THEN 1 ELSE 0 END) AS in_progress,
        SUM(CASE WHEN CurrentStatus IN ('مغلقة','تم الحل') THEN 1 ELSE 0 END) AS closed
      FROM Complaints
    `);
    res.json({ totals }); // شكل مختلف عمداً للسوبر أدمن
  } catch (e) {
    console.error('summary error:', e);
    res.status(500).json({ success: false, message: 'summary error' });
  }
});

router.get('/superadmin', async (req, res) => {
  try {
    const [[totals]] = await pool.execute(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN CurrentStatus = 'جديدة' THEN 1 ELSE 0 END) AS open,
        SUM(CASE WHEN CurrentStatus IN ('قيد المعالجة','قيد المراجعة') THEN 1 ELSE 0 END) AS in_progress,
        SUM(CASE WHEN CurrentStatus IN ('مغلقة','تم الحل') THEN 1 ELSE 0 END) AS closed
      FROM Complaints
    `);

    const [latestLogs] = await pool.execute(`
      SELECT CreatedAt, Username, ActivityType, Description
      FROM ActivityLogs
      ORDER BY CreatedAt DESC
      LIMIT 10
    `);

    const [[logsToday]] = await pool.execute(`
      SELECT COUNT(*) AS c
      FROM ActivityLogs
      WHERE DATE(CreatedAt) = CURDATE()
    `);

    res.json({ totals, latest_logs: latestLogs, logs_today: logsToday.c });
  } catch (e) {
    console.error('superadmin route error:', e);
    res.status(500).json({ success: false, message: 'overview error' });
  }
});

module.exports = router;
