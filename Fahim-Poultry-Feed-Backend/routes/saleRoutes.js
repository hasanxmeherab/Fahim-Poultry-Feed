    const express = require('express');
    const router = express.Router();
    const { createSale, getSales, createWholesaleSale } = require('../controllers/saleController');
    const firebaseAuthMiddleware = require('../middleware/firebaseAuthMiddleware');

    // --- UPDATED IMPORTS ---
    const {
        createSaleRules,
        createWholesaleSaleRules
    } = require('../validation/sale.validation.js'); // Import from new file
    const { validate } = require('../validation/shared.validation.js'); // Import validate helper
    // --- END UPDATED IMPORTS ---

    // Apply validation to the POST route for regular sales
    router.route('/')
        .get(firebaseAuthMiddleware, getSales)
        .post(firebaseAuthMiddleware, createSaleRules(), validate, createSale);

    // Apply validation to the POST route for wholesale sales
    router.post('/wholesale', firebaseAuthMiddleware, createWholesaleSaleRules(), validate, createWholesaleSale);

    module.exports = router;
    
