const express = require('express');
const router = express.Router();
const {
    getTransactions,
    getTransactionsByBatch,
    getTransactionsForBuyer,
    getTransactionById 
} = require('../controllers/transactionController');
const firebaseAuthMiddleware = require('../middleware/firebaseAuthMiddleware');
const requireRole = require('../middleware/requireRole'); 

// --- DEFINE Role Check ---
const requireViewer = requireRole('viewer'); // Read access for Viewers, Clerks, and Admins
// --- End Role Check ---

// Apply auth middleware to all transaction routes first
router.use(firebaseAuthMiddleware);

// All GET routes require 'viewer' role or higher
router.get('/', requireViewer, getTransactions); // Get all transactions (paginated, date range)
router.get('/batch/:batchId', requireViewer, getTransactionsByBatch); // Get transactions for a batch
router.get('/wholesale-buyer/:buyerId', requireViewer, getTransactionsForBuyer); // Get transactions for a buyer
router.get('/:id', requireViewer, getTransactionById); // Get a single transaction by its ID (for receipts)

module.exports = router;