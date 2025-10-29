const express = require('express');
const router = express.Router();
const { getSalesReport, getBatchReport, getDashboardCharts } = require('../controllers/reportController');
const firebaseAuthMiddleware = require('../middleware/firebaseAuthMiddleware');
const requireRole = require('../middleware/requireRole'); // <-- 1. IMPORT requireRole

// --- 2. DEFINE Role Checks ---
const requireViewer = requireRole('viewer');
// You can also define requireClerk here if needed for future proofing, 
// but for now, just define requireViewer as required by the routes below.
// -----------------------------

// Use firebaseAuthMiddleware to ensure user is logged in, then use requireRole for permission check
router.get('/sales', firebaseAuthMiddleware, requireViewer, getSalesReport);
router.get('/batch/:id', firebaseAuthMiddleware, requireViewer, getBatchReport);
router.get('/dashboard-charts', firebaseAuthMiddleware, requireViewer, getDashboardCharts);

module.exports = router;