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

//Check if sku exist
router.get('/check-sku', protect, checkSkuExists);

// GET all products
router.get('/', protect , getProducts);

// POST a new product
router.post('/', protect , createProduct);

// UPDATE a product by ID
router.patch('/:id', protect , updateProduct);

// DELETE a product by ID
router.delete('/:id', protect , deleteProduct);

//Add Stock
router.patch('/:id/addstock', protect , addStock);

//Remove Stock
router.patch('/:id/removestock', protect , removeStock);

//Update Product
router.patch('/:id', protect, updateProduct);

//Delete Product
router.delete('/:id', protect, deleteProduct);

router.get('/:id', protect, getProduct);

module.exports = router;