const express = require('express');
const router = express.Router();
const {
    getProducts,
    createProduct,
    getProductById,
    updateProduct,
    deleteProduct  
} = require('../controllers/wholesaleProductController');
const  firebaseAuthMiddleware  = require('../middleware/firebaseAuthMiddleware');

const { createWholesaleProductRules, updateWholesaleProductRules, validate } = require('../validation/customer.validation.js');

// Routes for the collection
router.route('/')
    .get(firebaseAuthMiddleware, getProducts)
    .post(firebaseAuthMiddleware, createWholesaleProductRules(), validate, createProduct);

// Routes for a single document by ID
router.route('/:id')
    .get(firebaseAuthMiddleware, getProductById)
    .patch(firebaseAuthMiddleware, updateWholesaleProductRules(), validate, updateProduct)
    .delete(firebaseAuthMiddleware, deleteProduct); 

module.exports = router;