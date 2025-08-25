// middleware/rolePermissions.js
const db = require('../config/database');

/**
 * Middleware للتحقق من الصلاحيات حسب الدور والإذن المطلوب
 * @param {string} permissionName - اسم الصلاحية المطلوبة
 * @returns {Function} middleware function
 */
const checkPermission = (permissionName) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'يجب تسجيل الدخول أولاً'
                });
            }

            const userRoleId = req.user.RoleID;
            let roleName = '';

            // تحديد اسم الدور حسب RoleID
            switch (Number(userRoleId)) {
                case 1:
                    roleName = 'SUPER_ADMIN';
                    break;
                case 2:
                    roleName = 'EMPLOYEE';
                    break;
                case 3:
                    roleName = 'ADMIN';
                    break;
                default:
                    return res.status(403).json({
                        success: false,
                        message: 'دور غير معروف'
                    });
            }

            // السوبر أدمن لديه كل الصلاحيات
            if (roleName === 'SUPER_ADMIN') {
                return next();
            }

            // التحقق من الصلاحية في قاعدة البيانات
            const [permissions] = await db.execute(`
                SELECT has_permission 
                FROM rolepermissions 
                WHERE role_name = ? AND permission_name = ?
            `, [roleName, permissionName]);

            if (permissions.length === 0 || !permissions[0].has_permission) {
                return res.status(403).json({
                    success: false,
                    message: 'ليس لديك صلاحية للوصول لهذه الميزة'
                });
            }

            next();
        } catch (error) {
            console.error('خطأ في التحقق من الصلاحيات:', error);
            return res.status(500).json({
                success: false,
                message: 'خطأ في الخادم'
            });
        }
    };
};

/**
 * Middleware للتحقق من صلاحيات القسم (للأدمن فقط)
 */
const checkDepartmentAccess = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'يجب تسجيل الدخول أولاً'
            });
        }

        const userRoleId = Number(req.user.RoleID);
        
        // السوبر أدمن لديه صلاحية الوصول لكل الأقسام
        if (userRoleId === 1) {
            return next();
        }

        // الأدمن يمكنه الوصول لقسمه فقط
        if (userRoleId === 3) {
            const requestedDeptId = req.params.departmentId || req.body.departmentId || req.query.departmentId;
            const userDeptId = req.user.DepartmentID;

            if (requestedDeptId && Number(requestedDeptId) !== Number(userDeptId)) {
                return res.status(403).json({
                    success: false,
                    message: 'لا يمكنك الوصول لبيانات قسم آخر'
                });
            }
        }

        // الموظفين العاديين لا يمكنهم الوصول لصفحات الإدارة
        if (userRoleId === 2) {
            return res.status(403).json({
                success: false,
                message: 'ليس لديك صلاحية الوصول لهذه الصفحة'
            });
        }

        next();
    } catch (error) {
        console.error('خطأ في التحقق من صلاحيات القسم:', error);
        return res.status(500).json({
            success: false,
            message: 'خطأ في الخادم'
        });
    }
};

/**
 * إعداد الصلاحيات الافتراضية لجميع الأدوار
 */
const setupDefaultPermissions = async () => {
    try {
        console.log('🔧 إعداد الصلاحيات الافتراضية...');

        const defaultPermissions = [
            // صلاحيات السوبر أدمن - كل شيء مفعل
            { role: 'SUPER_ADMIN', permission: 'full_system_access', enabled: true },
            { role: 'SUPER_ADMIN', permission: 'user_management', enabled: true },
            { role: 'SUPER_ADMIN', permission: 'department_management', enabled: true },
            { role: 'SUPER_ADMIN', permission: 'assign_complaints', enabled: true },
            { role: 'SUPER_ADMIN', permission: 'transfer_complaints', enabled: true },
            { role: 'SUPER_ADMIN', permission: 'view_all_complaints', enabled: true },
            { role: 'SUPER_ADMIN', permission: 'view_reports', enabled: true },
            { role: 'SUPER_ADMIN', permission: 'audit_logs', enabled: true },
            { role: 'SUPER_ADMIN', permission: 'submit_complaint', enabled: true },
            { role: 'SUPER_ADMIN', permission: 'follow_own_complaint', enabled: true },
            { role: 'SUPER_ADMIN', permission: 'view_public_complaints', enabled: true },
            { role: 'SUPER_ADMIN', permission: 'reply_complaints', enabled: true },
            { role: 'SUPER_ADMIN', permission: 'change_complaint_status', enabled: true },
            { role: 'SUPER_ADMIN', permission: 'export_reports', enabled: true },
            { role: 'SUPER_ADMIN', permission: 'access_dashboard', enabled: true },

            // صلاحيات الأدمن (رئيس القسم)
            { role: 'ADMIN', permission: 'assign_complaints', enabled: true },
            { role: 'ADMIN', permission: 'transfer_complaints', enabled: true },
            { role: 'ADMIN', permission: 'view_department_complaints', enabled: true },
            { role: 'ADMIN', permission: 'view_reports', enabled: true },
            { role: 'ADMIN', permission: 'update_complaint_status', enabled: true },
            { role: 'ADMIN', permission: 'add_comments', enabled: true },
            { role: 'ADMIN', permission: 'submit_complaint', enabled: true },
            { role: 'ADMIN', permission: 'follow_own_complaint', enabled: true },
            { role: 'ADMIN', permission: 'view_public_complaints', enabled: true },
            { role: 'ADMIN', permission: 'reply_complaints', enabled: true },
            { role: 'ADMIN', permission: 'change_complaint_status', enabled: true },
            { role: 'ADMIN', permission: 'export_reports', enabled: true },
            { role: 'ADMIN', permission: 'access_dashboard', enabled: true },

            // صلاحيات الموظف
            { role: 'EMPLOYEE', permission: 'view_assigned_complaints', enabled: true },
            { role: 'EMPLOYEE', permission: 'update_complaint_status', enabled: true },
            { role: 'EMPLOYEE', permission: 'add_comments', enabled: true },
            { role: 'EMPLOYEE', permission: 'submit_complaint', enabled: true },
            { role: 'EMPLOYEE', permission: 'follow_own_complaint', enabled: true },
            { role: 'EMPLOYEE', permission: 'reply_complaints', enabled: true },
            { role: 'EMPLOYEE', permission: 'change_complaint_status', enabled: true }
        ];

        for (const { role, permission, enabled } of defaultPermissions) {
            await db.execute(`
                INSERT INTO rolepermissions (role_name, permission_name, has_permission) 
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE has_permission = ?
            `, [role, permission, enabled ? 1 : 0, enabled ? 1 : 0]);
        }

        console.log('✅ تم إعداد الصلاحيات الافتراضية بنجاح');
    } catch (error) {
        console.error('❌ خطأ في إعداد الصلاحيات الافتراضية:', error);
    }
};

module.exports = {
    checkPermission,
    checkDepartmentAccess,
    setupDefaultPermissions
};
