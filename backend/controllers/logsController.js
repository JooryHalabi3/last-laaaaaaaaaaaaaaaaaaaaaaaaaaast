const pool = require('../config/database');
const jwt = require('jsonwebtoken');

// التحقق من صلاحيات المستخدم
const checkUserPermissions = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'لا يوجد رمز مصادقة' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const [userResult] = await pool.execute(
      `SELECT u.UserID, u.Username, u.FullName, u.RoleID, r.RoleName 
       FROM users u 
       LEFT JOIN roles r ON u.RoleID = r.RoleID 
       WHERE u.UserID = ?`,
      [decoded.UserID || decoded.employeeID]
    );

    if (userResult.length === 0) {
      return res.status(401).json({ message: 'المستخدم غير موجود' });
    }

    req.user = {
      UserID: userResult[0].UserID,
      employeeID: userResult[0].UserID, // للتوافق مع الكود القديم
      username: userResult[0].Username,
      fullName: userResult[0].FullName,
      roleID: userResult[0].RoleID,
      roleName: userResult[0].RoleName
    };

    next();
  } catch (error) {
    console.error('خطأ في التحقق من الصلاحيات:', error);
    res.status(401).json({ message: 'رمز المصادقة غير صالح' });
  }
};

// التحقق من صلاحيات المدير
const checkAdminPermissions = async (req, res, next) => {
  try {
    if (req.user.roleID !== 1 && req.user.username.toLowerCase() !== 'admin') {
      return res.status(403).json({ message: 'ليس لديك صلاحية للوصول لهذه الميزة' });
    }
    next();
  } catch (error) {
    console.error('خطأ في التحقق من صلاحيات المدير:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
};

// دالة تسجيل النشاط
const logActivity = async (actorUserID, effectiveUserID, action, details = {}) => {
  try {
    await pool.execute(
      `INSERT INTO activitylogs (ActorUserID, EffectiveUserID, Action, Details) 
       VALUES (?, ?, ?, ?)`,
      [actorUserID, effectiveUserID, action, JSON.stringify(details)]
    );
  } catch (error) {
    console.error('خطأ في تسجيل النشاط:', error);
  }
};

// جلب سجلات النشاط
const getActivityLogs = async (req, res) => {
  try {
    const { 
      limit = 50, 
      offset = 0, 
      action, 
      userID, 
      dateFrom, 
      dateTo 
    } = req.query;

    let whereConditions = [];
    let queryParams = [];

    if (action) {
      whereConditions.push('al.Action = ?');
      queryParams.push(action);
    }

    if (userID) {
      whereConditions.push('(al.ActorUserID = ? OR al.EffectiveUserID = ?)');
      queryParams.push(userID, userID);
    }

    if (dateFrom) {
      whereConditions.push('DATE(al.CreatedAt) >= ?');
      queryParams.push(dateFrom);
    }

    if (dateTo) {
      whereConditions.push('DATE(al.CreatedAt) <= ?');
      queryParams.push(dateTo);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ') 
      : '';

    const query = `
      SELECT al.LogID, al.Action, al.Details, al.CreatedAt,
             actor.FullName as ActorName, actor.Username as ActorUsername,
             effective.FullName as EffectiveName, effective.Username as EffectiveUsername
      FROM activitylogs al
      LEFT JOIN users actor ON al.ActorUserID = actor.UserID
      LEFT JOIN users effective ON al.EffectiveUserID = effective.UserID
      ${whereClause}
      ORDER BY al.CreatedAt DESC
      LIMIT ? OFFSET ?
    `;

    queryParams.push(parseInt(limit), parseInt(offset));

    const [logs] = await pool.execute(query, queryParams);

    // جلب العدد الإجمالي
    const countQuery = `
      SELECT COUNT(*) as total
      FROM activitylogs al
      ${whereClause}
    `;

    const [countResult] = await pool.execute(countQuery, queryParams.slice(0, -2));

    res.json({
      success: true,
      data: logs.map(log => ({
        ...log,
        Details: typeof log.Details === 'string' ? JSON.parse(log.Details) : log.Details
      })),
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: countResult[0].total
      }
    });

  } catch (error) {
    console.error('خطأ في جلب سجلات النشاط:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};

// جلب إحصائيات النشاط
const getActivityStats = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    let whereConditions = [];
    let queryParams = [];

    if (dateFrom) {
      whereConditions.push('DATE(CreatedAt) >= ?');
      queryParams.push(dateFrom);
    }

    if (dateTo) {
      whereConditions.push('DATE(CreatedAt) <= ?');
      queryParams.push(dateTo);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ') 
      : '';

    // إحصائيات حسب نوع النشاط
    const [actionStats] = await pool.execute(`
      SELECT Action, COUNT(*) as count
      FROM activitylogs
      ${whereClause}
      GROUP BY Action
      ORDER BY count DESC
    `, queryParams);

    // إحصائيات حسب المستخدم
    const [userStats] = await pool.execute(`
      SELECT u.FullName, u.Username, COUNT(al.LogID) as count
      FROM activitylogs al
      LEFT JOIN users u ON al.ActorUserID = u.UserID
      ${whereClause}
      GROUP BY al.ActorUserID, u.FullName, u.Username
      ORDER BY count DESC
      LIMIT 10
    `, queryParams);

    // إحصائيات يومية للأسبوع الماضي
    const [dailyStats] = await pool.execute(`
      SELECT DATE(CreatedAt) as date, COUNT(*) as count
      FROM activitylogs
      WHERE CreatedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(CreatedAt)
      ORDER BY date DESC
    `);

    res.json({
      success: true,
      data: {
        byAction: actionStats,
        byUser: userStats,
        daily: dailyStats
      }
    });

  } catch (error) {
    console.error('خطأ في جلب إحصائيات النشاط:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};

// جلب أنواع الأنشطة المتاحة
const getActivityTypes = async (req, res) => {
  try {
    const [types] = await pool.execute(`
      SELECT DISTINCT Action
      FROM activitylogs
      ORDER BY Action
    `);

    res.json({
      success: true,
      data: types.map(type => type.Action)
    });

  } catch (error) {
    console.error('خطأ في جلب أنواع الأنشطة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};

// حذف سجلات النشاط القديمة
const cleanupOldLogs = async (req, res) => {
  try {
    const { daysOld = 90 } = req.body;

    const [result] = await pool.execute(`
      DELETE FROM activitylogs 
      WHERE CreatedAt < DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [daysOld]);

    await logActivity(req.user.UserID, null, 'LOGS_CLEANUP', {
      deletedRows: result.affectedRows,
      daysOld
    });

    res.json({
      success: true,
      message: `تم حذف ${result.affectedRows} سجل قديم`,
      deletedRows: result.affectedRows
    });

  } catch (error) {
    console.error('خطأ في تنظيف السجلات:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};

// تصدير سجلات النشاط
const exportLogs = async (req, res) => {
  try {
    const { 
      format = 'json', 
      dateFrom, 
      dateTo, 
      action, 
      userID 
    } = req.query;

    let whereConditions = [];
    let queryParams = [];

    if (action) {
      whereConditions.push('al.Action = ?');
      queryParams.push(action);
    }

    if (userID) {
      whereConditions.push('(al.ActorUserID = ? OR al.EffectiveUserID = ?)');
      queryParams.push(userID, userID);
    }

    if (dateFrom) {
      whereConditions.push('DATE(al.CreatedAt) >= ?');
      queryParams.push(dateFrom);
    }

    if (dateTo) {
      whereConditions.push('DATE(al.CreatedAt) <= ?');
      queryParams.push(dateTo);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ') 
      : '';

    const query = `
      SELECT al.LogID, al.Action, al.Details, al.CreatedAt,
             actor.FullName as ActorName, actor.Username as ActorUsername,
             effective.FullName as EffectiveName, effective.Username as EffectiveUsername
      FROM activitylogs al
      LEFT JOIN users actor ON al.ActorUserID = actor.UserID
      LEFT JOIN users effective ON al.EffectiveUserID = effective.UserID
      ${whereClause}
      ORDER BY al.CreatedAt DESC
      LIMIT 10000
    `;

    const [logs] = await pool.execute(query, queryParams);

    const processedLogs = logs.map(log => ({
      ...log,
      Details: typeof log.Details === 'string' ? JSON.parse(log.Details) : log.Details
    }));

    if (format === 'csv') {
      // تحويل إلى CSV
      const csv = convertToCSV(processedLogs);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=activity_logs.csv');
      res.send(csv);
    } else {
      // إرجاع JSON
      res.json({
        success: true,
        data: processedLogs,
        exportedAt: new Date().toISOString(),
        totalRecords: processedLogs.length
      });
    }

    // تسجيل عملية التصدير
    await logActivity(req.user.UserID, null, 'LOGS_EXPORTED', {
      format,
      recordCount: processedLogs.length,
      filters: { action, userID, dateFrom, dateTo }
    });

  } catch (error) {
    console.error('خطأ في تصدير السجلات:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};

// دالة مساعدة لتحويل البيانات إلى CSV
const convertToCSV = (data) => {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',')
  );

  return [csvHeaders, ...csvRows].join('\n');
};

module.exports = {
  checkUserPermissions,
  checkAdminPermissions,
  logActivity,
  getActivityLogs,
  getActivityStats,
  getActivityTypes,
  cleanupOldLogs,
  exportLogs
};