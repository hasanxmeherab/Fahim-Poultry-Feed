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


const getTransactions = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 15; // Allow overriding limit via query
        const page = parseInt(req.query.page) || 1;

        const filter = {};
        const { startDate, endDate } = req.query;

        // Date Range Filter (Already correctly using UTC start/end assumptions)
        if (startDate && endDate) {
            const start = new Date(`${startDate}T00:00:00.000Z`);
            const end = new Date(`${endDate}T23:59:59.999Z`);
             if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                filter.createdAt = { $gte: start, $lte: end };
            } else {
                 console.warn("Invalid startDate or endDate received:", startDate, endDate);
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

        // --- IMPROVED Single Date Filter ---
        if (req.query.date) {
            const dateStr = req.query.date; // e.g., "2025-10-26"
            // Get UTC bounds for the day in Bangladesh time (UTC+6)
            const bounds = getDayBoundsUTC(dateStr, '+06:00');

            if (bounds) {
                filter.createdAt = { $gte: bounds.startUTC, $lte: bounds.endUTC };
            } else {
                 console.warn("Invalid date received for batch filter:", dateStr);
                 // Optionally return a 400 error
            }
        }
        // --- END IMPROVEMENT ---

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
             if (t.type === 'DISCOUNT') { // Assuming discounts are positive values in 'amount'
                 // Discounts reduce the net total owed by customer, handled in BatchInfoCard
            }
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
             totalSoldInBatch, // Sum of credit sales
             totalBoughtInBatch, // Sum of buy backs
             totalChickensBought,
             productSummary: productSummaryArray
         });

    } catch (error) {
        next(error);
    }
};

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

        // --- IMPROVED Single Date Filter ---
        if (req.query.date) {
            const dateStr = req.query.date; // e.g., "2025-10-26"
            // Get UTC bounds for the day in Bangladesh time (UTC+6)
            const bounds = getDayBoundsUTC(dateStr, '+06:00');

             if (bounds) {
                filter.createdAt = { $gte: bounds.startUTC, $lte: bounds.endUTC };
            } else {
                 console.warn("Invalid date received for buyer filter:", dateStr);
                 // Optionally return a 400 error
            }
        }
        // --- END IMPROVEMENT ---

        const count = await Transaction.countDocuments(filter);
        const transactions = await Transaction.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(limit * (page - 1));
            // Consider populating buyer details if needed, though maybe redundant on this page
            // .populate('wholesaleBuyer', 'name businessName');

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
    getTransactions,
    getTransactionsByBatch,
    getTransactionsForBuyer
};
