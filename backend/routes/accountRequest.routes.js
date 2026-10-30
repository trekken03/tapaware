const express = require('express');
const router = express.Router();
const accountRequestController = require('../controllers/accountRequest.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { verifyCsrf } = require('../middleware/csrf.middleware');
const { accountRequestLimiter } = require('../middleware/rateLimit');

// Public, like POST /concerns: no login and no CSRF token (visitors have no session).
router.post('/', accountRequestLimiter, accountRequestController.submitRequest);
router.get('/', verifyToken, requireRole('admin'), accountRequestController.getAllRequests);
router.get('/:id', verifyToken, requireRole('admin'), accountRequestController.getRequestById);
router.post('/:id/approve', verifyToken, verifyCsrf, requireRole('admin'), accountRequestController.approveRequest);
router.post('/:id/reject', verifyToken, verifyCsrf, requireRole('admin'), accountRequestController.rejectRequest);

module.exports = router;
