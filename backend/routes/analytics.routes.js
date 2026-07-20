const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.get('/summary', analyticsController.getSummary);
router.get('/reports-by-issue', verifyToken, requireRole('admin', 'staff'), analyticsController.getReportByIssueType);
router.get('/reports-by-household', verifyToken, requireRole('admin', 'staff'), analyticsController.getReportsByHouseholdCount);
router.get('/reports-by-purok', verifyToken, requireRole('admin', 'staff'), analyticsController.getReportsByPurokCount);
router.get('/flagged', verifyToken, requireRole('admin', 'staff'), analyticsController.getFlaggedHouseholds);
router.get('/tds-trend', verifyToken, requireRole('admin', 'staff'), analyticsController.getTdsTrend);
router.get('/tds-by-purok', analyticsController.getTdsByPurok);
router.get('/resident/summary', verifyToken, analyticsController.getResidentSummary);
router.get('/trending-issues', verifyToken, requireRole('admin', 'staff'), analyticsController.getTrendingIssuesByPurok);
router.get('/trending-by-time', verifyToken, requireRole('admin', 'staff'), analyticsController.getTrendingIssuesByTime);

module.exports = router;