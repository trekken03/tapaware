const express = require('express');
const router = express.Router();
const concernController = require('../controllers/concern.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { concernLimiter } = require('../middleware/rateLimit');

router.post('/', concernLimiter, concernController.submitConcern);
router.get('/', verifyToken, requireRole('admin', 'staff'), concernController.getAllConcerns);
router.get('/:id', verifyToken, requireRole('admin', 'staff'), concernController.getConcernById);
router.put('/:id/reply', verifyToken, requireRole('admin', 'staff'), concernController.replyToConcern);

module.exports = router;