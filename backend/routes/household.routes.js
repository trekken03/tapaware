const express = require('express');
const router = express.Router();
const householdController = require('../controllers/household.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');



router.get('/', householdController.getAllHouseholds);
router.post('/', householdController.addHousehold);
router.get('/:id', householdController.getHouseholdById);
router.delete('/:id', verifyToken, requireRole('admin'), householdController.deleteHousehold);

module.exports = router;