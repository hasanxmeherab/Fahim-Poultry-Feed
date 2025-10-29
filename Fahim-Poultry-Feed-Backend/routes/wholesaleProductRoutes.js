const express = require('express');
const router = express.Router();
const {
    getProducts,
    createProduct,
    getProductById,
    updateProduct,
    deleteProduct
} = require('../controllers/wholesaleProductController');
const firebaseAuthMiddleware = require('../middleware/firebaseAuthMiddleware');
const requireRole = require('../middleware/requireRole');
const { createWholesaleProductRules, updateWholesaleProductRules } = require('../validation/wholesaleProduct.validation.js');
const { validate } = require('../validation/shared.validation.js');

// --- Define Role Checks ---
const requireViewer = requireRole('viewer');
const requireOperator = requireRole('operator');
// --- End Role Checks ---

// Apply auth middleware to all routes first
router.use(firebaseAuthMiddleware);

// Routes for the collection
router.route('/')
    .get(requireViewer, getProducts)   // Viewer or higher can list
    .post(requireOperator, createWholesaleProductRules(), validate, createProduct); // Operator or Admin can create

// Routes for a single document by ID
router.route('/:id')
    .get(requireViewer, getProductById) // Viewer or higher can view detail
    .patch(requireOperator, updateWholesaleProductRules(), validate, updateProduct)  // Operator or Admin can edit
    .delete(requireOperator, deleteProduct); // Operator or Admin can delete

module.exports = router;