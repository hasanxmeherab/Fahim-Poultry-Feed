const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Import all the functions from the controller
const {
     getBuyers,
     getBuyerById,
     createBuyer,
     updateBuyer,
     deleteBuyer,
     addDepositToBuyer,
     makeWithdrawalFromBuyer
} = require('../controllers/wholesaleBuyerController');

// Routes for the base URL (/api/wholesale-buyers)
router.route('/')
     .get(protect, getBuyers)
     .post(protect, createBuyer);

// Routes for a specific buyer by ID (/api/wholesale-buyers/:id)
router.route('/:id')
     .get(protect, getBuyerById)
     .patch(protect, updateBuyer)
     .delete(protect, deleteBuyer);

// Routes for financial transactions
router.patch('/:id/deposit', protect, addDepositToBuyer);
router.patch('/:id/withdrawal', protect, makeWithdrawalFromBuyer);

module.exports = router;