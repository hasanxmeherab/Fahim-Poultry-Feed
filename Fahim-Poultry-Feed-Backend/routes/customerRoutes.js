const express = require('express');

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
const { createCustomerRules, updateCustomerRules, validate } = require('../validation/customer.validation.js');

const router = express.Router();

// --- Apply middleware to all routes in this file ---
router.use(firebaseAuthMiddleware);

// --- Routes for the customer collection (/api/customers) ---
router.route('/')
    .get(getCustomers) // GET /api/customers
    .post(createCustomerRules(), validate, createCustomer); // POST /api/customers

// --- Routes for a single customer by ID (/api/customers/:id) ---
router.route('/:id')
    .get(getCustomer) // GET /api/customers/:id
    .patch(updateCustomerRules(), validate, updateCustomer) // PATCH /api/customers/:id
    .delete(deleteCustomer); // DELETE /api/customers/:id

// --- Routes for specific financial actions on a customer ---
router.patch('/:id/deposit', addDeposit); // PATCH /api/customers/:id/deposit
router.patch('/:id/withdrawal', makeWithdrawal); // PATCH /api/customers/:id/withdrawal

// --- Route for a specific business action (buy back from customer) ---
router.post('/buyback', buyFromCustomer); // POST /api/customers/buyback

module.exports = router;