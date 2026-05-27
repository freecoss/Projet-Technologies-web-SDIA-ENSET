const express = require('express');
const router = express.Router();
const { toggleVote } = require('../controllers/voteController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/:priceId')
    .post(protect, toggleVote);

module.exports = router;
