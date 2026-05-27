const express = require('express');
const router = express.Router();
const { addPrice, updatePrice, getPricesByProduct, getPriceStats } = require('../controllers/priceController');
const { protect } = require('../middlewares/authMiddleware');
const { validatePrice } = require('../middlewares/validationMiddleware');
const { upload } = require('../config/cloudinary');

router.route('/')
    .post(protect, upload.single('proofImage'), validatePrice, addPrice);

router.route('/stats/:productId')
    .get(getPriceStats);

router.route('/:id')
    .put(protect, updatePrice);

router.route('/product/:productId')
    .get(getPricesByProduct);

module.exports = router;
