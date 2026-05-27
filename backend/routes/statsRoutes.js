const express = require('express');
const router = express.Router();
const { getPublicStats } = require('../controllers/statsController');

router.route('/public').get(getPublicStats);

module.exports = router;
