const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { loginLimiter, forgotPasswordLimiter } = require('../middleware/rateLimit');

router.post('/register', verifyToken, requireRole('admin'), authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword);
router.post('/reset-password', forgotPasswordLimiter, authController.resetPassword);
router.put('/profile', verifyToken, authController.updateProfile)
router.put('/change-password', verifyToken, authController.changePassword)

module.exports = router;
