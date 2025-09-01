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
    const userID = req.user.UserID || req.user.EmployeeID;
    const status = (req.query.status || 'unread').toLowerCase();
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);

    const where = ['UserID = ?'];
    const args = [userID];

    if (status === 'unread') where.push('IsRead = 0');
    else if (status === 'read') where.push('IsRead = 1');
    // 'all' => no IsRead filter

    const [rows] = await pool.query(
      `
      SELECT
        NotificationID, Title, Body, Type, IsRead, CreatedAt
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
    const userID = req.user.UserID || req.user.EmployeeID;
    const status = (req.query.status || 'unread').toLowerCase();

    const where = ['UserID = ?'];
    const args = [userID];

    if (status === 'unread') where.push('IsRead = 0');
    else if (status === 'read') where.push('IsRead = 1');
    // 'all' => no IsRead filter

    const [[{ count }]] = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM notifications
      WHERE ${where.join(' AND ')}
      `,
      args
    );

    res.json({ success: true, count });
  } catch (err) {
    console.error('notifications.count error:', err);
    res.status(500).json({ success: false, message: 'Error counting notifications' });
  }
};

/**
 * PUT /api/notifications/:id/read
 * Mark a single notification as read
 */
exports.markAsRead = async (req, res) => {
  try {
    const notificationID = parseInt(req.params.id, 10);
    const userID = req.user.UserID || req.user.EmployeeID;

    // التحقق من أن الإشعار يخص المستخدم الحالي
    const [notification] = await pool.query(
      'SELECT NotificationID FROM notifications WHERE NotificationID = ? AND UserID = ?',
      [notificationID, userID]
    );

    if (notification.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الإشعار غير موجود أو لا تملك صلاحية للوصول إليه'
      });
    }

    await pool.query(
      'UPDATE notifications SET IsRead = 1 WHERE NotificationID = ?',
      [notificationID]
    );

    res.json({ success: true, message: 'تم وضع علامة مقروء على الإشعار' });
  } catch (err) {
    console.error('notifications.markAsRead error:', err);
    res.status(500).json({ success: false, message: 'Error marking notification as read' });
  }
};

/**
 * PUT /api/notifications/mark-all-read
 * Mark all notifications as read for the current user
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userID = req.user.UserID || req.user.EmployeeID;

    const [result] = await pool.query(
      'UPDATE notifications SET IsRead = 1 WHERE UserID = ? AND IsRead = 0',
      [userID]
    );

    res.json({ 
      success: true, 
      message: 'تم وضع علامة مقروء على جميع الإشعارات',
      updatedCount: result.affectedRows
    });
  } catch (err) {
    console.error('notifications.markAllAsRead error:', err);
    res.status(500).json({ success: false, message: 'Error marking all notifications as read' });
  }
};

/**
 * DELETE /api/notifications/:id
 * Delete a single notification
 */
exports.deleteNotification = async (req, res) => {
  try {
    const notificationID = parseInt(req.params.id, 10);
    const userID = req.user.UserID || req.user.EmployeeID;

    // التحقق من أن الإشعار يخص المستخدم الحالي
    const [notification] = await pool.query(
      'SELECT NotificationID FROM notifications WHERE NotificationID = ? AND UserID = ?',
      [notificationID, userID]
    );

    if (notification.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الإشعار غير موجود أو لا تملك صلاحية للوصول إليه'
      });
    }

    await pool.query(
      'DELETE FROM notifications WHERE NotificationID = ?',
      [notificationID]
    );

    res.json({ success: true, message: 'تم حذف الإشعار' });
  } catch (err) {
    console.error('notifications.deleteNotification error:', err);
    res.status(500).json({ success: false, message: 'Error deleting notification' });
  }
};

/**
 * DELETE /api/notifications/clear-read
 * Delete all read notifications for the current user
 */
exports.clearReadNotifications = async (req, res) => {
  try {
    const userID = req.user.UserID || req.user.EmployeeID;

    const [result] = await pool.query(
      'DELETE FROM notifications WHERE UserID = ? AND IsRead = 1',
      [userID]
    );

    res.json({ 
      success: true, 
      message: 'تم حذف جميع الإشعارات المقروءة',
      deletedCount: result.affectedRows
    });
  } catch (err) {
    console.error('notifications.clearReadNotifications error:', err);
    res.status(500).json({ success: false, message: 'Error clearing read notifications' });
  }
};

/**
 * POST /api/notifications
 * Create a new notification (for admin use)
 */
exports.createNotification = async (req, res) => {
  try {
    const { userID, type, title, body } = req.body;

    if (!userID || !type || !title || !body) {
      return res.status(400).json({
        success: false,
        message: 'جميع البيانات مطلوبة (userID, type, title, body)'
      });
    }

    // التحقق من وجود المستخدم المستهدف
    const [user] = await pool.query(
      'SELECT UserID FROM users WHERE UserID = ? AND IsActive = 1',
      [userID]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم المستهدف غير موجود أو غير نشط'
      });
    }

    const [result] = await pool.query(
      'INSERT INTO notifications (UserID, Type, Title, Body) VALUES (?, ?, ?, ?)',
      [userID, type, title, body]
    );

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الإشعار بنجاح',
      data: { NotificationID: result.insertId }
    });
  } catch (err) {
    console.error('notifications.createNotification error:', err);
    res.status(500).json({ success: false, message: 'Error creating notification' });
  }
};

/**
 * POST /api/notifications/broadcast
 * Send notification to multiple users (for admin use)
 */
exports.broadcastNotification = async (req, res) => {
  try {
    const { userIDs, type, title, body, roleID, departmentID } = req.body;

    if (!type || !title || !body) {
      return res.status(400).json({
        success: false,
        message: 'النوع والعنوان والمحتوى مطلوبة'
      });
    }

    let targetUsers = [];

    if (userIDs && Array.isArray(userIDs)) {
      // إرسال لمستخدمين محددين
      const [users] = await pool.query(
        `SELECT UserID FROM users WHERE UserID IN (${userIDs.map(() => '?').join(',')}) AND IsActive = 1`,
        userIDs
      );
      targetUsers = users.map(u => u.UserID);
    } else if (roleID) {
      // إرسال لجميع المستخدمين في دور معين
      const [users] = await pool.query(
        'SELECT UserID FROM users WHERE RoleID = ? AND IsActive = 1',
        [roleID]
      );
      targetUsers = users.map(u => u.UserID);
    } else if (departmentID) {
      // إرسال لجميع المستخدمين في قسم معين
      const [users] = await pool.query(
        'SELECT UserID FROM users WHERE DepartmentID = ? AND IsActive = 1',
        [departmentID]
      );
      targetUsers = users.map(u => u.UserID);
    } else {
      // إرسال لجميع المستخدمين النشطين
      const [users] = await pool.query(
        'SELECT UserID FROM users WHERE IsActive = 1'
      );
      targetUsers = users.map(u => u.UserID);
    }

    if (targetUsers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'لا يوجد مستخدمين مستهدفين'
      });
    }

    // إنشاء الإشعارات
    const notifications = targetUsers.map(userID => [userID, type, title, body]);
    
    await pool.query(
      'INSERT INTO notifications (UserID, Type, Title, Body) VALUES ?',
      [notifications]
    );

    res.json({
      success: true,
      message: `تم إرسال الإشعار إلى ${targetUsers.length} مستخدم`,
      sentCount: targetUsers.length
    });
  } catch (err) {
    console.error('notifications.broadcastNotification error:', err);
    res.status(500).json({ success: false, message: 'Error broadcasting notification' });
  }
};

/**
 * GET /api/notifications/stats
 * Get notification statistics for the current user
 */
exports.getStats = async (req, res) => {
  try {
    const userID = req.user.UserID || req.user.EmployeeID;

    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN IsRead = 0 THEN 1 ELSE 0 END) as unread,
        SUM(CASE WHEN IsRead = 1 THEN 1 ELSE 0 END) as read,
        COUNT(CASE WHEN DATE(CreatedAt) = CURDATE() THEN 1 END) as today
      FROM notifications 
      WHERE UserID = ?
    `, [userID]);

    // إحصائيات حسب النوع
    const [typeStats] = await pool.query(`
      SELECT Type, COUNT(*) as count
      FROM notifications 
      WHERE UserID = ?
      GROUP BY Type
      ORDER BY count DESC
    `, [userID]);

    res.json({
      success: true,
      data: {
        overview: stats[0],
        byType: typeStats
      }
    });
  } catch (err) {
    console.error('notifications.getStats error:', err);
    res.status(500).json({ success: false, message: 'Error getting notification stats' });
  }
};