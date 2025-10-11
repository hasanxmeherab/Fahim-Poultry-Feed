const WholesaleProduct = require('../models/wholesaleProductModel');
const mongoose = require('mongoose');

const getProducts = async (req, res, next) => {
    try {
        const keyword = req.query.search
            ? { name: { $regex: req.query.search, $options: 'i' } }
            : {};
        const products = await WholesaleProduct.find({ ...keyword }).sort({ name: 1 });
        res.status(200).json(products);
    } catch (error) {
        next(error);
    }
};

const getProductById = async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'No such product' });
    }

    try {
        const product = await WholesaleProduct.findById(id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.status(200).json(product);
    } catch (error) {
        next(error);
    }
};

const createProduct = async (req, res, next) => {
    try {
        const newProduct = await WholesaleProduct.create({ name: req.body.name });
        res.status(201).json(newProduct);
    } catch (error) {
        next(error);
    }
};

const updateProduct = async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'No such product' });
    }

    try {
        const product = await WholesaleProduct.findByIdAndUpdate(id, { ...req.body }, { new: true });
        if (!product) {
            return res.status(404).json({ error: 'No such product' });
        }
        res.status(200).json(product);
    } catch (error) {
        next(error);
    }
};

const deleteProduct = async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'No such product' });
    }

    try {
        const product = await WholesaleProduct.findByIdAndDelete(id);
        if (!product) {
            return res.status(404).json({ error: 'No such product' });
        }
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProducts,
    createProduct,
    getProductById,
    updateProduct, 
    deleteProduct  
};