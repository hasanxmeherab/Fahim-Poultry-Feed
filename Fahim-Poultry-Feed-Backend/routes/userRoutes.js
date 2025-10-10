const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/userController');

//router.post('/register', registerUser); // For one-time use
router.post('/login', loginUser);

module.exports = router;