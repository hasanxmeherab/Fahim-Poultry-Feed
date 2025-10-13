const express = require('express');
const router = express.Router();
const  firebaseAuthMiddleware  = require('../middleware/firebaseAuthMiddleware');

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
     .get(firebaseAuthMiddleware, getBuyers)
     .post(firebaseAuthMiddleware, createBuyer);

// Routes for a specific buyer by ID (/api/wholesale-buyers/:id)
router.route('/:id')
     .get(firebaseAuthMiddleware, getBuyerById)
     .patch(firebaseAuthMiddleware, updateBuyer)
     .delete(firebaseAuthMiddleware, deleteBuyer);

// Routes for financial transactions
router.patch('/:id/deposit', firebaseAuthMiddleware, addDepositToBuyer);
router.patch('/:id/withdrawal', firebaseAuthMiddleware, makeWithdrawalFromBuyer);

module.exports = router;