const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('admin'), userController.getUsers);
router.get('/:id', authenticate, authorize('admin'), userController.getUser);
router.patch('/:id/role', authenticate, authorize('admin'), userController.updateRole);

module.exports = router;
