const express = require('express');
// Make sure to import addDeposit here
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
const  firebaseAuthMiddleware  = require('../middleware/firebaseAuthMiddleware');

const router = express.Router();

// Route to get all customers
router.get('/', firebaseAuthMiddleware, getCustomers);

// Route to create a new customer
router.post('/', firebaseAuthMiddleware, createCustomer);

// Route to add a deposit for a specific customer
router.patch('/:id/deposit', firebaseAuthMiddleware, addDeposit);

//Make Withdrawal
router.patch('/:id/withdrawal', firebaseAuthMiddleware, makeWithdrawal);

//Delete Customer
router.delete('/:id', firebaseAuthMiddleware, deleteCustomer);

//Update Customer
router.patch('/:id', firebaseAuthMiddleware, updateCustomer);

router.get('/:id', firebaseAuthMiddleware, getCustomer);

//buying from a customer
router.post('/buyback', firebaseAuthMiddleware, buyFromCustomer);

module.exports = router;