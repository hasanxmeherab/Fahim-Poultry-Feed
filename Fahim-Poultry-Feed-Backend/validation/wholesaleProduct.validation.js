const { body } = require('express-validator');

const createWholesaleProductRules = () => [
  body('name').trim().notEmpty().withMessage('Product name is required.'),
  // Add uniqueness check at controller/model level if needed
];

const updateWholesaleProductRules = () => [
  body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty.'),
];

module.exports = {
  createWholesaleProductRules,
  updateWholesaleProductRules,
};