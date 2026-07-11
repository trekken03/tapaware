const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/summary', analyticsController.getSummary);
router.get('/reports-by-issue', analyticsController.getReportByIssueType);
router.get('/reports-by-household', analyticsController.getReportsByHouseholdCount);
router.get('/reports-by-purok', analyticsController.getReportsByPurokCount);
router.get('/flagged', analyticsController.getFlaggedHouseholds);
router.get('/tds-trend', analyticsController.getTdsTrend);
router.get('/tds-by-purok', analyticsController.getTdsByPurok);
router.get('/resident/summary', verifyToken, analyticsController.getResidentSummary);
router.get('/trending-issues', analyticsController.getTrendingIssuesByPurok);

module.exports = router;