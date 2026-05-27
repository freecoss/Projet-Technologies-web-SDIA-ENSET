const express = require('express');
const router = express.Router();
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getPendingProducts, updateProductStatus, getMyProducts } = require('../controllers/productController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { validateProduct } = require('../middlewares/validationMiddleware');
const { upload } = require('../config/cloudinary');

router.route('/')
    .get(getProducts)
    .post(protect, upload.single('image'), validateProduct, createProduct);

router.route('/my-products')
    .get(protect, getMyProducts);

router.route('/pending')
    .get(protect, authorize('admin', 'moderator'), getPendingProducts);

router.route('/:id/status')
    .put(protect, authorize('admin', 'moderator'), updateProductStatus);

router.route('/:id')
    .get(getProductById)
    .put(protect, updateProduct)
    .delete(protect, deleteProduct);

module.exports = router;
