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
        SUM(CASE WHEN Status = 'open' THEN 1 ELSE 0 END) AS open,
        SUM(CASE WHEN Status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress,
        SUM(CASE WHEN Status = 'closed' THEN 1 ELSE 0 END) AS closed
      FROM complaints
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
        SUM(CASE WHEN Status = 'open' THEN 1 ELSE 0 END) AS open,
        SUM(CASE WHEN Status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress,
        SUM(CASE WHEN Status = 'closed' THEN 1 ELSE 0 END) AS closed
      FROM complaints
    `);

    const [latestLogs] = await pool.execute(`
      SELECT al.CreatedAt, u.Username, al.Action as ActivityType, 
             JSON_UNQUOTE(JSON_EXTRACT(al.Details, '$.description')) as Description
      FROM activitylogs al
      LEFT JOIN users u ON al.ActorUserID = u.UserID
      ORDER BY al.CreatedAt DESC
      LIMIT 10
    `);

    const [[logsToday]] = await pool.execute(`
      SELECT COUNT(*) AS c
      FROM activitylogs
      WHERE DATE(CreatedAt) = CURDATE()
    `);

    res.json({ totals, latest_logs: latestLogs, logs_today: logsToday.c });
  } catch (e) {
    console.error('superadmin route error:', e);
    res.status(500).json({ success: false, message: 'overview error' });
  }
});

module.exports = router;
