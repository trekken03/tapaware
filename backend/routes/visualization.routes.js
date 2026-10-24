const express = require('express');
const router = express.Router();
const visualizationController = require('../controllers/visualization.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.get('/summary', visualizationController.getSummary);
router.get('/reports-by-issue', verifyToken, requireRole('admin', 'staff'), visualizationController.getReportByIssueType);
router.get('/reports-by-household', verifyToken, requireRole('admin', 'staff'), visualizationController.getReportsByHouseholdCount);
router.get('/reports-by-zone', verifyToken, requireRole('admin', 'staff'), visualizationController.getReportsByZoneCount);
router.get('/reports-by-status', verifyToken, requireRole('admin', 'staff'), visualizationController.getReportsByStatus);
router.get('/flagged', verifyToken, requireRole('admin', 'staff'), visualizationController.getFlaggedHouseholds);
router.get('/tds-trend', verifyToken, requireRole('admin', 'staff'), visualizationController.getTdsTrend);
router.get('/tds-by-zone', visualizationController.getTdsByZone);
router.get('/resident/summary', verifyToken, visualizationController.getResidentSummary);
router.get('/trending-issues', verifyToken, requireRole('admin', 'staff'), visualizationController.getTrendingIssuesByZone);
router.get('/trending-by-time', verifyToken, requireRole('admin', 'staff'), visualizationController.getTrendingIssuesByTime);


module.exports = router;