const { body } = require('express-validator');

const createWholesaleBuyerRules = () => [
  body('name').trim().notEmpty().withMessage('Contact name is required.'),
  body('phone').trim().notEmpty().withMessage('Phone number is required.')
    .isMobilePhone('bn-BD').withMessage('Please enter a valid Bangladesh mobile number.'), // Example
  body('businessName').optional({ checkFalsy: true }).trim(),
  body('address').optional({ checkFalsy: true }).trim(),
];

const updateWholesaleBuyerRules = () => [
  body('name').optional().trim().notEmpty().withMessage('Contact name cannot be empty.'),
  body('phone').optional().trim().notEmpty().withMessage('Phone number cannot be empty.')
    .isMobilePhone('bn-BD').withMessage('Please enter a valid Bangladesh mobile number.'), // Example
  body('businessName').optional({ checkFalsy: true }).trim(),
  body('address').optional({ checkFalsy: true }).trim(),
];

// Re-use amount rules if needed, or define specific ones
const amountRules = () => [
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number.'),
];


module.exports = {
  createWholesaleBuyerRules,
  updateWholesaleBuyerRules,
  amountRules, // Export if applying validation to deposit/withdrawal routes
};