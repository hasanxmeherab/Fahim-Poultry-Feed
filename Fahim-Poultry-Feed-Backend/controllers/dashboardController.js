// dashboardController.js

const Customer = require('../models/customerModel');
const Product = require('../models/productModel'); // Already imported
const Transaction = require('../models/transactionModel');
const WholesaleBuyer = require('../models/wholesaleBuyerModel'); // Already imported

const getDashboardStats = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        let startOfDay, endOfDay;

        // Determine date range (today by default, or use query params)
        // Ensure consistent timezone handling if necessary (e.g., using UTC or a specific offset)
        // This default uses the server's local time zone.
        if (startDate && endDate) {
            // Be cautious with timezones if query params are strings without offsets
            startOfDay = new Date(startDate); // Might interpret as UTC if only date string
             startOfDay.setHours(0, 0, 0, 0); // Ensure start of day
            endOfDay = new Date(endDate);
             endOfDay.setHours(23, 59, 59, 999); // Ensure end of day
        } else {
            // Fallback: server's "today" based on server time
            startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);
        }

        // Aggregate sales for the specified date range
        const salesTodayResult = await Transaction.aggregate([
            // --- UPDATED MATCH STAGE TO INCLUDE WHOLESALE_SALE ---
            { $match: { type: { $in: ['SALE', 'WHOLESALE_SALE'] }, createdAt: { $gte: startOfDay, $lte: endOfDay } } },
            // --- END UPDATE ---
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const salesToday = salesTodayResult.length > 0 ? salesTodayResult[0].total : 0;

        // Count customers with negative balance
        const negativeBalanceCustomers = await Customer.countDocuments({ balance: { $lt: 0 } });

        // Count products with low stock (quantity <= 10)
        const lowStockProducts = await Product.countDocuments({ quantity: { $lte: 10 } });

        // Get the 5 most recent transactions
        const recentTransactions = await Transaction.find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('customer', 'name') // Populate customer name if available
            .populate('wholesaleBuyer', 'name') // Populate wholesale buyer name if available
            .populate('product', 'name'); // Populate product name if available (mainly for stock types)

        // Count total customers
        const totalCustomers = await Customer.countDocuments();
        // Count total wholesale buyers
        const totalWholesaleBuyers = await WholesaleBuyer.countDocuments();
        // Count total products
        const totalProducts = await Product.countDocuments();


        // Send the combined stats back to the frontend
        res.status(200).json({
            salesToday, // This value should now match the chart's value for today
            negativeBalanceCustomers,
            lowStockProducts,
            recentTransactions,
            totalCustomers,
            totalWholesaleBuyers,
            totalProducts
        });
    } catch (error) {
        // Pass any errors to the central error handler
        next(error);
    }
};

module.exports = { getDashboardStats };