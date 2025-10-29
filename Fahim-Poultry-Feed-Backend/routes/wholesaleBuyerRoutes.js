const express = require('express');
const router = express.Router();
const firebaseAuthMiddleware = require('../middleware/firebaseAuthMiddleware');
const requireRole = require('../middleware/requireRole');
const { createWholesaleBuyerRules, updateWholesaleBuyerRules, amountRules } = require('../validation/wholesaleBuyer.validation.js');
const { validate } = require('../validation/shared.validation.js');

const {
    getBuyers,
    getBuyerById,
    createBuyer,
    updateBuyer,
    deleteBuyer,
    addDepositToBuyer,
    makeWithdrawalFromBuyer
} = require('../controllers/wholesaleBuyerController');

// --- Define Role Checks ---
const requireViewer = requireRole('viewer');
const requireOperator = requireRole('operator');
// --- End Role Checks ---

// Apply auth middleware to all routes first
router.use(firebaseAuthMiddleware);

// Routes for the collection
router.route('/')
    .get(requireViewer, getBuyers)    // Viewer or higher can list
    .post(requireOperator, createWholesaleBuyerRules(), validate, createBuyer); // Operator or Admin can create

// Routes for a specific buyer by ID
router.route('/:id')
    .get(requireViewer, getBuyerById)    // Viewer or higher can view details
    .patch(requireOperator, updateWholesaleBuyerRules(), validate, updateBuyer)    // Operator or Admin can edit
    .delete(requireOperator, deleteBuyer); // Operator or Admin can delete

// Routes for financial transactions (Operator or Admin only)
router.patch('/:id/deposit', requireOperator, amountRules(), validate, addDepositToBuyer);
router.patch('/:id/withdrawal', requireOperator, amountRules(), validate, makeWithdrawalFromBuyer);

module.exports = router;