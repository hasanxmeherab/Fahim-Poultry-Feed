const express = require('express');
const router = express.Router();
const {
    getProducts,
    createProduct,
    getProductById,
    updateProduct,
    deleteProduct  
} = require('../controllers/wholesaleProductController');
const { protect } = require('../middleware/authMiddleware');

// Routes for the collection
router.route('/')
    .get(protect, getProducts)
    .post(protect, createProduct);

// Routes for a single document by ID
router.route('/:id')
    .get(protect, getProductById)
    .patch(protect, updateProduct)
    .delete(protect, deleteProduct); 

module.exports = router;