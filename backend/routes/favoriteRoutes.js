const express = require('express');
const router = express.Router();
const { addFavorite, removeFavorite, getMyFavorites } = require('../controllers/favoriteController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
    .get(protect, getMyFavorites);

router.route('/:productId')
    .post(protect, addFavorite)
    .delete(protect, removeFavorite);

module.exports = router;
