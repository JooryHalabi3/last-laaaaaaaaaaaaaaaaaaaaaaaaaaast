// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getCurrentUser,
  getRoles,
  getDepartments,
  updateProfile
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const authController = require('../controllers/authController');

// المسارات الصحيحة
router.post('/register', register);
router.post('/login', login);
router.get('/me', getCurrentUser);
router.get('/roles', getRoles);
router.get('/departments', getDepartments);

// تحديث بيانات البروفايل (يتطلب توكن صالح)
router.put('/profile', authenticateToken, updateProfile);

module.exports = router; 