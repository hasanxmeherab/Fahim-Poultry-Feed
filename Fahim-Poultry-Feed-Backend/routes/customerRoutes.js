const express = require('express');
const router = express.Router();

const {
    getCustomers,
    getCustomer,
    createCustomer,
    addDeposit,
    makeWithdrawal,
    deleteCustomer,
    updateCustomer,
    buyFromCustomer
} = require('../controllers/customerController');
const firebaseAuthMiddleware = require('../middleware/firebaseAuthMiddleware');
const requireRole = require('../middleware/requireRole');

// --- Define Role Checks ---
const requireViewer = requireRole('viewer'); // Read access
const requireClerk = requireRole('clerk');   // Operational/Write access
// --- End Role Checks ---

// Apply auth middleware to all customer routes first
router.use(firebaseAuthMiddleware);

// --- Routes for the customer collection (/api/customers) ---
router.route('/')
    .get(requireViewer, getCustomers) // Viewer or higher can list
    .post(requireClerk, createCustomer); // Clerk or Admin can create

// --- Routes for a single customer by ID (/api/customers/:id) ---
router.route('/:id')
    .get(requireViewer, getCustomer)     // Viewer or higher can view details
    .patch(requireClerk, updateCustomer) // Clerk or Admin can edit details
    .delete(requireClerk, deleteCustomer); // Clerk or Admin can delete

// --- Routes for specific financial actions (Clerk or Admin only) ---
router.patch('/:id/deposit', requireClerk, addDeposit);
router.patch('/:id/withdrawal', requireClerk, makeWithdrawal);

// --- Route for buy back action (Clerk or Admin only) ---
router.post('/buyback', requireClerk, buyFromCustomer);

module.exports = router;