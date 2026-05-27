const express = require('express');
const router = express.Router();
const { getCommentsByProduct, addComment, updateComment, deleteComment } = require('../controllers/commentController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/product/:productId')
    .get(getCommentsByProduct)
    .post(protect, addComment);

router.route('/:id')
    .put(protect, updateComment)
    .delete(protect, deleteComment);

module.exports = router;
