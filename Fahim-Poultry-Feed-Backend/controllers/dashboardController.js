const Customer = require('../models/customerModel');
const Product = require('../models/productModel'); 
const Transaction = require('../models/transactionModel');
const WholesaleBuyer = require('../models/wholesaleBuyerModel'); 

const getDashboardStats = async (req, res, next) => {
    // Initialize salesToday here to ensure it's defined before returning
    let salesToday = 0; 
    let startUTC, endUTC;

    try {
        const { startDate, endDate } = req.query;
        
        // BDT Offset: UTC+06:00 (6 hours)
        const BDT_OFFSET = '+06:00'; 

        // --- Calculate "Today in BDT" Boundaries ---
        // Get today's date string in BDT (e.g., '2025-10-30')
        // Using 'Asia/Dhaka' ensures the time zone calculation is correct.
        const now = new Date();
        const todayString = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }); 
        
        // Define START and END using the BDT offset string. 
        // JavaScript correctly converts these local times to UTC timestamps.
        startUTC = new Date(`${todayString}T00:00:00.000${BDT_OFFSET}`);
        endUTC = new Date(`${todayString}T23:59:59.999${BDT_OFFSET}`);
        
        // Note: We ignore startDate/endDate query params here 
        // because this controller specifically calculates the 'Sales Today' stat.
        // --- End Date Calculation ---

        // Aggregate sales for the BDT "today" date range (using UTC boundaries)
        const salesTodayResult = await Transaction.aggregate([
            { $match: { type: { $in: ['SALE', 'WHOLESALE_SALE'] }, createdAt: { $gte: startUTC, $lte: endUTC } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        
        // Safely assign salesToday
        salesToday = salesTodayResult.length > 0 ? salesTodayResult[0].total : 0;

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
            salesToday, 
            negativeBalanceCustomers,
            lowStockProducts,
            recentTransactions,
            totalCustomers,
            totalWholesaleBuyers,
            totalProducts
        });
    } catch (error) {
        // Pass any errors to the central error handler
        console.error("Dashboard Stats Error:", error);
        next(error);
    }
};

module.exports = { getDashboardStats };