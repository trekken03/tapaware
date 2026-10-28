const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { verifyCsrf } = require('../middleware/csrf.middleware');
const { loginLimiter, forgotPasswordLimiter, verifyEmailLimiter } = require('../middleware/rateLimit');
const validateFields = require('../middleware/validateFields')

router.post('/register', verifyToken, verifyCsrf, requireRole('admin'), validateFields((req) => {
    // keep every field that was in your old array, EXCEPT 'password'
    const fields = ['name', 'email', 'role'];
    // password is only required when the admin types one manually
    if ((req.body.password_mode || 'manual') === 'manual') fields.push('password');
    return fields;
}), authController.register);
router.post('/login', loginLimiter, validateFields(['email', 'password']), authController.login);
router.post('/logout', verifyCsrf, authController.logout);
router.get('/me', verifyToken, authController.getMe);
router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword);
router.post('/reset-password', forgotPasswordLimiter, authController.resetPassword);
router.post('/verify-email', verifyEmailLimiter, authController.verifyEmail);
router.put('/profile', verifyToken, verifyCsrf, validateFields(['name']), authController.updateProfile);
router.put('/change-password', verifyToken, verifyCsrf, authController.changePassword);

module.exports = router;
