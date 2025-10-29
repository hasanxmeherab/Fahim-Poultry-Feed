const express = require('express');
const router = express.Router();
const firebaseAuthMiddleware = require('../middleware/firebaseAuthMiddleware');
const requireRole = require('../middleware/requireRole');

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
const requireClerk = requireRole('clerk');
// --- End Role Checks ---

// Apply auth middleware to all routes first
router.use(firebaseAuthMiddleware);

// Routes for the collection
router.route('/')
    .get(requireViewer, getBuyers)    // Viewer or higher can list
    .post(requireClerk, createBuyer); // Clerk or Admin can create

// Routes for a specific buyer by ID
router.route('/:id')
    .get(requireViewer, getBuyerById)    // Viewer or higher can view details
    .patch(requireClerk, updateBuyer)    // Clerk or Admin can edit
    .delete(requireClerk, deleteBuyer); // Clerk or Admin can delete

// Routes for financial transactions (Clerk or Admin only)
router.patch('/:id/deposit', requireClerk, addDepositToBuyer);
router.patch('/:id/withdrawal', requireClerk, makeWithdrawalFromBuyer);

module.exports = router;