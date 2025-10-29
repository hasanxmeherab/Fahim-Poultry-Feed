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
const { createCustomerRules, updateCustomerRules, amountRules, buyBackRules } = require('../validation/customer.validation.js');
const { validate } = require('../validation/shared.validation.js');

// --- Define Role Checks ---
const requireViewer = requireRole('viewer'); // Read access
const requireOperator = requireRole('operator');   // Operational/Write access
// --- End Role Checks ---

// Apply auth middleware to all customer routes first
router.use(firebaseAuthMiddleware);

// --- Routes for the customer collection (/api/customers) ---
router.route('/')
    .get(requireViewer, getCustomers) // Viewer or higher can list
    .post(requireOperator, createCustomerRules(), validate, createCustomer); // Operator or Admin can create

// --- Routes for a single customer by ID (/api/customers/:id) ---
router.route('/:id')
    .get(requireViewer, getCustomer)     // Viewer or higher can view details
    .patch(requireOperator, updateCustomerRules(), validate, updateCustomer) // Operator or Admin can edit details
    .delete(requireOperator, deleteCustomer); // Operator or Admin can delete

// --- Routes for specific financial actions (Operator or Admin only) ---
router.patch('/:id/deposit', requireOperator, amountRules(), validate, addDeposit);
router.patch('/:id/withdrawal', requireOperator, amountRules(), validate, makeWithdrawal);

// --- Route for buy back action (Operator or Admin only) ---
router.post('/buyback', requireOperator, buyBackRules(), validate, buyFromCustomer);

module.exports = router;