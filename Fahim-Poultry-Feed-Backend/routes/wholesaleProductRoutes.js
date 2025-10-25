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

    // --- UPDATED IMPORTS ---
    const {
        createWholesaleProductRules,
        updateWholesaleProductRules
    } = require('../validation/wholesaleProduct.validation.js'); // Import from new file
    const { validate } = require('../validation/shared.validation.js'); // Import validate helper
    // --- END UPDATED IMPORTS ---

    // Apply auth middleware
    router.use(firebaseAuthMiddleware);

    // Routes for the collection
    router.route('/')
        .get(getProducts)
        .post(createWholesaleProductRules(), validate, createProduct); // Added validation

    // Routes for a single document by ID
    router.route('/:id')
        .get(getProductById) // Add validation if needed (e.g., param('id').isMongoId())
        .patch(updateWholesaleProductRules(), validate, updateProduct) // Added validation
        .delete(deleteProduct); // Add validation if needed

    module.exports = router;
    
