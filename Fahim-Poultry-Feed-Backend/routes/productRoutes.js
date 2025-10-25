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

// --- UPDATED IMPORTS ---
const {
  createProductRules,
  updateProductRules,
  stockUpdateRules,
} = require('../validation/product.validation.js'); // Import from the new file
const { validate } = require('../validation/shared.validation.js'); // Import validate helper
// --- END UPDATED IMPORTS ---

const router = express.Router();

// --- Routes remain the same, using the imported rules and validate ---
router.route('/')
    .get(firebaseAuthMiddleware, getProducts)
    .post(firebaseAuthMiddleware, createProductRules(), validate, createProduct);

router.get('/check-sku', firebaseAuthMiddleware, checkSkuExists);

router.route('/:id')
    .get(firebaseAuthMiddleware, getProduct)
    .patch(firebaseAuthMiddleware, updateProductRules(), validate, updateProduct)
    .delete(firebaseAuthMiddleware, deleteProduct);

router.patch('/:id/addstock', firebaseAuthMiddleware, stockUpdateRules(), validate, addStock);
router.patch('/:id/removestock', firebaseAuthMiddleware, stockUpdateRules(), validate, removeStock);

module.exports = router;