const express = require('express');
const router = express.Router();
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
const requireRole = require('../middleware/requireRole');
const { createProductRules, updateProductRules, stockUpdateRules } = require('../validation/product.validation.js');
const { validate } = require('../validation/shared.validation.js');

// --- Define Role Checks ---
const requireViewer = requireRole('viewer'); // Read access
const requireOperator = requireRole('operator');   // Operational/Write access
// --- End Role Checks ---

// Apply auth middleware to all product routes first
router.use(firebaseAuthMiddleware);

// --- Collection Routes ---
router.route('/')
    .get(requireViewer, getProducts)    // Viewer or higher can list
    .post(requireOperator, createProductRules(), validate, createProduct); // Operator or Admin can create

// Check SKU endpoint (needs viewer access minimum)
router.get('/check-sku', requireViewer, checkSkuExists);

// --- Single Product Routes ---
router.route('/:id')
    .get(requireViewer, getProduct)     // Viewer or higher can view detail
    .patch(requireOperator, updateProductRules(), validate, updateProduct) // Operator or Admin can edit
    .delete(requireOperator, deleteProduct); // Operator or Admin can delete

// --- Stock Management Routes (Operator or Admin only) ---
router.patch('/:id/addstock', requireOperator, stockUpdateRules(), validate, addStock);
router.patch('/:id/removestock', requireOperator, stockUpdateRules(), validate, removeStock);

module.exports = router;