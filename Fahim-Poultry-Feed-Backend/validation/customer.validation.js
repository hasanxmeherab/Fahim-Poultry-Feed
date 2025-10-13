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
  validate,
};