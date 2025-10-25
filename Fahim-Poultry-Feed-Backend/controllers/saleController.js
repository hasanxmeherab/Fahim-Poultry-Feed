const mongoose = require('mongoose');
// const Sale = require('../models/saleModel'); // --- REMOVED ---
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
        const saleItems = []; // For storing detailed items for the Transaction
        const productUpdates = [];

        for (const item of items) {
            const product = await Product.findById(item.productId).session(session);
            if (!product) {
                const error = new Error(`Product with ID ${item.productId} not found.`);
                error.statusCode = 404;
                await session.abortTransaction();
                session.endSession();
                return next(error);
            }
            if (product.quantity < item.quantity) {
                const error = new Error(`Not enough stock for ${product.name}. Only ${product.quantity} available.`);
                error.statusCode = 400;
                await session.abortTransaction();
                session.endSession();
                return next(error);
            }

            totalAmount += product.price * item.quantity;
            // Prepare item details for Transaction model
            saleItems.push({
                product: item.productId,
                quantity: item.quantity,
                price: product.price, // Price per unit
                name: product.name, // Denormalized name
                // sku: product.sku // Optional: Add SKU if needed historically
            });
            productUpdates.push({ updateOne: { filter: { _id: item.productId }, update: { $inc: { quantity: -item.quantity } } } });
        }

        await Product.bulkWrite(productUpdates, { session });

        let createdTransaction; // Store the created transaction

        if (!isRandomCustomer) {
            const customer = await Customer.findById(customerId).session(session);
            if (!customer) {
                const error = new Error('Customer not found.');
                error.statusCode = 404;
                await session.abortTransaction();
                session.endSession();
                return next(error);
            }

            const activeBatch = await Batch.findOne({ customer: customerId, status: 'Active' }).session(session);
            const balanceBefore = customer.balance;
            let balanceAfter = customer.balance;

            if (!isCashPayment) {
                customer.balance -= totalAmount;
                balanceAfter = customer.balance;
                await customer.save({ session });
            }

            // --- REMOVED Sale.create ---
            // const saleData = { customer: customerId, items: saleItems, totalAmount, batch: activeBatch ? activeBatch._id : null };
            // const createdSales = await Sale.create([saleData], { session });
            // sale = createdSales[0];
            // --- END REMOVAL ---

            // Create only the Transaction
            const transactionResult = await Transaction.create([{
                type: 'SALE',
                customer: customerId,
                amount: totalAmount,
                items: saleItems, // Use the detailed saleItems
                balanceBefore,
                balanceAfter,
                paymentMethod: isCashPayment ? 'Cash' : 'Credit',
                notes: `Sale of ${saleItems.length} item(s) to ${customer.name}`,
                batch: activeBatch ? activeBatch._id : null,
            }], { session });
            createdTransaction = transactionResult[0]; // Get the created transaction

        } else { // Random Customer Sale (Cash Only)
             // --- REMOVED Sale.create ---
            // const saleData = { items: saleItems, totalAmount };
            // const createdSales = await Sale.create([saleData], { session });
            // sale = createdSales[0];
             // --- END REMOVAL ---

             // Create only the Transaction
            const transactionResult = await Transaction.create([{
                type: 'SALE',
                amount: totalAmount,
                items: saleItems, // Use the detailed saleItems
                paymentMethod: 'Cash', // Random customer sales are cash only
                randomCustomerName: randomCustomerName,
                notes: `Cash sale to ${randomCustomerName || 'a random customer'}`,
                // No customer, batch, or balance changes for random cash sales
            }], { session });
            createdTransaction = transactionResult[0]; // Get the created transaction
        }

        await session.commitTransaction();
        session.endSession();

        // Return the created Transaction instead of the Sale
        res.status(201).json(createdTransaction);

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};

// @desc   Create a new sale for a wholesale buyer
// @route  POST /api/sales/wholesale
const createWholesaleSale = async (req, res, next) => {
    const { wholesaleBuyerId, items, isCashPayment } = req.body; // items = [{ name, quantity, weight, price (total for item)}]

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const buyer = await WholesaleBuyer.findById(wholesaleBuyerId).session(session);
        if (!buyer) {
            const error = new Error('Wholesale buyer not found.');
            error.statusCode = 404;
            await session.abortTransaction();
            session.endSession();
            return next(error);
        }

        // Calculate total amount from the custom items provided
        const totalAmount = items.reduce((acc, item) => acc + (parseFloat(item.price) || 0), 0);
        if (isNaN(totalAmount) || totalAmount < 0) {
             const error = new Error('Invalid total amount calculated from items.');
             error.statusCode = 400;
             await session.abortTransaction();
             session.endSession();
             return next(error);
        }

        const balanceBefore = buyer.balance;
        let balanceAfter = buyer.balance;

        if (!isCashPayment) {
            buyer.balance -= totalAmount;
            balanceAfter = buyer.balance;
            await buyer.save({ session });
        }

        // --- REMOVED Sale.create ---
        // await Sale.create([{
        //     wholesaleBuyer: wholesaleBuyerId,
        //     items: [], // Was already simplified here
        //     totalAmount
        // }], { session });
        // --- END REMOVAL ---

        // Create only the Transaction
        const createdTransactions = await Transaction.create([{
            type: 'WHOLESALE_SALE',
            wholesaleBuyer: wholesaleBuyerId,
            amount: totalAmount,
            customItems: items, // Store the custom items here
            balanceBefore: balanceBefore,
            balanceAfter: balanceAfter,
            paymentMethod: isCashPayment ? 'Cash' : 'Credit',
            notes: `Wholesale sale of ${items.length} item(s) to ${buyer.name}`
        }], { session });

        await session.commitTransaction();
        session.endSession();

        // Return the created Transaction
        res.status(201).json(createdTransactions[0]);

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};

// @desc   Get all sales (now fetches Transactions)
// @route  GET /api/sales
const getSales = async (req, res, next) => {
    try {
        // --- MODIFIED QUERY ---
        // Query Transaction model instead of Sale model
        const salesTransactions = await Transaction.find({ type: { $in: ['SALE', 'WHOLESALE_SALE'] } })
            .sort({ createdAt: -1 })
            .populate('customer', 'name phone') // Populate customer if available
            .populate('wholesaleBuyer', 'name phone businessName') // Populate buyer if available
            .populate('items.product', 'name sku'); // Populate product within items if available
        // --- END MODIFICATION ---

        res.status(200).json(salesTransactions);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createSale,
    getSales,
    createWholesaleSale
};
