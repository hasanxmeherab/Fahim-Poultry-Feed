const express = require('express');
const router = express.Router();
const { createSale, getSales, createWholesaleSale } = require('../controllers/saleController');
const firebaseAuthMiddleware = require('../middleware/firebaseAuthMiddleware');
const requireRole = require('../middleware/requireRole');
const { createSaleRules, createWholesaleSaleRules } = require('../validation/sale.validation.js');
const { validate } = require('../validation/shared.validation.js');

// --- Define Role Checks ---
const requireViewer = requireRole('viewer');
const requireOperator = requireRole('operator');
// --- End Role Checks ---

// Apply auth middleware to all sale routes first
router.use(firebaseAuthMiddleware);

router.route('/')
    .get(requireViewer, getSales)       // Viewer or higher can view history
    .post(requireOperator, createSaleRules(), validate, createSale);    // Operator or Admin can create sales

// Wholesale Sales (Operator or Admin only)
router.post('/wholesale', requireOperator, createWholesaleSaleRules(), validate, createWholesaleSale);

module.exports = router;