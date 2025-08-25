const express = require('express');
const router = express.Router();
const userManagementController = require('../controllers/userManagementController');
const auth = require('../middleware/auth');

// جلب كل المستخدمين
router.get('/all', auth, userManagementController.getAllUsers);

// تحديث دور المستخدم
router.put('/:id/role', auth, userManagementController.updateUserRole);

// حذف مستخدم
router.delete('/:id', auth, userManagementController.deleteUser);

// سويتش يوزر (Impersonate)
router.post('/impersonate/:id', auth, userManagementController.impersonateUser);

// إنهاء السويتش يوزر
router.post('/impersonate/end', auth, userManagementController.endImpersonation);

module.exports = router;
