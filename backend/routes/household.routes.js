const express = require('express');
const router = express.Router();
const householdController = require('../controllers/household.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { verifyCsrf } = require('../middleware/csrf.middleware');



router.get('/archived', verifyToken, requireRole('admin'), householdController.getArchivedHouseholds);
router.get('/', householdController.getAllHouseholds);
router.post('/', householdController.addHousehold);
router.get('/:id', householdController.getHouseholdById);
router.delete('/:id/permanent', verifyToken, verifyCsrf, requireRole('admin'), householdController.permanentDeleteHousehold);
router.delete('/:id', verifyToken, verifyCsrf, requireRole('admin'), householdController.deleteHousehold);
router.put('/:id/restore', verifyToken, verifyCsrf, requireRole('admin'), householdController.restoreHousehold);

module.exports = router;
