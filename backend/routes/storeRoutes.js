const express = require('express');
const router = express.Router();
const { getStores, getStoreById, createStore, updateStore, deleteStore } = require('../controllers/storeController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.route('/')
    .get(getStores)
    .post(protect, authorize('admin'), createStore);

router.route('/:id')
    .get(getStoreById)
    .put(protect, authorize('admin'), updateStore)
    .delete(protect, authorize('admin'), deleteStore);

module.exports = router;
