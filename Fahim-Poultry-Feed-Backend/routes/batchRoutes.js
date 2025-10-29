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

// --- Define Role Checks ---
const requireViewer = requireRole('viewer');
const requireClerk = requireRole('clerk');
// --- End Role Checks ---

// Apply auth middleware to all batch routes first
router.use(firebaseAuthMiddleware);

// Viewing batches (Viewer or higher)
router.get('/customer/:id', requireViewer, getBatchesForCustomer);

// Operational actions (Clerk or Admin only)
router.post('/start', requireClerk, startNewBatch);
router.patch('/:id/buyback', requireClerk, buyBackAndEndBatch); // Deprecated but secured

// Discount management (Clerk or Admin only)
router.post('/:id/discount', requireClerk, addDiscount);
router.delete('/:id/discount/:discountId', requireClerk, removeDiscount);

module.exports = router;