const { validationResult } = require('express-validator');

// Helper function for validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next(); // Proceed if no errors
  }

  // Format errors for a consistent response
  const extractedErrors = [];
  errors.array().map(err => {
    // Handle nested errors (like in items arrays)
    const path = err.path || (err.param || 'unknown_param'); // Use err.param as fallback
    extractedErrors.push({ [path]: err.msg });
  });


  // Send a 400 Bad Request response with the validation errors
  return res.status(400).json({
    message: 'Validation failed. Please check your input.',
    errors: extractedErrors,
  });
};

module.exports = { validate };