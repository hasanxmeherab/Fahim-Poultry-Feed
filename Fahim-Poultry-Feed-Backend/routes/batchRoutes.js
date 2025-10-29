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
const requireRole = require('../middleware/requireRole');
const { addDiscountRules, removeDiscountRules, buyBackAndEndBatchRules } = require('../validation/batch.validation.js');
const { validate } = require('../validation/shared.validation.js');

// --- Define Role Checks ---
const requireViewer = requireRole('viewer');
const requireOperator = requireRole('operator');
// --- End Role Checks ---

// Apply auth middleware to all batch routes first
router.use(firebaseAuthMiddleware);

// Viewing batches (Viewer or higher)
router.get('/customer/:id', requireViewer, getBatchesForCustomer);

// Operational actions (Operator or Admin only)
router.post('/start', requireOperator, startNewBatch);
router.patch('/:id/buyback', requireOperator, buyBackAndEndBatchRules(), validate, buyBackAndEndBatch); // Secured deprecated route

// Discount management (Operator or Admin only)
router.post('/:id/discount', requireOperator, addDiscountRules(), validate, addDiscount);
router.delete('/:id/discount/:discountId', requireOperator, removeDiscountRules(), validate, removeDiscount);

module.exports = router;