const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.get('/users', verifyToken, requireRole('admin'), adminController.getAllUsers);
router.put('/users/:id/role', verifyToken, requireRole('admin'), adminController.updateUserRole);
router.delete('/users/:id', verifyToken, requireRole('admin'), adminController.deleteUser);
router.get('/audit-trail', verifyToken, requireRole('admin'), adminController.getAuditTrail);
router.get('/audit-trail/user/:id', verifyToken, requireRole('admin'), adminController.getAuditTrailByUser);
router.put('/users/:id', verifyToken, requireRole('admin'), adminController.updateUserInfo);
router.put('/flags/:id/status', verifyToken, requireRole('admin'), adminController.updateFlagStatus);
router.get('/users/:id', verifyToken, requireRole('admin'), adminController.getUserById)

module.exports = router;
