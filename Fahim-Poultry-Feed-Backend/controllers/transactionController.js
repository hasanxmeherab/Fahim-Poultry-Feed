const Transaction = require('../models/transactionModel');
const mongoose = require('mongoose');

// Helper function to get start and end of a day in UTC based on a local date string and offset
// Example: getDayBoundsUTC('2025-10-26', '+06:00') -> { startUTC, endUTC }
function getDayBoundsUTC(dateString, timezoneOffset = '+06:00') {
    // Construct date strings representing start and end of day in the target timezone
    const startOfDayLocalString = `${dateString}T00:00:00.000${timezoneOffset}`;
    const endOfDayLocalString = `${dateString}T23:59:59.999${timezoneOffset}`;

    // Create Date objects. JS Date constructor parses ISO 8601 strings with offsets correctly.
    const startUTC = new Date(startOfDayLocalString);
    const endUTC = new Date(endOfDayLocalString);

    // Validate if dates were parsed correctly
    if (isNaN(startUTC.getTime()) || isNaN(endUTC.getTime())) {
        console.error(`Invalid date string or offset provided: ${dateString}, ${timezoneOffset}`);
        // Return null or throw an error based on how you want to handle invalid input
        return null;
    }

    return { startUTC, endUTC };
}


// --- NEW FUNCTION ---
// @desc   Get a single transaction by ID, populated for receipt generation
// @route  GET /api/transactions/:id
const getTransactionById = async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error('Invalid Transaction ID format.');
        error.statusCode = 400; // Bad Request for invalid ID format
        return next(error);
    }

    try {
        const transaction = await Transaction.findById(id)
            // Populate all potentially needed fields for various receipt types
            .populate('customer', 'name phone balance') // Customer details for Sale, Deposit, Withdrawal, BuyBack
            .populate('wholesaleBuyer', 'name businessName phone balance') // Buyer details for WholesaleSale, Deposit, Withdrawal
            .populate('items.product', 'name sku') // Product details within items array for Sale
            .populate('batch', 'batchNumber'); // Batch number if needed

        if (!transaction) {
            const error = new Error('Transaction not found.');
            error.statusCode = 404; // Not Found
            return next(error);
        }

        // Return the fully populated transaction
        res.status(200).json(transaction);
    } catch (error) {
        // Log unexpected errors
        console.error("Error fetching transaction by ID:", error);
        next(error); // Pass errors to the central handler
    }
};
// --- END NEW FUNCTION ---


// @desc   Get all transactions with optional date range filter
// @route  GET /api/transactions
const getTransactions = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 15; // Allow overriding limit via query
        const page = parseInt(req.query.page) || 1;

        const filter = {};
        const { startDate, endDate } = req.query;

        // Date Range Filter (Using UTC start/end assumptions)
        if (startDate && endDate) {
            const start = new Date(`${startDate}T00:00:00.000Z`);
            const end = new Date(`${endDate}T23:59:59.999Z`);
             if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                filter.createdAt = { $gte: start, $lte: end };
            } else {
                 console.warn("Invalid startDate or endDate received in getTransactions:", startDate, endDate);
                 // Optionally return a 400 error here if dates are invalid
            }
        }

        const count = await Transaction.countDocuments(filter);
        const transactions = await Transaction.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(limit * (page - 1))
            .populate('customer', 'name') // Populate related data
            .populate('product', 'name sku') // Example: include SKU too
            .populate('wholesaleBuyer', 'name businessName') // Populate buyer details
            .populate('batch', 'batchNumber'); // Example: populate batch number

        res.status(200).json({
            transactions,
            page,
            totalPages: Math.ceil(count / limit)
        });
    } catch (error) {
        next(error); // Pass errors to the central handler
    }
};

// @desc   Get transactions for a specific batch with optional date filter
// @route  GET /api/transactions/batch/:batchId
const getTransactionsByBatch = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 15;
        const page = parseInt(req.query.page) || 1;
        const batchId = req.params.batchId;

        if (!mongoose.Types.ObjectId.isValid(batchId)) {
             const error = new Error('Invalid Batch ID format.');
             error.statusCode = 400;
             return next(error);
        }

        const filter = { batch: new mongoose.Types.ObjectId(batchId) };

        // Single Date Filter (Interpreted in local time, e.g., UTC+6)
        if (req.query.date) {
            const dateStr = req.query.date;
            const bounds = getDayBoundsUTC(dateStr, '+06:00'); // Use helper for local time interpretation

            if (bounds) {
                filter.createdAt = { $gte: bounds.startUTC, $lte: bounds.endUTC };
            } else {
                 console.warn("Invalid date received for batch filter:", dateStr);
                 // Optionally return a 400 error
            }
        }

        const count = await Transaction.countDocuments(filter);
        const transactions = await Transaction.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(limit * (page - 1))
            .populate('product', 'name sku'); // Populate product details

        // Calculate batch summary details (remains the same)
        const allBatchTransactions = await Transaction.find({ batch: batchId });
        let totalSoldInBatch = 0;
        let totalBoughtInBatch = 0;
        let totalChickensBought = 0;
        const productSummary = {};
        allBatchTransactions.forEach(t => {
            if (t.type === 'SALE' && t.paymentMethod === 'Credit') {
                totalSoldInBatch += t.amount || 0;
                (t.items || []).forEach(item => {
                    const name = item.name || 'Unknown Product';
                    productSummary[name] = (productSummary[name] || 0) + (item.quantity || 0);
                });
            }
             // Discounts handled separately in BatchInfoCard using batch data
            if (t.type === 'BUY_BACK') {
                totalBoughtInBatch += t.amount || 0;
                totalChickensBought += t.buyBackQuantity || 0;
            }
        });
        const productSummaryArray = Object.keys(productSummary).map(name => ({ name, quantity: productSummary[name] })).sort((a, b) => b.quantity - a.quantity);

        res.status(200).json({
             transactions,
             page,
             totalPages: Math.ceil(count / limit),
             totalSoldInBatch,
             totalBoughtInBatch,
             totalChickensBought,
             productSummary: productSummaryArray
         });

    } catch (error) {
        next(error);
    }
};

// @desc   Get transactions for a specific wholesale buyer with optional date filter
// @route  GET /api/transactions/wholesale-buyer/:buyerId
const getTransactionsForBuyer = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 15;
        const page = parseInt(req.query.page) || 1;
        const buyerId = req.params.buyerId;

        if (!mongoose.Types.ObjectId.isValid(buyerId)) {
             const error = new Error('Invalid Buyer ID format.');
             error.statusCode = 400;
             return next(error);
        }

        const filter = { wholesaleBuyer: new mongoose.Types.ObjectId(buyerId) };

        // Single Date Filter (Interpreted in local time, e.g., UTC+6)
        if (req.query.date) {
            const dateStr = req.query.date;
            const bounds = getDayBoundsUTC(dateStr, '+06:00'); // Use helper

             if (bounds) {
                filter.createdAt = { $gte: bounds.startUTC, $lte: bounds.endUTC };
            } else {
                 console.warn("Invalid date received for buyer filter:", dateStr);
                 // Optionally return a 400 error
            }
        }

        const count = await Transaction.countDocuments(filter);
        const transactions = await Transaction.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(limit * (page - 1));
            // No populate needed here usually as it's for a specific buyer's history

        res.status(200).json({
            transactions,
            page,
            totalPages: Math.ceil(count / limit)
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getTransactionById, 
    getTransactions,
    getTransactionsByBatch,
    getTransactionsForBuyer
};