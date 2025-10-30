const express = require('express');
const router = express.Router();
const { checkHealth } = require('../controllers/healthController');

// This route is NOT protected by firebaseAuthMiddleware
router.get('/', checkHealth);

module.exports = router;