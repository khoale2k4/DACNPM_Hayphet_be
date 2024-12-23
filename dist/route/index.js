const router = require('express').Router();
const userRoutes = require('./userRoutes');
const googleAuthRoutes = require('./googleAuthRoutes');
const commentRoutes = require('./commentRoutes');
const postRoutes = require('./postRoutes');
const adminRoutes = require('./adminRoutes');
const moderatorRoutes = require('./moderatorRoutes');
const reportRoutes = require('./reportRoutes');
const notifications = require('./noticesRoutes');
let initWebRoutes = app => {
  router.use('/api', userRoutes); // User routes
  router.use(googleAuthRoutes); // Google authentication routes
  router.use('/api/comments', commentRoutes); // Comment routes
  router.use('/api', postRoutes); // Post routes
  router.use('/api/reports/', reportRoutes);
  router.use('/api/admin', adminRoutes); // Admin routes
  router.use('/api/moderator', moderatorRoutes); // Moderator routes
  router.use('/api', notifications); // Moderator routes

  return app.use("/", router);
};
module.exports = initWebRoutes;