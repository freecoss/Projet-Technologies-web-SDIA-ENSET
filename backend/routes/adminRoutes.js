const express = require('express');
const router = express.Router();
const { getStats } = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.route('/stats')
    .get(protect, authorize('admin', 'moderator'), getStats);

module.exports = router;
