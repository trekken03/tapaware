const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller')
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware')

router.get('/', verifyToken, requireRole('staff', 'admin'), reportController.getAllReports);
router.post('/', verifyToken, reportController.submitReport);
router.put('/:id/status', verifyToken, requireRole('staff', 'admin'), reportController.updateReportStatus);
router.get('/household/:id', verifyToken, requireRole('staff', 'admin'), reportController.getReportsByHousehold);
router.get('/:id', verifyToken, requireRole('staff', 'admin'), reportController.getReportById);
router.delete('/:id', verifyToken, requireRole('staff', 'admin'), reportController.deleteReport);

module.exports = router;