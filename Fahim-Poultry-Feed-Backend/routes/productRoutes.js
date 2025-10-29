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

// --- Define Role Checks ---
const requireViewer = requireRole('viewer'); // Read access
const requireClerk = requireRole('clerk');   // Operational/Write access
// --- End Role Checks ---

// Apply auth middleware to all product routes first
router.use(firebaseAuthMiddleware);

// --- Collection Routes ---
router.route('/')
    .get(requireViewer, getProducts)    // Viewer or higher can list
    .post(requireClerk, createProduct); // Clerk or Admin can create

// Check SKU endpoint (needs viewer access minimum)
router.get('/check-sku', requireViewer, checkSkuExists);

// --- Single Product Routes ---
router.route('/:id')
    .get(requireViewer, getProduct)     // Viewer or higher can view detail
    .patch(requireClerk, updateProduct) // Clerk or Admin can edit
    .delete(requireClerk, deleteProduct); // Clerk or Admin can delete

// --- Stock Management Routes (Clerk or Admin only) ---
router.patch('/:id/addstock', requireClerk, addStock);
router.patch('/:id/removestock', requireClerk, removeStock);

module.exports = router;