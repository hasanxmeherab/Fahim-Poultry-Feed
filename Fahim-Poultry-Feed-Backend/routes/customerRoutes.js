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
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Route to get all customers
router.get('/', protect, getCustomers);

// Route to create a new customer
router.post('/', protect, createCustomer);

// Route to add a deposit for a specific customer
router.patch('/:id/deposit', protect, addDeposit);

//Make Withdrawal
router.patch('/:id/withdrawal', protect, makeWithdrawal);

//Delete Customer
router.delete('/:id', protect, deleteCustomer);

//Update Customer
router.patch('/:id', protect, updateCustomer);

router.get('/:id', protect, getCustomer);

//buying from a customer
router.post('/buyback', protect, buyFromCustomer);

module.exports = router;