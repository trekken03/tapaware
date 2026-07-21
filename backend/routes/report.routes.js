const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller')
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware')

router.get('/', verifyToken, reportController.getAllReports);
router.post('/', verifyToken, reportController.submitReport);
router.put('/:id/status', verifyToken, requireRole('staff', 'admin'), reportController.updateReportStatus);
router.get('/household/:id', verifyToken, reportController.getReportsByHousehold);
router.get('/:id', verifyToken, reportController.getReportById);
router.delete('/:id', verifyToken, reportController.deleteReport);

module.exports = router;