const mongoose = require('mongoose');
const Sale = require('../models/saleModel');
const Customer = require('../models/customerModel');
const Product = require('../models/productModel');
const Transaction = require('../models/transactionModel');
const Batch = require('../models/batchModel');
const WholesaleBuyer = require('../models/wholesaleBuyerModel');

// @desc   Create a new sale
// @route  POST /api/sales
const createSale = async (req, res, next) => {
    const { customerId, items, isCashPayment, isRandomCustomer, randomCustomerName } = req.body;
    if (!items || items.length === 0) {
        return res.status(400).json({ error: 'At least one item is required.' });
    }

    if (!isRandomCustomer && !customerId) {
        return res.status(400).json({ error: 'Customer ID is required for non-random sales.' });
    }
    
    if (isRandomCustomer && !isCashPayment) {
        return res.status(400).json({ error: 'Random customer sales must be paid in cash.' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let totalAmount = 0;
        const saleItems = [];
        const productUpdates = [];

        for (const item of items) {
            const product = await Product.findById(item.productId).session(session);
            if (!product) {
                throw new Error(`Product with ID ${item.productId} not found.`);
            }
            if (product.quantity < item.quantity) {
                throw new Error(`Not enough stock for ${product.name}. Only ${product.quantity} available.`);
            }

            totalAmount += product.price * item.quantity;
            saleItems.push({ product: item.productId, quantity: item.quantity, price: product.price, name: product.name });
            productUpdates.push({ updateOne: { filter: { _id: item.productId }, update: { $inc: { quantity: -item.quantity } } } });
        }

        await Product.bulkWrite(productUpdates, { session });

        let sale;
        if (!isRandomCustomer) {
            const customer = await Customer.findById(customerId).session(session);
            if (!customer) throw new Error('Customer not found.');

            const activeBatch = await Batch.findOne({ customer: customerId, status: 'Active' }).session(session);
            const balanceBefore = customer.balance;
            let balanceAfter = customer.balance;

            if (!isCashPayment) {
                customer.balance -= totalAmount;
                balanceAfter = customer.balance;
                await customer.save({ session });
            }

            const saleData = { customer: customerId, items: saleItems, totalAmount, batch: activeBatch ? activeBatch._id : null };
            const createdSales = await Sale.create([saleData], { session });
            sale = createdSales[0];

            await Transaction.create([{
                type: 'SALE',
                customer: customerId,
                amount: totalAmount,
                items: saleItems,
                balanceBefore,
                balanceAfter,
                paymentMethod: isCashPayment ? 'Cash' : 'Credit',
                notes: `Sale of ${saleItems.length} item(s) to ${customer.name}`,
                batch: activeBatch ? activeBatch._id : null,
            }], { session });
        } else {
            const saleData = { items: saleItems, totalAmount };
            const createdSales = await Sale.create([saleData], { session });
            sale = createdSales[0];

            await Transaction.create([{
                type: 'SALE',
                amount: totalAmount,
                items: saleItems,
                paymentMethod: 'Cash',
                randomCustomerName: randomCustomerName,
                notes: `Cash sale to ${randomCustomerName || 'a random customer'}`,
            }], { session });
        }

        await session.commitTransaction();
        session.endSession();

        res.status(201).json(sale);

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};

// @desc   Create a new sale for a wholesale buyer
// @route  POST /api/sales/wholesale
const createWholesaleSale = async (req, res, next) => {
    const { wholesaleBuyerId, items, isCashPayment } = req.body;

    if (!wholesaleBuyerId || !items || items.length === 0) {
        return res.status(400).json({ message: 'Buyer ID and items are required.' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const buyer = await WholesaleBuyer.findById(wholesaleBuyerId).session(session);
        if (!buyer) {
            throw new Error('Wholesale buyer not found.');
        }

        const totalAmount = items.reduce((acc, item) => acc + (parseFloat(item.price) || 0), 0);
        
        const balanceBefore = buyer.balance;
        let balanceAfter = buyer.balance;

        if (!isCashPayment) {
            buyer.balance -= totalAmount;
            balanceAfter = buyer.balance;
            await buyer.save({ session });
        }

        await Sale.create([{ 
            wholesaleBuyer: wholesaleBuyerId, 
            items: [], // Simplified for wholesale, customItems are in Transaction
            totalAmount 
        }], { session });

        const createdTransactions = await Transaction.create([{ 
            type: 'WHOLESALE_SALE', 
            wholesaleBuyer: wholesaleBuyerId, 
            amount: totalAmount, 
            customItems: items,
            balanceBefore: balanceBefore,
            balanceAfter: balanceAfter,
            paymentMethod: isCashPayment ? 'Cash' : 'Credit',
            notes: `Wholesale sale of ${items.length} item(s) to ${buyer.name}`
        }], { session });
        
        await session.commitTransaction();
        session.endSession();
        
        res.status(201).json(createdTransactions[0]);

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};

// @desc   Get all sales
// @route  GET /api/sales
const getSales = async (req, res, next) => {
    try {
        const sales = await Sale.find({})
            .sort({ createdAt: -1 })
            .populate('customer', 'name phone')
            .populate('items.product', 'name sku');
        res.status(200).json(sales);
    } catch (error) {
        next(error);
    }
};

module.exports = { 
    createSale, 
    getSales, 
    createWholesaleSale 
};