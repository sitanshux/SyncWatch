const express = require('express');
const router = express.Router();
const driveProxy = require('./driveProxy');

/**
 * @route   GET /api/status
 * @desc    Get the server and Socket.io API status
 * @access  Public
 */
router.get('/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'SyncWatch Backend'
  });
});

// Google Drive streaming proxy
router.use('/', driveProxy);

module.exports = router;
