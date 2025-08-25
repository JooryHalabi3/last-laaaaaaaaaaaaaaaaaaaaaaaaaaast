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
      `SELECT DISTINCT d.DepartmentID, d.DepartmentName, d.Description 
       FROM Departments d
       ORDER BY d.DepartmentName`
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

// جلب جميع أنواع الشكاوى
const getComplaintTypes = async (req, res) => {
  try {
    const [types] = await pool.execute(
      `SELECT DISTINCT ct.ComplaintTypeID, ct.TypeName, ct.Description 
       FROM ComplaintTypes ct
       ORDER BY ct.TypeName`
    );
    
    res.json({
      success: true,
      data: types
    });

  } catch (error) {
    console.error('خطأ في جلب أنواع الشكاوى:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في الخادم' 
    });
  }
};

// جلب التصنيفات الفرعية حسب النوع الرئيسي
const getSubTypes = async (req, res) => {
  try {
    const { complaintTypeID } = req.params;

    if (!complaintTypeID) {
      return res.status(400).json({ 
        success: false, 
        message: 'معرف نوع الشكوى مطلوب' 
      });
    }

    const [subTypes] = await pool.execute(
      `SELECT DISTINCT cst.SubTypeID, cst.SubTypeName, cst.Description 
       FROM ComplaintSubTypes cst
       WHERE cst.ComplaintTypeID = ?
       ORDER BY cst.SubTypeName`,
      [complaintTypeID]
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

// جلب جميع شكاوى المريض
const getPatientComplaints = async (req, res) => {
  try {
    const { nationalId } = req.params;

    if (!nationalId) {
      return res.status(400).json({ 
        success: false, 
        message: 'رقم الهوية مطلوب' 
      });
    }

    // جلب بيانات المريض وشكاويه
    const [complaints] = await pool.execute(
      `SELECT 
        c.ComplaintID,
        c.ComplaintDate,
        c.ComplaintDetails,
        c.CurrentStatus,
        c.Priority,
        c.ResolutionDetails,
        c.ResolutionDate,
        p.FullName as PatientName,
        p.NationalID_Iqama,
        p.ContactNumber,
        p.Gender,
        d.DepartmentName,
        ct.TypeName as ComplaintTypeName,
        cst.SubTypeName,
        e.FullName as EmployeeName
       FROM Complaints c
       JOIN Patients p ON c.PatientID = p.PatientID
       JOIN Departments d ON c.DepartmentID = d.DepartmentID
       JOIN ComplaintTypes ct ON c.ComplaintTypeID = ct.ComplaintTypeID
       LEFT JOIN ComplaintSubTypes cst ON c.SubTypeID = cst.SubTypeID
       LEFT JOIN Employees e ON c.EmployeeID = e.EmployeeID
       WHERE p.NationalID_Iqama = ?
       ORDER BY c.ComplaintDate DESC`,
      [nationalId]
    );

    if (complaints.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'لا توجد شكاوى لهذا المريض' 
      });
    }

    // جلب سجل التاريخ لكل شكوى - مع التعامل مع عدم وجود الجدول
    const complaintsWithHistory = await Promise.all(
      complaints.map(async (complaint) => {
        let history = [];
        try {
          const [historyResults] = await pool.execute(
            `SELECT 
              ch.Stage,
              ch.Remarks,
              ch.Timestamp,
              ch.OldStatus,
              ch.NewStatus,
              e.FullName as EmployeeName
             FROM ComplaintHistory ch
             LEFT JOIN Employees e ON ch.EmployeeID = e.EmployeeID
             WHERE ch.ComplaintID = ?
             ORDER BY ch.Timestamp DESC`,
            [complaint.ComplaintID]
          );
          history = historyResults;
        } catch (historyError) {
          console.log(`جدول التاريخ غير موجود للشكوى ${complaint.ComplaintID}:`, historyError.message);
          history = [];
        }

        return {
          ...complaint,
          history: history
        };
      })
    );

    res.json({
      success: true,
      data: {
        patient: {
          name: complaints[0].PatientName,
          nationalId: complaints[0].NationalID_Iqama,
          contactNumber: complaints[0].ContactNumber,
          gender: complaints[0].Gender
        },
        complaints: complaintsWithHistory
      }
    });

  } catch (error) {
    console.error('خطأ في جلب شكاوى المريض:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في الخادم' 
    });
  }
};

// جلب تفاصيل شكوى محددة مع المرفقات
const getComplaintDetails = async (req, res) => {
  try {
    const { complaintId } = req.params;

    if (!complaintId) {
      return res.status(400).json({ 
        success: false, 
        message: 'معرف الشكوى مطلوب' 
      });
    }

    // جلب تفاصيل الشكوى مع جميع البيانات المرتبطة
    const [complaints] = await pool.execute(
      `SELECT 
        c.ComplaintID,
        c.ComplaintDate,
        c.ComplaintDetails,
        c.CurrentStatus,
        c.Priority,
        c.ResolutionDetails,
        c.ResolutionDate,
        p.FullName as PatientName,
        p.NationalID_Iqama,
        p.ContactNumber,
        p.Gender,
        d.DepartmentName,
        ct.TypeName as ComplaintTypeName,
        cst.SubTypeName,
        e.FullName as EmployeeName
       FROM Complaints c
       JOIN Patients p ON c.PatientID = p.PatientID
       JOIN Departments d ON c.DepartmentID = d.DepartmentID
       JOIN ComplaintTypes ct ON c.ComplaintTypeID = ct.ComplaintTypeID
       LEFT JOIN ComplaintSubTypes cst ON c.SubTypeID = cst.SubTypeID
       LEFT JOIN Employees e ON c.EmployeeID = e.EmployeeID
       WHERE c.ComplaintID = ?`,
      [complaintId]
    );

    if (complaints.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'الشكوى غير موجودة' 
      });
    }

    const complaint = complaints[0];

    // جلب المرفقات - مع التعامل مع عدم وجود الجدول
    let attachments = [];
    try {
      cconst [attachments] = await pool.execute(
  `SELECT 
     a.FileName,
     a.FileType,
     a.FileSize,
     a.FilePath
   FROM Attachments a
   WHERE a.ComplaintID = ?`,
  [complaintId]
);

      attachments = attachmentResults;
    } catch (attachmentError) {
      console.log('جدول المرفقات غير موجود، سيتم تجاهل المرفقات:', attachmentError.message);
      attachments = [];
    }

    // جلب سجل التاريخ للشكوى - مع التعامل مع عدم وجود الجدول
    let history = [];
    try {
      const [historyResults] = await pool.execute(
        `SELECT 
          ch.Stage,
          ch.Remarks,
          ch.Timestamp,
          ch.OldStatus,
          ch.NewStatus,
          e.FullName as EmployeeName
         FROM ComplaintHistory ch
         LEFT JOIN Employees e ON ch.EmployeeID = e.EmployeeID
         WHERE ch.ComplaintID = ?
         ORDER BY ch.Timestamp DESC`,
        [complaintId]
      );
      history = historyResults;
    } catch (historyError) {
      console.log('جدول التاريخ غير موجود، سيتم تجاهل التاريخ:', historyError.message);
      history = [];
    }

    res.json({
      success: true,
      data: {
        complaint: {
          ...complaint,
          attachments: attachments,
          history: history
        }
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

// التحقق من صلاحيات المستخدم
const checkUserPermissions = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'التوكن مطلوب' 
      });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // إرفاق معلومات المستخدم للطلب
    req.user = {
      employeeID: decoded.employeeID,
      username: decoded.username,
      roleID: decoded.roleID,
      roleName: decoded.roleName
    };
    
    next();
  } catch (error) {
    console.error('خطأ في التحقق من التوكن:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'التوكن غير صالح' 
    });
  }
};

// جلب جميع الشكاوى (مع دعم الصلاحيات)
const getAllComplaints = async (req, res) => {
  try {
    const { 
      dateFilter = 'all',
      search = '',
      status = '',
      department = '',
      complaintType = '',
      userFilter = false // للمستخدمين العاديين
    } = req.query;

    console.log('معاملات الطلب:', req.query);
    console.log('معلومات المستخدم:', req.user);

    let whereConditions = [];
    let queryParams = [];

    // إذا كان المستخدم عادي، لا يعرض أي شكاوي (أو شكاوي محددة فقط)
    if (req.user && req.user.roleID === 2) {
      whereConditions.push('1 = 0');
    }

    // فلتر التاريخ
    if (dateFilter && dateFilter !== 'all') {
      const days = parseInt(dateFilter);
      if (!isNaN(days)) {
        whereConditions.push('c.ComplaintDate >= DATE_SUB(NOW(), INTERVAL ? DAY)');
        queryParams.push(days);
      }
    }

    // فلتر البحث
    if (search && search.trim() !== '') {
      whereConditions.push('(c.ComplaintID LIKE ? OR p.FullName LIKE ? OR p.NationalID_Iqama LIKE ?)');
      const searchTerm = `%${search.trim()}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    // فلتر الحالة
    if (status && status.trim() !== '') {
      whereConditions.push('c.CurrentStatus = ?');
      queryParams.push(status.trim());
    }

    // فلتر القسم
    if (department && department.trim() !== '') {
      whereConditions.push('d.DepartmentName LIKE ?');
      queryParams.push(`%${department.trim()}%`);
    }

    // فلتر نوع الشكوى
    if (complaintType && complaintType.trim() !== '') {
      whereConditions.push('ct.TypeName LIKE ?');
      queryParams.push(`%${complaintType.trim()}%`);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // جلب الشكاوى مع البيانات المرتبطة
    const [complaints] = await pool.execute(
      `SELECT 
        c.ComplaintID,
        c.ComplaintDate,
        c.ComplaintDetails,
        c.CurrentStatus,
        c.Priority,
        p.FullName as PatientName,
        p.NationalID_Iqama,
        p.ContactNumber,
        d.DepartmentName,
        ct.TypeName as ComplaintTypeName,
        cst.SubTypeName,
        e.FullName as EmployeeName
       FROM Complaints c
       JOIN Patients p ON c.PatientID = p.PatientID
       JOIN Departments d ON c.DepartmentID = d.DepartmentID
       JOIN ComplaintTypes ct ON c.ComplaintTypeID = ct.ComplaintTypeID
       LEFT JOIN ComplaintSubTypes cst ON c.SubTypeID = cst.SubTypeID
       LEFT JOIN Employees e ON c.EmployeeID = e.EmployeeID
       ${whereClause}
       ORDER BY c.ComplaintDate DESC
       LIMIT 50`,
      queryParams
    );

    console.log('عدد الشكاوى المطابقة:', complaints.length);

    res.json({
      success: true,
      data: complaints,
      userRole: req.user ? req.user.roleID : null,
      isAdmin: req.user ? (req.user.roleID === 1 || req.user.username === 'admin') : false
    });

  } catch (error) {
    console.error('خطأ في جلب الشكاوى:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في الخادم' 
    });
  }
};

// جلب الشكاوي الشخصية للمستخدم العادي
const getUserComplaints = async (req, res) => {
  try {
    if (!req.user || req.user.roleID !== 2) {
      return res.status(403).json({ 
        success: false, 
        message: 'هذا الـ endpoint للمستخدمين العاديين فقط' 
      });
    }

    const { 
      dateFilter = 'all',
      search = '',
      status = '',
      department = '',
      complaintType = ''
    } = req.query;

    let whereConditions = ['c.SubmittedByEmployeeID = ?'];
    let queryParams = [req.user.employeeID];

    // فلتر التاريخ
    if (dateFilter && dateFilter !== 'all') {
      const days = parseInt(dateFilter);
      if (!isNaN(days)) {
        whereConditions.push('c.ComplaintDate >= DATE_SUB(NOW(), INTERVAL ? DAY)');
        queryParams.push(days);
      }
    }

    // فلتر البحث
    if (search && search.trim() !== '') {
      whereConditions.push('(c.ComplaintID LIKE ? OR p.FullName LIKE ? OR p.NationalID_Iqama LIKE ?)');
      const searchTerm = `%${search.trim()}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    // فلتر الحالة
    if (status && status.trim() !== '') {
      whereConditions.push('c.CurrentStatus = ?');
      queryParams.push(status.trim());
    }

    // فلتر القسم
    if (department && department.trim() !== '') {
      whereConditions.push('d.DepartmentName LIKE ?');
      queryParams.push(`%${department.trim()}%`);
    }

    // فلتر نوع الشكوى
    if (complaintType && complaintType.trim() !== '') {
      whereConditions.push('ct.TypeName LIKE ?');
      queryParams.push(`%${complaintType.trim()}%`);
    }

    const whereClause = 'WHERE ' + whereConditions.join(' AND ');

    // جلب الشكاوى التي قدمها المستخدم
    const [complaints] = await pool.execute(
      `SELECT 
        c.ComplaintID,
        c.ComplaintDate,
        c.ComplaintDetails,
        c.CurrentStatus,
        c.Priority,
        p.FullName as PatientName,
        p.NationalID_Iqama,
        p.ContactNumber,
        d.DepartmentName,
        ct.TypeName as ComplaintTypeName,
        cst.SubTypeName,
        e.FullName as EmployeeName
       FROM Complaints c
       JOIN Patients p ON c.PatientID = p.PatientID
       JOIN Departments d ON c.DepartmentID = d.DepartmentID
       JOIN ComplaintTypes ct ON c.ComplaintTypeID = ct.ComplaintTypeID
       LEFT JOIN ComplaintSubTypes cst ON c.SubTypeID = cst.SubTypeID
       LEFT JOIN Employees e ON c.EmployeeID = e.EmployeeID
       ${whereClause}
       ORDER BY c.ComplaintDate DESC
       LIMIT 50`,
      queryParams
    );

    res.json({
      success: true,
      data: complaints,
      userRole: req.user.roleID,
      isAdmin: false
    });

  } catch (error) {
    console.error('خطأ في جلب شكاوى المستخدم:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في الخادم' 
    });
  }
};

// إنشاء أو تحديث جدول الشكاوي لدعم ربط الشكوى بالموظف
const ensureComplaintsTableStructure = async () => {
  try {
    // إضافة حقل SubmittedByEmployeeID إذا لم يكن موجوداً
    await pool.execute(`
      ALTER TABLE Complaints 
      ADD COLUMN IF NOT EXISTS SubmittedByEmployeeID INT,
      ADD FOREIGN KEY IF NOT EXISTS (SubmittedByEmployeeID) REFERENCES Employees(EmployeeID) ON DELETE SET NULL
    `);
    console.log('✅ تم التأكد من هيكل جدول الشكاوي');
  } catch (error) {
    // إذا كان الحقل موجود، سيظهر خطأ ويمكن تجاهله
    console.log('ℹ️ حقل SubmittedByEmployeeID موجود مسبقاً أو تم إنشاؤه');
  }
};

// استدعاء إعداد الجدول عند بدء التشغيل

const { notifyNewComplaint, notifyNewAttachment } = require('../utils/notificationUtils');

// حفظ شكوى جديدة مع المرفقات
const submitComplaint = async (req, res) => {
  try {
    // تفكيك الـ body (أضفنا complaintDetails)
    const {
      patientName,
      nationalId,
      gender,
      contactNumber,
      departmentID,
      visitDate,
      complaintTypeID,
      subTypeID,
      complaintDetails
    } = req.body;

    // من التوكن (الميدلوير يحط req.user)
    const submittedByEmployeeID = req.user ? req.user.employeeID : null;
    // استخدم الموظف الحقيقي بدل افتراض 1
    const employeeIdForComplaint = submittedByEmployeeID || null;

    // نظّف الأنواع الرقمية
    const complaintTypeId = Number(complaintTypeID);
    const departmentId    = Number(departmentID);
    const subTypeIdClean  = subTypeID ? Number(subTypeID) : null;

    // تاريخ الزيارة
    const visitAt = visitDate ? new Date(visitDate) : new Date();

    // التحقق من البيانات المطلوبة
    if (!patientName || !nationalId || !gender || !contactNumber || 
        !departmentID || !visitDate || !complaintTypeID || !complaintDetails) {
      return res.status(400).json({ 
        success: false, 
        message: 'جميع الحقول المطلوبة يجب أن تكون مملوءة' 
      });
    }

    // التحقق من وجود المريض أو إضافته
    let patientID;
    const [existingPatients] = await pool.execute(
      'SELECT PatientID FROM Patients WHERE NationalID_Iqama = ?',
      [nationalId]
    );

    if (existingPatients.length > 0) {
      patientID = existingPatients[0].PatientID;
    } else {
      // إضافة مريض جديد
      const [newPatient] = await pool.execute(
        `INSERT INTO Patients (FullName, NationalID_Iqama, ContactNumber, Gender) 
         VALUES (?, ?, ?, ?)`,
        [patientName, nationalId, contactNumber, gender]
      );
      patientID = newPatient.insertId;
    }

    // إضافة الشكوى
    // قبل: كان فيه SubmittedByEmployeeID (غير موجود في DB)
// بعد: إدخال مطابق لبنية الجدول الحالية
const [complaintResult] = await pool.execute(
  `INSERT INTO Complaints (
    PatientID, EmployeeID, ComplaintTypeID, SubTypeID, DepartmentID,
    ComplaintDate, ComplaintDetails, CurrentStatus, Priority
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    patientID,
    employeeIdForComplaint,     // من التوكن: req.user.employeeID
    complaintTypeId,
    subTypeIdClean,             // رقم أو NULL
    departmentId,
    visitAt,                    // تاريخ الزيارة
    complaintDetails,
    'جديدة',
    'متوسطة'
  ]
);


    const complaintID = complaintResult.insertId;

    // الحصول على اسم القسم للإشعار
    let departmentName = 'غير محدد';
    try {
      const [deptResult] = await pool.execute(
        'SELECT DepartmentName FROM departments WHERE DepartmentID = ?',
        [departmentId]
      );
      if (deptResult.length > 0) {
        departmentName = deptResult[0].DepartmentName;
      }
    } catch (deptError) {
      console.log('لا يمكن الحصول على اسم القسم:', deptError.message);
    }

    // إرسال إشعار للسوبر أدمن عن الشكوى الجديدة
    try {
      await notifyNewComplaint(complaintID, patientName, departmentName);
    } catch (notifError) {
      console.log('خطأ في إرسال إشعار الشكوى الجديدة:', notifError.message);
    }

    // حفظ المرفقات إذا وجدت - مع التعامل مع عدم وجود الجدول
    let attachments = [];
    if (req.files && req.files.length > 0) {
      try {
        for (const file of req.files) {
          // يطابق جدول Attachments في الـ DB
const [attachmentResult] = await pool.execute(
  `INSERT INTO Attachments (
    ComplaintID, FileName, FilePath, FileSize, FileType, UploadedByEmployeeID, Description
  ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  [
    complaintID,
    file.originalname,
    file.filename,
    file.size,
    file.mimetype,
    employeeIdForComplaint,   // الموظف الذي رفع المرفق (من التوكن)
    null                      // Description اختياري
  ]
);

          
          attachments.push({
            id: attachmentResult.insertId,
            name: file.originalname,
            path: file.filename,
            size: file.size,
            type: file.mimetype
          });

          // إرسال إشعار للسوبر أدمن عن المرفق الجديد
          try {
            await notifyNewAttachment(complaintID, file.originalname, 'مستخدم النظام');
          } catch (notifError) {
            console.log('خطأ في إرسال إشعار المرفق الجديد:', notifError.message);
          }
        }
      } catch (attachmentError) {
        console.log('جدول المرفقات غير موجود، تم تجاهل المرفقات:', attachmentError.message);
        attachments = [];
      }
    }

    // إضافة سجل في تاريخ الشكوى - مع التعامل مع عدم وجود الجدول
    try {
      await pool.execute(
        `INSERT INTO ComplaintHistory (
          ComplaintID, EmployeeID, Stage, Remarks, OldStatus, NewStatus
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          complaintID,
          submittedByEmployeeID,          // ← بدّلنا من employeeID إلى المرسل من التوكن
          'تم تقديم الشكوى',
          'تم استلام الشكوى بنجاح',
          '',
          'جديدة'
        ]
      );
    } catch (historyError) {
      console.log('جدول التاريخ غير موجود، تم تجاهل إضافة السجل:', historyError.message);
    }

    // الحصول على بيانات الشكوى المحدثة
    const [complaints] = await pool.execute(
      `SELECT c.*, p.FullName as PatientName, p.NationalID_Iqama, p.ContactNumber, p.Gender,
              d.DepartmentName, ct.TypeName as ComplaintTypeName, cst.SubTypeName
       FROM Complaints c
       JOIN Patients p ON c.PatientID = p.PatientID
       JOIN Departments d ON c.DepartmentID = d.DepartmentID
       JOIN ComplaintTypes ct ON c.ComplaintTypeID = ct.ComplaintTypeID
       LEFT JOIN ComplaintSubTypes cst ON c.SubTypeID = cst.SubTypeID
       WHERE c.ComplaintID = ?`,
      [complaintID]
    );

    if (complaints.length === 0) {
      return res.status(500).json({ 
        success: false, 
        message: 'حدث خطأ أثناء حفظ الشكوى' 
      });
    }

    res.status(201).json({
      success: true,
      message: 'تم حفظ الشكوى بنجاح',
      data: {
        complaint: complaints[0],
        complaintID,
        attachments
      }
    });

  } catch (error) {
    console.error('خطأ في حفظ الشكوى:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في الخادم' 
    });
  }
};

// التحقق من هوية المريض
const verifyPatientIdentity = async (req, res) => {
  try {
    const { nationalId } = req.params;

    if (!nationalId) {
      return res.status(400).json({ 
        success: false, 
        message: 'رقم الهوية مطلوب' 
      });
    }

    // البحث عن المريض في قاعدة البيانات
    const [patients] = await pool.execute(
      `SELECT PatientID, FullName, NationalID_Iqama, ContactNumber, Gender 
       FROM Patients 
       WHERE NationalID_Iqama = ?`,
      [nationalId]
    );

    if (patients.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'لا يوجد مريض مسجل بهذا الرقم' 
      });
    }

    const patient = patients[0];

    // جلب عدد الشكاوى للمريض
    const [complaintCount] = await pool.execute(
      `SELECT COUNT(*) as totalComplaints 
       FROM Complaints c 
       WHERE c.PatientID = ?`,
      [patient.PatientID]
    );

    res.json({
      success: true,
      data: {
        patient: {
          name: patient.FullName,
          nationalId: patient.NationalID_Iqama,
          contactNumber: patient.ContactNumber,
          gender: patient.Gender
        },
        totalComplaints: complaintCount[0].totalComplaints
      }
    });

  } catch (error) {
    console.error('خطأ في التحقق من هوية المريض:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في الخادم' 
    });
  }
};

const { notifyStatusUpdate } = require('../utils/notificationUtils');

// تحديث حالة الشكوى
const updateComplaintStatus = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { newStatus, notes, employeeId = 1 } = req.body;

    if (!complaintId) {
      return res.status(400).json({ 
        success: false, 
        message: 'معرف الشكوى مطلوب' 
      });
    }

    if (!newStatus) {
      return res.status(400).json({ 
        success: false, 
        message: 'الحالة الجديدة مطلوبة' 
      });
    }

    // التحقق من وجود الشكوى
    const [complaints] = await pool.execute(
      'SELECT ComplaintID, CurrentStatus FROM Complaints WHERE ComplaintID = ?',
      [complaintId]
    );

    if (complaints.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'الشكوى غير موجودة' 
      });
    }

    const oldStatus = complaints[0].CurrentStatus;

    // تحديث حالة الشكوى
    await pool.execute(
      'UPDATE Complaints SET CurrentStatus = ? WHERE ComplaintID = ?',
      [newStatus, complaintId]
    );

    // إضافة سجل في تاريخ الشكوى (إذا كان الجدول موجود)
    try {
      await pool.execute(
        `INSERT INTO ComplaintHistory (
          ComplaintID, EmployeeID, Stage, Remarks, OldStatus, NewStatus
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          complaintId,
          employeeId,
          'تحديث الحالة',
          notes || `تم تحديث حالة الشكوى من "${oldStatus}" إلى "${newStatus}"`,
          oldStatus,
          newStatus
        ]
      );
    } catch (historyError) {
      console.log('لا يمكن إضافة سجل التاريخ:', historyError.message);
    }

    // الحصول على اسم الموظف الذي قام بالتحديث للإشعار
    let updatedByName = 'مستخدم غير معروف';
    try {
      const [empResult] = await pool.execute(
        'SELECT FullName FROM employees WHERE EmployeeID = ?',
        [employeeId]
      );
      if (empResult.length > 0) {
        updatedByName = empResult[0].FullName;
      }
    } catch (empError) {
      console.log('لا يمكن الحصول على اسم الموظف:', empError.message);
    }

    // إرسال إشعار للسوبر أدمن عن تحديث الحالة
    try {
      await notifyStatusUpdate(complaintId, oldStatus, newStatus, updatedByName);
    } catch (notifError) {
      console.log('خطأ في إرسال إشعار تحديث الحالة:', notifError.message);
    }

    res.json({
      success: true,
      message: 'تم تحديث حالة الشكوى بنجاح',
      data: {
        complaintId,
        oldStatus,
        newStatus
      }
    });

  } catch (error) {
    console.error('خطأ في تحديث حالة الشكوى:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في الخادم' 
    });
  }
};

// تحويل الشكوى إلى قسم آخر (سوبر أدمن فقط)
const { notifyComplaintTransfer } = require('../utils/notificationUtils');
const transferComplaintToDepartment = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { newDepartmentId } = req.body;

    if (!req.user || Number(req.user.RoleID || req.user.roleID) !== 1) {
      return res.status(403).json({ success: false, message: 'يسمح للسوبر أدمن فقط بالتحويل' });
    }

    if (!complaintId || !newDepartmentId) {
      return res.status(400).json({ success: false, message: 'معرف الشكوى والقسم الجديد مطلوبان' });
    }

    // احصل على القسم الحالي واسمائه
    const [[current]] = await pool.execute(
      `SELECT c.ComplaintID, c.DepartmentID, d.DepartmentName
       FROM Complaints c
       LEFT JOIN Departments d ON d.DepartmentID = c.DepartmentID
       WHERE c.ComplaintID = ?
       LIMIT 1`,
      [complaintId]
    );
    if (!current) {
      return res.status(404).json({ success: false, message: 'الشكوى غير موجودة' });
    }

    const [[toDept]] = await pool.execute(
      `SELECT DepartmentID, DepartmentName FROM Departments WHERE DepartmentID = ? LIMIT 1`,
      [newDepartmentId]
    );
    if (!toDept) {
      return res.status(404).json({ success: false, message: 'القسم المستهدف غير موجود' });
    }

    // نفّذ التحويل: حدّث DepartmentID وأزل الإسناد الحالي إلى موظف (إن وُجد)
    await pool.execute(
      `UPDATE Complaints SET DepartmentID = ?, AssignedTo = NULL, AssignedBy = NULL, AssignedAt = NULL WHERE ComplaintID = ?`,
      [toDept.DepartmentID, complaintId]
    );

    // أضف سجل في التاريخ
    try {
      await pool.execute(
        `INSERT INTO ComplaintHistory (ComplaintID, EmployeeID, Stage, Remarks, OldStatus, NewStatus)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          complaintId,
          req.user.EmployeeID || null,
          'تحويل الشكوى',
          `تحويل من قسم "${current.DepartmentName || current.DepartmentID}" إلى "${toDept.DepartmentName}"`,
          '—',
          '—'
        ]
      );
    } catch (e) { /* جدول التاريخ قد لا يكون موجوداً */ }

    // إشعار السوبر أدمن
    try {
      await notifyComplaintTransfer(
        Number(complaintId),
        current.DepartmentName || String(current.DepartmentID),
        toDept.DepartmentName,
        req.user.FullName || req.user.Username || 'Super Admin'
      );
    } catch (e) {}

    return res.json({ success: true, message: 'تم تحويل الشكوى إلى القسم الجديد بنجاح' });
  } catch (error) {
    console.error('خطأ في تحويل الشكوى:', error);
    return res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};

module.exports = {
  getDepartments,
  getComplaintTypes,
  getSubTypes,
  getPatientComplaints,
  getComplaintDetails,
  getAllComplaints,
  getUserComplaints,
  submitComplaint,
  upload,
  verifyPatientIdentity,
  updateComplaintStatus,
  checkUserPermissions,
  transferComplaintToDepartment
};
