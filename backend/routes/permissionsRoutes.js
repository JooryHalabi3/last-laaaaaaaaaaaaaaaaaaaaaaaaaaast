const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole, requirePermission } = require('../middleware/auth');
const {
    getRoles,
    getRolePermissions,
    updateRolePermissions,
    getAllPermissions,
    getUserPermissions,
    updateUserPermissions,
    checkUserPermission,
    getPermissionsStats
} = require('../controllers/permissionsController');

// تطبيق المصادقة على جميع المسارات
router.use(authenticateToken);

// مسارات الأدوار
router.get('/roles', 
    requirePermission('permissions.manage'),
    getRoles
);

router.get('/roles/:roleID/permissions', 
    requirePermission('role_permissions.manage'),
    getRolePermissions
);

router.put('/roles/:roleID/permissions', 
    requirePermission('role_permissions.manage'),
    updateRolePermissions
);

// مسارات الصلاحيات العامة
router.get('/permissions', 
    requirePermission('permissions.manage'),
    getAllPermissions
);

router.get('/stats', 
    requirePermission('permissions.manage'),
    getPermissionsStats
);

// مسارات صلاحيات المستخدمين
router.get('/users/:userID/permissions', 
    requirePermission('user_permissions.manage'),
    getUserPermissions
);

router.put('/users/:userID/permissions', 
    requirePermission('user_permissions.manage'),
    updateUserPermissions
);

router.get('/users/:userID/check/:permissionCode', 
    requireRole(1), // SuperAdmin only
    checkUserPermission
);

module.exports = router;