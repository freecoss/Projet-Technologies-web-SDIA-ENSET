const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { createAlert, getMyAlerts, deleteAlert } = require('../controllers/alertController');

router.route('/')
    .post(protect, createAlert)
    .get(protect, getMyAlerts);

router.route('/:id')
    .delete(protect, deleteAlert);

module.exports = router;
