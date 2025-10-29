const express = require('express');
const router = express.Router();
const { createSale, getSales, createWholesaleSale } = require('../controllers/saleController');
const firebaseAuthMiddleware = require('../middleware/firebaseAuthMiddleware');
const requireRole = require('../middleware/requireRole');

// --- Define Role Checks ---
const requireViewer = requireRole('viewer');
const requireClerk = requireRole('clerk');
// --- End Role Checks ---

// Apply auth middleware to all sale routes first
router.use(firebaseAuthMiddleware);

router.route('/')
    .get(requireViewer, getSales)       // Viewer or higher can view history
    .post(requireClerk, createSale);    // Clerk or Admin can create sales

// Wholesale Sales (Clerk or Admin only)
router.post('/wholesale', requireClerk, createWholesaleSale);

module.exports = router;