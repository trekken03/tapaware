const express = require('express');
const router = express.Router();
const adminRequestController = require('../controllers/adminRequest.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { verifyCsrf } = require('../middleware/csrf.middleware');
const { adminRequestLimiter } = require('../middleware/rateLimit');

router.post('/', verifyToken, verifyCsrf, adminRequestLimiter, adminRequestController.submitRequest);
router.get('/', verifyToken, requireRole('admin'), adminRequestController.getAllRequests);
router.patch('/:id', verifyToken, verifyCsrf, requireRole('admin'), adminRequestController.reviewRequest);

module.exports = router;
