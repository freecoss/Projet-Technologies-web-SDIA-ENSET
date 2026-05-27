const express = require('express');
const router = express.Router();
const { getUsers, updateUserRole, deleteUser } = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.route('/')
    .get(protect, authorize('admin'), getUsers);

router.route('/:id/role')
    .put(protect, authorize('admin'), updateUserRole);

router.route('/:id')
    .delete(protect, authorize('admin'), deleteUser);

module.exports = router;
