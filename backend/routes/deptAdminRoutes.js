const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const pool = require('../config/database');

// Middleware to check if user is Department Admin (RoleID = 3)
const checkDepartmentAdminAccess = async (req, res, next) => {
  try {
    if (!req.user || req.user.RoleID !== 3) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only Department Admins can access this endpoint.'
      });
    }
    next();
  } catch (error) {
    console.error('Department Admin access check error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Apply authentication and department admin check to all routes
router.use(authenticateToken);
router.use(checkDepartmentAdminAccess);

// Get department employees
router.get('/department-employees/:departmentId', async (req, res) => {
  try {
    const departmentId = req.params.departmentId;
    
    // Verify the user belongs to this department
    if (req.user.DepartmentID !== parseInt(departmentId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own department data.'
      });
    }

    // Get query parameters for filtering
    const { search, role, status, sortBy = 'FullName', sortOrder = 'ASC' } = req.query;

    // Build the base query
    let query = `
      SELECT e.EmployeeID, e.FullName, e.Username, e.Email, e.PhoneNumber, 
             e.Specialty, e.JoinDate, e.RoleID, r.RoleName, d.DepartmentName
      FROM employees e 
      JOIN roles r ON e.RoleID = r.RoleID 
      LEFT JOIN departments d ON e.DepartmentID = d.DepartmentID
      WHERE e.DepartmentID = ?
    `;

    const params = [departmentId];

    // Add search filter
    if (search) {
      query += ` AND (e.FullName LIKE ? OR e.EmployeeID LIKE ? OR e.Username LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    // Add role filter
    if (role) {
      query += ` AND e.RoleID = ?`;
      params.push(role);
    }

    // Add status filter
    if (status) {
      if (status === 'active') {
        query += ` AND (e.Status IS NULL OR e.Status != 'inactive')`;
      } else if (status === 'inactive') {
        query += ` AND e.Status = 'inactive'`;
      }
    }

    // Add sorting
    const allowedSortFields = ['EmployeeID', 'FullName', 'Username', 'Email', 'RoleName', 'DepartmentName'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'FullName';
    const sortDirection = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    
    query += ` ORDER BY ${sortField} ${sortDirection}`;

    const [employees] = await pool.execute(query, params);

    res.json({
      success: true,
      data: employees,
      total: employees.length
    });

  } catch (error) {
    console.error('Error fetching department employees:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get department employees for permissions management
router.get('/department-employees/:departmentId/permissions', async (req, res) => {
  try {
    const departmentId = req.params.departmentId;
    
    // Verify the user belongs to this department
    if (req.user.DepartmentID !== parseInt(departmentId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own department data.'
      });
    }

    const [employees] = await pool.execute(`
      SELECT e.EmployeeID, e.FullName, e.Username, e.Email, e.PhoneNumber, 
             e.Specialty, e.JoinDate, r.RoleName, d.DepartmentName,
             'أساسية' as Permissions
      FROM employees e 
      JOIN roles r ON e.RoleID = r.RoleID 
      LEFT JOIN departments d ON e.DepartmentID = d.DepartmentID
      WHERE e.DepartmentID = ? AND e.RoleID != 1
      ORDER BY e.FullName
    `, [departmentId]);

    res.json({
      success: true,
      data: employees
    });

  } catch (error) {
    console.error('Error fetching department employees for permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get department complaints
router.get('/complaints/department/:departmentId', async (req, res) => {
  try {
    const departmentId = req.params.departmentId;
    
    // Verify the user belongs to this department
    if (req.user.DepartmentID !== parseInt(departmentId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own department data.'
      });
    }

    const [complaints] = await pool.execute(`
      SELECT c.ComplaintID, c.ComplaintDate, c.ComplaintDetails, c.CurrentStatus, 
             c.Priority, p.FullName as PatientName, p.NationalID_Iqama,
             d.DepartmentName, ct.TypeName as ComplaintTypeName,
             e.FullName as AssignedEmployeeName
      FROM complaints c
      JOIN patients p ON c.PatientID = p.PatientID
      JOIN departments d ON c.DepartmentID = d.DepartmentID
      JOIN complainttypes ct ON c.ComplaintTypeID = ct.ComplaintTypeID
      LEFT JOIN employees e ON c.EmployeeID = e.EmployeeID
      WHERE c.DepartmentID = ?
      ORDER BY c.ComplaintDate DESC
    `, [departmentId]);

    res.json({
      success: true,
      data: complaints
    });

  } catch (error) {
    console.error('Error fetching department complaints:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get complaints for assignment
router.get('/complaints/department/:departmentId/assignment', async (req, res) => {
  try {
    const departmentId = req.params.departmentId;
    
    // Verify the user belongs to this department
    if (req.user.DepartmentID !== parseInt(departmentId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own department data.'
      });
    }

    const [complaints] = await pool.execute(`
      SELECT c.ComplaintID, c.ComplaintDate, c.ComplaintDetails, c.CurrentStatus, 
             c.Priority, p.FullName as PatientName,
             d.DepartmentName, ct.TypeName as ComplaintTypeName,
             e.FullName as AssignedEmployeeName
      FROM Complaints c
      JOIN Patients p ON c.PatientID = p.PatientID
      JOIN Departments d ON c.DepartmentID = d.DepartmentID
      JOIN ComplaintTypes ct ON c.ComplaintTypeID = ct.ComplaintTypeID
      LEFT JOIN Employees e ON c.EmployeeID = e.EmployeeID
      WHERE c.DepartmentID = ?
      ORDER BY c.ComplaintDate DESC
    `, [departmentId]);

    res.json({
      success: true,
      data: complaints
    });

  } catch (error) {
    console.error('Error fetching complaints for assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get latest department complaints
router.get('/complaints/department/:departmentId/latest', async (req, res) => {
  try {
    const departmentId = req.params.departmentId;
    const limit = parseInt(req.query.limit) || 10;
    
    // Verify the user belongs to this department
    if (req.user.DepartmentID !== parseInt(departmentId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own department data.'
      });
    }

    const [complaints] = await pool.execute(`
      SELECT c.ComplaintID, c.ComplaintDate, c.ComplaintDetails, c.CurrentStatus, 
             p.FullName as PatientName,
             e.FullName as AssignedEmployeeName
      FROM Complaints c
      JOIN Patients p ON c.PatientID = p.PatientID
      LEFT JOIN Employees e ON c.EmployeeID = e.EmployeeID
      WHERE c.DepartmentID = ?
      ORDER BY c.ComplaintDate DESC
      LIMIT ?
    `, [departmentId, limit]);

    res.json({
      success: true,
      data: complaints
    });

  } catch (error) {
    console.error('Error fetching latest department complaints:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get department logs with enhanced filtering
router.get('/logs/department/:departmentId', async (req, res) => {
  try {
    const departmentId = req.params.departmentId;
    const { activityType, employee, fromDate, toDate, page = 1, limit = 20 } = req.query;
    
    // Verify the user belongs to this department
    if (req.user.DepartmentID !== parseInt(departmentId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own department data.'
      });
    }

    // Build the query with filters
    let query = `
      SELECT l.LogID, l.Username, l.ActivityType, l.Description, l.CreatedAt,
             l.IPAddress, l.UserAgent, e.FullName
      FROM activitylogs l
      JOIN employees e ON l.Username = e.Username
      WHERE e.DepartmentID = ?
    `;
    
    const params = [departmentId];
    
    // Add filters
    if (activityType) {
      query += ` AND l.ActivityType LIKE ?`;
      params.push(`%${activityType}%`);
    }
    
    if (employee) {
      query += ` AND l.Username = ?`;
      params.push(employee);
    }
    
    if (fromDate) {
      query += ` AND DATE(l.CreatedAt) >= ?`;
      params.push(fromDate);
    }
    
    if (toDate) {
      query += ` AND DATE(l.CreatedAt) <= ?`;
      params.push(toDate);
    }
    
    // Count total records for pagination
    const countQuery = query.replace(
      'SELECT l.LogID, l.Username, l.ActivityType, l.Description, l.CreatedAt, l.IPAddress, l.UserAgent, e.FullName',
      'SELECT COUNT(*) as total'
    );
    
    const [[countResult]] = await pool.execute(countQuery, params);
    const total = countResult.total;
    
    // Add pagination
    query += ` ORDER BY l.CreatedAt DESC LIMIT ? OFFSET ?`;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);
    
    const [logs] = await pool.execute(query, params);

    res.json({
      success: true,
      data: logs,
      total: total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });

  } catch (error) {
    console.error('Error fetching department logs:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get department overview/summary
router.get('/overview/department/:departmentId', async (req, res) => {
  try {
    const departmentId = req.params.departmentId;
    console.log('Department overview requested for DepartmentID:', departmentId);
    console.log('User DepartmentID:', req.user.DepartmentID);
    
    // Verify the user belongs to this department
    if (req.user.DepartmentID !== parseInt(departmentId)) {
      console.log('Access denied: User department mismatch');
      return res.status(403).json({
        success: false,
        message: 'You can only access your own department data.'
      });
    }

    // Get complaint statistics
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN CurrentStatus IN ('جديدة', 'قيد المراجعة') THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN CurrentStatus = 'قيد المعالجة' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN CurrentStatus IN ('مغلقة', 'تم الحل') THEN 1 ELSE 0 END) as closed
      FROM complaints 
      WHERE DepartmentID = ?
    `, [departmentId]);

    console.log('Department statistics:', stats[0]);

    // Get latest complaints
    const [latestComplaints] = await pool.execute(`
      SELECT c.ComplaintID, c.ComplaintDate, c.CurrentStatus,
             e.FullName as AssignedEmployeeName
      FROM complaints c
      LEFT JOIN employees e ON c.EmployeeID = e.EmployeeID
      WHERE c.DepartmentID = ?
      ORDER BY c.ComplaintDate DESC
      LIMIT 10
    `, [departmentId]);

    console.log('Latest complaints count:', latestComplaints.length);

    res.json({
      success: true,
      data: {
        totals: stats[0],
        latest_complaints: latestComplaints
      }
    });

  } catch (error) {
    console.error('Error fetching department overview:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Assign complaint to department employee
router.post('/complaints/:complaintId/assign', async (req, res) => {
  try {
    const complaintId = req.params.complaintId;
    const { employeeId } = req.body;

    // Verify the user belongs to the department of this complaint
    const [complaint] = await pool.execute(`
      SELECT DepartmentID FROM Complaints WHERE ComplaintID = ?
    `, [complaintId]);

    if (!complaint.length) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    if (req.user.DepartmentID !== complaint[0].DepartmentID) {
      return res.status(403).json({
        success: false,
        message: 'You can only assign complaints within your department.'
      });
    }

    // Verify the employee belongs to the same department
    const [employee] = await pool.execute(`
      SELECT DepartmentID FROM Employees WHERE EmployeeID = ?
    `, [employeeId]);

    if (!employee.length || employee[0].DepartmentID !== req.user.DepartmentID) {
      return res.status(403).json({
        success: false,
        message: 'You can only assign to employees in your department.'
      });
    }

    // Update the complaint assignment
    await pool.execute(`
      UPDATE Complaints SET EmployeeID = ? WHERE ComplaintID = ?
    `, [employeeId, complaintId]);

    res.json({
      success: true,
      message: 'Complaint assigned successfully'
    });

  } catch (error) {
    console.error('Error assigning complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Dashboard KPI endpoints
router.get('/dashboard/kpis/:departmentId', async (req, res) => {
  try {
    const departmentId = req.params.departmentId;
    
    // Verify the user belongs to this department
    if (req.user.DepartmentID !== parseInt(departmentId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own department data.'
      });
    }

    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get KPI data
    const [todayNew] = await pool.execute(`
      SELECT COUNT(*) as count FROM Complaints 
      WHERE DepartmentID = ? AND DATE(ComplaintDate) = ?
    `, [departmentId, today]);

    const [yesterdayNew] = await pool.execute(`
      SELECT COUNT(*) as count FROM Complaints 
      WHERE DepartmentID = ? AND DATE(ComplaintDate) = ?
    `, [departmentId, yesterday]);

    const [openComplaints] = await pool.execute(`
      SELECT COUNT(*) as count FROM Complaints 
      WHERE DepartmentID = ? AND CurrentStatus = 'مفتوحة/جديدة'
    `, [departmentId]);

    const [inProgress] = await pool.execute(`
      SELECT COUNT(*) as count FROM Complaints 
      WHERE DepartmentID = ? AND CurrentStatus = 'قيد المعالجة'
    `, [departmentId]);

    const [overdue] = await pool.execute(`
      SELECT COUNT(*) as count FROM Complaints 
      WHERE DepartmentID = ? AND ComplaintDate < DATE_SUB(NOW(), INTERVAL 3 DAY)
      AND CurrentStatus IN ('مفتوحة/جديدة', 'قيد المعالجة')
    `, [departmentId]);

    // Calculate changes
    const todayNewCount = todayNew[0].count;
    const yesterdayNewCount = yesterdayNew[0].count;
    const todayNewChange = yesterdayNewCount > 0 ? 
      Math.round(((todayNewCount - yesterdayNewCount) / yesterdayNewCount) * 100) : 0;

    res.json({
      success: true,
      data: {
        today_new: todayNewCount,
        today_new_change: todayNewChange,
        open: openComplaints[0].count,
        open_change: 0, // Calculate based on previous day
        in_progress: inProgress[0].count,
        progress_change: 0, // Calculate based on previous day
        overdue: overdue[0].count,
        overdue_change: 0 // Calculate based on previous day
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard KPIs:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Dashboard trends endpoint
router.get('/dashboard/trends/:departmentId', async (req, res) => {
  try {
    const departmentId = req.params.departmentId;
    
    // Verify the user belongs to this department
    if (req.user.DepartmentID !== parseInt(departmentId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own department data.'
      });
    }

    // Get complaints for last 30 days
    const [trends] = await pool.execute(`
      SELECT DATE(ComplaintDate) as date, COUNT(*) as count
      FROM Complaints 
      WHERE DepartmentID = ? AND ComplaintDate >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(ComplaintDate)
      ORDER BY date
    `, [departmentId]);

    res.json({
      success: true,
      data: trends
    });

  } catch (error) {
    console.error('Error fetching dashboard trends:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Dashboard status distribution endpoint
router.get('/dashboard/status-distribution/:departmentId', async (req, res) => {
  try {
    const departmentId = req.params.departmentId;
    
    // Verify the user belongs to this department
    if (req.user.DepartmentID !== parseInt(departmentId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own department data.'
      });
    }

    // Get status distribution
    const [distribution] = await pool.execute(`
      SELECT CurrentStatus as status, COUNT(*) as count
      FROM Complaints 
      WHERE DepartmentID = ?
      GROUP BY CurrentStatus
      ORDER BY count DESC
    `, [departmentId]);

    res.json({
      success: true,
      data: distribution
    });

  } catch (error) {
    console.error('Error fetching status distribution:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Dashboard worklist endpoint
router.get('/dashboard/worklist/:departmentId', async (req, res) => {
  try {
    const departmentId = req.params.departmentId;
    const { dateRange, status, priority, assignment, search } = req.query;
    
    // Verify the user belongs to this department
    if (req.user.DepartmentID !== parseInt(departmentId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own department data.'
      });
    }

    let query = `
      SELECT c.ComplaintID, c.ComplaintDate, c.ComplaintDetails, c.CurrentStatus, 
             c.Priority, p.FullName as PatientName, p.NationalID_Iqama,
             d.DepartmentName, ct.TypeName as ComplaintTypeName,
             e.FullName as AssignedEmployeeName, c.CreatedAt
      FROM Complaints c
      JOIN Patients p ON c.PatientID = p.PatientID
      JOIN Departments d ON c.DepartmentID = d.DepartmentID
      JOIN ComplaintTypes ct ON c.ComplaintTypeID = ct.ComplaintTypeID
      LEFT JOIN Employees e ON c.EmployeeID = e.EmployeeID
      WHERE c.DepartmentID = ?
    `;

    const params = [departmentId];

    // Add filters
    if (status) {
      query += ` AND c.CurrentStatus = ?`;
      params.push(status);
    }

    if (priority) {
      query += ` AND c.Priority = ?`;
      params.push(priority);
    }

    if (assignment === 'assigned') {
      query += ` AND c.EmployeeID IS NOT NULL`;
    } else if (assignment === 'unassigned') {
      query += ` AND c.EmployeeID IS NULL`;
    }

    if (search) {
      query += ` AND (c.ComplaintID LIKE ? OR p.FullName LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (dateRange) {
      const dates = dateRange.split(' to ');
      if (dates.length === 2) {
        query += ` AND DATE(c.ComplaintDate) BETWEEN ? AND ?`;
        params.push(dates[0], dates[1]);
      }
    }

    query += ` ORDER BY c.ComplaintDate DESC LIMIT 100`;

    const [complaints] = await pool.execute(query, params);

    res.json({
      success: true,
      data: complaints
    });

  } catch (error) {
    console.error('Error fetching worklist:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Dashboard team endpoint
router.get('/dashboard/team/:departmentId', async (req, res) => {
  try {
    const departmentId = req.params.departmentId;
    
    // Verify the user belongs to this department
    if (req.user.DepartmentID !== parseInt(departmentId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own department data.'
      });
    }

    // Get team members with workload
    const [team] = await pool.execute(`
      SELECT e.EmployeeID, e.FullName, e.Email, e.Username,
             r.RoleName,
             COUNT(c.ComplaintID) as Workload
      FROM Employees e 
      JOIN Roles r ON e.RoleID = r.RoleID 
      LEFT JOIN Complaints c ON e.EmployeeID = c.EmployeeID 
        AND c.CurrentStatus IN ('مفتوحة/جديدة', 'قيد المعالجة')
      WHERE e.DepartmentID = ?
      GROUP BY e.EmployeeID, e.FullName, e.Email, e.Username, r.RoleName
      ORDER BY e.FullName
    `, [departmentId]);

    res.json({
      success: true,
      data: team
    });

  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Dashboard SLA alerts endpoint
router.get('/dashboard/sla/:departmentId', async (req, res) => {
  try {
    const departmentId = req.params.departmentId;
    
    // Verify the user belongs to this department
    if (req.user.DepartmentID !== parseInt(departmentId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own department data.'
      });
    }

    // Get SLA alerts
    const [unanswered] = await pool.execute(`
      SELECT COUNT(*) as count FROM Complaints 
      WHERE DepartmentID = ? AND ComplaintDate < DATE_SUB(NOW(), INTERVAL 3 DAY)
      AND CurrentStatus = 'مفتوحة/جديدة'
    `, [departmentId]);

    const [dueToday] = await pool.execute(`
      SELECT COUNT(*) as count FROM Complaints 
      WHERE DepartmentID = ? AND ComplaintDate = DATE_SUB(NOW(), INTERVAL 3 DAY)
      AND CurrentStatus IN ('مفتوحة/جديدة', 'قيد المعالجة')
    `, [departmentId]);

    const [reminders] = await pool.execute(`
      SELECT COUNT(*) as count FROM Complaints 
      WHERE DepartmentID = ? AND ComplaintDate = DATE_SUB(NOW(), INTERVAL 3 DAY)
      AND CurrentStatus = 'مفتوحة/جديدة'
    `, [departmentId]);

    res.json({
      success: true,
      data: {
        unanswered: unanswered[0].count,
        due_today: dueToday[0].count,
        reminders: reminders[0].count
      }
    });

  } catch (error) {
    console.error('Error fetching SLA alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Dashboard activity endpoint
router.get('/dashboard/activity/:departmentId', async (req, res) => {
  try {
    const departmentId = req.params.departmentId;
    
    // Verify the user belongs to this department
    if (req.user.DepartmentID !== parseInt(departmentId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own department data.'
      });
    }

    // Get recent activity for department
    const [activity] = await pool.execute(`
      SELECT l.LogID, l.Username, l.ActivityType, l.Description, l.CreatedAt
      FROM ActivityLogs l
      JOIN Employees e ON l.Username = e.Username
      WHERE e.DepartmentID = ?
      ORDER BY l.CreatedAt DESC
      LIMIT 10
    `, [departmentId]);

    res.json({
      success: true,
      data: activity
    });

  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update complaint status
router.put('/complaints/:complaintId/status', async (req, res) => {
  try {
    const complaintId = req.params.complaintId;
    const { status } = req.body;

    // Verify the user belongs to the department of this complaint
    const [complaint] = await pool.execute(`
      SELECT DepartmentID FROM Complaints WHERE ComplaintID = ?
    `, [complaintId]);

    if (!complaint.length) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    if (req.user.DepartmentID !== complaint[0].DepartmentID) {
      return res.status(403).json({
        success: false,
        message: 'You can only update complaints within your department.'
      });
    }

    // Update the complaint status
    await pool.execute(`
      UPDATE Complaints SET CurrentStatus = ? WHERE ComplaintID = ?
    `, [status, complaintId]);

    res.json({
      success: true,
      message: 'Complaint status updated successfully'
    });

  } catch (error) {
    console.error('Error updating complaint status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get employee permissions
router.get('/employees/:employeeId/permissions', async (req, res) => {
  try {
    const employeeId = req.params.employeeId;

    // Verify the employee belongs to the user's department
    const [employee] = await pool.execute(`
      SELECT e.EmployeeID, e.FullName, e.DepartmentID, d.DepartmentName
      FROM Employees e
      LEFT JOIN Departments d ON e.DepartmentID = d.DepartmentID
      WHERE e.EmployeeID = ?
    `, [employeeId]);

    if (!employee.length) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    if (req.user.DepartmentID !== employee[0].DepartmentID) {
      return res.status(403).json({
        success: false,
        message: 'You can only access permissions for employees in your department.'
      });
    }

    // Get current permissions (assuming you have a permissions table)
    // For now, we'll return an empty array as the permissions system needs to be implemented
    const [permissions] = await pool.execute(`
      SELECT PermissionID, PermissionName, PermissionDescription
      FROM EmployeePermissions ep
      JOIN Permissions p ON ep.PermissionID = p.PermissionID
      WHERE ep.EmployeeID = ?
    `, [employeeId]).catch(() => [[]]);

    res.json({
      success: true,
      data: {
        employee: employee[0],
        permissions: permissions || []
      }
    });

  } catch (error) {
    console.error('Error fetching employee permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update employee permissions
router.put('/employees/:employeeId/permissions', async (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    const { permissions } = req.body;

    // Verify the employee belongs to the user's department
    const [employee] = await pool.execute(`
      SELECT DepartmentID FROM Employees WHERE EmployeeID = ?
    `, [employeeId]);

    if (!employee.length) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    if (req.user.DepartmentID !== employee[0].DepartmentID) {
      return res.status(403).json({
        success: false,
        message: 'You can only update permissions for employees in your department.'
      });
    }

    // Begin transaction
    await pool.execute('START TRANSACTION');

    try {
      // Delete existing permissions for this employee
      await pool.execute(`
        DELETE FROM EmployeePermissions WHERE EmployeeID = ?
      `, [employeeId]);

      // Insert new permissions
      if (permissions && permissions.length > 0) {
        const permissionValues = permissions.map(permission => [employeeId, permission]).join(',');
        await pool.execute(`
          INSERT INTO EmployeePermissions (EmployeeID, PermissionID) VALUES ${permissionValues}
        `);
      }

      // Commit transaction
      await pool.execute('COMMIT');

      res.json({
        success: true,
        message: 'Employee permissions updated successfully'
      });

    } catch (error) {
      // Rollback on error
      await pool.execute('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error updating employee permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get available permissions for department
router.get('/permissions/available', async (req, res) => {
  try {
    // Return department-scoped permissions (no Super Admin permissions)
    const departmentPermissions = [
      {
        id: 'view_complaints',
        name: 'View Complaints',
        description: 'Can view department complaints',
        ar_name: 'عرض الشكاوى',
        ar_description: 'يمكنه عرض شكاوى القسم'
      },
      {
        id: 'assign_complaints',
        name: 'Assign Complaints',
        description: 'Can assign complaints to employees',
        ar_name: 'توزيع الشكاوى',
        ar_description: 'يمكنه توزيع الشكاوى على الموظفين'
      },
      {
        id: 'update_complaint_status',
        name: 'Update Complaint Status',
        description: 'Can change complaint status',
        ar_name: 'تحديث حالة الشكوى',
        ar_description: 'يمكنه تغيير حالة الشكوى'
      },
      {
        id: 'view_reports',
        name: 'View Reports',
        description: 'Can view department reports',
        ar_name: 'عرض التقارير',
        ar_description: 'يمكنه عرض تقارير القسم'
      },
      {
        id: 'manage_employees',
        name: 'Manage Employees',
        description: 'Can manage department employees',
        ar_name: 'إدارة الموظفين',
        ar_description: 'يمكنه إدارة موظفي القسم'
      },
      {
        id: 'view_logs',
        name: 'View Logs',
        description: 'Can view department activity logs',
        ar_name: 'عرض السجلات',
        ar_description: 'يمكنه عرض سجلات نشاط القسم'
      }
    ];

    res.json({
      success: true,
      data: departmentPermissions
    });

  } catch (error) {
    console.error('Error fetching available permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get department information  
router.get('/departments/:departmentId', async (req, res) => {
  try {
    const departmentId = req.params.departmentId;
    
    // Verify the user belongs to this department
    if (req.user.DepartmentID !== parseInt(departmentId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own department data.'
      });
    }

    const [[department]] = await pool.execute(`
      SELECT DepartmentID, DepartmentName, Description
      FROM departments 
      WHERE DepartmentID = ?
    `, [departmentId]);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Get additional statistics
    const [[employeeStats]] = await pool.execute(`
      SELECT 
        COUNT(*) as totalEmployees,
        COUNT(CASE WHEN JoinDate >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as newEmployees
      FROM employees 
      WHERE DepartmentID = ?
    `, [departmentId]);

    res.json({
      success: true,
      data: {
        ...department,
        ...employeeStats
      }
    });

  } catch (error) {
    console.error('Error fetching department info:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Submit employee deletion request
router.post('/employees/:employeeId/delete-request', async (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    const { reason } = req.body;

    // Verify the employee belongs to the user's department
    const [[employee]] = await pool.execute(`
      SELECT DepartmentID, FullName FROM employees WHERE EmployeeID = ?
    `, [employeeId]);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    if (req.user.DepartmentID !== employee.DepartmentID) {
      return res.status(403).json({
        success: false,
        message: 'You can only request deletion for employees in your department.'
      });
    }

    // Prevent self-deletion
    if (parseInt(employeeId) === req.user.EmployeeID) {
      return res.status(403).json({
        success: false,
        message: 'You cannot request deletion of your own account.'
      });
    }

    // Check if request already exists
    const [[existingRequest]] = await pool.execute(`
      SELECT RequestID FROM deletion_requests 
      WHERE TableName = 'employees' AND RecordPK = ? AND Status = 'requested'
    `, [employeeId]);

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: 'A deletion request for this employee already exists.'
      });
    }

    // Create deletion request
    await pool.execute(`
      INSERT INTO deletion_requests (TableName, RecordPK, RequestedBy, Reason, Snapshot)
      VALUES ('employees', ?, ?, ?, ?)
    `, [
      employeeId,
      req.user.EmployeeID,
      reason || 'No reason provided',
      JSON.stringify({ EmployeeID: employeeId, FullName: employee.FullName })
    ]);

    // Log the activity
    await pool.execute(`
      INSERT INTO activitylogs (EmployeeID, Username, ActivityType, Description, IPAddress, UserAgent)
      VALUES (?, ?, 'delete_request', ?, ?, ?)
    `, [
      req.user.EmployeeID,
      req.user.Username,
      `طلب حذف الموظف: ${employee.FullName}`,
      req.ip,
      req.headers['user-agent']
    ]);

    res.json({
      success: true,
      message: 'Employee deletion request submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting deletion request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get pending deletion requests count
router.get('/deletion-requests/pending', async (req, res) => {
  try {
    // Get pending requests for department employees
    const [[result]] = await pool.execute(`
      SELECT COUNT(*) as count
      FROM deletion_requests dr
      JOIN employees e ON dr.RecordPK = e.EmployeeID
      WHERE dr.TableName = 'employees' 
        AND dr.Status = 'requested'
        AND e.DepartmentID = ?
    `, [req.user.DepartmentID]);

    res.json({
      success: true,
      count: result.count || 0
    });

  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Export department logs
router.get('/logs/export/:departmentId', async (req, res) => {
  try {
    const departmentId = req.params.departmentId;
    const { format = 'csv', activityType, employee, fromDate, toDate } = req.query;
    
    // Verify the user belongs to this department
    if (req.user.DepartmentID !== parseInt(departmentId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only export your own department data.'
      });
    }

    // Build the query with filters (same as logs endpoint)
    let query = `
      SELECT l.LogID, l.Username, l.ActivityType, l.Description, l.CreatedAt,
             l.IPAddress, e.FullName
      FROM activitylogs l
      JOIN employees e ON l.Username = e.Username
      WHERE e.DepartmentID = ?
    `;
    
    const params = [departmentId];
    
    // Add filters
    if (activityType) {
      query += ` AND l.ActivityType LIKE ?`;
      params.push(`%${activityType}%`);
    }
    
    if (employee) {
      query += ` AND l.Username = ?`;
      params.push(employee);
    }
    
    if (fromDate) {
      query += ` AND DATE(l.CreatedAt) >= ?`;
      params.push(fromDate);
    }
    
    if (toDate) {
      query += ` AND DATE(l.CreatedAt) <= ?`;
      params.push(toDate);
    }
    
    query += ` ORDER BY l.CreatedAt DESC`;
    
    const [logs] = await pool.execute(query, params);

    // Log the export activity
    await pool.execute(`
      INSERT INTO activitylogs (EmployeeID, Username, ActivityType, Description, IPAddress, UserAgent)
      VALUES (?, ?, 'export_logs', ?, ?, ?)
    `, [
      req.user.EmployeeID,
      req.user.Username,
      `تم تصدير ${logs.length} سجل قسم بصيغة ${format}`,
      req.ip,
      req.headers['user-agent']
    ]);

    if (format === 'csv') {
      // Create CSV content
      const headers = ['الوقت', 'الموظف', 'نوع النشاط', 'الوصف', 'عنوان IP'];
      const csvRows = [
        headers.join(','),
        ...logs.map(log => [
          `"${log.CreatedAt || ''}"`,
          `"${log.FullName || log.Username || ''}"`,
          `"${log.ActivityType || ''}"`,
          `"${log.Description || ''}"`,
          `"${log.IPAddress || ''}"`
        ].join(','))
      ];
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=department-${departmentId}-logs-${new Date().toISOString().split('T')[0]}.csv`);
      res.send('\uFEFF' + csvRows.join('\n')); // Add BOM for proper UTF-8 support
    } else if (format === 'pdf') {
      // For PDF, we'll return JSON that frontend can convert
      res.json({
        success: true,
        data: logs,
        format: 'pdf',
        exportDate: new Date().toISOString(),
        totalRecords: logs.length
      });
    } else {
      // JSON format
      res.json({
        success: true,
        data: logs,
        exportDate: new Date().toISOString(),
        totalRecords: logs.length
      });
    }

  } catch (error) {
    console.error('Error exporting department logs:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
