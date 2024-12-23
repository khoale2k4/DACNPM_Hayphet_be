const router = require('express').Router();
const passport = require('passport');
const googleAuthController = require('../controllers/googleAuthController');

// Google authentication routes
router.get('/login-success', googleAuthController.loginSuccess);
router.get('/auth/google/callback', passport.authenticate('google', {
  failureRedirect: `${process.env.CLIENT_URL}/login`
}), googleAuthController.callbackUser);
router.get('/google/auth', passport.authenticate("google", {
  scope: ["profile", "email"]
}));
router.get('/logout', googleAuthController.userLogout);
module.exports = router;