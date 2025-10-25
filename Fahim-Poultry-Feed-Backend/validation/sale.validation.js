const { body } = require('express-validator');

const createSaleRules = () => [
  // Customer validation conditional on isRandomCustomer flag
  body('customerId')
    .if(body('isRandomCustomer').equals('false')) // Only validate if not a random customer
    .isMongoId().withMessage('A valid customer ID is required for credit/customer sales.'),

  body('isRandomCustomer').isBoolean().withMessage('isRandomCustomer must be true or false.'),
  body('isCashPayment').isBoolean().withMessage('isCashPayment must be true or false.'),

  // Validate random customer name only if it's a random customer sale
  body('randomCustomerName')
    .if(body('isRandomCustomer').equals('true'))
    .optional({ checkFalsy: true }).trim().escape(), // Optional, but trim if provided

  // Items array validation
  body('items').isArray({ min: 1 }).withMessage('At least one item is required in the sale.'),
  body('items.*.productId').isMongoId().withMessage('Each item must have a valid product ID.'),
  body('items.*.quantity').isInt({ gt: 0 }).withMessage('Item quantity must be a positive whole number.'),
];

const createWholesaleSaleRules = () => [
    body('wholesaleBuyerId').isMongoId().withMessage('A valid wholesale buyer ID is required.'),
    body('isCashPayment').isBoolean().withMessage('isCashPayment must be true or false.'),

    // Wholesale items validation
    body('items').isArray({ min: 1 }).withMessage('At least one item is required in the wholesale sale.'),
    body('items.*.name').trim().notEmpty().withMessage('Each wholesale item must have a name.'),
    // Allow quantity and weight to be optional or 0, but price must be positive
    body('items.*.quantity').optional().isInt({ gt: -1 }).withMessage('Item quantity must be a non-negative whole number.'),
    body('items.*.weight').optional().isFloat({ gt: -1 }).withMessage('Item weight must be a non-negative number.'),
    body('items.*.price').isFloat({ gt: 0 }).withMessage('Each item\'s total price must be a positive number.'), // Price here likely means total price for that line item
];

module.exports = {
  createSaleRules,
  createWholesaleSaleRules,
};