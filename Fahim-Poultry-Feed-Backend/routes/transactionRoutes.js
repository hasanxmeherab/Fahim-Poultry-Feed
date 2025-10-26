const express = require('express');
const router = express.Router();
const {
    getTransactions,
    getTransactionsByBatch,
    getTransactionsForBuyer,
    getTransactionById 
} = require('../controllers/transactionController');
const firebaseAuthMiddleware = require('../middleware/firebaseAuthMiddleware');

// Apply auth middleware to all transaction routes
router.use(firebaseAuthMiddleware);

// --- Existing routes ---
router.get('/', getTransactions); // Get all transactions (paginated, date range)
router.get('/batch/:batchId', getTransactionsByBatch); // Get transactions for a batch
router.get('/wholesale-buyer/:buyerId', getTransactionsForBuyer); // Get transactions for a buyer

// --- NEW ROUTE ---
// Get a single transaction by its ID (for receipts)
// Ensure parameter name ':id' doesn't conflict if other specific routes use parameters
router.get('/:id', getTransactionById);
// --- END NEW ROUTE ---

module.exports = router;