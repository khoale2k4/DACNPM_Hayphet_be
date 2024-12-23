const router = require('express').Router();
const {
  isAuthenticated,
  isModerator
} = require('../middlewares/auth');
const postController = require('../controllers/postController');
// Moderator routes
// ...existing code...
router.delete('/posts/:postId', isAuthenticated, isModerator, postController.deletePost);
module.exports = router;