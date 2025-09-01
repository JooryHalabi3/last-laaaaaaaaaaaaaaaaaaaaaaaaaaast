const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
    list,
    count,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
    createNotification,
    broadcastNotification,
    getStats
} = require('../controllers/notificationsController');

// تطبيق المصادقة على جميع المسارات
router.use(authenticateToken);

// مسارات المستخدم العادي
// GET /api/notifications?status=unread|read|all&limit=20
router.get('/', list);

// GET /api/notifications/count?status=unread|read|all
router.get('/count', count);

// GET /api/notifications/stats
router.get('/stats', getStats);

// PUT /api/notifications/:id/read
router.put('/:id/read', markAsRead);

// PUT /api/notifications/mark-all-read
router.put('/mark-all-read', markAllAsRead);

// DELETE /api/notifications/:id
router.delete('/:id', deleteNotification);

// DELETE /api/notifications/clear-read
router.delete('/clear-read', clearReadNotifications);

// مسارات المدراء فقط
// POST /api/notifications
router.post('/', 
    requireRole(1), // SuperAdmin only
    createNotification
);

// POST /api/notifications/broadcast
router.post('/broadcast', 
    requireRole(1), // SuperAdmin only
    broadcastNotification
);

module.exports = router;