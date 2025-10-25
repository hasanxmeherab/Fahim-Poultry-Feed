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
        next(error); // Pass errors to the central handler
    }
};

// @desc   Get a single product
// @route  GET /api/products/:id
const getProduct = async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        // --- MODIFIED ERROR HANDLING ---
        const error = new Error('Invalid product ID format.');
        error.statusCode = 400; // Bad Request for invalid ID
        return next(error);
        // --- END MODIFICATION ---
    }

    try {
        const product = await Product.findById(id);
        if (!product) {
            // --- MODIFIED ERROR HANDLING ---
            const error = new Error('No such product found');
            error.statusCode = 404; // Not Found
            return next(error);
            // --- END MODIFICATION ---
        }
        res.status(200).json(product);
    } catch (error) {
        next(error); // Pass other errors to the central handler
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
        if (error.code === 11000) { // Handle duplicate SKU specifically
            error.statusCode = 400; // Bad Request
            error.message = 'A product with this SKU already exists.';
        }
        // Pass the modified error or any other error to the central handler
        next(error);
    }
};

// @desc   Update a product
// @route  PATCH /api/products/:id
const updateProduct = async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        // --- MODIFIED ERROR HANDLING ---
        const error = new Error('Invalid product ID format.');
        error.statusCode = 400; // Bad Request
        return next(error);
        // --- END MODIFICATION ---
    }

    try {
        const product = await Product.findByIdAndUpdate(id, { ...req.body }, { new: true });
        if (!product) {
            // --- MODIFIED ERROR HANDLING ---
            const error = new Error('No such product found to update');
            error.statusCode = 404; // Not Found
            return next(error);
            // --- END MODIFICATION ---
        }
        res.status(200).json(product);
    } catch (error) {
        // Handle potential duplicate key errors during update if SKU is changed
        if (error.code === 11000) {
            error.statusCode = 400;
            error.message = 'Update failed: SKU may already exist.';
        }
        next(error); // Pass errors to the central handler
    }
};

// @desc   Delete a product
// @route  DELETE /api/products/:id
const deleteProduct = async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        // --- MODIFIED ERROR HANDLING ---
        const error = new Error('Invalid product ID format.');
        error.statusCode = 400; // Bad Request
        return next(error);
        // --- END MODIFICATION ---
    }

    try {
        const product = await Product.findByIdAndDelete(id);
        if (!product) {
            // --- MODIFIED ERROR HANDLING ---
            const error = new Error('No such product found to delete');
            error.statusCode = 404; // Not Found
            return next(error);
            // --- END MODIFICATION ---
        }
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        next(error); // Pass errors to the central handler
    }
};

// @desc   Add stock to a product
// @route  PATCH /api/products/:id/addstock
const addStock = async (req, res, next) => {
    const { id } = req.params;
    const { addQuantity } = req.body; // Assuming validation ensures this is a positive number

    // --- Added ID Validation ---
    if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error('Invalid product ID format.');
        error.statusCode = 400; // Bad Request
        return next(error);
    }
    // --- End Added ID Validation ---

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            { $inc: { quantity: addQuantity } },
            { new: true, session } // 'new: true' returns the updated document
        );

        if (!updatedProduct) {
            // --- MODIFIED ERROR HANDLING ---
            const error = new Error('No such product found to add stock');
            error.statusCode = 404; // Not Found
            await session.abortTransaction();
            session.endSession();
            return next(error);
            // --- END MODIFICATION ---
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
        next(error); // Pass errors to the central handler
    }
};

// @desc   Remove stock from a product
// @route  PATCH /api/products/:id/removestock
const removeStock = async (req, res, next) => {
    const { id } = req.params;
    const { removeQuantity } = req.body; // Assuming validation ensures this is a positive number

    // --- Added ID Validation ---
    if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error('Invalid product ID format.');
        error.statusCode = 400; // Bad Request
        return next(error);
    }
    // --- End Added ID Validation ---

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const product = await Product.findById(id).session(session);
        if (!product) {
            // --- MODIFIED ERROR HANDLING ---
            const error = new Error('No such product found to remove stock');
            error.statusCode = 404; // Not Found
            await session.abortTransaction();
            session.endSession();
            return next(error);
            // --- END MODIFICATION ---
        }

        if (product.quantity < removeQuantity) {
            // --- MODIFIED ERROR HANDLING ---
            const error = new Error(`Not enough stock. Only ${product.quantity} available.`);
            error.statusCode = 400; // Bad Request
            await session.abortTransaction();
            session.endSession();
            return next(error);
            // --- END MODIFICATION ---
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
        next(error); // Pass errors to the central handler
    }
};

// @desc   Check if a SKU exists
// @route  GET /api/products/check-sku
const checkSkuExists = async (req, res, next) => {
    const { sku } = req.query;
    if (!sku) {
        // No need for error, just return exists: false
        return res.status(200).json({ exists: false });
    }
    try {
        const product = await Product.findOne({ sku: sku.trim() });
        res.status(200).json({ exists: !!product });
    } catch (error) {
        next(error); // Pass database errors to the central handler
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