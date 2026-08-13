const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller')
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware')
const { verifyCsrf } = require('../middleware/csrf.middleware');

router.get('/archived', verifyToken, requireRole('admin'), reportController.getArchivedReports);
router.get('/', verifyToken, reportController.getAllReports);
router.post('/', verifyToken, verifyCsrf, reportController.submitReport);
router.put('/:id/status', verifyToken, verifyCsrf, requireRole('staff', 'admin'), reportController.updateReportStatus);
router.put('/:id/restore', verifyToken, verifyCsrf, requireRole('admin'), reportController.restoreReport);
router.get('/household/:id', verifyToken, reportController.getReportsByHousehold);
router.get('/:id', verifyToken, reportController.getReportById);
router.delete('/:id/permanent', verifyToken, verifyCsrf, requireRole('admin'), reportController.permanentDeleteReport);
router.delete('/:id', verifyToken, verifyCsrf, reportController.deleteReport);

module.exports = router;
