const { body, param } = require('express-validator');

// Example rule for adding a discount (adjust based on your needs)
const addDiscountRules = () => [
    param('id').isMongoId().withMessage('Invalid Batch ID in URL.'), // Validate batch ID from URL param
    body('description').trim().notEmpty().withMessage('Discount description is required.'),
    body('amount').isFloat({ gt: 0 }).withMessage('Discount amount must be a positive number.'),
];

// Example rule for removing a discount
const removeDiscountRules = () => [
    param('id').isMongoId().withMessage('Invalid Batch ID in URL.'),
    param('discountId').isMongoId().withMessage('Invalid Discount ID in URL.'),
];

 // Example rule for buy back and end batch
const buyBackAndEndBatchRules = () => [
    param('id').isMongoId().withMessage('Invalid Batch ID in URL.'),
    body('quantity').isInt({ gt: 0 }).withMessage('Quantity must be a positive whole number.'),
    body('weight').isFloat({ gt: 0 }).withMessage('Weight must be a positive number.'),
    body('pricePerKg').isFloat({ gt: 0 }).withMessage('Price per Kg must be a positive number.'),
];


module.exports = {
   addDiscountRules,
   removeDiscountRules,
   buyBackAndEndBatchRules
  // Add other batch-related validation rules here as needed
};