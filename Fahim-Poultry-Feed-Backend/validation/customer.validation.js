const { body, validationResult } = require('express-validator');

// --- Helper function for validation results ---
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors = [];
  errors.array().map(err => extractedErrors.push({ [err.path]: err.msg }));

  return res.status(400).json({
    errors: extractedErrors,
  });
};

// --- Rule Sets ---

const createCustomerRules = () => [
  body('name').trim().notEmpty().withMessage('Customer name is required.'),
  body('phone').trim().notEmpty().withMessage('Phone number is required.'),
];

const updateCustomerRules = () => [
  body('name').trim().notEmpty().withMessage('Customer name cannot be empty.'),
  body('phone').trim().notEmpty().withMessage('Phone number cannot be empty.'),
];

const createProductRules = () => [
  body('name').trim().notEmpty().withMessage('Product name is required.'),
  body('sku').trim().notEmpty().withMessage('SKU is required.'),
  body('price').isFloat({ gt: 0 }).withMessage('Price must be a number greater than 0.'),
  body('quantity').isInt({ gt: -1 }).withMessage('Quantity must be a whole number (0 or more).'),
];

const updateProductRules = () => [
  body('name').trim().notEmpty().withMessage('Product name cannot be empty.'),
  body('sku').trim().notEmpty().withMessage('SKU cannot be empty.'),
  body('price').isFloat({ gt: 0 }).withMessage('Price must be a number greater than 0.'),
];

const stockUpdateRules = () => [
  body('addQuantity').optional().isInt({ gt: 0 }).withMessage('Quantity to add must be a positive whole number.'),
  body('removeQuantity').optional().isInt({ gt: 0 }).withMessage('Quantity to remove must be a positive whole number.'),
];

const createSaleRules = () => [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required in the sale.'),
  body('items.*.productId').isMongoId().withMessage('Each item must have a valid product ID.'),
  body('items.*.quantity').isInt({ gt: 0 }).withMessage('Item quantity must be a positive whole number.'),
  body('customerId').if(body('isRandomCustomer').equals('false')).isMongoId().withMessage('A valid customer ID is required for credit sales.'),
  body('isCashPayment').isBoolean().withMessage('isCashPayment must be a boolean value.'),
];

const createWholesaleSaleRules = () => [
    body('wholesaleBuyerId').isMongoId().withMessage('A valid buyer ID is required.'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required in the sale.'),
    body('items.*.name').trim().notEmpty().withMessage('Each wholesale item must have a name.'),
    body('items.*.price').isFloat({ gt: 0 }).withMessage('Each item price must be a positive number.'),
    body('isCashPayment').isBoolean().withMessage('isCashPayment must be a boolean value.'),
];

const createWholesaleBuyerRules = () => [
  body('name').trim().notEmpty().withMessage('Contact name is required.'),
  body('phone').trim().notEmpty().withMessage('Phone number is required.'),
];

const updateWholesaleBuyerRules = () => [
  body('name').trim().notEmpty().withMessage('Contact name cannot be empty.'),
  body('phone').trim().notEmpty().withMessage('Phone number cannot be empty.'),
];

const createWholesaleProductRules = () => [
  body('name').trim().notEmpty().withMessage('Product name is required.'),
];

const updateWholesaleProductRules = () => [
  body('name').trim().notEmpty().withMessage('Product name cannot be empty.'),
];


module.exports = {
  validate,
  createCustomerRules,
  updateCustomerRules,
  createProductRules,
  updateProductRules,
  stockUpdateRules,
  createSaleRules,
  createWholesaleSaleRules,
  createWholesaleBuyerRules,
  updateWholesaleBuyerRules,
  createWholesaleProductRules,
  updateWholesaleProductRules,
};