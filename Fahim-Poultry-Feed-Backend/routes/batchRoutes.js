const express = require('express');
const router = express.Router();
const { 
    startNewBatch, 
    getBatchesForCustomer, 
    buyBackAndEndBatch,
    addDiscount,       
    removeDiscount   
} = require('../controllers/batchController');
const { protect } = require('../middleware/authMiddleware');

router.post('/start', protect, startNewBatch);
router.get('/customer/:id', protect, getBatchesForCustomer);
router.patch('/:id/buyback', protect, buyBackAndEndBatch);
router.post('/:id/discount', protect, addDiscount);
router.delete('/:id/discount/:discountId', protect, removeDiscount);


module.exports = router;