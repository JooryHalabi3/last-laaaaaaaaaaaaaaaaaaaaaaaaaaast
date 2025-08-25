const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { authenticateToken } = require('./middleware/auth');
const { requireRole } = require('./middleware/requireRole');

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
const db = require('./config/database');
const { setupEmployeesTable } = require('./controllers/authController');
const userManagementRoutes = require('./routes/userManagementRoutes');
const notificationsRoutes = require('./routes/notificationsRoutes');



const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
app.use('/api/overview', require('./routes/overviewRoutes'));
app.use('/api/notifications', require('./routes/notificationsRoutes'));

app.use(
    '/api/admin/users',
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

// دالة لإنشاء جدول الصلاحيات
async function setupPermissionsTable() {
    try {
        console.log('🔧 التحقق من وجود جدول RolePermissions...');
        
        // إنشاء جدول الصلاحيات
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS RolePermissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                role_name VARCHAR(50) NOT NULL,
                permission_name VARCHAR(100) NOT NULL,
                has_permission TINYINT(1) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_role_permission (role_name, permission_name)
            )
        `;
        
        await db.execute(createTableQuery);
        console.log('✅ جدول RolePermissions جاهز');
        
        // إدخال الصلاحيات الافتراضية
        const defaultPermissions = [
            // صلاحيات الموظف
            ['employee', 'submit_complaint', 0],
            ['employee', 'follow_own_complaint', 1],
            ['employee', 'view_public_complaints', 1],
            ['employee', 'reply_complaints', 1],
            ['employee', 'change_complaint_status', 1],
            ['employee', 'export_reports', 1],
            ['employee', 'access_dashboard', 1],
            
            // صلاحيات المدير
            ['manager', 'full_system_access', 1],
            ['manager', 'user_management', 1],
            ['manager', 'roles_management', 1],
            ['manager', 'performance_reports', 1],
            ['manager', 'export_data', 1],
            ['manager', 'audit_logs', 1],
            ['manager', 'system_config', 1],
            ['manager', 'backup_restore', 1]
        ];
        
        for (const [role, permission, hasPermission] of defaultPermissions) {
            const insertQuery = `
                INSERT INTO RolePermissions (role_name, permission_name, has_permission) 
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE has_permission = VALUES(has_permission)
            `;
            await db.execute(insertQuery, [role, permission, hasPermission]);
        }
        
        console.log('✅ تم إدخال الصلاحيات الافتراضية بنجاح');
        
    } catch (error) {
        console.error('❌ خطأ في إعداد جدول الصلاحيات:', error);
    }
}

app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    
    // إعداد جدول الصلاحيات عند بدء الخادم
    await setupPermissionsTable();
    await setupEmployeesTable();
}); 
// Import routes
module.exports = app;
