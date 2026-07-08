const express = require('express');
const router = express.Router();
const tdsController = require('../controllers/tds.controller');

router.get('/', tdsController.getAllReadings);
router.post('/', tdsController.addReadings);
router.get('/household/:id/latest', tdsController.getLatestReadingByHousehold);
router.get('/household/:id', tdsController.getReadingsByHousehold);
router.get('/:id', tdsController.getReadingById);

module.exports = router;