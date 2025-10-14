const Transaction = require('../models/transactionModel');

const getSalesReport = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Please provide both a start and end date.' });
        }
        const start = new Date(`${startDate}T00:00:00.000Z`);
        const end = new Date(`${endDate}T23:59:59.999Z`);
        const sales = await Transaction.find({
            type: 'SALE',
            createdAt: { $gte: start, $lte: end }
        }).sort({ createdAt: -1 }).populate('customer', 'name');
        const totalRevenue = sales.reduce((acc, sale) => acc + sale.amount, 0);
        res.status(200).json({ sales, totalRevenue });
    } catch (error) {
        next(error);
    }
};

const getBatchReport = async (req, res, next) => {
    try {
        const { id } = req.params; // Batch ID

        const sales = await Transaction.find({ batch: id, type: 'SALE' })
            .sort({ createdAt: 'asc' })
            .populate('items.product', 'sku');

        const buyBacks = await Transaction.find({ batch: id, type: 'BUY_BACK' })
            .sort({ createdAt: 'asc' });

        const totalSold = sales.reduce((acc, sale) => acc + sale.amount, 0);
        const totalBought = buyBacks.reduce((acc, buy) => acc + buy.amount, 0);
        const totalChickens = buyBacks.reduce((acc, buy) => acc + (buy.buyBackQuantity || 0), 0);

        res.status(200).json({ 
            sales, 
            buyBacks, 
            totalSold, 
            totalBought, 
            totalChickens 
        });

    } catch (error) {
        next(error);
    }
};

const getDashboardCharts = async (req, res, next) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const dailySales = await Transaction.aggregate([
            { $match: { type: 'SALE', createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    totalRevenue: { $sum: "$amount" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const topProducts = await Transaction.aggregate([
            { $match: { type: 'SALE' } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.name",
                    totalQuantitySold: { $sum: "$items.quantity" }
                }
            },
            { $sort: { totalQuantitySold: -1 } },
            { $limit: 5 }
        ]);

        res.status(200).json({ dailySales, topProducts });

    } catch (error) {
        next(error);
    }
};

module.exports = { 
    getSalesReport, 
    getBatchReport, 
    getDashboardCharts
};