const express = require('express');
const router = express.Router();
const tdsController = require('../controllers/tds.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');


router.get('/', verifyToken, requireRole('staff', 'admin'), tdsController.getAllReadings);
router.post('/', verifyToken, requireRole('staff', 'admin'), tdsController.addReadings);
router.get('/household/:id/latest', verifyToken, tdsController.getLatestReadingByHousehold);
router.get('/household/:id', verifyToken, tdsController.getReadingsByHousehold);
router.get('/:id', verifyToken, requireRole('staff', 'admin'), tdsController.getReadingById);
router.delete('/:id', verifyToken, requireRole('admin'), tdsController.deleteReading);

module.exports = router;