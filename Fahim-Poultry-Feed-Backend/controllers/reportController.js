const Transaction = require('../models/transactionModel');
const mongoose = require('mongoose'); // Make sure mongoose is imported

const getSalesReport = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Please provide both a start and end date.' });
        }
        // Assuming '+06:00' for Bangladesh Time. Adjust if server/DB is different.
        const start = new Date(`${startDate}T00:00:00.000+06:00`);
        const end = new Date(`${endDate}T23:59:59.999+06:00`);

        // Validate dates
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
             return res.status(400).json({ message: 'Invalid date format provided.' });
        }

        const sales = await Transaction.find({
            // Include both SALE and WHOLESALE_SALE types
            type: { $in: ['SALE', 'WHOLESALE_SALE'] },
            createdAt: { $gte: start, $lte: end }
        }).sort({ createdAt: -1 })
          .populate('customer', 'name')
          .populate('wholesaleBuyer', 'name'); // Populate buyer too

        const totalRevenue = sales.reduce((acc, sale) => acc + (sale.amount || 0), 0);
        res.status(200).json({ sales, totalRevenue });
    } catch (error) {
        next(error);
    }
};

// --- UPGRADED getBatchReport function ---
const getBatchReport = async (req, res, next) => {
    try {
        const { id } = req.params; // Batch ID

        // 1. ADDED VALIDATION: Check if the provided ID is a valid MongoDB ObjectId.
        if (!mongoose.Types.ObjectId.isValid(id)) {
            // --- MODIFIED ERROR ---
            const error = new Error('Batch not found. Invalid ID format.');
            error.statusCode = 400; // Bad Request for invalid ID
            return next(error);
            // --- END MODIFICATION ---
        }

        // Fetch sales transactions linked to the batch
        const sales = await Transaction.find({ batch: id, type: 'SALE' })
            .sort({ createdAt: 'asc' })
            .populate('items.product', 'name sku'); // Populate product details within items

        // Fetch buy back transactions linked to the batch
        const buyBacks = await Transaction.find({ batch: id, type: 'BUY_BACK' })
            .sort({ createdAt: 'asc' })
            .populate('customer', 'name'); // Populate customer for context

        // --- Fetch discount transactions linked to the batch ---
        const discounts = await Transaction.find({ batch: id, type: 'DISCOUNT' })
             .sort({ createdAt: 'asc' });
        const discountRemovals = await Transaction.find({ batch: id, type: 'DISCOUNT_REMOVAL'})
             .sort({ createdAt: 'asc'});

        const totalDiscountAmount = discounts.reduce((acc, d) => acc + (d.amount || 0), 0);
        const totalDiscountRemovedAmount = discountRemovals.reduce((acc, d) => acc + Math.abs(d.amount || 0), 0); // Amount is negative
        const netDiscountAmount = totalDiscountAmount - totalDiscountRemovedAmount;
        // --- End discount calculation ---

        // Calculate totals using reduce, ensuring amounts exist
        const totalSold = sales.reduce((acc, sale) => acc + (sale.amount || 0), 0);
        const totalBought = buyBacks.reduce((acc, buy) => acc + (buy.amount || 0), 0);
        const totalChickens = buyBacks.reduce((acc, buy) => acc + (buy.buyBackQuantity || 0), 0);

        res.status(200).json({
            sales,
            buyBacks,
            discounts, // Include discounts in the response if needed
            discountRemovals, // Include removals if needed
            totalSold,
            totalBought,
            totalChickens,
            netDiscountAmount // Send the net discount amount
        });

    } catch (error) {
        next(error);
    }
};

// --- UPDATED getDashboardCharts: Added Top Customers Monthly ---
const getDashboardCharts = async (req, res, next) => {
    try {
        // --- Date Boundaries ---
        const now = new Date();
        const BDT_OFFSET_MS = 6 * 60 * 60 * 1000; // +06:00 offset

        // Daily Sales (Last 7 Days)
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 6); // Go back 6 days to include today
        sevenDaysAgo.setHours(0, 0, 0, 0); // Start of the 7th day ago in server time

        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999); // End of today

        // Monthly Boundaries (Current Month)
        const serverYear = now.getFullYear();
        const serverMonth = now.getMonth(); // 0-indexed
        const startOfMonth = new Date(serverYear, serverMonth, 1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = new Date(serverYear, serverMonth + 1, 0); // Last day of current month
        endOfMonth.setHours(23, 59, 59, 999);

        // Yearly Boundaries (Current Year)
        const startOfYear = new Date(serverYear, 0, 1);
        startOfYear.setHours(0, 0, 0, 0);
        const endOfYear = new Date(serverYear, 11, 31);
        endOfYear.setHours(23, 59, 59, 999);

        // --- Aggregations ---

        // 1. Daily Sales (Last 7 Days)
        const dateArray = [];
        const salesDataMap = new Map();
        const dayLabels = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(now.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const year = date.getUTCFullYear();
            const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
            const day = date.getUTCDate().toString().padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;
            const localDateForDayName = new Date(date.getTime() + BDT_OFFSET_MS);
            const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][localDateForDayName.getUTCDay()];
            salesDataMap.set(dateString, 0);
            dayLabels.push(dayName);
        }
        const actualSales = await Transaction.aggregate([
            { $match: { type: { $in: ['SALE', 'WHOLESALE_SALE'] }, createdAt: { $gte: sevenDaysAgo, $lte: todayEnd } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "+06:00" } }, totalRevenue: { $sum: "$amount" } } }
        ]);
        actualSales.forEach(sale => { if (salesDataMap.has(sale._id)) { salesDataMap.set(sale._id, sale.totalRevenue); } });
        const finalDailySalesData = Array.from(salesDataMap.values());

        // 2. Yearly Top Products (Current Year)
        const yearlyTopProducts = await Transaction.aggregate([
            { $match: { type: 'SALE', createdAt: { $gte: startOfYear, $lte: endOfYear } } },
            { $unwind: "$items" },
            { $match: { "items.name": { $exists: true, $ne: null, $ne: "" } } },
            { $group: { _id: "$items.name", totalQuantitySold: { $sum: "$items.quantity" } } },
            { $sort: { totalQuantitySold: -1 } },
            { $limit: 5 }
        ]);

        // 3. Overall Top Products (All Time)
        const topProducts = await Transaction.aggregate([
             { $match: { type: 'SALE' } }, { $unwind: "$items" },
             { $match: { "items.name": { $exists: true, $ne: null, $ne: "" } } },
             { $group: { _id: "$items.name", totalQuantitySold: { $sum: "$items.quantity" } } },
             { $sort: { totalQuantitySold: -1 } }, { $limit: 5 }
         ]);

        // 4. Top Customers (Current Month)
        const topCustomersMonthly = await Transaction.aggregate([
             {
                 $match: {
                     type: { $in: ['SALE', 'WHOLESALE_SALE'] }, // Consider both types for revenue
                     createdAt: { $gte: startOfMonth, $lte: endOfMonth }
                 }
             },
             // Lookup customer names
             { $lookup: { from: 'customers', localField: 'customer', foreignField: '_id', as: 'customerInfo' } },
             // Lookup wholesale buyer names
             { $lookup: { from: 'wholesalebuyers', localField: 'wholesaleBuyer', foreignField: '_id', as: 'buyerInfo' } },
             // Unwind the lookup results (preserve transactions even if lookup fails)
             { $unwind: { path: '$customerInfo', preserveNullAndEmptyArrays: true } },
             { $unwind: { path: '$buyerInfo', preserveNullAndEmptyArrays: true } },
             // Add a unified field for grouping
             {
                 $addFields: {
                     customerNameForGrouping: {
                         $cond: {
                             if: { $ifNull: ['$customerInfo.name', false] }, // Prioritize Customer name
                             then: '$customerInfo.name',
                             else: {
                                 $cond: {
                                     if: { $ifNull: ['$buyerInfo.name', false] }, // Then Wholesale Buyer name
                                     then: '$buyerInfo.name',
                                     // Use "Walk-In Customer" if randomCustomerName exists, otherwise "Unknown"
                                     else: { $ifNull: ['$randomCustomerName', 'Walk-In Customer'] }
                                 }
                             }
                         }
                     }
                 }
             },
             // Group by the unified name and sum the revenue
             {
                 $group: {
                     _id: '$customerNameForGrouping',
                     totalRevenue: { $sum: '$amount' }
                 }
             },
             // Sort by revenue descending
             { $sort: { totalRevenue: -1 } },
             // Limit to top 5
             { $limit: 5 }
         ]);
        // --- END Top Customers Calculation ---

        // --- Send Response ---
        res.status(200).json({
            dailySalesLabels: dayLabels,
            dailySalesData: finalDailySalesData,
            yearlyTopProducts,
            topCustomersMonthly, // Add top customers to the response
            topProducts
        });

    } catch (error) {
        next(error);
    }
};
// --- END UPDATED getDashboardCharts function ---

module.exports = {
    getSalesReport,
    getBatchReport,
    getDashboardCharts // Make sure it's exported
};