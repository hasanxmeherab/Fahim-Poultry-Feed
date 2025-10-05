const Product = require('../models/productModel');
const mongoose = require('mongoose');
const Transaction = require('../models/transactionModel');


// @desc   Get all products
// @route  GET /api/products
const getProducts = async (req, res) => {
  try {
    const keyword = req.query.search
      ? {
          $or: [
            { name: { $regex: req.query.search, $options: 'i' } },
            { sku: { $regex: req.query.search, $options: 'i' } },
          ],
        }
      : {};

    const products = await Product.find({ ...keyword }).sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const getProduct = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({error: 'No such product'});
    }

    try {
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({error: 'No such product found'});
        }
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc   Create a new product
// @route  POST /api/products
const createProduct = async (req, res) => {
  const { name, sku, price, quantity } = req.body;

  if (!name || !sku || !price) {
    return res.status(400).json({ error: 'Name, SKU, and Price are required.' });
  }

  try {
    const product = await Product.create({ name, sku, price, quantity });
    res.status(201).json(product);
  } catch (error) {
    // Handle duplicate SKU error
    if (error.code === 11000) {
      return res.status(400).json({ error: 'A product with this SKU already exists.' });
    }
    res.status(500).json({ error: error.message });
  }
};

// @desc   Update a product
// @route  PATCH /api/products/:id
const updateProduct = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({error: 'No such product'});
    }

    try {
        const product = await Product.findByIdAndUpdate(id, { ...req.body }, { new: true });
        if (!product) {
            return res.status(404).json({error: 'No such product'});
        }
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc   Delete a product
// @route  DELETE /api/products/:id
const deleteProduct = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({error: 'No such product'});
    }

    try {
        const product = await Product.findByIdAndDelete(id);
        if (!product) {
            return res.status(404).json({error: 'No such product'});
        }
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Add Stock
const addStock = async (req, res) => {
    const { id } = req.params;
    const { addQuantity } = req.body;

    if (typeof addQuantity !== 'number' || addQuantity <= 0) {
        return res.status(400).json({ error: 'Invalid quantity provided.' });
    }

    try {
        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            { $inc: { quantity: addQuantity } }, // Atomically increases the quantity
            { new: true } // Returns the updated document
        );

        if (!updatedProduct) {
            return res.status(404).json({ error: 'No such product' });
        }
        
        await Transaction.create({
    type: 'STOCK_ADD',
    product: id,
    quantityChange: addQuantity,
    notes: `Added ${addQuantity} unit(s) to ${updatedProduct.name}`
});

        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//Remove Stock
// Add this new function inside the file
const removeStock = async (req, res) => {
    const { id } = req.params;
    const { removeQuantity } = req.body;

    if (typeof removeQuantity !== 'number' || removeQuantity <= 0) {
        return res.status(400).json({ error: 'Invalid quantity provided.' });
    }

    try {
        // First, find the product to check its current quantity
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ error: 'No such product' });
        }

        // Check if there is enough stock to remove
        if (product.quantity < removeQuantity) {
            return res.status(400).json({ error: `Not enough stock. Only ${product.quantity} available.` });
        }

        // If validation passes, decrease the quantity
        product.quantity -= removeQuantity;
        const updatedProduct = await product.save();
        
        await Transaction.create({
    type: 'STOCK_REMOVE',
    product: id,
    quantityChange: -removeQuantity, // Store removal as a negative quantity
    notes: `Removed ${removeQuantity} unit(s) of ${updatedProduct.name}`
});

        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const checkSkuExists = async (req, res) => {
    const { sku } = req.query;
    if (!sku) {
        // Silently fail if no SKU is provided
        return res.status(200).json({ exists: false });
    }
    try {
        const product = await Product.findOne({ sku: sku.trim() });
        if (product) {
            return res.status(200).json({ exists: true });
        }
        res.status(200).json({ exists: false });
    } catch (error) {
        res.status(500).json({ message: 'Server error checking SKU.' });
    }
};

module.exports = {
  checkSkuExists,
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  addStock,
  removeStock,
};