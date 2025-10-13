const express = require('express');
const router = express.Router();
const firebaseAuthMiddleware = require('../middleware/firebaseAuthMiddleware');

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

const { createWholesaleBuyerRules, updateWholesaleBuyerRules, validate } = require('../validation/customer.validation.js');

// Routes for the base URL (/api/wholesale-buyers)
router.route('/')
     .get(firebaseAuthMiddleware, getBuyers)
     // THIS IS THE CORRECTED LINE:
     .post(firebaseAuthMiddleware, createWholesaleBuyerRules(), validate, createBuyer);

// Routes for a specific buyer by ID (/api/wholesale-buyers/:id)
router.route('/:id')
     .get(firebaseAuthMiddleware, getBuyerById)
     .patch(firebaseAuthMiddleware, updateWholesaleBuyerRules(), validate, updateBuyer)
     .delete(firebaseAuthMiddleware, deleteBuyer);

// Routes for financial transactions
router.patch('/:id/deposit', firebaseAuthMiddleware, addDepositToBuyer);
router.patch('/:id/withdrawal', firebaseAuthMiddleware, makeWithdrawalFromBuyer);

module.exports = router;