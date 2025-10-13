const Product = require('../models/productModel');
const mongoose = require('mongoose');
const Transaction = require('../models/transactionModel');

// @desc   Get all products
// @route  GET /api/products
const getProducts = async (req, res, next) => {
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
    next(error);
  }
};

// @desc   Get a single product
// @route  GET /api/products/:id
const getProduct = async (req, res, next) => {
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
        next(error);
    }
};

// @desc   Create a new product
// @route  POST /api/products
const createProduct = async (req, res, next) => {

  try {
    const { name, sku, price, quantity } = req.body;
    const product = await Product.create({ name, sku, price, quantity });
    res.status(201).json(product);
  } catch (error) {
    if (error.code === 11000) {
      error.statusCode = 400;
      error.message = 'A product with this SKU already exists.';
    }
    next(error);
  }
};

// @desc   Update a product
// @route  PATCH /api/products/:id
const updateProduct = async (req, res, next) => {
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
        next(error);
    }
};

// @desc   Delete a product
// @route  DELETE /api/products/:id
const deleteProduct = async (req, res, next) => {
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
        next(error);
    }
};

// @desc   Add stock to a product
// @route  PATCH /api/products/:id/addstock
const addStock = async (req, res, next) => {
    const { id } = req.params;
    const { addQuantity } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            { $inc: { quantity: addQuantity } },
            { new: true, session }
        );

        if (!updatedProduct) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ error: 'No such product' });
        }
        
        await Transaction.create([{
            type: 'STOCK_ADD',
            product: id,
            quantityChange: addQuantity,
            notes: `Added ${addQuantity} unit(s) to ${updatedProduct.name}`
        }], { session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json(updatedProduct);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};

// @desc   Remove stock from a product
// @route  PATCH /api/products/:id/removestock
const removeStock = async (req, res, next) => {
    const { id } = req.params;
    const { removeQuantity } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const product = await Product.findById(id).session(session);
        if (!product) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ error: 'No such product' });
        }

        if (product.quantity < removeQuantity) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ error: `Not enough stock. Only ${product.quantity} available.` });
        }
        
        product.quantity -= removeQuantity;
        const updatedProduct = await product.save({ session });
        
        await Transaction.create([{
            type: 'STOCK_REMOVE',
            product: id,
            quantityChange: -removeQuantity,
            notes: `Removed ${removeQuantity} unit(s) of ${updatedProduct.name}`
        }], { session });
        
        await session.commitTransaction();
        session.endSession();

        res.status(200).json(updatedProduct);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};

// @desc   Check if a SKU exists
// @route  GET /api/products/check-sku
const checkSkuExists = async (req, res, next) => {
    const { sku } = req.query;
    if (!sku) {
        return res.status(200).json({ exists: false });
    }
    try {
        const product = await Product.findOne({ sku: sku.trim() });
        res.status(200).json({ exists: !!product });
    } catch (error) {
        next(error);
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