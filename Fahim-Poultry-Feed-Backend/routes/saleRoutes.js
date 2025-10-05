const express = require('express');
const router = express.Router();

const {
    createSale,
    getSales,
    createWholesaleSale
} = require('../controllers/saleController');
const { protect } = require('../middleware/authMiddleware');

// Routes for the base /api/sales URL
router.route('/')
    .get(protect, getSales)      // Handles GET /api/sales
    .post(protect, createSale);    // Handles POST /api/sales

// Route specifically for a new WHOLESALE sale
router.post('/wholesale', protect, createWholesaleSale); // Handles POST /api/sales/wholesale

module.exports = router;