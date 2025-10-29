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

// --- Define Role Checks ---
const requireViewer = requireRole('viewer');
const requireClerk = requireRole('clerk');
// --- End Role Checks ---

// Apply auth middleware to all routes first
router.use(firebaseAuthMiddleware);

// Routes for the collection
router.route('/')
    .get(requireViewer, getProducts)   // Viewer or higher can list
    .post(requireClerk, createProduct); // Clerk or Admin can create

// Routes for a single document by ID
router.route('/:id')
    .get(requireViewer, getProductById) // Viewer or higher can view detail
    .patch(requireClerk, updateProduct)  // Clerk or Admin can edit
    .delete(requireClerk, deleteProduct); // Clerk or Admin can delete

module.exports = router;