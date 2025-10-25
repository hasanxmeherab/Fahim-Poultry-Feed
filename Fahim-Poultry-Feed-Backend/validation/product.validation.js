const { body } = require('express-validator');

const createProductRules = () => [
  body('name').trim().notEmpty().withMessage('Product name is required.'),
  body('sku').trim().notEmpty().withMessage('SKU is required.'),
  body('price').isFloat({ gt: 0 }).withMessage('Price must be a number greater than 0.'),
  body('quantity').isInt({ gt: -1 }).withMessage('Quantity must be a whole number (0 or more).'), // Allow 0
];

const updateProductRules = () => [
  body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty.'),
  body('sku').optional().trim().notEmpty().withMessage('SKU cannot be empty.'),
  body('price').optional().isFloat({ gt: 0 }).withMessage('Price must be a number greater than 0.'),
  // Quantity is typically handled by add/remove stock routes, not general update
];

// Combined rule for adding or removing stock
const stockUpdateRules = () => [
  body().custom((value, { req }) => {
    const { addQuantity, removeQuantity } = req.body;
    const addQty = addQuantity !== undefined ? Number(addQuantity) : undefined;
    const removeQty = removeQuantity !== undefined ? Number(removeQuantity) : undefined;

    if (addQty === undefined && removeQty === undefined) {
      throw new Error('Either addQuantity or removeQuantity must be provided.');
    }
    if (addQty !== undefined && removeQty !== undefined) {
      throw new Error('Provide either addQuantity or removeQuantity, not both.');
    }

    if (addQty !== undefined && (!Number.isInteger(addQty) || addQty <= 0)) {
      throw new Error('Quantity to add must be a positive whole number.');
    }
    if (removeQty !== undefined && (!Number.isInteger(removeQty) || removeQty <= 0)) {
      throw new Error('Quantity to remove must be a positive whole number.');
    }
    return true;
  }),
];

module.exports = {
  createProductRules,
  updateProductRules,
  stockUpdateRules,
};