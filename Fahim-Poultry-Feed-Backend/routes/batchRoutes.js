const express = require('express');
const router = express.Router();
const { 
    startNewBatch, 
    getBatchesForCustomer, 
    buyBackAndEndBatch,
    addDiscount,       
    removeDiscount   
} = require('../controllers/batchController');
const  firebaseAuthMiddleware  = require('../middleware/firebaseAuthMiddleware');

router.post('/start', firebaseAuthMiddleware, startNewBatch);
router.get('/customer/:id', firebaseAuthMiddleware, getBatchesForCustomer);
router.patch('/:id/buyback', firebaseAuthMiddleware, buyBackAndEndBatch);
router.post('/:id/discount', firebaseAuthMiddleware, addDiscount);
router.delete('/:id/discount/:discountId', firebaseAuthMiddleware, removeDiscount);


module.exports = router;