const Customer = require('../models/customerModel');
const Product = require('../models/productModel');
const Transaction = require('../models/transactionModel');

const getDashboardStats = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        let startOfDay, endOfDay;

        // If the frontend provides a specific date range, use it.
        if (startDate && endDate) {
            startOfDay = new Date(startDate);
            endOfDay = new Date(endDate);
        } else {
            // Fallback for old behavior (server's "today")
            startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);
        }

        const salesTodayResult = await Transaction.aggregate([
            { $match: { type: 'SALE', createdAt: { $gte: startOfDay, $lte: endOfDay } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const salesToday = salesTodayResult.length > 0 ? salesTodayResult[0].total : 0;

        const negativeBalanceCustomers = await Customer.countDocuments({ balance: { $lt: 0 } });
        
        const lowStockProducts = await Product.countDocuments({ quantity: { $lte: 10 } });
        
        const recentTransactions = await Transaction.find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('customer', 'name')
            .populate('product', 'name');

        res.status(200).json({
            salesToday,
            negativeBalanceCustomers,
            lowStockProducts,
            recentTransactions
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getDashboardStats };