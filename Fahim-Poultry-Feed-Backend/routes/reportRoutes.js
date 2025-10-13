const express = require('express');
const router = express.Router();
const { getSalesReport, getBatchReport, getDashboardCharts } = require('../controllers/reportController');
const { firebaseAuthMiddleware } = require('../middleware/authMiddleware');

router.get('/sales', firebaseAuthMiddleware, getSalesReport);
router.get('/batch/:id', firebaseAuthMiddleware, getBatchReport);
router.get('/dashboard-charts', firebaseAuthMiddleware, getDashboardCharts);

module.exports = router;