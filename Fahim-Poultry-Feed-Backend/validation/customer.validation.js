const { body } = require('express-validator');

const createCustomerRules = () => [
  body('name').trim().notEmpty().withMessage('Customer name is required.'),
  body('phone').trim().notEmpty().withMessage('Phone number is required.')
    // Add more specific phone validation if needed (e.g., length, digits only)
    .isMobilePhone('bn-BD').withMessage('Please enter a valid Bangladesh mobile number.'), // Example for BD
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Please enter a valid email address.'),
  body('address').optional({ checkFalsy: true }).trim(),
];

const updateCustomerRules = () => [
  body('name').trim().notEmpty().withMessage('Customer name cannot be empty.'),
  body('phone').trim().notEmpty().withMessage('Phone number cannot be empty.')
    .isMobilePhone('bn-BD').withMessage('Please enter a valid Bangladesh mobile number.'), // Example for BD
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Please enter a valid email address.'),
  body('address').optional({ checkFalsy: true }).trim(),
];

// Rules for Deposit/Withdrawal amounts (can be used in routes if needed)
const amountRules = () => [
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number.'),
];

 // Rules for Buy Back from customer
const buyBackRules = () => [
    body('customerId').isMongoId().withMessage('Invalid Customer ID.'),
    body('quantity').isInt({ gt: 0 }).withMessage('Quantity must be a positive whole number.'),
    body('weight').isFloat({ gt: 0 }).withMessage('Weight must be a positive number.'),
    body('pricePerKg').isFloat({ gt: 0 }).withMessage('Price per Kg must be a positive number.'),
    body('referenceName').optional().trim().escape(),
];


module.exports = {
  createCustomerRules,
  updateCustomerRules,
  amountRules, // Export if you apply validation directly on deposit/withdrawal routes
  buyBackRules, // Export for the buyback route
};