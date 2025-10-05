const Sale = require('../models/saleModel');
const Customer = require('../models/customerModel');
const Product = require('../models/productModel');
const Transaction = require('../models/transactionModel');
const Batch = require('../models/batchModel');
const WholesaleBuyer = require('../models/wholesaleBuyerModel');

// @desc   Create a new sale
// @route  POST /api/sales
const createSale = async (req, res) => {
const { customerId, items, isCashPayment, isRandomCustomer, randomCustomerName } = req.body;
    if (!items || items.length === 0) {
        return res.status(400).json({ error: 'At least one item is required.' });
    }

    if (!isRandomCustomer && !customerId) {
        return res.status(400).json({ error: 'Customer ID is required for non-random sales.' });
    }
    
    // Random customer sales must be cash sales.
    if (isRandomCustomer && !isCashPayment) {
        return res.status(400).json({ error: 'Random customer sales must be paid in cash.' });
    }

    try {
        let totalAmount = 0;
        const saleItems = [];
        const productUpdates = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) return res.status(404).json({ error: `Product not found.` });
            if (product.quantity < item.quantity) return res.status(400).json({ error: `Not enough stock for ${product.name}.` });

            totalAmount += product.price * item.quantity;
            saleItems.push({ product: item.productId, quantity: item.quantity, price: product.price, name: product.name });
            productUpdates.push({ updateOne: { filter: { _id: item.productId }, update: { $inc: { quantity: -item.quantity } } } });
        }

        await Product.bulkWrite(productUpdates);

        let sale;
        // Logic for registered customers
        if (!isRandomCustomer) {
            const customer = await Customer.findById(customerId);
            if (!customer) return res.status(404).json({ error: 'Customer not found.' });

            const activeBatch = await Batch.findOne({ customer: customerId, status: 'Active' });
            const balanceBefore = customer.balance;
            let balanceAfter = customer.balance;

            if (!isCashPayment) {
                customer.balance -= totalAmount;
                balanceAfter = customer.balance;
                await customer.save();
            }

            sale = await Sale.create({
                customer: customerId,
                items: saleItems,
                totalAmount,
                batch: activeBatch ? activeBatch._id : null,
            });

            await Transaction.create({
                type: 'SALE',
                customer: customerId,
                amount: totalAmount,
                items: saleItems,
                balanceBefore,
                balanceAfter,
                paymentMethod: isCashPayment ? 'Cash' : 'Credit',
                notes: `Sale of ${saleItems.length} item(s) to ${customer.name}`,
                batch: activeBatch ? activeBatch._id : null,
            });
        } else {
            // Logic for random customers
            sale = await Sale.create({
                items: saleItems,
                totalAmount,
            });

            await Transaction.create({
                type: 'SALE',
                amount: totalAmount,
                items: saleItems,
                paymentMethod: 'Cash',
                randomCustomerName: randomCustomerName, // <-- ADD THIS LINE
                notes: `Cash sale to ${randomCustomerName || 'a random customer'}`, // <-- MODIFY THIS LINE
            });
        }

        res.status(201).json(sale);

    } catch (error) {
        res.status(500).json({ error: 'Server error during sale processing: ' + error.message });
    }
};


// @desc   Create a new sale for a wholesale buyer
// @route  POST /api/sales/wholesale
const createWholesaleSale = async (req, res) => {
    const { wholesaleBuyerId, items, isCashPayment } = req.body;

    if (!wholesaleBuyerId || !items || items.length === 0) {
        return res.status(400).json({ message: 'Buyer ID and items are required.' });
    }

    try {
        const buyer = await WholesaleBuyer.findById(wholesaleBuyerId);
        if (!buyer) {
            return res.status(404).json({ message: 'Wholesale buyer not found.' });
        }

        const totalAmount = items.reduce((acc, item) => acc + (parseFloat(item.price) || 0), 0);
        
        const balanceBefore = buyer.balance;
        let balanceAfter = buyer.balance;

        if (!isCashPayment) {
            buyer.balance -= totalAmount;
            balanceAfter = buyer.balance;
            await buyer.save();
        }

        await Sale.create({ 
            wholesaleBuyer: wholesaleBuyerId, 
            items: [],
            totalAmount 
        });

        // MODIFIED: Save the new transaction to a variable
        const newTransaction = await Transaction.create({ 
            type: 'WHOLESALE_SALE', 
            wholesaleBuyer: wholesaleBuyerId, 
            amount: totalAmount, 
            customItems: items,
            balanceBefore: balanceBefore,
            balanceAfter: balanceAfter,
            paymentMethod: isCashPayment ? 'Cash' : 'Credit',
            notes: `Wholesale sale of ${items.length} item(s) to ${buyer.name}`
        });
        
        // MODIFIED: Send the new transaction back to the frontend
        res.status(201).json(newTransaction);

    } catch (error) {
        console.error("WHOLESALE SALE ERROR:", error);
        res.status(500).json({ message: 'Server error during wholesale sale processing.' });
    }
};

// @desc   Get all sales
// @route  GET /api/sales
const getSales = async (req, res) => {
    try {
        const sales = await Sale.find({})
            .sort({ createdAt: -1 })
            .populate('customer', 'name phone')
            .populate('items.product', 'name sku');
        res.status(200).json(sales);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { 
    createSale, 
    getSales, 
    createWholesaleSale 
};

