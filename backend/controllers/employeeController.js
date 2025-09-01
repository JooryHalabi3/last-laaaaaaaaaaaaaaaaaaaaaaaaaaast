const pool = require('../config/database');
const { logActivity } = require('./logsController');

// الحصول على معلومات الموظف الحالي
const getEmployeeProfile = async (req, res) => {
    try {
        const userID = req.user.UserID || req.user.EmployeeID;

        const [users] = await pool.execute(
            `SELECT u.UserID, u.FullName, u.Username, u.Email, u.Phone, 
                    u.NationalID, u.EmployeeNumber, u.RoleID, u.DepartmentID, 
                    u.CreatedAt, r.RoleName, d.DepartmentName
             FROM users u 
             JOIN roles r ON u.RoleID = r.RoleID 
             LEFT JOIN departments d ON u.DepartmentID = d.DepartmentID
             WHERE u.UserID = ?`,
            [userID]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'الموظف غير موجود'
            });
        }

        res.json({
            success: true,
            data: users[0]
        });

    } catch (error) {
        console.error('خطأ في جلب معلومات الموظف:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

const { notifyNewComplaint } = require('../utils/notificationUtils');

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
            attachments
        } = req.body;

        const userID = req.user.UserID || req.user.EmployeeID;

        // التحقق من البيانات المطلوبة
        if (!title || !description) {
            return res.status(400).json({
                success: false,
                message: 'العنوان والوصف مطلوبان'
            });
        }

        // إنشاء رقم الشكوى
        const complaintNumber = `C${Date.now()}`;

        // إدراج الشكوى الجديدة
        const [result] = await pool.execute(
            `INSERT INTO complaints (ComplaintNumber, Title, Description, SubtypeID, 
                                   DepartmentID, Priority, Source, PatientID, CreatedBy, Status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')`,
            [complaintNumber, title, description, subtypeID, departmentID, 
             priority || 'normal', source || 'in_person', patientID, userID]
        );

        const complaintID = result.insertId;

        // إضافة المرفقات إن وجدت
        if (attachments && attachments.length > 0) {
            for (const attachment of attachments) {
                await pool.execute(
                    `INSERT INTO complaint_attachments (ComplaintID, FileURL, FileName, 
                                                      MimeType, SizeBytes, UploadedBy) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [complaintID, attachment.url, attachment.filename, 
                     attachment.mimetype, attachment.size, userID]
                );
            }
        }

        // تسجيل النشاط
        await logActivity(userID, userID, 'COMPLAINT_CREATED', {
            complaintID,
            complaintNumber,
            title
        });

        // إرسال إشعار للمسؤولين
        await notifyNewComplaint(complaintID, userID);

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

// جلب شكاوى الموظف
const getEmployeeComplaints = async (req, res) => {
    try {
        const userID = req.user.UserID || req.user.EmployeeID;
        const { status, limit = 50, offset = 0 } = req.query;

        let whereClause = 'WHERE (c.CreatedBy = ? OR ca.AssignedToUserID = ?)';
        let queryParams = [userID, userID];

        if (status) {
            whereClause += ' AND c.Status = ?';
            queryParams.push(status);
        }

        const query = `
            SELECT DISTINCT c.ComplaintID, c.ComplaintNumber, c.Title, c.Description,
                   c.Status, c.Priority, c.Source, c.CreatedAt, c.UpdatedAt, c.ClosedAt,
                   d.DepartmentName, st.SubtypeName, cr.ReasonName,
                   p.FullName as PatientFullName, p.NationalID as PatientNationalID,
                   creator.FullName as CreatedByName,
                   ca.AssignedToUserID, assignee.FullName as AssignedToName
            FROM complaints c
            LEFT JOIN departments d ON c.DepartmentID = d.DepartmentID
            LEFT JOIN complaint_subtypes st ON c.SubtypeID = st.SubtypeID
            LEFT JOIN complaint_reasons cr ON st.ReasonID = cr.ReasonID
            LEFT JOIN patients p ON c.PatientID = p.PatientID
            LEFT JOIN users creator ON c.CreatedBy = creator.UserID
            LEFT JOIN (
                SELECT ca1.ComplaintID, ca1.AssignedToUserID,
                       ROW_NUMBER() OVER (PARTITION BY ca1.ComplaintID ORDER BY ca1.CreatedAt DESC) as rn
                FROM complaint_assignments ca1
            ) ca_ranked ON c.ComplaintID = ca_ranked.ComplaintID AND ca_ranked.rn = 1
            LEFT JOIN complaint_assignments ca ON c.ComplaintID = ca.ComplaintID AND ca.AssignmentID = (
                SELECT MAX(AssignmentID) FROM complaint_assignments WHERE ComplaintID = c.ComplaintID
            )
            LEFT JOIN users assignee ON ca.AssignedToUserID = assignee.UserID
            ${whereClause}
            ORDER BY c.CreatedAt DESC
            LIMIT ? OFFSET ?
        `;

        queryParams.push(parseInt(limit), parseInt(offset));

        const [complaints] = await pool.execute(query, queryParams);

        // جلب المرفقات لكل شكوى
        for (let complaint of complaints) {
            const [attachments] = await pool.execute(
                `SELECT AttachmentID, FileURL, FileName, MimeType, SizeBytes, CreatedAt
                 FROM complaint_attachments WHERE ComplaintID = ?`,
                [complaint.ComplaintID]
            );
            complaint.attachments = attachments;
        }

        res.json({
            success: true,
            data: complaints,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total: complaints.length
            }
        });

    } catch (error) {
        console.error('خطأ في جلب شكاوى الموظف:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

// جلب تفاصيل شكوى محددة
const getComplaintDetails = async (req, res) => {
    try {
        const { complaintID } = req.params;
        const userID = req.user.UserID || req.user.EmployeeID;

        // التحقق من صلاحية الوصول للشكوى
        const [accessCheck] = await pool.execute(
            `SELECT c.ComplaintID FROM complaints c
             LEFT JOIN complaint_assignments ca ON c.ComplaintID = ca.ComplaintID
             WHERE c.ComplaintID = ? AND (c.CreatedBy = ? OR ca.AssignedToUserID = ?)`,
            [complaintID, userID, userID]
        );

        if (accessCheck.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'غير مصرح لك بالوصول لهذه الشكوى'
            });
        }

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

        // جلب التكليفات الحالية
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

// إضافة رد على الشكوى
const addComplaintReply = async (req, res) => {
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

        // التحقق من صلاحية الوصول للشكوى
        const [accessCheck] = await pool.execute(
            `SELECT c.ComplaintID FROM complaints c
             LEFT JOIN complaint_assignments ca ON c.ComplaintID = ca.ComplaintID
             WHERE c.ComplaintID = ? AND (c.CreatedBy = ? OR ca.AssignedToUserID = ?)`,
            [complaintID, userID, userID]
        );

        if (accessCheck.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'غير مصرح لك بالرد على هذه الشكوى'
            });
        }

        // إضافة الرد
        const [result] = await pool.execute(
            `INSERT INTO complaint_replies (ComplaintID, AuthorUserID, Body, AttachmentURL) 
             VALUES (?, ?, ?, ?)`,
            [complaintID, userID, body, attachmentURL]
        );

        // تحديث حالة الشكوى إلى "تم الرد" إذا لم تكن مغلقة
        await pool.execute(
            `UPDATE complaints SET Status = 'responded', UpdatedAt = CURRENT_TIMESTAMP 
             WHERE ComplaintID = ? AND Status != 'closed'`,
            [complaintID]
        );

        // تسجيل النشاط
        await logActivity(userID, null, 'COMPLAINT_REPLY_ADDED', {
            complaintID,
            replyID: result.insertId
        });

        res.status(201).json({
            success: true,
            message: 'تم إضافة الرد بنجاح',
            data: {
                ReplyID: result.insertId
            }
        });

    } catch (error) {
        console.error('خطأ في إضافة رد الشكوى:', error);
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
        const { status } = req.body;
        const userID = req.user.UserID || req.user.EmployeeID;

        if (!status || !['open', 'in_progress', 'responded', 'closed'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'حالة غير صحيحة'
            });
        }

        // التحقق من صلاحية الوصول للشكوى
        const [accessCheck] = await pool.execute(
            `SELECT c.ComplaintID, c.Status FROM complaints c
             LEFT JOIN complaint_assignments ca ON c.ComplaintID = ca.ComplaintID
             WHERE c.ComplaintID = ? AND (c.CreatedBy = ? OR ca.AssignedToUserID = ?)`,
            [complaintID, userID, userID]
        );

        if (accessCheck.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'غير مصرح لك بتعديل هذه الشكوى'
            });
        }

        const oldStatus = accessCheck[0].Status;

        // تحديث الحالة
        const updateData = [status, userID];
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

        // تسجيل النشاط
        await logActivity(userID, null, 'COMPLAINT_STATUS_UPDATED', {
            complaintID,
            oldStatus,
            newStatus: status
        });

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

// جلب الإحصائيات الشخصية للموظف
const getEmployeeStats = async (req, res) => {
    try {
        const userID = req.user.UserID || req.user.EmployeeID;

        // إحصائيات الشكاوى المُنشأة
        const [createdStats] = await pool.execute(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN Status = 'open' THEN 1 ELSE 0 END) as open,
                SUM(CASE WHEN Status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN Status = 'responded' THEN 1 ELSE 0 END) as responded,
                SUM(CASE WHEN Status = 'closed' THEN 1 ELSE 0 END) as closed
             FROM complaints WHERE CreatedBy = ?`,
            [userID]
        );

        // إحصائيات الشكاوى المُكلف بها
        const [assignedStats] = await pool.execute(
            `SELECT 
                COUNT(DISTINCT c.ComplaintID) as total,
                SUM(CASE WHEN c.Status = 'open' THEN 1 ELSE 0 END) as open,
                SUM(CASE WHEN c.Status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN c.Status = 'responded' THEN 1 ELSE 0 END) as responded,
                SUM(CASE WHEN c.Status = 'closed' THEN 1 ELSE 0 END) as closed
             FROM complaints c
             JOIN complaint_assignments ca ON c.ComplaintID = ca.ComplaintID
             WHERE ca.AssignedToUserID = ?`,
            [userID]
        );

        // الشكاوى الحديثة
        const [recentComplaints] = await pool.execute(
            `SELECT c.ComplaintID, c.ComplaintNumber, c.Title, c.Status, c.Priority, c.CreatedAt
             FROM complaints c
             LEFT JOIN complaint_assignments ca ON c.ComplaintID = ca.ComplaintID
             WHERE (c.CreatedBy = ? OR ca.AssignedToUserID = ?)
             ORDER BY c.CreatedAt DESC
             LIMIT 5`,
            [userID, userID]
        );

        res.json({
            success: true,
            data: {
                created: createdStats[0],
                assigned: assignedStats[0],
                recentComplaints
            }
        });

    } catch (error) {
        console.error('خطأ في جلب إحصائيات الموظف:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

// جلب الأقسام
const getDepartments = async (req, res) => {
    try {
        const [departments] = await pool.execute(
            'SELECT DepartmentID, DepartmentName FROM departments ORDER BY DepartmentName'
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

        const [reasons] = await pool.execute(
            'SELECT ReasonID, ReasonName FROM complaint_reasons WHERE DepartmentID = ? ORDER BY ReasonName',
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

// جلب الأنواع الفرعية حسب السبب
const getComplaintSubtypes = async (req, res) => {
    try {
        const { reasonID } = req.params;

        const [subtypes] = await pool.execute(
            'SELECT SubtypeID, SubtypeName FROM complaint_subtypes WHERE ReasonID = ? ORDER BY SubtypeName',
            [reasonID]
        );

        res.json({
            success: true,
            data: subtypes
        });

    } catch (error) {
        console.error('خطأ في جلب الأنواع الفرعية:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

module.exports = {
    getEmployeeProfile,
    createComplaint,
    getEmployeeComplaints,
    getComplaintDetails,
    addComplaintReply,
    updateComplaintStatus,
    getEmployeeStats,
    getDepartments,
    getComplaintReasons,
    getComplaintSubtypes
};