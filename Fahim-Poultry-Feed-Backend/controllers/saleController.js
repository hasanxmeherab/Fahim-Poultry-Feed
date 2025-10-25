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

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let totalAmount = 0;
        const saleItems = [];
        const productUpdates = [];

        for (const item of items) {
            const product = await Product.findById(item.productId).session(session);
            if (!product) {
                // --- MODIFIED ERROR HANDLING ---
                const error = new Error(`Product with ID ${item.productId} not found.`);
                error.statusCode = 404;
                await session.abortTransaction();
                session.endSession();
                return next(error);
                // --- END MODIFICATION ---
            }
            if (product.quantity < item.quantity) {
                // --- MODIFIED ERROR HANDLING ---
                const error = new Error(`Not enough stock for ${product.name}. Only ${product.quantity} available.`);
                error.statusCode = 400; // Bad Request for insufficient stock
                await session.abortTransaction();
                session.endSession();
                return next(error);
                // --- END MODIFICATION ---
            }

            totalAmount += product.price * item.quantity;
            saleItems.push({ product: item.productId, quantity: item.quantity, price: product.price, name: product.name });
            productUpdates.push({ updateOne: { filter: { _id: item.productId }, update: { $inc: { quantity: -item.quantity } } } });
        }

        await Product.bulkWrite(productUpdates, { session });

        let sale;
        if (!isRandomCustomer) {
            const customer = await Customer.findById(customerId).session(session);
            if (!customer) {
                // --- MODIFIED ERROR HANDLING ---
                const error = new Error('Customer not found.');
                error.statusCode = 404;
                await session.abortTransaction();
                session.endSession();
                return next(error);
                // --- END MODIFICATION ---
            }

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

    } catch (error) { // Catch any other unexpected errors
        await session.abortTransaction();
        session.endSession();
        next(error); // Pass general errors to the main handler
    }
};

// @desc   Create a new sale for a wholesale buyer
// @route  POST /api/sales/wholesale
const createWholesaleSale = async (req, res, next) => {
    const { wholesaleBuyerId, items, isCashPayment } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const buyer = await WholesaleBuyer.findById(wholesaleBuyerId).session(session);
        if (!buyer) {
            // --- MODIFIED ERROR HANDLING ---
            const error = new Error('Wholesale buyer not found.');
            error.statusCode = 404;
            await session.abortTransaction();
            session.endSession();
            return next(error);
            // --- END MODIFICATION ---
        }

        const totalAmount = items.reduce((acc, item) => acc + (parseFloat(item.price) || 0), 0);
        
        const balanceBefore = buyer.balance;
        let balanceAfter = buyer.balance;

        if (!isCashPayment) {
            buyer.balance -= totalAmount;
            balanceAfter = buyer.balance;
            await buyer.save({ session });
        }

        // Consider if Sale model is needed, see previous feedback
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

    } catch (error) { // Catch any other unexpected errors
        await session.abortTransaction();
        session.endSession();
        next(error); // Pass general errors to the main handler
    }
};

// @desc   Get all sales
// @route  GET /api/sales
const getSales = async (req, res, next) => {
    try {
        // Consider removing Sale model if Transaction is sufficient
        const sales = await Sale.find({})
            .sort({ createdAt: -1 })
            .populate('customer', 'name phone')
            .populate('items.product', 'name sku'); // Populate might fail if product deleted
        res.status(200).json(sales);
    } catch (error) {
        next(error); // Pass errors to the main handler
    }
};

module.exports = { 
    createSale, 
    getSales, 
    createWholesaleSale 
};