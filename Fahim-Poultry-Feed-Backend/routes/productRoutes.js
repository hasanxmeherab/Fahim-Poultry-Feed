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
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();



router.route('/')
    .get(protect , getProducts)
    .post(protect , createProduct);

//Check if sku exist
router.get('/check-sku', protect, checkSkuExists);

router.route('/:id')
    .get(protect, getProduct)
    .patch(protect , updateProduct)
    .delete(protect , deleteProduct);

router.patch('/:id/addstock', protect , addStock);
router.patch('/:id/removestock', protect , removeStock);

module.exports = router;