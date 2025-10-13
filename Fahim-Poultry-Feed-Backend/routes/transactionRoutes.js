const express = require('express');
const router = express.Router();
const { getTransactions, getTransactionsByBatch, getTransactionsForBuyer } = require('../controllers/transactionController');
const firebaseAuthMiddleware = require('../middleware/firebaseAuthMiddleware');

router.get('/', firebaseAuthMiddleware, getTransactions);
router.get('/batch/:batchId', firebaseAuthMiddleware, getTransactionsByBatch);
router.get('/wholesale-buyer/:buyerId', firebaseAuthMiddleware, getTransactionsForBuyer);

module.exports = router;
