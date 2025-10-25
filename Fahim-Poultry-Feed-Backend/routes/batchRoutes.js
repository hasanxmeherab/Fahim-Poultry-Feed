    const express = require('express');
    const router = express.Router();
    const {
        startNewBatch,
        getBatchesForCustomer,
        buyBackAndEndBatch,
        addDiscount,
        removeDiscount
    } = require('../controllers/batchController');
    const firebaseAuthMiddleware = require('../middleware/firebaseAuthMiddleware');

    // --- IMPORTS FOR VALIDATION ---
    const {
        addDiscountRules,
        removeDiscountRules,
        buyBackAndEndBatchRules
     } = require('../validation/batch.validation.js'); // Import batch rules
    const { validate } = require('../validation/shared.validation.js'); // Import validate helper
    // --- END IMPORTS FOR VALIDATION ---

    // Apply auth middleware to all batch routes
    router.use(firebaseAuthMiddleware);

    // No specific validation needed for startNewBatch (relies on customerId from body, could add body('customerId').isMongoId() if desired)
    router.post('/start', startNewBatch);

    // Add validation for customer ID param if needed
    router.get('/customer/:id', getBatchesForCustomer);

    // Add validation for buyBackAndEndBatch
    router.patch('/:id/buyback', buyBackAndEndBatchRules(), validate, buyBackAndEndBatch);

    // Add validation for adding discount
    router.post('/:id/discount', addDiscountRules(), validate, addDiscount);

    // Add validation for removing discount
    router.delete('/:id/discount/:discountId', removeDiscountRules(), validate, removeDiscount);


    module.exports = router;
    
