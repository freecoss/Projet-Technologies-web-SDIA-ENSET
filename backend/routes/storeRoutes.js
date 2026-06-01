const express = require('express');
const router = express.Router();
const { getStores, getStoreById, createStore, updateStore, deleteStore } = require('../controllers/storeController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { upload } = require('../config/cloudinary');

router.route('/')
    .get(getStores)
    .post(protect, authorize('admin'), upload.single('logo'), createStore);

router.route('/:id')
    .get(getStoreById)
    .put(protect, authorize('admin'), upload.single('logo'), updateStore)
    .delete(protect, authorize('admin'), deleteStore);

module.exports = router;
