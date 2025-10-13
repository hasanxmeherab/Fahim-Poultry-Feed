const express = require('express');
const {
  checkSkuExists,
  getProducts,
  getProduct,
  createProduct,
  addStock,
  removeStock,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const firebaseAuthMiddleware = require('../middleware/firebaseAuthMiddleware');

// Import all necessary validation rules from your validation file
const { 
  createProductRules, 
  updateProductRules, 
  stockUpdateRules, 
  validate 
} = require('../validation/customer.validation.js');

const router = express.Router();

// --- Routes for the collection ---
router.route('/')
    .get(firebaseAuthMiddleware, getProducts)
    .post(firebaseAuthMiddleware, createProductRules(), validate, createProduct);

// --- Route for checking if a SKU exists ---
router.get('/check-sku', firebaseAuthMiddleware, checkSkuExists);

// --- Routes for a single document by ID ---
router.route('/:id')
    .get(firebaseAuthMiddleware, getProduct)
    // THIS IS THE CORRECTED AND ONLY PATCH ROUTE FOR /:id
    .patch(firebaseAuthMiddleware, updateProductRules(), validate, updateProduct)
    .delete(firebaseAuthMiddleware, deleteProduct);

// --- Routes for managing stock ---
router.patch('/:id/addstock', firebaseAuthMiddleware, stockUpdateRules(), validate, addStock);
router.patch('/:id/removestock', firebaseAuthMiddleware, stockUpdateRules(), validate, removeStock);

module.exports = router;