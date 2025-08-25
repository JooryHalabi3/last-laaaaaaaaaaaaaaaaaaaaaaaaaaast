const db = require('../config/database');

// جلب جميع الأدوار
const getRoles = async (req, res) => {
    try {
        // جلب الأدوار من قاعدة البيانات مع عدد المستخدمين
        const [rolesData] = await db.execute(`
            SELECT 
                r.RoleName as name,
                r.Description as description,
                COUNT(e.EmployeeID) as user_count
            FROM roles r
            LEFT JOIN employees e ON e.RoleID = r.RoleID
            GROUP BY r.RoleID, r.RoleName, r.Description
            ORDER BY r.RoleID
        `);
        
        res.json({
            success: true,
            data: rolesData
        });
    } catch (error) {
        console.error('Error getting roles:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب الأدوار'
        });
    }
};

// جلب صلاحيات دور معين
const getRolePermissions = async (req, res) => {
    try {
        const { roleName } = req.params;
        
        const query = `
            SELECT 
                permission_name as name,
                has_permission
            FROM RolePermissions 
            WHERE role_name = ?
            ORDER BY permission_name
        `;
        
        const [permissions] = await db.execute(query, [roleName]);
        
        res.json({
            success: true,
            data: permissions
        });
    } catch (error) {
        console.error('Error getting role permissions:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب صلاحيات الدور'
        });
    }
};

// تحديث صلاحيات دور معين
const updateRolePermissions = async (req, res) => {
    try {
        const { roleName } = req.params;
        const { permissions } = req.body;
        
        // التحقق من أن المستخدم مدير (RoleID = 1 أو اسم المستخدم admin)
        const user = req.user;
        if (user.RoleID !== 1 && user.Username.toLowerCase() !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'ليس لديك صلاحية تحديث الصلاحيات'
            });
        }
        
        // تحديث جميع الصلاحيات إلى 0 أولاً
        const allPermissions = [
            'submit_complaint', 'follow_own_complaint', 'view_public_complaints',
            'reply_complaints', 'change_complaint_status', 'export_reports',
            'access_dashboard', 'full_system_access', 'user_management',
            'roles_management', 'performance_reports', 'export_data',
            'audit_logs', 'system_config', 'backup_restore'
        ];
        
        for (const permissionName of allPermissions) {
            const updateQuery = `
                INSERT INTO RolePermissions (role_name, permission_name, has_permission) 
                VALUES (?, ?, 0)
                ON DUPLICATE KEY UPDATE has_permission = 0
            `;
            await db.execute(updateQuery, [roleName, permissionName]);
        }
        
        // تفعيل الصلاحيات المحددة
        for (const permission of permissions) {
            const query = `
                UPDATE RolePermissions 
                SET has_permission = 1 
                WHERE role_name = ? AND permission_name = ?
            `;
            await db.execute(query, [roleName, permission.name]);
        }
        
        res.json({
            success: true,
            message: 'تم تحديث الصلاحيات بنجاح'
        });
    } catch (error) {
        console.error('Error updating role permissions:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تحديث الصلاحيات'
        });
    }
};

module.exports = {
    getRoles,
    getRolePermissions,
    updateRolePermissions
};
