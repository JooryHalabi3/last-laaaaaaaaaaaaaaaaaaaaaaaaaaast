const db = require('../config/database');
const { logActivity } = require('./logsController');

// جلب جميع الأدوار
const getRoles = async (req, res) => {
    try {
        // جلب الأدوار من قاعدة البيانات مع عدد المستخدمين
        const [rolesData] = await db.execute(`
            SELECT 
                r.RoleID,
                r.RoleName as name,
                COUNT(u.UserID) as user_count
            FROM roles r
            LEFT JOIN users u ON u.RoleID = r.RoleID AND u.IsActive = 1
            GROUP BY r.RoleID, r.RoleName
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
        const { roleID } = req.params;
        
        const query = `
            SELECT 
                p.PermissionID,
                p.Code as permission_code,
                p.Label as permission_name,
                COALESCE(rp.Allowed, 0) as has_permission
            FROM permissions p
            LEFT JOIN role_permissions rp ON p.PermissionID = rp.PermissionID AND rp.RoleID = ?
            ORDER BY p.Label
        `;
        
        const [permissions] = await db.execute(query, [roleID]);
        
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
        const { roleID } = req.params;
        const { permissions } = req.body;
        const userID = req.user.UserID || req.user.employeeID;

        if (!permissions || !Array.isArray(permissions)) {
            return res.status(400).json({
                success: false,
                message: 'صيغة الصلاحيات غير صحيحة'
            });
        }

        // التحقق من وجود الدور
        const [roleCheck] = await db.execute(
            'SELECT RoleID, RoleName FROM roles WHERE RoleID = ?',
            [roleID]
        );

        if (roleCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'الدور غير موجود'
            });
        }

        // حذف الصلاحيات الحالية للدور
        await db.execute(
            'DELETE FROM role_permissions WHERE RoleID = ?',
            [roleID]
        );

        // إضافة الصلاحيات الجديدة
        for (const permission of permissions) {
            if (permission.has_permission) {
                await db.execute(
                    'INSERT INTO role_permissions (RoleID, PermissionID, Allowed) VALUES (?, ?, 1)',
                    [roleID, permission.PermissionID]
                );
            }
        }

        // تسجيل النشاط
        await logActivity(userID, null, 'ROLE_PERMISSIONS_UPDATED', {
            roleID,
            roleName: roleCheck[0].RoleName,
            permissionsCount: permissions.filter(p => p.has_permission).length
        });

        res.json({
            success: true,
            message: 'تم تحديث صلاحيات الدور بنجاح'
        });
    } catch (error) {
        console.error('Error updating role permissions:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تحديث صلاحيات الدور'
        });
    }
};

// جلب جميع الصلاحيات المتاحة
const getAllPermissions = async (req, res) => {
    try {
        const [permissions] = await db.execute(`
            SELECT PermissionID, Code, Label
            FROM permissions
            ORDER BY Label
        `);
        
        res.json({
            success: true,
            data: permissions
        });
    } catch (error) {
        console.error('Error getting all permissions:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب الصلاحيات'
        });
    }
};

// جلب صلاحيات مستخدم معين
const getUserPermissions = async (req, res) => {
    try {
        const { userID } = req.params;

        // التحقق من وجود المستخدم
        const [userCheck] = await db.execute(
            'SELECT UserID, FullName, RoleID FROM users WHERE UserID = ?',
            [userID]
        );

        if (userCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود'
            });
        }

        const user = userCheck[0];

        // جلب صلاحيات المستخدم (صلاحيات الدور + الصلاحيات الشخصية)
        const [permissions] = await db.execute(`
            SELECT 
                p.PermissionID,
                p.Code as permission_code,
                p.Label as permission_name,
                COALESCE(rp.Allowed, 0) as role_permission,
                COALESCE(up.Allowed, NULL) as user_permission,
                CASE 
                    WHEN up.Allowed IS NOT NULL THEN up.Allowed
                    ELSE COALESCE(rp.Allowed, 0)
                END as effective_permission
            FROM permissions p
            LEFT JOIN role_permissions rp ON p.PermissionID = rp.PermissionID AND rp.RoleID = ?
            LEFT JOIN user_permissions up ON p.PermissionID = up.PermissionID AND up.UserID = ?
            ORDER BY p.Label
        `, [user.RoleID, userID]);

        res.json({
            success: true,
            data: {
                user: user,
                permissions: permissions
            }
        });
    } catch (error) {
        console.error('Error getting user permissions:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب صلاحيات المستخدم'
        });
    }
};

// تحديث صلاحيات مستخدم معين
const updateUserPermissions = async (req, res) => {
    try {
        const { userID } = req.params;
        const { permissions } = req.body;
        const currentUserID = req.user.UserID || req.user.employeeID;

        if (!permissions || !Array.isArray(permissions)) {
            return res.status(400).json({
                success: false,
                message: 'صيغة الصلاحيات غير صحيحة'
            });
        }

        // التحقق من وجود المستخدم
        const [userCheck] = await db.execute(
            'SELECT UserID, FullName FROM users WHERE UserID = ?',
            [userID]
        );

        if (userCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود'
            });
        }

        // حذف الصلاحيات الشخصية الحالية
        await db.execute(
            'DELETE FROM user_permissions WHERE UserID = ?',
            [userID]
        );

        // إضافة الصلاحيات الجديدة
        for (const permission of permissions) {
            if (permission.user_permission !== null) {
                await db.execute(
                    'INSERT INTO user_permissions (UserID, PermissionID, Allowed) VALUES (?, ?, ?)',
                    [userID, permission.PermissionID, permission.user_permission ? 1 : 0]
                );
            }
        }

        // تسجيل النشاط
        await logActivity(currentUserID, userID, 'USER_PERMISSIONS_UPDATED', {
            targetUser: userCheck[0].FullName,
            permissionsCount: permissions.filter(p => p.user_permission !== null).length
        });

        res.json({
            success: true,
            message: 'تم تحديث صلاحيات المستخدم بنجاح'
        });
    } catch (error) {
        console.error('Error updating user permissions:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تحديث صلاحيات المستخدم'
        });
    }
};

// التحقق من صلاحية معينة لمستخدم
const checkUserPermission = async (req, res) => {
    try {
        const { userID, permissionCode } = req.params;

        // جلب صلاحية المستخدم
        const [result] = await db.execute(`
            SELECT 
                CASE 
                    WHEN up.Allowed IS NOT NULL THEN up.Allowed
                    ELSE COALESCE(rp.Allowed, 0)
                END as has_permission
            FROM users u
            LEFT JOIN permissions p ON p.Code = ?
            LEFT JOIN role_permissions rp ON p.PermissionID = rp.PermissionID AND rp.RoleID = u.RoleID
            LEFT JOIN user_permissions up ON p.PermissionID = up.PermissionID AND up.UserID = u.UserID
            WHERE u.UserID = ?
        `, [permissionCode, userID]);

        const hasPermission = result.length > 0 && result[0].has_permission === 1;

        res.json({
            success: true,
            data: {
                userID: parseInt(userID),
                permissionCode,
                hasPermission
            }
        });
    } catch (error) {
        console.error('Error checking user permission:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في التحقق من الصلاحية'
        });
    }
};

// جلب إحصائيات الصلاحيات
const getPermissionsStats = async (req, res) => {
    try {
        // عدد الأدوار
        const [rolesCount] = await db.execute('SELECT COUNT(*) as count FROM roles');
        
        // عدد الصلاحيات
        const [permissionsCount] = await db.execute('SELECT COUNT(*) as count FROM permissions');
        
        // عدد المستخدمين الذين لديهم صلاحيات شخصية
        const [usersWithCustomPermissions] = await db.execute(`
            SELECT COUNT(DISTINCT UserID) as count FROM user_permissions
        `);
        
        // أكثر الصلاحيات استخداماً
        const [mostUsedPermissions] = await db.execute(`
            SELECT p.Label, COUNT(*) as usage_count
            FROM permissions p
            JOIN role_permissions rp ON p.PermissionID = rp.PermissionID
            WHERE rp.Allowed = 1
            GROUP BY p.PermissionID, p.Label
            ORDER BY usage_count DESC
            LIMIT 5
        `);

        res.json({
            success: true,
            data: {
                totalRoles: rolesCount[0].count,
                totalPermissions: permissionsCount[0].count,
                usersWithCustomPermissions: usersWithCustomPermissions[0].count,
                mostUsedPermissions
            }
        });
    } catch (error) {
        console.error('Error getting permissions stats:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب إحصائيات الصلاحيات'
        });
    }
};

module.exports = {
    getRoles,
    getRolePermissions,
    updateRolePermissions,
    getAllPermissions,
    getUserPermissions,
    updateUserPermissions,
    checkUserPermission,
    getPermissionsStats
};