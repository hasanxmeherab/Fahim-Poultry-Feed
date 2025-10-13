const { body, validationResult } = require('express-validator');

const createCustomerRules = () => {
  return [
    body('name').trim().notEmpty().withMessage('Customer name is required.'),
    body('phone').trim().notEmpty().withMessage('Phone number is required.'),
  ];
};

const createProductRules = () => {
  return [
    body('name').trim().notEmpty().withMessage('Product name is required.'),
    body('sku').trim().notEmpty().withMessage('SKU is required.'),
    body('price').isFloat({ gt: 0 }).withMessage('Price must be a number greater than 0.'),
    body('quantity').isInt({ gt: -1 }).withMessage('Quantity must be a whole number (0 or more).'),
  ];
};

const stockUpdateRules = () => {
  return [
    // Checks for either 'addQuantity' or 'removeQuantity' in the request body
    body('addQuantity').optional().isInt({ gt: 0 }).withMessage('Quantity to add must be a positive whole number.'),
    body('removeQuantity').optional().isInt({ gt: 0 }).withMessage('Quantity to remove must be a positive whole number.')
  ];
};

const updateCustomerRules = () => {
  return [
    body('name').trim().notEmpty().withMessage('Customer name cannot be empty.'),
    body('phone').trim().notEmpty().withMessage('Phone number cannot be empty.'),
  ];
};

const updateProductRules = () => {
  return [
    body('name').trim().notEmpty().withMessage('Product name cannot be empty.'),
    body('sku').trim().notEmpty().withMessage('SKU cannot be empty.'),
    body('price').isFloat({ gt: 0 }).withMessage('Price must be a number greater than 0.'),
  ];
};

const updateWholesaleBuyerRules = () => {
  return [
    body('name').trim().notEmpty().withMessage('Contact name cannot be empty.'),
    body('phone').trim().notEmpty().withMessage('Phone number cannot be empty.'),
  ];
};

const createWholesaleBuyerRules = () => {
  return [
    body('name').trim().notEmpty().withMessage('Contact name is required.'),
    body('phone').trim().notEmpty().withMessage('Phone number is required.'),
  ];
};

const createWholesaleProductRules = () => {
  return [
    body('name').trim().notEmpty().withMessage('Product name is required.'),
  ];
};

const updateWholesaleProductRules = () => {
  return [
    body('name').trim().notEmpty().withMessage('Product name cannot be empty.'),
  ];
};

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

module.exports = {
  createCustomerRules,
  createProductRules,
  stockUpdateRules,
  updateCustomerRules,
  updateProductRules,
  updateWholesaleBuyerRules,
  createWholesaleBuyerRules,
  createWholesaleProductRules,
  updateWholesaleProductRules,
  validate,
};