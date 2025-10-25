    const express = require('express');
    const router = express.Router();
    const firebaseAuthMiddleware = require('../middleware/firebaseAuthMiddleware');

    const {
        getBuyers,
        getBuyerById,
        createBuyer,
        updateBuyer,
        deleteBuyer,
        addDepositToBuyer,
        makeWithdrawalFromBuyer
    } = require('../controllers/wholesaleBuyerController');

    // --- UPDATED IMPORTS ---
    const {
        createWholesaleBuyerRules,
        updateWholesaleBuyerRules,
        amountRules // Import amount rules
    } = require('../validation/wholesaleBuyer.validation.js'); // Import from new file
    const { validate } = require('../validation/shared.validation.js'); // Import validate helper
    // --- END UPDATED IMPORTS ---

    // Apply auth middleware to all routes
    router.use(firebaseAuthMiddleware);

    // Routes for the collection
    router.route('/')
        .get(getBuyers)
        .post(createWholesaleBuyerRules(), validate, createBuyer); // Added validation

    // Routes for a specific buyer by ID
    router.route('/:id')
        .get(getBuyerById) // Add validation if needed (e.g., param('id').isMongoId())
        .patch(updateWholesaleBuyerRules(), validate, updateBuyer) // Added validation
        .delete(deleteBuyer); // Add validation if needed

    // Routes for financial transactions
    // Added amount validation
    router.patch('/:id/deposit', amountRules(), validate, addDepositToBuyer);
    router.patch('/:id/withdrawal', amountRules(), validate, makeWithdrawalFromBuyer);

    module.exports = router;
    
