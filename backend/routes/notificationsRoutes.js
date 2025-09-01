const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/auth'); // << فقط authenticateToken
const controller = require('../controllers/notificationsController');

// حارس محلي للسوبر أدمن (RoleID=1)
function requireSuperAdmin(req, res, next) {
  const roleId = Number(req.user?.RoleID);
  if (roleId !== 1) {
    return res.status(403).json({ success: false, message: 'Forbidden: Super Admin only' });
  }
  next();
}

router.use(authenticateToken, requireSuperAdmin);

// GET /api/notifications?status=unread|read|all&limit=20
router.get('/', controller.list);

// GET /api/notifications/count?status=unread|read|all
router.get('/count', controller.count);

// POST /api/notifications/:id/read
router.post('/:id/read', controller.markAsRead);

// POST /api/notifications/read-all
router.post('/read-all', controller.markAllAsRead);

module.exports = router;
