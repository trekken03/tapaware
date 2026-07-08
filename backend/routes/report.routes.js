const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller')
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/', verifyToken, reportController.getAllReports);
router.post('/', verifyToken, reportController.submitReport);
router.put('/:id/status', verifyToken, reportController.updateReportStatus);
router.get('/household/:id', verifyToken, reportController.getReportsByHousehold);
router.get('/:id', verifyToken, reportController.getReportById);

module.exports = router;