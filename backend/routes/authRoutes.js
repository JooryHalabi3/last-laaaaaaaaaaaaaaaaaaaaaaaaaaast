// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const {
  register,
  login,
  changePassword,
  requestPasswordReset,
  resetPassword,
  getProfile,
  updateProfile
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// مسارات المصادقة العامة (لا تحتاج توكن)
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);

// مسارات تحتاج مصادقة
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.post('/change-password', authenticateToken, changePassword);

module.exports = router;