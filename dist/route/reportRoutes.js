const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// Routes
router.post('/', reportController.createReport);
router.get('/', reportController.getReportedPosts);
router.get('/post/:postId', reportController.getReporterOfAPost);
router.get('/status', reportController.getByStatus);
// router.post('/:id/handle', reportController.handleReport); 
router.patch('/:id', reportController.updateReport);
router.delete('/:id', reportController.deleteReport);
router.get('/reporter/:reporterId', reportController.getReportsByReporter);
router.get('/resolver/:resolvedBy', reportController.getReportsByResolver);
module.exports = router;