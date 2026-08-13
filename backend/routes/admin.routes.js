const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { verifyCsrf } = require('../middleware/csrf.middleware');

router.get('/users/archived', verifyToken, requireRole('admin'), adminController.getArchivedUsers);
router.get('/users', verifyToken, requireRole('admin'), adminController.getAllUsers);
router.put('/users/:id/role', verifyToken, verifyCsrf, requireRole('admin'), adminController.updateUserRole);
router.put('/users/:id/restore', verifyToken, verifyCsrf, requireRole('admin'), adminController.restoreUser);
router.delete('/users/:id/permanent', verifyToken, verifyCsrf, requireRole('admin'), adminController.permanentDeleteUser);
router.delete('/users/:id', verifyToken, verifyCsrf, requireRole('admin'), adminController.deleteUser);
router.get('/audit-trail', verifyToken, requireRole('admin'), adminController.getAuditTrail);
router.get('/audit-trail/user/:id', verifyToken, requireRole('admin'), adminController.getAuditTrailByUser);
router.put('/users/:id', verifyToken, verifyCsrf, requireRole('admin'), adminController.updateUserInfo);
router.put('/flags/:id/status', verifyToken, verifyCsrf, requireRole('admin'), adminController.updateFlagStatus);
router.get('/users/:id', verifyToken, requireRole('admin'), adminController.getUserById);
router.get('/audit-trail/:id', verifyToken, requireRole('admin'), adminController.getAuditLogById);
router.get('/flags/:id', verifyToken, requireRole('admin'), adminController.getFlagById);

module.exports = router;
