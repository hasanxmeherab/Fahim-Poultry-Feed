const express = require('express');
const router = express.Router();

const {
    createSale,
    getSales,
    createWholesaleSale
} = require('../controllers/saleController');
const { firebaseAuthMiddleware } = require('../middleware/authMiddleware');

// Routes for the base /api/sales URL
router.route('/')
    .get(firebaseAuthMiddleware, getSales)      // Handles GET /api/sales
    .post(firebaseAuthMiddleware, createSale);    // Handles POST /api/sales

// Route specifically for a new WHOLESALE sale
router.post('/wholesale', firebaseAuthMiddleware, createWholesaleSale); // Handles POST /api/sales/wholesale

module.exports = router;