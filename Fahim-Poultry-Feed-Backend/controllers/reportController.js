const Transaction = require('../models/transactionModel'); // <-- This import was likely missing

const getSalesReport = async (req, res) => {
    // ... (this function remains the same)
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Please provide both a start and end date.' });
        }
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        const sales = await Transaction.find({
            type: 'SALE',
            createdAt: { $gte: start, $lte: end }
        }).sort({ createdAt: -1 }).populate('customer', 'name');
        const totalRevenue = sales.reduce((acc, sale) => acc + sale.amount, 0);
        res.status(200).json({ sales, totalRevenue });
    } catch (error) {
        console.error("SALES REPORT ERROR:", error);
        res.status(500).json({ message: 'Server error fetching sales report.' });
    }
};

const getBatchReport = async (req, res) => {
    try {
        const { id } = req.params; // Batch ID

        // Find all "SALE" transactions for this batch
        const sales = await Transaction.find({ batch: id, type: 'SALE' })
            .sort({ createdAt: 'asc' })
            .populate('items.product', 'sku'); // Corrected populate path

        // Find all "BUY_BACK" transactions for this batch
        const buyBacks = await Transaction.find({ batch: id, type: 'BUY_BACK' })
            .sort({ createdAt: 'asc' });

        // Calculate totals
        const totalSold = sales.reduce((acc, sale) => acc + sale.amount, 0);
        const totalBought = buyBacks.reduce((acc, buy) => acc + buy.amount, 0);
        const totalChickens = buyBacks.reduce((acc, buy) => acc + buy.buyBackQuantity, 0);

        res.status(200).json({ 
            sales, 
            buyBacks, 
            totalSold, 
            totalBought, 
            totalChickens 
        });

    } catch (error) {
        console.error("BATCH REPORT ERROR:", error);
        res.status(500).json({ message: 'Server error fetching batch report.' });
    }
};

const getDashboardCharts = async (req, res) => {
    try {
        // 1. Data for Sales in the Last 7 Days
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

        // 2. Data for Top 5 Selling Products (All Time)
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
        console.error("DASHBOARD CHARTS ERROR:", error);
        res.status(500).json({ message: 'Server error fetching chart data.' });
    }
};

module.exports = { 
    getSalesReport, 
    getBatchReport, 
    getDashboardCharts
};