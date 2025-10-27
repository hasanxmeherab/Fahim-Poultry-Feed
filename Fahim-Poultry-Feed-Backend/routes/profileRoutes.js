const express = require('express');
const router = express.Router();
const { updateUserProfile } = require('../controllers/profileController');
const firebaseAuthMiddleware = require('../middleware/firebaseAuthMiddleware');

// Apply auth middleware to protect the route
router.use(firebaseAuthMiddleware);

// Define the PATCH route for updating the profile
router.patch('/', updateUserProfile);

module.exports = router;
