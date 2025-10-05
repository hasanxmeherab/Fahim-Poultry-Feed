const express = require('express');
const router = express.Router();
const { getTransactions, getTransactionsByBatch, getTransactionsForBuyer } = require('../controllers/transactionController');const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getTransactions);
router.get('/batch/:batchId', protect, getTransactionsByBatch);
router.get('/wholesale-buyer/:buyerId', protect, getTransactionsForBuyer);

module.exports = router;