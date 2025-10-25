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

    // --- UPDATED IMPORTS ---
    const {
        createCustomerRules,
        updateCustomerRules,
        amountRules, // Import amount rules
        buyBackRules // Import buy back rules
     } = require('../validation/customer.validation.js'); // Specific customer rules
    const { validate } = require('../validation/shared.validation.js'); // Shared validate helper
    // --- END UPDATED IMPORTS ---

    const router = express.Router();

    // Apply auth middleware to all customer routes
    router.use(firebaseAuthMiddleware);

    // --- Routes for the customer collection (/api/customers) ---
    router.route('/')
        .get(getCustomers)
        .post(createCustomerRules(), validate, createCustomer); // Added validation

    // --- Routes for a single customer by ID (/api/customers/:id) ---
    router.route('/:id')
        .get(getCustomer)
        .patch(updateCustomerRules(), validate, updateCustomer) // Added validation
        .delete(deleteCustomer); // Add validation if needed (e.g., param('id').isMongoId())

    // --- Routes for specific financial actions ---
    // Added amount validation
    router.patch('/:id/deposit', amountRules(), validate, addDeposit);
    router.patch('/:id/withdrawal', amountRules(), validate, makeWithdrawal);

    // --- Route for buy back action ---
    // Added buy back validation
    router.post('/buyback', buyBackRules(), validate, buyFromCustomer);

    module.exports = router;
    
