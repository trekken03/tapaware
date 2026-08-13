const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { verifyCsrf } = require('../middleware/csrf.middleware');
const { loginLimiter, forgotPasswordLimiter } = require('../middleware/rateLimit');

router.post('/register', verifyToken, verifyCsrf, requireRole('admin'), authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/logout', verifyCsrf, authController.logout);
router.get('/me', verifyToken, authController.getMe);
router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword);
router.post('/reset-password', forgotPasswordLimiter, authController.resetPassword);
router.put('/profile', verifyToken, verifyCsrf, authController.updateProfile);
router.put('/change-password', verifyToken, verifyCsrf, authController.changePassword);

module.exports = router;
