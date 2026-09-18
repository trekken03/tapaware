const express = require('express');
const router = express.Router();
const tdsController = require('../controllers/tds.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { verifyCsrf } = require('../middleware/csrf.middleware');
const validateFields = require('../middleware/validateFields');


router.get('/archived', verifyToken, requireRole('admin'), tdsController.getArchivedReadings);
router.get('/', verifyToken, requireRole('staff', 'admin'), tdsController.getAllReadings);
router.post('/', verifyToken, verifyCsrf, requireRole('staff', 'admin'), validateFields(['tds_value']), tdsController.addReadings);
router.get('/household/:id/latest', verifyToken, tdsController.getLatestReadingByHousehold);
router.get('/household/:id', verifyToken, tdsController.getReadingsByHousehold);
router.get('/:id', verifyToken, requireRole('staff', 'admin'), tdsController.getReadingById);
router.delete('/:id/permanent', verifyToken, verifyCsrf, requireRole('admin'), tdsController.permanentDeleteReading);
router.delete('/:id', verifyToken, verifyCsrf, requireRole('admin'), tdsController.deleteReading);
router.put('/:id/restore', verifyToken, verifyCsrf, requireRole('admin'), tdsController.restoreReading);

module.exports = router;
