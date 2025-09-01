const pool = require('../config/database');
const { logActivity } = require('./logsController');

// الحصول على معلومات الموظف الحالي
const getEmployeeProfile = async (req, res) => {
    try {
        const employeeId = req.user.EmployeeID;

        const [employees] = await pool.execute(
            `SELECT e.EmployeeID, e.FullName, e.Username, e.Email, e.PhoneNumber, 
                    e.Specialty, e.JoinDate, r.RoleName, d.DepartmentName
             FROM Employees e 
             JOIN Roles r ON e.RoleID = r.RoleID 
             LEFT JOIN Departments d ON e.DepartmentID = d.DepartmentID
             WHERE e.EmployeeID = ?`,
            [employeeId]
        );

        if (employees.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'الموظف غير موجود'
            });
        }

        res.json({
            success: true,
            data: employees[0]
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
            category,
            priority,
            attachments
        } = req.body;

        const employeeId = req.user.EmployeeID;

        // التحقق من البيانات المطلوبة
        if (!title || !description || !category) {
            return res.status(400).json({
                success: false,
                message: 'العنوان والوصف والفئة مطلوبة'
            });
        }

        // جلب قسم الموظف
        const [employeeData] = await pool.execute(
            'SELECT DepartmentID FROM Employees WHERE EmployeeID = ?',
            [employeeId]
        );

        const departmentId = employeeData[0].DepartmentID;

        // إنشاء الشكوى
        const [result] = await pool.execute(
            `INSERT INTO Complaints (Title, Description, Category, Priority, Status, 
                                   EmployeeID, DepartmentID, CreatedAt, UpdatedAt) 
             VALUES (?, ?, ?, ?, 'مفتوحة/جديدة', ?, ?, NOW(), NOW())`,
            [title, description, category, priority || 'متوسط', employeeId, departmentId]
        );

        const complaintId = result.insertId;

        // الحصول على اسم القسم للإشعار
        let departmentName = 'غير محدد';
        try {
            const [deptResult] = await pool.execute(
                'SELECT DepartmentName FROM Departments WHERE DepartmentID = ?',
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
            await notifyNewComplaint(complaintId, title, departmentName);
        } catch (notifError) {
            console.log('خطأ في إرسال إشعار الشكوى الجديدة:', notifError.message);
        }

        // تسجيل النشاط
        await logActivity(
            employeeId,
            req.user.Username,
            'create_complaint',
            `تم إنشاء شكوى جديدة: ${title}`,
            req.ip,
            req.get('User-Agent'),
            complaintId,
            'complaint'
        );

        res.status(201).json({
            success: true,
            message: 'تم إنشاء الشكوى بنجاح',
            data: {
                complaintId,
                title,
                status: 'مفتوحة/جديدة'
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
        const employeeId = req.user.EmployeeID;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const status = req.query.status;
        const category = req.query.category;

        let whereConditions = ['(c.EmployeeID = ? OR c.AssignedTo = ?)'];
        let queryParams = [employeeId, employeeId];

        if (status) {
            whereConditions.push('c.Status = ?');
            queryParams.push(status);
        }

        if (category) {
            whereConditions.push('c.Category = ?');
            queryParams.push(category);
        }

        const whereClause = whereConditions.join(' AND ');

        // جلب عدد الشكاوى
        const [countResult] = await pool.execute(
            `SELECT COUNT(*) as total 
             FROM Complaints c 
             WHERE ${whereClause}`,
            queryParams
        );

        const totalComplaints = countResult[0].total;

        // جلب الشكاوى
        const [complaints] = await pool.execute(
            `SELECT c.ComplaintID, c.Title, c.Description, c.Category, c.Priority, 
                    c.Status, c.CreatedAt, c.UpdatedAt, c.AssignedTo,
                    e.FullName as EmployeeName, d.DepartmentName,
                    (SELECT COUNT(*) FROM Responses r WHERE r.ComplaintID = c.ComplaintID) as ResponseCount
             FROM Complaints c
             LEFT JOIN Employees e ON c.EmployeeID = e.EmployeeID
             LEFT JOIN Departments d ON c.DepartmentID = d.DepartmentID
             WHERE ${whereClause}
             ORDER BY c.CreatedAt DESC
             LIMIT ? OFFSET ?`,
            [...queryParams, limit, offset]
        );

        res.json({
            success: true,
            data: {
                complaints,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalComplaints / limit),
                    totalComplaints,
                    complaintsPerPage: limit
                }
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

// جلب تفاصيل شكوى واحدة
const getComplaintDetails = async (req, res) => {
    try {
        const { complaintId } = req.params;
        const employeeId = req.user.EmployeeID;

        // التحقق من ملكية الشكوى
        const [complaints] = await pool.execute(
            `SELECT c.*, e.FullName as EmployeeName, d.DepartmentName,
                    a.FullName as AssignedToName
             FROM Complaints c
             LEFT JOIN Employees e ON c.EmployeeID = e.EmployeeID
             LEFT JOIN Departments d ON c.DepartmentID = d.DepartmentID
             LEFT JOIN Employees a ON c.AssignedTo = a.EmployeeID
             WHERE c.ComplaintID = ? AND (c.EmployeeID = ? OR c.AssignedTo = ?)`,
            [complaintId, employeeId, employeeId]
        );

        if (complaints.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'الشكوى غير موجودة أو ليس لديك صلاحية للوصول إليها'
            });
        }

        // جلب الردود
        const [responses] = await pool.execute(
            `SELECT r.*, e.FullName as EmployeeName
             FROM Responses r
             LEFT JOIN Employees e ON r.EmployeeID = e.EmployeeID
             WHERE r.ComplaintID = ?
             ORDER BY r.CreatedAt ASC`,
            [complaintId]
        );

        res.json({
            success: true,
            data: {
                complaint: complaints[0],
                responses
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

const { notifyNewResponse } = require('../utils/notificationUtils');

// إضافة رد على شكوى
const addResponse = async (req, res) => {
    try {
        const { complaintId } = req.params;
        const { content } = req.body;
        const employeeId = req.user.EmployeeID;

        if (!content) {
            return res.status(400).json({
                success: false,
                message: 'محتوى الرد مطلوب'
            });
        }

        // التحقق من ملكية الشكوى
        const [complaints] = await pool.execute(
            'SELECT * FROM Complaints WHERE ComplaintID = ? AND (EmployeeID = ? OR AssignedTo = ?)',
            [complaintId, employeeId, employeeId]
        );

        if (complaints.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'ليس لديك صلاحية للرد على هذه الشكوى'
            });
        }

        // إضافة الرد
        const [result] = await pool.execute(
            `INSERT INTO Responses (ComplaintID, EmployeeID, Content, CreatedAt) 
             VALUES (?, ?, ?, NOW())`,
            [complaintId, employeeId, content]
        );

        // تحديث وقت آخر تحديث للشكوى
        await pool.execute(
            'UPDATE Complaints SET UpdatedAt = NOW() WHERE ComplaintID = ?',
            [complaintId]
        );

        // تسجيل النشاط
        await logActivity(
            employeeId,
            req.user.Username,
            'add_response',
            `تم إضافة رد على الشكوى رقم ${complaintId}`,
            req.ip,
            req.get('User-Agent'),
            complaintId,
            'complaint'
        );

        // إرسال إشعار للسوبر أدمن عن الرد الجديد
        try {
            await notifyNewResponse(complaintId, 'رد داخلي', req.user.FullName || req.user.Username);
        } catch (notifError) {
            console.log('خطأ في إرسال إشعار الرد الجديد:', notifError.message);
        }

        res.status(201).json({
            success: true,
            message: 'تم إضافة الرد بنجاح',
            data: {
                responseId: result.insertId,
                content,
                createdAt: new Date()
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

const { notifyComplaintUpdate } = require('../utils/notificationUtils');

// تغيير حالة الشكوى
const updateComplaintStatus = async (req, res) => {
    try {
        const { complaintId } = req.params;
        const { status } = req.body;
        const employeeId = req.user.EmployeeID;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'الحالة الجديدة مطلوبة'
            });
        }

        // الحالات المسموح بها للموظف
        const allowedStatuses = ['مفتوحة/جديدة', 'قيد المعالجة', 'معلقة', 'مكتملة'];
        
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'الحالة غير مسموح بها'
            });
        }

        // التحقق من ملكية الشكوى
        const [complaints] = await pool.execute(
            'SELECT * FROM Complaints WHERE ComplaintID = ? AND (EmployeeID = ? OR AssignedTo = ?)',
            [complaintId, employeeId, employeeId]
        );

        if (complaints.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'ليس لديك صلاحية لتغيير حالة هذه الشكوى'
            });
        }

        // تحديث الحالة
        await pool.execute(
            'UPDATE Complaints SET Status = ?, UpdatedAt = NOW() WHERE ComplaintID = ?',
            [status, complaintId]
        );

        // تسجيل النشاط
        await logActivity(
            employeeId,
            req.user.Username,
            'update_status',
            `تم تغيير حالة الشكوى رقم ${complaintId} إلى: ${status}`,
            req.ip,
            req.get('User-Agent'),
            complaintId,
            'complaint'
        );

        // إرسال إشعار للسوبر أدمن عن تحديث الشكوى
        try {
            await notifyComplaintUpdate(complaintId, `تحديث حالة الشكوى إلى "${status}"`, req.user.FullName || req.user.Username);
        } catch (notifError) {
            console.log('خطأ في إرسال إشعار تحديث الشكوى:', notifError.message);
        }

        res.json({
            success: true,
            message: 'تم تحديث حالة الشكوى بنجاح',
            data: {
                complaintId,
                status,
                updatedAt: new Date()
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

// جلب الإشعارات
const getNotifications = async (req, res) => {
    try {
        const employeeId = req.user.EmployeeID;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // جلب الإشعارات الخاصة بالموظف
        const [notifications] = await pool.execute(
            `SELECT n.*, c.Title as ComplaintTitle
             FROM Notifications n
             LEFT JOIN Complaints c ON n.ComplaintID = c.ComplaintID
             WHERE n.EmployeeID = ?
             ORDER BY n.CreatedAt DESC
             LIMIT ? OFFSET ?`,
            [employeeId, limit, offset]
        );

        // جلب عدد الإشعارات غير المقروءة
        const [unreadCount] = await pool.execute(
            'SELECT COUNT(*) as count FROM Notifications WHERE EmployeeID = ? AND IsRead = 0',
            [employeeId]
        );

        res.json({
            success: true,
            data: {
                notifications,
                unreadCount: unreadCount[0].count,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(notifications.length / limit),
                    notificationsPerPage: limit
                }
            }
        });

    } catch (error) {
        console.error('خطأ في جلب الإشعارات:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

// تحديث حالة الإشعار كمقروء
const markNotificationAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const employeeId = req.user.EmployeeID;

        // تحديث حالة الإشعار
        const [result] = await pool.execute(
            'UPDATE Notifications SET IsRead = 1 WHERE NotificationID = ? AND EmployeeID = ?',
            [notificationId, employeeId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'الإشعار غير موجود أو ليس لديك صلاحية للوصول إليه'
            });
        }

        res.json({
            success: true,
            message: 'تم تحديث حالة الإشعار بنجاح'
        });

    } catch (error) {
        console.error('خطأ في تحديث حالة الإشعار:', error);
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
    addResponse,
    updateComplaintStatus,
    getNotifications,
    markNotificationAsRead
};
