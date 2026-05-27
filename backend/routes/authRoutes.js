const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, logoutUser, updateProfile } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { validateRegister, validateLogin } = require('../middlewares/validationMiddleware');
const { upload } = require('../config/cloudinary');

router.post('/register', validateRegister, registerUser);
router.post('/login', validateLogin, loginUser);
router.post('/logout', logoutUser);

router.route('/profile')
    .get(protect, getMe)
    .put(protect, upload.single('avatar'), updateProfile);

module.exports = router;
