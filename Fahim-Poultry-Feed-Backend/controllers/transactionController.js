const Transaction = require('../models/transactionModel');
const mongoose = require('mongoose');

const getTransactions = async (req, res) => {
    try {
        const limit = 15;
        const page = Number(req.query.page) || 1;
        
        // --- NEW: Date range filter logic ---
        const filter = {};
        const { startDate, endDate } = req.query;
        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            filter.createdAt = { $gte: start, $lte: end };
        }

        const count = await Transaction.countDocuments(filter);
        const transactions = await Transaction.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(limit * (page - 1))
            .populate('customer', 'name')
            .populate('product', 'name')
            .populate('wholesaleBuyer', 'name');

        res.status(200).json({ 
            transactions, 
            page, 
            totalPages: Math.ceil(count / limit) 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getTransactionsByBatch = async (req, res) => {
    // This function already supports date filtering, so no changes are needed.
    try {
        const limit = 15;
        const page = Number(req.query.page) || 1;
        const batchId = req.params.batchId;
        const filter = { batch: new mongoose.Types.ObjectId(batchId) };
        
        if (req.query.date) {
            const searchDate = new Date(req.query.date);
            const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
            const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));
            filter.createdAt = { $gte: startOfDay, $lte: endOfDay };
        }

        const count = await Transaction.countDocuments(filter);
        const transactions = await Transaction.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(limit * (page - 1))
            .populate('product', 'name');
        
        // ... rest of the function for totals remains the same
        const allBatchTransactions = await Transaction.find({ batch: batchId });
        let totalSoldInBatch = 0;
        let totalBoughtInBatch = 0;
        let totalChickensBought = 0;
        const productSummary = {};
        allBatchTransactions.forEach(t => { if (t.type === 'SALE' && t.paymentMethod === 'Credit'){ totalSoldInBatch += t.amount; t.items.forEach(item => { if (productSummary[item.name]) { productSummary[item.name] += item.quantity; } else { productSummary[item.name] = item.quantity; } }); } if (t.type === 'BUY_BACK') { totalBoughtInBatch += t.amount; totalChickensBought += t.buyBackQuantity || 0; } });
        const productSummaryArray = Object.keys(productSummary).map(name => ({ name, quantity: productSummary[name] })).sort((a, b) => b.quantity - a.quantity);

        res.status(200).json({ transactions, page, totalPages: Math.ceil(count / limit), totalSoldInBatch, totalBoughtInBatch, totalChickensBought, productSummary: productSummaryArray });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getTransactionsForBuyer = async (req, res) => {
    try {
        const limit = 15;
        const page = Number(req.query.page) || 1;
        const buyerId = req.params.buyerId;
        
        // --- NEW: Date filter logic ---
        const filter = { wholesaleBuyer: new mongoose.Types.ObjectId(buyerId) };
        if (req.query.date) {
            const searchDate = new Date(req.query.date);
            const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
            const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));
            filter.createdAt = { $gte: startOfDay, $lte: endOfDay };
        }
   
        const count = await Transaction.countDocuments(filter);
        const transactions = await Transaction.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(limit * (page - 1));

        res.status(200).json({ 
            transactions, 
            page, 
            totalPages: Math.ceil(count / limit) 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { 
    getTransactions,
    getTransactionsByBatch,
    getTransactionsForBuyer 
};