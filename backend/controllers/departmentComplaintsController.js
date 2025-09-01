// controllers/departmentComplaintsController.js
const pool = require('../config/database');
const { logActivity } = require('./logsController');

/**
 * يحاول استخراج DepartmentID للمستخدم الحالي:
 * - أولاً من التوكن (req.user)
 * - ثم من جدول users إذا توفر UserID أو Username
 */
async function resolveDepartmentIdForUser(req) {
  // 1) من بيانات التوكن مباشرة
  const depFromToken =
    req.user?.DepartmentID ||
    req.user?.department_id ||
    req.user?.departmentId;

  if (depFromToken) return Number(depFromToken);

  // 2) من جدول users عن طريق UserID أو Username
  const userID =
    req.user?.UserID ||
    req.user?.EmployeeID ||
    req.user?.user_id ||
    req.user?.empId;

  const username =
    req.user?.Username ||
    req.user?.username ||
    req.user?.user;

  if (userID) {
    const [rows] = await pool.execute(
      `SELECT DepartmentID FROM users WHERE UserID = ? LIMIT 1`,
      [userID]
    );
    if (rows?.length) return Number(rows[0].DepartmentID);
  }

  if (username) {
    const [rows] = await pool.execute(
      `SELECT DepartmentID FROM users WHERE Username = ? LIMIT 1`,
      [username]
    );
    if (rows?.length) return Number(rows[0].DepartmentID);
  }

  return null;
}

/**
 * GET /api/department-complaints/by-department
 * - Super Admin (RoleID=1) يقدر يمرر ?departmentId=XX
 * - Admin/Employee: يجلب شكاوى قسمه فقط
 */
exports.getComplaintsByDepartment = async (req, res) => {
  try {
    const userRoleID = Number(req.user?.RoleID || 0);
    const requestedDeptId = req.query.departmentId ? Number(req.query.departmentId) : null;

    let finalDeptId = null;

    if (userRoleID === 1) {
      // Super Admin: يقدر يشوف أي قسم
      finalDeptId = requestedDeptId || await resolveDepartmentIdForUser(req);
    } else {
      // Admin/Employee: قسمه فقط
      finalDeptId = await resolveDepartmentIdForUser(req);
    }

    if (!finalDeptId) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن تحديد القسم للمستخدم الحالي'
      });
    }

    console.log(`📋 جلب شكاوى القسم ${finalDeptId} للمستخدم (Role: ${userRoleID})`);

    // جلب شكاوى القسم مع التفاصيل
    const [complaints] = await pool.execute(`
      SELECT 
        c.ComplaintID,
        c.ComplaintNumber,
        c.Title,
        c.Description,
        c.Status,
        c.Priority,
        c.Source,
        c.CreatedAt,
        c.UpdatedAt,
        c.ClosedAt,
        d.DepartmentName,
        st.SubtypeName,
        cr.ReasonName,
        p.FullName as PatientFullName,
        p.NationalID as PatientNationalID,
        p.Phone as PatientPhone,
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
      WHERE c.DepartmentID = ?
      ORDER BY c.CreatedAt DESC
    `, [finalDeptId]);

    // إحصائيات القسم
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN Status = 'open' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN Status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN Status = 'responded' THEN 1 ELSE 0 END) as responded,
        SUM(CASE WHEN Status = 'closed' THEN 1 ELSE 0 END) as closed,
        SUM(CASE WHEN Priority = 'urgent' THEN 1 ELSE 0 END) as urgent,
        SUM(CASE WHEN Priority = 'high' THEN 1 ELSE 0 END) as high
      FROM complaints 
      WHERE DepartmentID = ?
    `, [finalDeptId]);

    // معلومات القسم
    const [deptInfo] = await pool.execute(
      'SELECT DepartmentID, DepartmentName FROM departments WHERE DepartmentID = ?',
      [finalDeptId]
    );

    res.json({
      success: true,
      data: {
        department: deptInfo[0] || { DepartmentID: finalDeptId, DepartmentName: 'غير محدد' },
        complaints,
        statistics: stats[0]
      }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب شكاوى القسم:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};

/**
 * GET /api/department-complaints/stats
 * إحصائيات سريعة لجميع الأقسام (للسوبر أدمن)
 * أو إحصائيات قسم المستخدم (للمدراء)
 */
exports.getDepartmentStats = async (req, res) => {
  try {
    const userRoleID = Number(req.user?.RoleID || 0);
    let whereClause = '';
    let params = [];

    if (userRoleID !== 1) {
      // ليس سوبر أدمن، اجلب قسمه فقط
      const deptId = await resolveDepartmentIdForUser(req);
      if (!deptId) {
        return res.status(400).json({
          success: false,
          message: 'لا يمكن تحديد القسم للمستخدم الحالي'
        });
      }
      whereClause = 'WHERE d.DepartmentID = ?';
      params.push(deptId);
    }

    const [stats] = await pool.execute(`
      SELECT 
        d.DepartmentID,
        d.DepartmentName,
        COUNT(c.ComplaintID) as total,
        SUM(CASE WHEN c.Status = 'open' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN c.Status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN c.Status = 'responded' THEN 1 ELSE 0 END) as responded,
        SUM(CASE WHEN c.Status = 'closed' THEN 1 ELSE 0 END) as closed,
        SUM(CASE WHEN c.Priority = 'urgent' THEN 1 ELSE 0 END) as urgent,
        SUM(CASE WHEN c.Priority = 'high' THEN 1 ELSE 0 END) as high,
        AVG(CASE WHEN c.Status = 'closed' AND c.ClosedAt IS NOT NULL 
            THEN TIMESTAMPDIFF(HOUR, c.CreatedAt, c.ClosedAt) 
            ELSE NULL END) as avg_resolution_hours
      FROM departments d
      LEFT JOIN complaints c ON d.DepartmentID = c.DepartmentID
      ${whereClause}
      GROUP BY d.DepartmentID, d.DepartmentName
      ORDER BY total DESC
    `, params);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ خطأ في جلب إحصائيات الأقسام:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};

/**
 * POST /api/department-complaints/assign
 * تكليف شكوى لموظف في نفس القسم
 */
exports.assignComplaint = async (req, res) => {
  try {
    const { complaintID, assignedToUserID, notes } = req.body;
    const assignerUserID = req.user.UserID || req.user.EmployeeID;

    if (!complaintID || !assignedToUserID) {
      return res.status(400).json({
        success: false,
        message: 'معرف الشكوى والمستخدم المكلف مطلوبان'
      });
    }

    // التحقق من وجود الشكوى وأنها في نفس قسم المستخدم
    const userDeptId = await resolveDepartmentIdForUser(req);
    const userRoleID = Number(req.user?.RoleID || 0);

    let complaintQuery = `
      SELECT c.ComplaintID, c.DepartmentID, c.Status, d.DepartmentName
      FROM complaints c
      LEFT JOIN departments d ON c.DepartmentID = d.DepartmentID
      WHERE c.ComplaintID = ?
    `;
    let complaintParams = [complaintID];

    // إذا لم يكن سوبر أدمن، تأكد أن الشكوى في قسمه
    if (userRoleID !== 1 && userDeptId) {
      complaintQuery += ' AND c.DepartmentID = ?';
      complaintParams.push(userDeptId);
    }

    const [complaints] = await pool.execute(complaintQuery, complaintParams);

    if (complaints.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الشكوى غير موجودة أو لا تملك صلاحية للوصول إليها'
      });
    }

    const complaint = complaints[0];

    // التحقق من أن المستخدم المكلف في نفس القسم
    const [assigneeCheck] = await pool.execute(
      'SELECT UserID, FullName, DepartmentID FROM users WHERE UserID = ? AND IsActive = 1',
      [assignedToUserID]
    );

    if (assigneeCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم المكلف غير موجود أو غير نشط'
      });
    }

    const assignee = assigneeCheck[0];

    // التأكد أن المكلف في نفس القسم (إلا للسوبر أدمن)
    if (userRoleID !== 1 && assignee.DepartmentID !== complaint.DepartmentID) {
      return res.status(403).json({
        success: false,
        message: 'لا يمكن تكليف شكوى لموظف من قسم آخر'
      });
    }

    // إضافة التكليف
    await pool.execute(
      `INSERT INTO complaint_assignments (ComplaintID, AssignedToUserID, AssignedByUserID, Notes) 
       VALUES (?, ?, ?, ?)`,
      [complaintID, assignedToUserID, assignerUserID, notes || '']
    );

    // تحديث حالة الشكوى
    await pool.execute(
      'UPDATE complaints SET Status = ?, UpdatedAt = CURRENT_TIMESTAMP WHERE ComplaintID = ?',
      ['in_progress', complaintID]
    );

    // تسجيل النشاط
    await logActivity(assignerUserID, assignedToUserID, 'COMPLAINT_ASSIGNED', {
      complaintID,
      assignedToName: assignee.FullName,
      notes
    });

    res.json({
      success: true,
      message: 'تم تكليف الشكوى بنجاح'
    });

  } catch (error) {
    console.error('❌ خطأ في تكليف الشكوى:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};

/**
 * PUT /api/department-complaints/:complaintID/status
 * تحديث حالة شكوى في القسم
 */
exports.updateComplaintStatus = async (req, res) => {
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

    // التحقق من الشكوى والصلاحية
    const userDeptId = await resolveDepartmentIdForUser(req);
    const userRoleID = Number(req.user?.RoleID || 0);

    let complaintQuery = `
      SELECT c.ComplaintID, c.Status as CurrentStatus, c.DepartmentID
      FROM complaints c
      WHERE c.ComplaintID = ?
    `;
    let complaintParams = [complaintID];

    if (userRoleID !== 1 && userDeptId) {
      complaintQuery += ' AND c.DepartmentID = ?';
      complaintParams.push(userDeptId);
    }

    const [complaints] = await pool.execute(complaintQuery, complaintParams);

    if (complaints.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الشكوى غير موجودة أو لا تملك صلاحية لتعديلها'
      });
    }

    const complaint = complaints[0];
    const oldStatus = complaint.CurrentStatus;

    // تحديث الحالة
    const updateData = [status, userID];
    let updateQuery = 'UPDATE complaints SET Status = ?, UpdatedAt = CURRENT_TIMESTAMP';

    if (status === 'closed') {
      updateQuery += ', ClosedAt = CURRENT_TIMESTAMP';
    }

    updateQuery += ' WHERE ComplaintID = ?';
    updateData.push(complaintID);

    await pool.execute(updateQuery, updateData);

    // إضافة سجل في التاريخ
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
      newStatus: status,
      notes
    });

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

/**
 * GET /api/department-complaints/employees
 * جلب موظفي القسم للتكليف
 */
exports.getDepartmentEmployees = async (req, res) => {
  try {
    const userDeptId = await resolveDepartmentIdForUser(req);
    const userRoleID = Number(req.user?.RoleID || 0);

    if (!userDeptId && userRoleID !== 1) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن تحديد القسم للمستخدم الحالي'
      });
    }

    let query = `
      SELECT u.UserID, u.FullName, u.Username, u.Email, u.Phone,
             r.RoleName, d.DepartmentName
      FROM users u
      JOIN roles r ON u.RoleID = r.RoleID
      LEFT JOIN departments d ON u.DepartmentID = d.DepartmentID
      WHERE u.IsActive = 1
    `;
    let params = [];

    if (userRoleID !== 1 && userDeptId) {
      query += ' AND u.DepartmentID = ?';
      params.push(userDeptId);
    }

    query += ' ORDER BY u.FullName';

    const [employees] = await pool.execute(query, params);

    res.json({
      success: true,
      data: employees
    });

  } catch (error) {
    console.error('❌ خطأ في جلب موظفي القسم:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
};