const express = require('express');
const router = express.Router();
const tdsController = require('../controllers/tds.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');


router.get('/', tdsController.getAllReadings);
router.post('/', tdsController.addReadings);
router.get('/household/:id/latest', tdsController.getLatestReadingByHousehold);
router.get('/household/:id', tdsController.getReadingsByHousehold);
router.get('/:id', tdsController.getReadingById);
router.delete('/:id', verifyToken, requireRole('admin'), tdsController.deleteReading);

module.exports = router;