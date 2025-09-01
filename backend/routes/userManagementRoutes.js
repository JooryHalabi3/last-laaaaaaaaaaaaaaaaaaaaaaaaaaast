// routes/userManagementRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
    listUsers,
    createUser,
    updateUser,
    deleteUser,
    getUserById,
    changeUserPassword,
    getRoles,
    getDepartments,
    getUserStats
} = require('../controllers/userManagementController');

// تطبيق المصادقة والصلاحية (SuperAdmin فقط) على جميع المسارات
router.use(authenticateToken);
router.use(requireRole(1)); // SuperAdmin only

// قائمة المستخدمين مع البحث والفلترة
router.get('/', listUsers);

// إحصائيات المستخدمين
router.get('/stats', getUserStats);

// جلب الأدوار المتاحة
router.get('/roles', getRoles);

// جلب الأقسام المتاحة
router.get('/departments', getDepartments);

// إنشاء مستخدم جديد
router.post('/', createUser);

// جلب تفاصيل مستخدم محدد
router.get('/:id', getUserById);

// تحديث بيانات المستخدم
router.put('/:id', updateUser);

// تغيير كلمة مرور المستخدم
router.put('/:id/password', changeUserPassword);

// حذف مستخدم (تعطيل)
router.delete('/:id', deleteUser);

module.exports = router;