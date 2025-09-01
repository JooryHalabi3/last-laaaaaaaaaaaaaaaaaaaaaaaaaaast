const pool = require('../config/database');
const { logActivity } = require('./logsController');
const { notifyNewReply } = require('../utils/notificationUtils');

// إضافة رد على شكوى
const addResponse = async (req, res) => {
  try {
    const { complaintId, responseText, responseType = 'رد رسمي', attachmentURL } = req.body;
    const userID = req.user?.UserID || req.user?.EmployeeID;

    if (!complaintId || !responseText) {
      return res.status(400).json({
        success: false,
        message: 'معرف الشكوى ونص الرد مطلوبان'
      });
    }

    // التحقق من وجود الشكوى
    const [complaintCheck] = await pool.execute(
      'SELECT ComplaintID, Status FROM complaints WHERE ComplaintID = ?',
      [complaintId]
    );

    if (complaintCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الشكوى غير موجودة'
      });
    }

    // إضافة الرد إلى جدول complaint_replies
    const [responseResult] = await pool.execute(
      `INSERT INTO complaint_replies (ComplaintID, AuthorUserID, Body, AttachmentURL) 
       VALUES (?, ?, ?, ?)`,
      [complaintId, userID, responseText, attachmentURL]
    );

    // تحديث حالة الشكوى
    const newStatus = responseType === 'رد رسمي' ? 'responded' : 'in_progress';
    await pool.execute(
      'UPDATE complaints SET Status = ?, UpdatedAt = CURRENT_TIMESTAMP WHERE ComplaintID = ?',
      [newStatus, complaintId]
    );

    // إضافة سجل في التاريخ
    await pool.execute(
      `INSERT INTO complaint_history (ComplaintID, ActorUserID, PrevStatus, NewStatus, 
                                    FieldChanged, NewValue) 
       VALUES (?, ?, ?, ?, 'Response', ?)`,
      [complaintId, userID, complaintCheck[0].Status, newStatus, `تم إضافة رد: ${responseText.substring(0, 50)}...`]
    );

    // الحصول على اسم المستخدم للإشعار
    const [user] = await pool.execute(
      'SELECT FullName FROM users WHERE UserID = ?',
      [userID]
    );

    // إرسال إشعار
    if (user.length > 0) {
      await notifyNewReply(complaintId, userID);
    }

    // تسجيل النشاط
    await logActivity(userID, null, 'COMPLAINT_REPLY_ADDED', {
      complaintId,
      replyID: responseResult.insertId,
      responseType
    });

    console.log(`✅ تم إضافة رد على الشكوى ${complaintId} بنجاح`);

    res.json({
      success: true,
      message: 'تم إضافة الرد بنجاح',
      data: {
        ReplyID: responseResult.insertId,
        ComplaintID: complaintId,
        NewStatus: newStatus
      }
    });

  } catch (error) {
    console.error('❌ خطأ في إضافة الرد:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};

// جلب جميع الردود لشكوى محددة
const getComplaintResponses = async (req, res) => {
  try {
    const { complaintId } = req.params;

    // التحقق من وجود الشكوى
    const [complaintCheck] = await pool.execute(
      'SELECT ComplaintID FROM complaints WHERE ComplaintID = ?',
      [complaintId]
    );

    if (complaintCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الشكوى غير موجودة'
      });
    }

    // جلب الردود
    const [responses] = await pool.execute(`
      SELECT 
        cr.ReplyID,
        cr.Body as ResponseText,
        cr.AttachmentURL,
        cr.CreatedAt as ResponseDate,
        u.FullName as AuthorName,
        u.Email as AuthorEmail,
        u.RoleID
      FROM complaint_replies cr
      LEFT JOIN users u ON cr.AuthorUserID = u.UserID
      WHERE cr.ComplaintID = ?
      ORDER BY cr.CreatedAt ASC
    `, [complaintId]);

    console.log(`✅ تم جلب ${responses.length} رد للشكوى ${complaintId}`);

    res.json({
      success: true,
      data: responses
    });

  } catch (error) {
    console.error('❌ خطأ في جلب ردود الشكوى:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};

// تحديث حالة الشكوى
const updateComplaintStatus = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { status, notes } = req.body;
    const userID = req.user?.UserID || req.user?.EmployeeID;

    if (!status || !['open', 'in_progress', 'responded', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'حالة غير صحيحة'
      });
    }

    // جلب الحالة الحالية
    const [currentComplaint] = await pool.execute(
      'SELECT Status FROM complaints WHERE ComplaintID = ?',
      [complaintId]
    );

    if (currentComplaint.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الشكوى غير موجودة'
      });
    }

    const oldStatus = currentComplaint[0].Status;

    // تحديث الحالة
    const updateData = [status];
    let updateQuery = 'UPDATE complaints SET Status = ?, UpdatedAt = CURRENT_TIMESTAMP';

    if (status === 'closed') {
      updateQuery += ', ClosedAt = CURRENT_TIMESTAMP';
    }

    updateQuery += ' WHERE ComplaintID = ?';
    updateData.push(complaintId);

    await pool.execute(updateQuery, updateData);

    // إضافة سجل في التاريخ
    await pool.execute(
      `INSERT INTO complaint_history (ComplaintID, ActorUserID, PrevStatus, NewStatus, 
                                    FieldChanged, OldValue, NewValue) 
       VALUES (?, ?, ?, ?, 'Status', ?, ?)`,
      [complaintId, userID, oldStatus, status, oldStatus, status]
    );

    // تسجيل النشاط
    await logActivity(userID, null, 'COMPLAINT_STATUS_UPDATED', {
      complaintId,
      oldStatus,
      newStatus: status,
      notes
    });

    console.log(`✅ تم تحديث حالة الشكوى ${complaintId} من ${oldStatus} إلى ${status}`);

    res.json({
      success: true,
      message: 'تم تحديث حالة الشكوى بنجاح'
    });

  } catch (error) {
    console.error('❌ خطأ في تحديث حالة الشكوى:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};

// جلب سجل التاريخ لشكوى محددة
const getComplaintHistory = async (req, res) => {
  try {
    const { complaintId } = req.params;

    // التحقق من وجود الشكوى
    const [complaintCheck] = await pool.execute(
      'SELECT ComplaintID FROM complaints WHERE ComplaintID = ?',
      [complaintId]
    );

    if (complaintCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الشكوى غير موجودة'
      });
    }

    // جلب تاريخ التغييرات
    const [history] = await pool.execute(`
      SELECT 
        ch.HistoryID,
        ch.PrevStatus,
        ch.NewStatus,
        ch.FieldChanged,
        ch.OldValue,
        ch.NewValue,
        ch.CreatedAt,
        u.FullName as ActorName,
        u.Email as ActorEmail
      FROM complaint_history ch
      LEFT JOIN users u ON ch.ActorUserID = u.UserID
      WHERE ch.ComplaintID = ?
      ORDER BY ch.CreatedAt DESC
    `, [complaintId]);

    console.log(`✅ تم جلب ${history.length} سجل تاريخ للشكوى ${complaintId}`);

    res.json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('❌ خطأ في جلب تاريخ الشكوى:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};

// جلب الحالات المتاحة
const getAvailableStatuses = async (req, res) => {
  try {
    const statuses = [
      { value: 'open', label: 'مفتوحة', description: 'شكوى جديدة لم يتم التعامل معها بعد' },
      { value: 'in_progress', label: 'قيد المعالجة', description: 'جاري التعامل مع الشكوى' },
      { value: 'responded', label: 'تم الرد', description: 'تم الرد على الشكوى' },
      { value: 'closed', label: 'مغلقة', description: 'تم حل الشكوى وإغلاقها' }
    ];

    res.json({
      success: true,
      data: statuses
    });

  } catch (error) {
    console.error('❌ خطأ في جلب الحالات المتاحة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};

// جلب أنواع الردود المتاحة
const getResponseTypes = async (req, res) => {
  try {
    const responseTypes = [
      { value: 'رد رسمي', label: 'رد رسمي', description: 'رد رسمي من إدارة المستشفى' },
      { value: 'توضيح', label: 'توضيح', description: 'طلب توضيح إضافي من المريض' },
      { value: 'إجراء تصحيحي', label: 'إجراء تصحيحي', description: 'تم اتخاذ إجراء تصحيحي' },
      { value: 'تحويل', label: 'تحويل', description: 'تم تحويل الشكوى لقسم آخر' },
      { value: 'متابعة', label: 'متابعة', description: 'متابعة حالة الشكوى' }
    ];

    res.json({
      success: true,
      data: responseTypes
    });

  } catch (error) {
    console.error('❌ خطأ في جلب أنواع الردود:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};

// تحديث رد موجود
const updateResponse = async (req, res) => {
  try {
    const { responseId } = req.params;
    const { responseText, attachmentURL } = req.body;
    const userID = req.user?.UserID || req.user?.EmployeeID;

    if (!responseText) {
      return res.status(400).json({
        success: false,
        message: 'نص الرد مطلوب'
      });
    }

    // التحقق من وجود الرد والصلاحية
    const [responseCheck] = await pool.execute(
      'SELECT ReplyID, ComplaintID, AuthorUserID FROM complaint_replies WHERE ReplyID = ?',
      [responseId]
    );

    if (responseCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الرد غير موجود'
      });
    }

    const response = responseCheck[0];

    // التحقق من الصلاحية (المؤلف أو السوبر أدمن)
    if (response.AuthorUserID !== userID && req.user.RoleID !== 1) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لتعديل هذا الرد'
      });
    }

    // تحديث الرد
    await pool.execute(
      'UPDATE complaint_replies SET Body = ?, AttachmentURL = ? WHERE ReplyID = ?',
      [responseText, attachmentURL, responseId]
    );

    // تسجيل النشاط
    await logActivity(userID, null, 'COMPLAINT_REPLY_UPDATED', {
      replyID: responseId,
      complaintID: response.ComplaintID
    });

    console.log(`✅ تم تحديث الرد ${responseId} بنجاح`);

    res.json({
      success: true,
      message: 'تم تحديث الرد بنجاح'
    });

  } catch (error) {
    console.error('❌ خطأ في تحديث الرد:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};

// حذف رد
const deleteResponse = async (req, res) => {
  try {
    const { responseId } = req.params;
    const userID = req.user?.UserID || req.user?.EmployeeID;

    // التحقق من وجود الرد والصلاحية
    const [responseCheck] = await pool.execute(
      'SELECT ReplyID, ComplaintID, AuthorUserID FROM complaint_replies WHERE ReplyID = ?',
      [responseId]
    );

    if (responseCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الرد غير موجود'
      });
    }

    const response = responseCheck[0];

    // التحقق من الصلاحية (المؤلف أو السوبر أدمن)
    if (response.AuthorUserID !== userID && req.user.RoleID !== 1) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لحذف هذا الرد'
      });
    }

    // حذف الرد
    await pool.execute(
      'DELETE FROM complaint_replies WHERE ReplyID = ?',
      [responseId]
    );

    // تسجيل النشاط
    await logActivity(userID, null, 'COMPLAINT_REPLY_DELETED', {
      replyID: responseId,
      complaintID: response.ComplaintID
    });

    console.log(`✅ تم حذف الرد ${responseId} بنجاح`);

    res.json({
      success: true,
      message: 'تم حذف الرد بنجاح'
    });

  } catch (error) {
    console.error('❌ خطأ في حذف الرد:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};

// جلب إحصائيات الردود
const getResponseStats = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    
    let whereClause = 'WHERE 1=1';
    let params = [];
    
    if (fromDate && toDate) {
      whereClause += ' AND DATE(cr.CreatedAt) BETWEEN ? AND ?';
      params = [fromDate, toDate];
    }
    
    // إحصائيات عامة للردود
    const [generalStats] = await pool.execute(`
      SELECT 
        COUNT(*) as totalReplies,
        COUNT(DISTINCT cr.ComplaintID) as complaintsWithReplies,
        COUNT(DISTINCT cr.AuthorUserID) as activeResponders,
        AVG(LENGTH(cr.Body)) as avgReplyLength
      FROM complaint_replies cr
      ${whereClause}
    `, params);
    
    // إحصائيات حسب المؤلف
    const [authorStats] = await pool.execute(`
      SELECT 
        u.FullName as authorName,
        u.Email as authorEmail,
        r.RoleName,
        COUNT(cr.ReplyID) as replyCount,
        AVG(LENGTH(cr.Body)) as avgReplyLength
      FROM complaint_replies cr
      LEFT JOIN users u ON cr.AuthorUserID = u.UserID
      LEFT JOIN roles r ON u.RoleID = r.RoleID
      ${whereClause}
      GROUP BY cr.AuthorUserID, u.FullName, u.Email, r.RoleName
      ORDER BY replyCount DESC
      LIMIT 10
    `, params);
    
    // إحصائيات شهرية
    const [monthlyStats] = await pool.execute(`
      SELECT 
        DATE_FORMAT(cr.CreatedAt, '%Y-%m') as month,
        COUNT(*) as replyCount,
        COUNT(DISTINCT cr.ComplaintID) as complaintsCount
      FROM complaint_replies cr
      WHERE cr.CreatedAt >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      ${fromDate && toDate ? 'AND DATE(cr.CreatedAt) BETWEEN ? AND ?' : ''}
      GROUP BY DATE_FORMAT(cr.CreatedAt, '%Y-%m')
      ORDER BY month DESC
      LIMIT 12
    `, params);
    
    res.json({
      success: true,
      data: {
        overview: generalStats[0],
        byAuthor: authorStats,
        monthlyTrend: monthlyStats
      }
    });
    
  } catch (error) {
    console.error('❌ خطأ في جلب إحصائيات الردود:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};

module.exports = {
  addResponse,
  getComplaintResponses,
  updateComplaintStatus,
  getComplaintHistory,
  getAvailableStatuses,
  getResponseTypes,
  updateResponse,
  deleteResponse,
  getResponseStats
};