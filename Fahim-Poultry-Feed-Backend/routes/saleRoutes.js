const express = require('express');
const router = express.Router();
const { createSale, getSales, createWholesaleSale } = require('../controllers/saleController');
const firebaseAuthMiddleware = require('../middleware/firebaseAuthMiddleware');

// Import the new validation rules
const { createSaleRules, createWholesaleSaleRules, validate } = require('../validation/customer.validation.js');

// Apply validation to the POST route for regular sales
router.route('/')
    .get(firebaseAuthMiddleware, getSales)
    .post(firebaseAuthMiddleware, createSaleRules(), validate, createSale);

// Apply validation to the POST route for wholesale sales
router.post('/wholesale', firebaseAuthMiddleware, createWholesaleSaleRules(), validate, createWholesaleSale);

module.exports = router;