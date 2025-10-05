const Customer = require('../models/customerModel');
const Product = require('../models/productModel');
const Transaction = require('../models/transactionModel');

const getDashboardStats = async (req, res) => {
    try {
        // 1. Get total sales value for today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const salesTodayResult = await Transaction.aggregate([
            { $match: { type: 'SALE', createdAt: { $gte: startOfDay, $lte: endOfDay } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const salesToday = salesTodayResult.length > 0 ? salesTodayResult[0].total : 0;

        // 2. Get number of customers with a negative balance
        const negativeBalanceCustomers = await Customer.countDocuments({ balance: { $lt: 0 } });

        // 3. Get number of products low in stock (e.g., quantity <= 10)
        const lowStockProducts = await Product.countDocuments({ quantity: { $lte: 10 } });

        // 4. Get the 5 most recent transactions
        const recentTransactions = await Transaction.find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('customer', 'name')
            .populate('product', 'name');

        // Send all stats in one response
        res.status(200).json({
            salesToday,
            negativeBalanceCustomers,
            lowStockProducts,
            recentTransactions
        });
    } catch (error) {
        console.error("DASHBOARD STATS ERROR:", error);
        res.status(500).json({ message: 'Server error fetching dashboard stats', error });
    }
};

module.exports = { getDashboardStats };