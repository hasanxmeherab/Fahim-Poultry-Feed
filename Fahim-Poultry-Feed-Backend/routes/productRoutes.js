const express = require('express');
const {
  checkSkuExists,
  getProducts,
  getProduct,
  createProduct,
  addStock,
  removeStock,
  updateProduct,
  deleteProduct,

} = require('../controllers/productController');
const  firebaseAuthMiddleware  = require('../middleware/firebaseAuthMiddleware');

const router = express.Router();



router.route('/')
    .get(firebaseAuthMiddleware , getProducts)
    .post(firebaseAuthMiddleware , createProduct);

//Check if sku exist
router.get('/check-sku', firebaseAuthMiddleware, checkSkuExists);

router.route('/:id')
    .get(firebaseAuthMiddleware, getProduct)
    .patch(firebaseAuthMiddleware , updateProduct)
    .delete(firebaseAuthMiddleware , deleteProduct);

router.patch('/:id/addstock', firebaseAuthMiddleware , addStock);
router.patch('/:id/removestock', firebaseAuthMiddleware , removeStock);

module.exports = router;