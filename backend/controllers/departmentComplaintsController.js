// controllers/departmentComplaintsController.js
const pool = require('../config/database');

/**
 * يحاول استخراج DepartmentID للمستخدم الحالي:
 * - أولاً من التوكن (req.user)
 * - ثم من جدول Employees إذا توفر EmployeeID أو Username
 */
async function resolveDepartmentIdForUser(req) {
  // 1) من بيانات التوكن مباشرة
  const depFromToken =
    req.user?.DepartmentID ||
    req.user?.department_id ||
    req.user?.departmentId;

  if (depFromToken) return Number(depFromToken);

  // 2) من جدول Employees عن طريق EmployeeID أو Username
  const employeeId =
    req.user?.EmployeeID ||
    req.user?.employee_id ||
    req.user?.empId;

  const username =
    req.user?.Username ||
    req.user?.username ||
    req.user?.user;

  if (employeeId) {
    const [rows] = await pool.execute(
      `SELECT DepartmentID FROM Employees WHERE EmployeeID = ? LIMIT 1`,
      [employeeId]
    );
    if (rows?.length) return Number(rows[0].DepartmentID);
  }

  if (username) {
    const [rows] = await pool.execute(
      `SELECT DepartmentID FROM Employees WHERE Username = ? LIMIT 1`,
      [username]
    );
    if (rows?.length) return Number(rows[0].DepartmentID);
  }

  return null;
}

/**
 * GET /api/department-complaints/by-department
 * - Super Admin (RoleID=1) يقدر يمرر ?departmentId=XX
 * - Admin (RoleID=3) مربوط بقسمه فقط
 * - تدعم فلاتر اختيارية: ?status=&search=&dateFilter=all|7|30|...
 *
 * الاستجابة:
 * {
 *   success: true,
 *   departmentId: 3,
 *   count: 12,
 *   data: [ { ComplaintID, ComplaintDate, ComplaintDetails, CurrentStatus, Priority,
 *             PatientName, NationalID_Iqama, ContactNumber,
 *             DepartmentName, ComplaintTypeName, SubTypeName, EmployeeName }, ... ]
 * }
 */
exports.getMyDepartmentComplaints = async (req, res) => {
  try {
    const roleId = Number(req.user?.RoleID || req.user?.role || req.user?.roleId);

    // تحديد القسم
    let departmentId = null;
    if (roleId === 1 && req.query.departmentId) {
      // سوبر أدمن يسمح له بتحديد القسم عبر الكويري
      departmentId = Number(req.query.departmentId);
    } else {
      // الأدمن مربوط بقسمه
      departmentId = await resolveDepartmentIdForUser(req);
    }

    if (!departmentId || Number.isNaN(departmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot resolve DepartmentID for the current user.'
      });
    }

    // فلاتر اختيارية (متوافقة مع الواجهة)
    const { status = '', search = '', dateFilter = 'all' } = req.query;

    const where = ['c.DepartmentID = ?'];
    const params = [departmentId];

    if (status && status.trim() !== '') {
      where.push('c.CurrentStatus = ?');
      params.push(status.trim());
    }

    if (search && search.trim() !== '') {
      const s = `%${search.trim()}%`;
      // بحث برقم الشكوى (ID) أو اسم المريض أو الهوية
      where.push('(c.ComplaintID LIKE ? OR p.FullName LIKE ? OR p.NationalID_Iqama LIKE ?)');
      params.push(s, s, s);
    }

    if (dateFilter && dateFilter !== 'all') {
      const days = Number(dateFilter);
      if (!Number.isNaN(days) && days > 0) {
        where.push('c.ComplaintDate >= DATE_SUB(NOW(), INTERVAL ? DAY)');
        params.push(days);
      }
    }

    const whereSql = `WHERE ${where.join(' AND ')}`;

    // نجلب نفس الحقول التي تعتمد عليها واجهة الـ general
    const sql = `
      SELECT 
        c.ComplaintID,
        c.ComplaintDate,
        c.ComplaintDetails,
        c.CurrentStatus,
        c.Priority,

        p.FullName           AS PatientName,
        p.NationalID_Iqama   AS NationalID_Iqama,
        p.ContactNumber      AS ContactNumber,

        d.DepartmentName,
        ct.TypeName          AS ComplaintTypeName,
        cst.SubTypeName,

        e.FullName           AS EmployeeName
      FROM Complaints c
      JOIN Patients             p   ON c.PatientID = p.PatientID
      JOIN Departments          d   ON c.DepartmentID = d.DepartmentID
      JOIN ComplaintTypes       ct  ON c.ComplaintTypeID = ct.ComplaintTypeID
      LEFT JOIN ComplaintSubTypes cst ON c.SubTypeID = cst.SubTypeID
      LEFT JOIN Employees       e   ON c.EmployeeID = e.EmployeeID
      ${whereSql}
      ORDER BY c.ComplaintDate DESC, c.ComplaintID DESC
      LIMIT 500
    `;

    const [rows] = await pool.execute(sql, params);

    // نفس where لعدد السجلات
    const countSql = `
      SELECT COUNT(*) AS cnt
      FROM Complaints c
      JOIN Patients             p   ON c.PatientID = p.PatientID
      JOIN Departments          d   ON c.DepartmentID = d.DepartmentID
      JOIN ComplaintTypes       ct  ON c.ComplaintTypeID = ct.ComplaintTypeID
      LEFT JOIN ComplaintSubTypes cst ON c.SubTypeID = cst.SubTypeID
      LEFT JOIN Employees       e   ON c.EmployeeID = e.EmployeeID
      ${whereSql}
    `;
    const [cntRows] = await pool.execute(countSql, params);
    const count = cntRows?.[0]?.cnt || rows.length || 0;

    return res.json({
      success: true,
      departmentId,
      count,
      data: rows
    });
  } catch (error) {
    console.error('getMyDepartmentComplaints error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: String(error) });
  }
};
