// middleware/rolePermissions.js
const db = require('../config/database');

/**
 * Middleware للتحقق من الصلاحيات حسب الدور والإذن المطلوب (محدث للنظام الجديد)
 * @param {string} permissionCode - كود الصلاحية المطلوبة
 * @returns {Function} middleware function
 */
const checkPermission = (permissionCode) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'يجب تسجيل الدخول أولاً'
                });
            }

            const userID = req.user.UserID;
            const userRoleID = req.user.RoleID;

            // السوبر أدمن لديه كل الصلاحيات
            if (userRoleID === 1) {
                return next();
            }

            // التحقق من الصلاحية في النظام الجديد
            const [permissions] = await db.execute(`
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

            const hasPermission = permissions.length > 0 && permissions[0].has_permission === 1;

            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: `ليس لديك صلاحية: ${permissionCode}`
                });
            }

            next();
        } catch (error) {
            console.error('خطأ في التحقق من الصلاحية:', error);
            res.status(500).json({
                success: false,
                message: 'خطأ في التحقق من الصلاحيات'
            });
        }
    };
};

/**
 * إعداد الصلاحيات الافتراضية للأدوار (محدث للنظام الجديد)
 */
const setupDefaultPermissions = async () => {
    try {
        console.log('🔧 إعداد الصلاحيات الافتراضية...');
        
        // التحقق من وجود الصلاحيات في الجدول
        const [existingPermissions] = await db.execute(
            'SELECT COUNT(*) as count FROM permissions'
        );

        if (existingPermissions[0].count === 0) {
            console.log('⚠️ لا توجد صلاحيات في قاعدة البيانات');
            return;
        }

        // التحقق من وجود صلاحيات للأدوار
        const [existingRolePermissions] = await db.execute(
            'SELECT COUNT(*) as count FROM role_permissions'
        );

        if (existingRolePermissions[0].count > 0) {
            console.log('✅ الصلاحيات موجودة بالفعل');
            return;
        }

        // إعداد صلاحيات SuperAdmin (جميع الصلاحيات)
        const [allPermissions] = await db.execute(
            'SELECT PermissionID FROM permissions'
        );

        for (const permission of allPermissions) {
            await db.execute(
                'INSERT IGNORE INTO role_permissions (RoleID, PermissionID, Allowed) VALUES (1, ?, 1)',
                [permission.PermissionID]
            );
        }

        // إعداد صلاحيات Employee (صلاحيات محدودة)
        const employeePermissions = [
            'complaint.create',
            'complaint.view_own',
            'complaint.reply'
        ];

        for (const permCode of employeePermissions) {
            const [perm] = await db.execute(
                'SELECT PermissionID FROM permissions WHERE Code = ?',
                [permCode]
            );
            if (perm.length > 0) {
                await db.execute(
                    'INSERT IGNORE INTO role_permissions (RoleID, PermissionID, Allowed) VALUES (2, ?, 1)',
                    [perm[0].PermissionID]
                );
            }
        }

        // إعداد صلاحيات Admin (صلاحيات متوسطة)
        const adminPermissions = [
            'complaint.create',
            'complaint.view_dept',
            'complaint.view_own',
            'complaint.assign',
            'complaint.reply',
            'complaint.status',
            'dept.employees.manage_basic'
        ];

        for (const permCode of adminPermissions) {
            const [perm] = await db.execute(
                'SELECT PermissionID FROM permissions WHERE Code = ?',
                [permCode]
            );
            if (perm.length > 0) {
                await db.execute(
                    'INSERT IGNORE INTO role_permissions (RoleID, PermissionID, Allowed) VALUES (3, ?, 1)',
                    [perm[0].PermissionID]
                );
            }
        }

        console.log('✅ تم إعداد الصلاحيات الافتراضية بنجاح');
        
    } catch (error) {
        console.error('❌ خطأ في إعداد الصلاحيات الافتراضية:', error);
    }
};

/**
 * التحقق من صلاحية متعددة (المستخدم يحتاج واحدة منها على الأقل)
 */
const checkAnyPermission = (permissionCodes) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'يجب تسجيل الدخول أولاً'
                });
            }

            const userID = req.user.UserID;
            const userRoleID = req.user.RoleID;

            // السوبر أدمن لديه كل الصلاحيات
            if (userRoleID === 1) {
                return next();
            }

            // التحقق من وجود أي من الصلاحيات المطلوبة
            const placeholders = permissionCodes.map(() => '?').join(',');
            const [permissions] = await db.execute(`
                SELECT 
                    COUNT(CASE WHEN 
                        (up.Allowed IS NOT NULL AND up.Allowed = 1) OR 
                        (up.Allowed IS NULL AND rp.Allowed = 1)
                    THEN 1 END) as valid_permissions
                FROM permissions p
                LEFT JOIN role_permissions rp ON p.PermissionID = rp.PermissionID AND rp.RoleID = ?
                LEFT JOIN user_permissions up ON p.PermissionID = up.PermissionID AND up.UserID = ?
                WHERE p.Code IN (${placeholders})
            `, [userRoleID, userID, ...permissionCodes]);

            const hasAnyPermission = permissions[0].valid_permissions > 0;

            if (!hasAnyPermission) {
                return res.status(403).json({
                    success: false,
                    message: `ليس لديك أي من الصلاحيات المطلوبة: ${permissionCodes.join(', ')}`
                });
            }

            next();
        } catch (error) {
            console.error('خطأ في التحقق من الصلاحيات المتعددة:', error);
            res.status(500).json({
                success: false,
                message: 'خطأ في التحقق من الصلاحيات'
            });
        }
    };
};

/**
 * التحقق من صلاحية القسم (للمدراء)
 */
const checkDepartmentPermission = async (req, res, next) => {
    try {
        const user = await ensureReqUserOrDecode(req);
        
        // السوبر أدمن يمكنه الوصول لجميع الأقسام
        if (user.RoleID === 1) {
            req.user = user;
            return next();
        }
        
        // التحقق من وجود DepartmentID
        if (!user.DepartmentID) {
            return res.status(403).json({
                success: false,
                message: 'المستخدم غير مرتبط بأي قسم'
            });
        }
        
        // إضافة معلومات القسم للطلب
        req.userDepartment = user.DepartmentID;
        req.user = user;
        next();
    } catch (error) {
        console.error('checkDepartmentPermission error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في التحقق من صلاحية القسم' 
        });
    }
};

/**
 * دالة مساعدة للحصول على صلاحيات المستخدم
 */
const getUserPermissions = async (userID) => {
    try {
        const [permissions] = await db.execute(`
            SELECT 
                p.Code,
                p.Label,
                CASE 
                    WHEN up.Allowed IS NOT NULL THEN up.Allowed
                    ELSE COALESCE(rp.Allowed, 0)
                END as has_permission
            FROM users u
            JOIN permissions p ON 1=1
            LEFT JOIN role_permissions rp ON p.PermissionID = rp.PermissionID AND rp.RoleID = u.RoleID
            LEFT JOIN user_permissions up ON p.PermissionID = up.PermissionID AND up.UserID = u.UserID
            WHERE u.UserID = ?
            ORDER BY p.Label
        `, [userID]);

        return permissions.filter(p => p.has_permission === 1);
    } catch (error) {
        console.error('getUserPermissions error:', error);
        return [];
    }
};

/**
 * دالة للتحقق من صلاحية محددة دون middleware
 */
const hasPermission = async (userID, permissionCode) => {
    try {
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

        return result.length > 0 && result[0].has_permission === 1;
    } catch (error) {
        console.error('hasPermission error:', error);
        return false;
    }
};

module.exports = {
    checkPermission,
    setupDefaultPermissions,
    checkAnyPermission,
    checkDepartmentPermission,
    getUserPermissions,
    hasPermission,
    checkEmployeePermissions,
    checkComplaintOwnership,
    logEmployeeActivity,
    checkRole
};