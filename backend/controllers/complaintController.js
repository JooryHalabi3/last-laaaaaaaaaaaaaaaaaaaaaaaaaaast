const pool = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// إعداد multer لرفع الملفات
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB
  },
fileFilter: function (req, file, cb) {
  const ok =
    file.mimetype.startsWith('image/') ||
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/msword' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  if (ok) cb(null, true);
  else cb(new Error('نوع الملف غير مسموح به. يسمح بالصور و PDF و Word'), false);
}
});

// جلب جميع الأقسام
const getDepartments = async (req, res) => {
  try {
    const [departments] = await pool.execute(
      `SELECT DepartmentID, DepartmentName, CreatedAt, UpdatedAt 
       FROM departments
       ORDER BY DepartmentName`
    );
    
    res.json({
      success: true,
      data: departments
    });

  } catch (error) {
    console.error('خطأ في جلب الأقسام:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في الخادم' 
    });
  }
};

// جلب أسباب الشكاوى حسب القسم
const getComplaintReasons = async (req, res) => {
  try {
    const { departmentID } = req.params;

    if (!departmentID) {
      return res.status(400).json({ 
        success: false, 
        message: 'معرف القسم مطلوب' 
      });
    }

    const [reasons] = await pool.execute(
      `SELECT ReasonID, ReasonName, DepartmentID 
       FROM complaint_reasons
       WHERE DepartmentID = ?
       ORDER BY ReasonName`,
      [departmentID]
    );
    
    res.json({
      success: true,
      data: reasons
    });

  } catch (error) {
    console.error('خطأ في جلب أسباب الشكاوى:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في الخادم' 
    });
  }
};

// جلب التصنيفات الفرعية حسب السبب
const getSubTypes = async (req, res) => {
  try {
    const { reasonID } = req.params;

    if (!reasonID) {
      return res.status(400).json({ 
        success: false, 
        message: 'معرف السبب مطلوب' 
      });
    }

    const [subTypes] = await pool.execute(
      `SELECT SubtypeID, SubtypeName, ReasonID 
       FROM complaint_subtypes
       WHERE ReasonID = ?
       ORDER BY SubtypeName`,
      [reasonID]
    );
    
    res.json({
      success: true,
      data: subTypes
    });

  } catch (error) {
    console.error('خطأ في جلب التصنيفات الفرعية:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في الخادم' 
    });
  }
};

// إنشاء شكوى جديدة
const createComplaint = async (req, res) => {
  try {
    const {
      title,
      description,
      subtypeID,
      departmentID,
      priority,
      source,
      patientID,
      patientName,
      patientNationalID,
      patientPhone,
      patientEmail
    } = req.body;

    const userID = req.user.UserID || req.user.EmployeeID;

    // التحقق من البيانات المطلوبة
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'العنوان والوصف مطلوبان'
      });
    }

    let finalPatientID = patientID;

    // إنشاء مريض جديد إذا لم يكن موجوداً
    if (!patientID && patientName) {
      const [patientResult] = await pool.execute(
        `INSERT INTO patients (FullName, NationalID, Phone, Email) 
         VALUES (?, ?, ?, ?)`,
        [patientName, patientNationalID, patientPhone, patientEmail]
      );
      finalPatientID = patientResult.insertId;
    }

    // إنشاء رقم الشكوى
    const complaintNumber = `C${Date.now()}`;

    // إدراج الشكوى الجديدة
    const [result] = await pool.execute(
      `INSERT INTO complaints (ComplaintNumber, Title, Description, SubtypeID, 
                             DepartmentID, Priority, Source, PatientID, CreatedBy, Status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')`,
      [complaintNumber, title, description, subtypeID, departmentID, 
       priority || 'normal', source || 'in_person', finalPatientID, userID]
    );

    const complaintID = result.insertId;

    // معالجة المرفقات إن وجدت
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await pool.execute(
          `INSERT INTO complaint_attachments (ComplaintID, FileURL, FileName, 
                                            MimeType, SizeBytes, UploadedBy) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [complaintID, file.path, file.originalname, file.mimetype, file.size, userID]
        );
      }
    }

    // إضافة سجل في تاريخ الشكوى
    await pool.execute(
      `INSERT INTO complaint_history (ComplaintID, ActorUserID, NewStatus, 
                                    FieldChanged, NewValue) 
       VALUES (?, ?, 'open', 'Status', 'open')`,
      [complaintID, userID]
    );

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الشكوى بنجاح',
      data: {
        ComplaintID: complaintID,
        ComplaintNumber: complaintNumber
      }
    });

  } catch (error) {
    console.error('خطأ في إنشاء الشكوى:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};

// جلب جميع الشكاوى (للمدراء)
const getAllComplaints = async (req, res) => {
  try {
    const { 
      status, 
      departmentID, 
      priority, 
      source, 
      dateFrom, 
      dateTo, 
      limit = 50, 
      offset = 0 
    } = req.query;

    let whereConditions = [];
    let queryParams = [];

    if (status) {
      whereConditions.push('c.Status = ?');
      queryParams.push(status);
    }

    if (departmentID) {
      whereConditions.push('c.DepartmentID = ?');
      queryParams.push(departmentID);
    }

    if (priority) {
      whereConditions.push('c.Priority = ?');
      queryParams.push(priority);
    }

    if (source) {
      whereConditions.push('c.Source = ?');
      queryParams.push(source);
    }

    if (dateFrom) {
      whereConditions.push('DATE(c.CreatedAt) >= ?');
      queryParams.push(dateFrom);
    }

    if (dateTo) {
      whereConditions.push('DATE(c.CreatedAt) <= ?');
      queryParams.push(dateTo);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ') 
      : '';

    const query = `
      SELECT c.ComplaintID, c.ComplaintNumber, c.Title, c.Description,
             c.Status, c.Priority, c.Source, c.CreatedAt, c.UpdatedAt, c.ClosedAt,
             d.DepartmentName, st.SubtypeName, cr.ReasonName,
             p.FullName as PatientFullName, p.NationalID as PatientNationalID,
             creator.FullName as CreatedByName,
             assignee.FullName as AssignedToName
      FROM complaints c
      LEFT JOIN departments d ON c.DepartmentID = d.DepartmentID
      LEFT JOIN complaint_subtypes st ON c.SubtypeID = st.SubtypeID
      LEFT JOIN complaint_reasons cr ON st.ReasonID = cr.ReasonID
      LEFT JOIN patients p ON c.PatientID = p.PatientID
      LEFT JOIN users creator ON c.CreatedBy = creator.UserID
      LEFT JOIN (
          SELECT ca.ComplaintID, ca.AssignedToUserID,
                 ROW_NUMBER() OVER (PARTITION BY ca.ComplaintID ORDER BY ca.CreatedAt DESC) as rn
          FROM complaint_assignments ca
      ) latest_assignment ON c.ComplaintID = latest_assignment.ComplaintID AND latest_assignment.rn = 1
      LEFT JOIN users assignee ON latest_assignment.AssignedToUserID = assignee.UserID
      ${whereClause}
      ORDER BY c.CreatedAt DESC
      LIMIT ? OFFSET ?
    `;

    queryParams.push(parseInt(limit), parseInt(offset));

    const [complaints] = await pool.execute(query, queryParams);

    // جلب عدد النتائج الإجمالي
    const countQuery = `
      SELECT COUNT(*) as total
      FROM complaints c
      LEFT JOIN departments d ON c.DepartmentID = d.DepartmentID
      LEFT JOIN complaint_subtypes st ON c.SubtypeID = st.SubtypeID
      LEFT JOIN complaint_reasons cr ON st.ReasonID = cr.ReasonID
      ${whereClause}
    `;

    const [countResult] = await pool.execute(countQuery, queryParams.slice(0, -2));

    res.json({
      success: true,
      data: complaints,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: countResult[0].total
      }
    });

  } catch (error) {
    console.error('خطأ في جلب الشكاوى:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};

// جلب تفاصيل شكوى محددة
const getComplaintById = async (req, res) => {
  try {
    const { complaintID } = req.params;

    // جلب تفاصيل الشكوى
    const [complaints] = await pool.execute(
      `SELECT c.*, d.DepartmentName, st.SubtypeName, cr.ReasonName,
              p.FullName as PatientFullName, p.NationalID as PatientNationalID,
              p.Phone as PatientPhone, p.Email as PatientEmail,
              creator.FullName as CreatedByName
       FROM complaints c
       LEFT JOIN departments d ON c.DepartmentID = d.DepartmentID
       LEFT JOIN complaint_subtypes st ON c.SubtypeID = st.SubtypeID
       LEFT JOIN complaint_reasons cr ON st.ReasonID = cr.ReasonID
       LEFT JOIN patients p ON c.PatientID = p.PatientID
       LEFT JOIN users creator ON c.CreatedBy = creator.UserID
       WHERE c.ComplaintID = ?`,
      [complaintID]
    );

    if (complaints.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الشكوى غير موجودة'
      });
    }

    const complaint = complaints[0];

    // جلب المرفقات
    const [attachments] = await pool.execute(
      `SELECT AttachmentID, FileURL, FileName, MimeType, SizeBytes, CreatedAt
       FROM complaint_attachments WHERE ComplaintID = ?`,
      [complaintID]
    );

    // جلب الردود
    const [replies] = await pool.execute(
      `SELECT cr.*, u.FullName as AuthorName
       FROM complaint_replies cr
       LEFT JOIN users u ON cr.AuthorUserID = u.UserID
       WHERE cr.ComplaintID = ?
       ORDER BY cr.CreatedAt ASC`,
      [complaintID]
    );

    // جلب تاريخ التغييرات
    const [history] = await pool.execute(
      `SELECT ch.*, u.FullName as ActorName
       FROM complaint_history ch
       LEFT JOIN users u ON ch.ActorUserID = u.UserID
       WHERE ch.ComplaintID = ?
       ORDER BY ch.CreatedAt DESC`,
      [complaintID]
    );

    // جلب التكليفات
    const [assignments] = await pool.execute(
      `SELECT ca.*, u.FullName as AssignedToName, assigner.FullName as AssignedByName
       FROM complaint_assignments ca
       LEFT JOIN users u ON ca.AssignedToUserID = u.UserID
       LEFT JOIN users assigner ON ca.AssignedByUserID = assigner.UserID
       WHERE ca.ComplaintID = ?
       ORDER BY ca.CreatedAt DESC`,
      [complaintID]
    );

    res.json({
      success: true,
      data: {
        ...complaint,
        attachments,
        replies,
        history,
        assignments
      }
    });

  } catch (error) {
    console.error('خطأ في جلب تفاصيل الشكوى:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};

// تحديث حالة الشكوى
const updateComplaintStatus = async (req, res) => {
  try {
    const { complaintID } = req.params;
    const { status, notes } = req.body;
    const userID = req.user.UserID || req.user.EmployeeID;

    if (!status || !['open', 'in_progress', 'responded', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'حالة غير صحيحة'
      });
    }

    // جلب الحالة الحالية
    const [currentComplaint] = await pool.execute(
      'SELECT Status FROM complaints WHERE ComplaintID = ?',
      [complaintID]
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
    let updateQuery = `UPDATE complaints SET Status = ?, UpdatedAt = CURRENT_TIMESTAMP`;

    if (status === 'closed') {
      updateQuery += `, ClosedAt = CURRENT_TIMESTAMP`;
    }

    updateQuery += ` WHERE ComplaintID = ?`;
    updateData.push(complaintID);

    await pool.execute(updateQuery, updateData);

    // إضافة سجل في تاريخ التغييرات
    await pool.execute(
      `INSERT INTO complaint_history (ComplaintID, ActorUserID, PrevStatus, NewStatus, 
                                    FieldChanged, OldValue, NewValue) 
       VALUES (?, ?, ?, ?, 'Status', ?, ?)`,
      [complaintID, userID, oldStatus, status, oldStatus, status]
    );

    res.json({
      success: true,
      message: 'تم تحديث حالة الشكوى بنجاح'
    });

  } catch (error) {
    console.error('خطأ في تحديث حالة الشكوى:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};

// تكليف شكوى لمستخدم
const assignComplaint = async (req, res) => {
  try {
    const { complaintID } = req.params;
    const { assignedToUserID, notes } = req.body;
    const userID = req.user.UserID || req.user.EmployeeID;

    if (!assignedToUserID) {
      return res.status(400).json({
        success: false,
        message: 'معرف المستخدم المكلف مطلوب'
      });
    }

    // التحقق من وجود المستخدم المكلف
    const [assigneeCheck] = await pool.execute(
      'SELECT UserID, FullName FROM users WHERE UserID = ? AND IsActive = 1',
      [assignedToUserID]
    );

    if (assigneeCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم المكلف غير موجود أو غير نشط'
      });
    }

    // إضافة التكليف
    await pool.execute(
      `INSERT INTO complaint_assignments (ComplaintID, AssignedToUserID, AssignedByUserID, Notes) 
       VALUES (?, ?, ?, ?)`,
      [complaintID, assignedToUserID, userID, notes]
    );

    // تحديث حالة الشكوى إلى "قيد المعالجة"
    await pool.execute(
      `UPDATE complaints SET Status = 'in_progress', UpdatedAt = CURRENT_TIMESTAMP 
       WHERE ComplaintID = ?`,
      [complaintID]
    );

    // إضافة سجل في تاريخ التغييرات
    await pool.execute(
      `INSERT INTO complaint_history (ComplaintID, ActorUserID, NewStatus, 
                                    FieldChanged, NewValue) 
       VALUES (?, ?, 'in_progress', 'Assignment', ?)`,
      [complaintID, userID, `Assigned to ${assigneeCheck[0].FullName}`]
    );

    res.json({
      success: true,
      message: 'تم تكليف الشكوى بنجاح'
    });

  } catch (error) {
    console.error('خطأ في تكليف الشكوى:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};

// إضافة رد على الشكوى
const addReply = async (req, res) => {
  try {
    const { complaintID } = req.params;
    const { body, attachmentURL } = req.body;
    const userID = req.user.UserID || req.user.EmployeeID;

    if (!body) {
      return res.status(400).json({
        success: false,
        message: 'نص الرد مطلوب'
      });
    }

    // إضافة الرد
    const [result] = await pool.execute(
      `INSERT INTO complaint_replies (ComplaintID, AuthorUserID, Body, AttachmentURL) 
       VALUES (?, ?, ?, ?)`,
      [complaintID, userID, body, attachmentURL]
    );

    // تحديث حالة الشكوى إلى "تم الرد"
    await pool.execute(
      `UPDATE complaints SET Status = 'responded', UpdatedAt = CURRENT_TIMESTAMP 
       WHERE ComplaintID = ?`,
      [complaintID]
    );

    res.status(201).json({
      success: true,
      message: 'تم إضافة الرد بنجاح',
      data: {
        ReplyID: result.insertId
      }
    });

  } catch (error) {
    console.error('خطأ في إضافة الرد:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};

// جلب إحصائيات الشكاوى
const getComplaintStats = async (req, res) => {
  try {
    // إحصائيات عامة
    const [generalStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN Status = 'open' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN Status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN Status = 'responded' THEN 1 ELSE 0 END) as responded,
        SUM(CASE WHEN Status = 'closed' THEN 1 ELSE 0 END) as closed
      FROM complaints
    `);

    // إحصائيات حسب القسم
    const [departmentStats] = await pool.execute(`
      SELECT d.DepartmentName, 
             COUNT(c.ComplaintID) as total,
             SUM(CASE WHEN c.Status = 'open' THEN 1 ELSE 0 END) as open,
             SUM(CASE WHEN c.Status = 'closed' THEN 1 ELSE 0 END) as closed
      FROM departments d
      LEFT JOIN complaints c ON d.DepartmentID = c.DepartmentID
      GROUP BY d.DepartmentID, d.DepartmentName
      ORDER BY total DESC
    `);

    // إحصائيات حسب المصدر
    const [sourceStats] = await pool.execute(`
      SELECT Source,
             COUNT(*) as total,
             SUM(CASE WHEN Status = 'closed' THEN 1 ELSE 0 END) as closed
      FROM complaints
      GROUP BY Source
    `);

    res.json({
      success: true,
      data: {
        general: generalStats[0],
        byDepartment: departmentStats,
        bySource: sourceStats
      }
    });

  } catch (error) {
    console.error('خطأ في جلب إحصائيات الشكاوى:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};

// البحث في الشكاوى
const searchComplaints = async (req, res) => {
  try {
    const { query, limit = 20, offset = 0 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'نص البحث مطلوب'
      });
    }

    const searchQuery = `
      SELECT c.ComplaintID, c.ComplaintNumber, c.Title, c.Description,
             c.Status, c.Priority, c.CreatedAt,
             d.DepartmentName, creator.FullName as CreatedByName
      FROM complaints c
      LEFT JOIN departments d ON c.DepartmentID = d.DepartmentID
      LEFT JOIN users creator ON c.CreatedBy = creator.UserID
      WHERE c.Title LIKE ? OR c.Description LIKE ? OR c.ComplaintNumber LIKE ?
      ORDER BY c.CreatedAt DESC
      LIMIT ? OFFSET ?
    `;

    const searchTerm = `%${query}%`;
    const [results] = await pool.execute(searchQuery, [
      searchTerm, searchTerm, searchTerm, 
      parseInt(limit), parseInt(offset)
    ]);

    res.json({
      success: true,
      data: results,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('خطأ في البحث:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};

module.exports = {
  upload,
  getDepartments,
  getComplaintReasons,
  getSubTypes,
  createComplaint,
  getAllComplaints,
  getComplaintById,
  updateComplaintStatus,
  assignComplaint,
  addReply,
  getComplaintStats,
  searchComplaints
};