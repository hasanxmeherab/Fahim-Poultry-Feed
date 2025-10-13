const Transaction = require('../models/transactionModel');
const mongoose = require('mongoose');

const getTransactions = async (req, res, next) => {
    try {
        const limit = 15;
        const page = Number(req.query.page) || 1;
        
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
        next(error);
    }
};

const getTransactionsByBatch = async (req, res, next) => {
    try {
        const limit = 15;
        const page = Number(req.query.page) || 1;
        const batchId = req.params.batchId;
        if (!mongoose.Types.ObjectId.isValid(batchId)) {
            return res.status(404).json({ message: 'Invalid Batch ID' });
        }
        const filter = { batch: new mongoose.Types.ObjectId(batchId) };
        
        if (req.query.date) {
            const dateStr = req.query.date; // e.g., "2025-10-13"
            
            // Explicitly create the start and end of the day in UTC
            const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
            const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);
            
            filter.createdAt = { $gte: startOfDay, $lte: endOfDay };
        }

        const count = await Transaction.countDocuments(filter);
        const transactions = await Transaction.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(limit * (page - 1))
            .populate('product', 'name');
        
        const allBatchTransactions = await Transaction.find({ batch: batchId });
        let totalSoldInBatch = 0;
        let totalBoughtInBatch = 0;
        let totalChickensBought = 0;
        const productSummary = {};
        allBatchTransactions.forEach(t => {
            if (t.type === 'SALE' && t.paymentMethod === 'Credit') {
                totalSoldInBatch += t.amount;
                t.items.forEach(item => {
                    if (productSummary[item.name]) {
                        productSummary[item.name] += item.quantity;
                    } else {
                        productSummary[item.name] = item.quantity;
                    }
                });
            }
            if (t.type === 'BUY_BACK') {
                totalBoughtInBatch += t.amount;
                totalChickensBought += t.buyBackQuantity || 0;
            }
        });
        const productSummaryArray = Object.keys(productSummary).map(name => ({ name, quantity: productSummary[name] })).sort((a, b) => b.quantity - a.quantity);

        res.status(200).json({ transactions, page, totalPages: Math.ceil(count / limit), totalSoldInBatch, totalBoughtInBatch, totalChickensBought, productSummary: productSummaryArray });
    } catch (error) {
        next(error);
    }
};

const getTransactionsForBuyer = async (req, res, next) => {
    try {
        const limit = 15;
        const page = Number(req.query.page) || 1;
        const buyerId = req.params.buyerId;

        if (!mongoose.Types.ObjectId.isValid(buyerId)) {
            return res.status(404).json({ message: 'Invalid Buyer ID' });
        }
        
        const filter = { wholesaleBuyer: new mongoose.Types.ObjectId(buyerId) };
        if (req.query.date) {
            const dateStr = req.query.date; // e.g., "2025-10-13"

            // Explicitly create the start and end of the day in UTC
            const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
            const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);
            
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
        next(error);
    }
};

module.exports = { 
    getTransactions,
    getTransactionsByBatch,
    getTransactionsForBuyer 
};