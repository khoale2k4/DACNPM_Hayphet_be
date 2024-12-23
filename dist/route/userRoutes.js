const router = require('express').Router();
const userController = require('../controllers/userController');
const {
  isAuthenticated
} = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// Forget password routes
router.post('/forgot-password/send', userController.forgotPassword_send);
router.post('/forgot-password/verify', userController.forgotPassword_verify);

// Login and sign-in routes
router.post('/login', userController.handleLogin);
router.post('/signin-send', userController.handleUserSignin_sentAuthCode);
router.post('/signin-verify', userController.handleUserSignin_verifyAuthCode);
router.put('/update-info', isAuthenticated, upload.single('avatar'), userController.updateUserInfo);
module.exports = router;