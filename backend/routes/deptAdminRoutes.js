const express = require('express');
const router = express.Router();
const { authenticateToken, requireAnyRole } = require('../middleware/auth');
const { logActivity } = require('../controllers/logsController');
const pool = require('../config/database');

// Middleware to check if user is Department Admin (RoleID = 3) or Super Admin (RoleID = 1)
const checkDepartmentAdminAccess = async (req, res, next) => {
  try {
    if (!req.user || (req.user.RoleID !== 3 && req.user.RoleID !== 1)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only Department Admins and Super Admins can access this endpoint.'
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
    
    // Verify the user belongs to this department (Super Admin can access any department)
    if (req.user.RoleID !== 1 && req.user.DepartmentID !== parseInt(departmentId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own department data.'
      });
    }

    // Get query parameters for filtering
    const { search, role, status, sortBy = 'FullName', sortOrder = 'ASC' } = req.query;

    // Build the base query - exclude Super Admins (RoleID = 1)
    let query = `
      SELECT u.UserID, u.FullName, u.Username, u.Email, u.Phone, 
             u.NationalID, u.EmployeeNumber, u.CreatedAt, u.RoleID, u.IsActive,
             r.RoleName, d.DepartmentName
      FROM users u 
      JOIN roles r ON u.RoleID = r.RoleID 
      LEFT JOIN departments d ON u.DepartmentID = d.DepartmentID
      WHERE u.DepartmentID = ? AND u.RoleID != 1
    `;

    const params = [departmentId];

    // Add search filter
    if (search) {
      query += ` AND (u.FullName LIKE ? OR u.UserID LIKE ? OR u.Username LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    // Add role filter
    if (role) {
      query += ` AND u.RoleID = ?`;
      params.push(role);
    }

    // Add status filter
    if (status) {
      if (status === 'active') {
        query += ` AND u.IsActive = 1`;
      } else if (status === 'inactive') {
        query += ` AND u.IsActive = 0`;
      }
    }

    // Add sorting
    const allowedSortFields = ['UserID', 'FullName', 'Username', 'Email', 'RoleName', 'DepartmentName'];
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

// Get department complaints
router.get('/complaints/department/:departmentId', async (req, res) => {
  try {
    const departmentId = req.params.departmentId;
    
    // Verify the user belongs to this department (Super Admin can access any department)
    if (req.user.RoleID !== 1 && req.user.DepartmentID !== parseInt(departmentId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own department data.'
      });
    }

    const [complaints] = await pool.execute(`
      SELECT c.ComplaintID, c.CreatedAt as ComplaintDate, c.Title, c.Description as ComplaintDetails, 
             c.Status as CurrentStatus, c.Priority, p.FullName as PatientName, p.NationalID,
             d.DepartmentName, cr.ReasonName as ComplaintTypeName,
             assignee.FullName as AssignedEmployeeName
      FROM complaints c
      LEFT JOIN patients p ON c.PatientID = p.PatientID
      LEFT JOIN departments d ON c.DepartmentID = d.DepartmentID
      LEFT JOIN complaint_subtypes st ON c.SubtypeID = st.SubtypeID
      LEFT JOIN complaint_reasons cr ON st.ReasonID = cr.ReasonID
      LEFT JOIN (
          SELECT ca.ComplaintID, ca.AssignedToUserID,
                 ROW_NUMBER() OVER (PARTITION BY ca.ComplaintID ORDER BY ca.CreatedAt DESC) as rn
          FROM complaint_assignments ca
      ) latest_assignment ON c.ComplaintID = latest_assignment.ComplaintID AND latest_assignment.rn = 1
      LEFT JOIN users assignee ON latest_assignment.AssignedToUserID = assignee.UserID
      WHERE c.DepartmentID = ?
      ORDER BY c.CreatedAt DESC
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

// Get department overview/summary
router.get('/overview/department/:departmentId', async (req, res) => {
  try {
    const departmentId = req.params.departmentId;
    console.log('Department overview requested for DepartmentID:', departmentId);
    console.log('User DepartmentID:', req.user.DepartmentID);
    
    // Verify the user belongs to this department (Super Admin can access any department)
    if (req.user.RoleID !== 1 && req.user.DepartmentID !== parseInt(departmentId)) {
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
        SUM(CASE WHEN Status = 'open' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN Status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN Status = 'closed' THEN 1 ELSE 0 END) as closed,
        SUM(CASE WHEN Priority = 'urgent' THEN 1 ELSE 0 END) as urgent,
        SUM(CASE WHEN Priority = 'high' THEN 1 ELSE 0 END) as high_priority
      FROM complaints 
      WHERE DepartmentID = ?
    `, [departmentId]);

    console.log('Department statistics:', stats[0]);

    // Get latest complaints
    const [latestComplaints] = await pool.execute(`
      SELECT c.ComplaintID, c.CreatedAt as ComplaintDate, c.Status as CurrentStatus,
             c.Title, assignee.FullName as AssignedEmployeeName
      FROM complaints c
      LEFT JOIN (
          SELECT ca.ComplaintID, ca.AssignedToUserID,
                 ROW_NUMBER() OVER (PARTITION BY ca.ComplaintID ORDER BY ca.CreatedAt DESC) as rn
          FROM complaint_assignments ca
      ) latest_assignment ON c.ComplaintID = latest_assignment.ComplaintID AND latest_assignment.rn = 1
      LEFT JOIN users assignee ON latest_assignment.AssignedToUserID = assignee.UserID
      WHERE c.DepartmentID = ?
      ORDER BY c.CreatedAt DESC
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

// Dashboard KPI endpoints
router.get('/dashboard/kpis/:departmentId', async (req, res) => {
  try {
    const departmentId = req.params.departmentId;
    
    // Verify the user belongs to this department (Super Admin can access any department)
    if (req.user.RoleID !== 1 && req.user.DepartmentID !== parseInt(departmentId)) {
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
      SELECT COUNT(*) as count FROM complaints 
      WHERE DepartmentID = ? AND DATE(CreatedAt) = ?
    `, [departmentId, today]);

    const [yesterdayNew] = await pool.execute(`
      SELECT COUNT(*) as count FROM complaints 
      WHERE DepartmentID = ? AND DATE(CreatedAt) = ?
    `, [departmentId, yesterday]);

    const [openComplaints] = await pool.execute(`
      SELECT COUNT(*) as count FROM complaints 
      WHERE DepartmentID = ? AND Status = 'open'
    `, [departmentId]);

    const [inProgress] = await pool.execute(`
      SELECT COUNT(*) as count FROM complaints 
      WHERE DepartmentID = ? AND Status = 'in_progress'
    `, [departmentId]);

    const [overdue] = await pool.execute(`
      SELECT COUNT(*) as count FROM complaints 
      WHERE DepartmentID = ? AND CreatedAt < DATE_SUB(NOW(), INTERVAL 3 DAY)
      AND Status IN ('open', 'in_progress')
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

// Get department information  
router.get('/departments/:departmentId', async (req, res) => {
  try {
    const departmentId = req.params.departmentId;
    
    // Verify the user belongs to this department (Super Admin can access any department)
    if (req.user.RoleID !== 1 && req.user.DepartmentID !== parseInt(departmentId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own department data.'
      });
    }

    const [[department]] = await pool.execute(`
      SELECT DepartmentID, DepartmentName, CreatedAt, UpdatedAt
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
        COUNT(CASE WHEN CreatedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as newEmployees,
        COUNT(CASE WHEN IsActive = 1 THEN 1 END) as activeEmployees,
        COUNT(CASE WHEN IsActive = 0 THEN 1 END) as inactiveEmployees
      FROM users 
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

// Submit user deletion request
router.post('/employees/:employeeId/delete-request', async (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    const { reason } = req.body;
    const userID = req.user.UserID;

    // Verify the employee belongs to the user's department
    const [[employee]] = await pool.execute(`
      SELECT DepartmentID, FullName FROM users WHERE UserID = ?
    `, [employeeId]);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    if (req.user.RoleID !== 1 && req.user.DepartmentID !== employee.DepartmentID) {
      return res.status(403).json({
        success: false,
        message: 'You can only request deletion for employees in your department.'
      });
    }

    // Prevent self-deletion
    if (parseInt(employeeId) === userID) {
      return res.status(403).json({
        success: false,
        message: 'You cannot request deletion of your own account.'
      });
    }

    // Check if request already exists
    const [[existingRequest]] = await pool.execute(`
      SELECT RequestID FROM delete_requests 
      WHERE TableName = 'users' AND RecordPK = ? AND Status = 'pending'
    `, [employeeId]);

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: 'A deletion request for this employee already exists.'
      });
    }

    // Create deletion request
    await pool.execute(`
      INSERT INTO delete_requests (TableName, RecordPK, RequestedBy, Snapshot)
      VALUES ('users', ?, ?, ?)
    `, [
      employeeId,
      userID,
      JSON.stringify({ UserID: employeeId, FullName: employee.FullName, reason })
    ]);

    // Log the activity
    await logActivity(userID, parseInt(employeeId), 'DELETE_REQUEST_SUBMITTED', {
      targetUser: employee.FullName,
      reason: reason || 'No reason provided'
    });

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
    let query = `
      SELECT COUNT(*) as count
      FROM delete_requests dr
      JOIN users u ON dr.RecordPK = u.UserID
      WHERE dr.TableName = 'users' 
        AND dr.Status = 'pending'
    `;
    let params = [];

    // If not Super Admin, limit to own department
    if (req.user.RoleID !== 1) {
      query += ` AND u.DepartmentID = ?`;
      params.push(req.user.DepartmentID);
    }

    const [[result]] = await pool.execute(query, params);

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

// Dashboard trends endpoint
router.get('/dashboard/trends/:departmentId', async (req, res) => {
  try {
    const departmentId = req.params.departmentId;
    
    // Verify the user belongs to this department (Super Admin can access any department)
    if (req.user.RoleID !== 1 && req.user.DepartmentID !== parseInt(departmentId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own department data.'
      });
    }

    // Get complaints for last 30 days
    const [trends] = await pool.execute(`
      SELECT DATE(CreatedAt) as date, COUNT(*) as count
      FROM complaints 
      WHERE DepartmentID = ? AND CreatedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(CreatedAt)
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
    
    // Verify the user belongs to this department (Super Admin can access any department)
    if (req.user.RoleID !== 1 && req.user.DepartmentID !== parseInt(departmentId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own department data.'
      });
    }

    // Get status distribution
    const [distribution] = await pool.execute(`
      SELECT Status as status, COUNT(*) as count
      FROM complaints 
      WHERE DepartmentID = ?
      GROUP BY Status
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

// Dashboard team endpoint
router.get('/dashboard/team/:departmentId', async (req, res) => {
  try {
    const departmentId = req.params.departmentId;
    
    // Verify the user belongs to this department (Super Admin can access any department)
    if (req.user.RoleID !== 1 && req.user.DepartmentID !== parseInt(departmentId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own department data.'
      });
    }

    // Get team members with workload
    const [team] = await pool.execute(`
      SELECT u.UserID, u.FullName, u.Email, u.Username,
             r.RoleName,
             COUNT(CASE WHEN ca.AssignedToUserID = u.UserID AND c.Status IN ('open', 'in_progress') THEN 1 END) as Workload
      FROM users u 
      JOIN roles r ON u.RoleID = r.RoleID 
      LEFT JOIN complaint_assignments ca ON u.UserID = ca.AssignedToUserID
      LEFT JOIN complaints c ON ca.ComplaintID = c.ComplaintID
      WHERE u.DepartmentID = ? AND u.IsActive = 1
      GROUP BY u.UserID, u.FullName, u.Email, u.Username, r.RoleName
      ORDER BY u.FullName
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

module.exports = router;