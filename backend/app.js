const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { authenticateToken, requireRole } = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const responseRoutes = require('./routes/responseRoutes');
const reportRoutes = require('./routes/reportRoutes');
const generalRequestRoutes = require('./routes/generalRequestRoutes');
const misconductRoutes = require('./routes/misconductRoutes');
const overviewRoutes = require('./routes/overviewRoutes');
const generalComplaintsRoutes = require('./routes/generalComplaintsRoutes');
const inpersonComplaintsRoutes = require('./routes/inpersonComplaintsRoutes');
const logsRoutes = require('./routes/logsRoutes');
const permissionsRoutes = require('./routes/permissionsRoutes');
const deptAdminRoutes = require('./routes/deptAdminRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const db = require('./config/database');
const { setupEmployeesTable } = require('./controllers/authController');
const userManagementRoutes = require('./routes/userManagementRoutes');
const notificationsRoutes = require('./routes/notificationsRoutes');
// إضافة مسار شكاوي القسم
const departmentComplaintsRoutes = require('./routes/departmentComplaintsRoutes');





const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static HTML files
app.use(express.static(path.join(__dirname, '..')));

// Route to serve dept-admin pages
app.use('/dept-admin', express.static(path.join(__dirname, '..', 'dept-admin')));
app.use('/superadmin', express.static(path.join(__dirname, '..', 'superadmin')));
app.use('/login', express.static(path.join(__dirname, '..', 'login')));
app.use('/DashBoard', express.static(path.join(__dirname, '..', 'DashBoard')));
app.use('/employee', express.static(path.join(__dirname, '..', 'employee')));
app.use('/icon', express.static(path.join(__dirname, '..', 'icon')));


// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});


// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        message: 'Backend is running successfully'
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/general-requests', generalRequestRoutes);
app.use('/api/misconduct', misconductRoutes);
app.use('/api/general-complaints', generalComplaintsRoutes);
app.use('/api/inperson-complaints', inpersonComplaintsRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api', permissionsRoutes);
app.use('/api/dept-admin', deptAdminRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/overview', require('./routes/overviewRoutes'));
app.use('/api/notifications', require('./routes/notificationsRoutes'));
app.use('/api/department-complaints', departmentComplaintsRoutes);



app.use(
    '/api/users',
    authenticateToken,
    requireRole(1),
    userManagementRoutes
  );

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Endpoint not found',
        path: req.path,
        method: req.method
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 3001;

// دالة للتحقق من قاعدة البيانات الجديدة
app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    
}); 
// Import routes
module.exports = app;
