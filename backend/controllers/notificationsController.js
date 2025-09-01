// controllers/notificationsController.js
const pool = require('../config/database');

/**
 * GET /api/notifications
 * Query params:
 *   - status: 'unread' | 'read' | 'all'   (default: 'unread')
 *   - limit: number (max 100, default 20)
 */
exports.list = async (req, res) => {
  try {
    const employeeId = req.user.EmployeeID;
    const status = (req.query.status || 'unread').toLowerCase();
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);

    const where = ['RecipientEmployeeID = ?'];
    const args = [employeeId];

    if (status === 'unread') where.push('IsRead = 0');
    else if (status === 'read') where.push('IsRead = 1');
    // 'all' => no IsRead filter

    const [rows] = await pool.query(
      `
      SELECT
        NotificationID, Title, Body, Type, IsRead, CreatedAt, RelatedType, RelatedID
      FROM notifications
      WHERE ${where.join(' AND ')}
      ORDER BY CreatedAt DESC
      LIMIT ?
      `,
      [...args, limit]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('notifications.list error:', err);
    res.status(500).json({ success: false, message: 'Error fetching notifications' });
  }
};

/**
 * GET /api/notifications/count
 * Query params:
 *   - status: 'unread' | 'read' | 'all'  (default: 'unread')
 */
exports.count = async (req, res) => {
  try {
    const employeeId = req.user.EmployeeID;
    const status = (req.query.status || 'unread').toLowerCase();

    const where = ['RecipientEmployeeID = ?'];
    const args = [employeeId];

    if (status === 'unread') where.push('IsRead = 0');
    else if (status === 'read') where.push('IsRead = 1');

    const [[row]] = await pool.query(
      `
      SELECT COUNT(*) AS cnt
      FROM notifications
      WHERE ${where.join(' AND ')}
      `,
      args
    );

    res.json({ success: true, count: Number(row?.cnt || 0) });
  } catch (err) {
    console.error('notifications.count error:', err);
    res.status(500).json({ success: false, message: 'Error counting notifications' });
  }
};

/**
 * POST /api/notifications/:id/read
 * Marks a single notification as read (for the current user)
 */
exports.markAsRead = async (req, res) => {
  try {
    const employeeId = req.user.EmployeeID;
    const notificationId = parseInt(req.params.id, 10);

    await pool.query(
      `
      UPDATE notifications
      SET IsRead = 1
      WHERE NotificationID = ? AND RecipientEmployeeID = ?
      `,
      [notificationId, employeeId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('notifications.markAsRead error:', err);
    res.status(500).json({ success: false, message: 'Error marking as read' });
  }
};

/**
 * POST /api/notifications/read-all
 * Marks all unread notifications as read (for the current user)
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const employeeId = req.user.EmployeeID;

    await pool.query(
      `
      UPDATE notifications
      SET IsRead = 1
      WHERE IsRead = 0 AND RecipientEmployeeID = ?
      `,
      [employeeId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('notifications.markAllAsRead error:', err);
    res.status(500).json({ success: false, message: 'Error marking all as read' });
  }
};
