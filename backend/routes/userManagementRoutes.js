// routes/userManagementRoutes.js
const express = require('express');
const router = express.Router();

const controller = require('../controllers/userManagementController');
const { authenticateToken } = require('../middleware/auth');

// قائمة المستخدمين (مع ترقيم صفحات) => يطابق طلب الواجهة /api/users?page=&limit=
router.get('/', authenticateToken, controller.listUsers);

// إحصائيات مبسطة للواجهة (عدد الكل/حسب الأدوار)
router.get('/stats', authenticateToken, controller.getStats);

// تحديث بيانات المستخدم
router.put('/:id', authenticateToken, controller.updateUser);

// تحديث دور المستخدم
router.put('/:id/role', authenticateToken, controller.updateUserRole);

// حذف مستخدم
router.delete('/:id', authenticateToken, controller.deleteUser);

// سويتش يوزر (Impersonate)
router.post('/:id/impersonate', authenticateToken, controller.impersonateUser);
// إنهاء السويتش يوزر
router.post('/impersonate/end', authenticateToken, controller.endImpersonation);

module.exports = router;
