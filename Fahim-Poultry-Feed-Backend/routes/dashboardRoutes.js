const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const  firebaseAuthMiddleware  = require('../middleware/firebaseAuthMiddleware');

router.get('/stats', firebaseAuthMiddleware, getDashboardStats);

module.exports = router;