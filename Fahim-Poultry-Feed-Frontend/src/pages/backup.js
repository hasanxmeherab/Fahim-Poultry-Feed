const Batch = require('../models/batchModel');
const Customer = require('../models/customerModel');
const Transaction = require('../models/transactionModel');

const startNewBatch = async (req, res) => {
    // ... This function remains the same
};

const getBatchesForCustomer = async (req, res) => {
    // ... This function remains the same
};

// --- NEW FUNCTION: ADD DISCOUNT ---
const addDiscount = async (req, res) => {
    const { id } = req.params; // Batch ID
    const { description, amount } = req.body;

    if (!description || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: 'A valid description and positive amount are required.' });
    }

    try {
        const batch = await Batch.findById(id).populate('customer');
        if (!batch) {
            return res.status(404).json({ message: 'Batch not found.' });
        }
        if (batch.status !== 'Active') {
            return res.status(400).json({ message: 'Discounts can only be added to active batches.' });
        }

        const customer = batch.customer;
        const discountAmount = parseFloat(amount);

        // Add discount to the batch's array
        batch.discounts.push({ description, amount: discountAmount });
        
        // A discount is a credit, so it INCREASES the customer's balance (makes it less negative)
        const balanceBefore = customer.balance;
        customer.balance += discountAmount;
        
        // Create a transaction record for the discount
        await Transaction.create({
            type: 'DISCOUNT',
            customer: customer._id,
            batch: batch._id,
            amount: discountAmount,
            balanceBefore: balanceBefore,
            balanceAfter: customer.balance,
            notes: `Discount applied: ${description} (TK ${discountAmount.toFixed(2)})`
        });

        await customer.save();
        const updatedBatch = await batch.save();

        res.status(200).json(updatedBatch);

    } catch (error) {
        console.error("ADD DISCOUNT ERROR:", error);
        res.status(500).json({ message: 'Server error while adding discount.' });
    }
};

// --- NEW FUNCTION: REMOVE DISCOUNT ---
const removeDiscount = async (req, res) => {
    const { id, discountId } = req.params; // Batch ID and Discount ID

    try {
        const batch = await Batch.findById(id).populate('customer');
        if (!batch) return res.status(404).json({ message: 'Batch not found.' });
        if (batch.status !== 'Active') return res.status(400).json({ message: 'Discounts can only be removed from active batches.' });
        
        const customer = batch.customer;
        const discountToRemove = batch.discounts.id(discountId);

        if (!discountToRemove) return res.status(404).json({ message: 'Discount not found in this batch.' });
        
        const discountAmount = discountToRemove.amount;

        // Revert customer balance by DECREASING it
        const balanceBefore = customer.balance;
        customer.balance -= discountAmount;

        // Create a transaction record for the removal
        await Transaction.create({
            type: 'DISCOUNT_REMOVAL',
            customer: customer._id,
            batch: batch._id,
            amount: -discountAmount, // Log as a negative amount
            balanceBefore: balanceBefore,
            balanceAfter: customer.balance,
            notes: `Discount removed: ${discountToRemove.description} (TK ${discountAmount.toFixed(2)})`
        });

        // Remove the discount from the batch's array
        await batch.discounts.pull({ _id: discountId });
        
        await customer.save();
        const updatedBatch = await batch.save();

        res.status(200).json(updatedBatch);

    } catch (error) {
        console.error("REMOVE DISCOUNT ERROR:", error);
        res.status(500).json({ message: 'Server error while removing discount.' });
    }
};


// Note: Your buyBackAndEndBatch function might be here, it should remain unchanged.
const buyBackAndEndBatch = async (req, res) => {
    // ... This function remains the same
};


// Re-pasting the original functions for completeness
startNewBatch = async (req, res) => {
    const { customerId } = req.body;
    try {
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        const existingBatch = await Batch.findOne({ customer: customerId, status: 'Active' });
        if (existingBatch) {
            existingBatch.status = 'Completed';
            existingBatch.endDate = new Date();
            existingBatch.endingBalance = customer.balance;
            await existingBatch.save();
        }
        const batchCount = await Batch.countDocuments({ customer: customerId });
        const newBatchNumber = batchCount + 1;
        const newBatch = await Batch.create({
            customer: customerId,
            startingBalance: customer.balance,
            batchNumber: newBatchNumber,
        });
        res.status(201).json(newBatch);
    } catch (error) {
        console.error("ERROR STARTING BATCH:", error);
        res.status(500).json({ message: 'Server error starting new batch', error: error.message });
    }
};
getBatchesForCustomer = async (req, res) => {
    try {
        const batches = await Batch.find({ customer: req.params.id }).sort({ startDate: -1 });
        res.status(200).json(batches);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching batches' });
    }
};
buyBackAndEndBatch = async (req, res) => {
    const { quantity, weight, pricePerKg } = req.body;
    const batchId = req.params.id;
    if (!quantity || !weight || !pricePerKg) {
        return res.status(400).json({ message: 'Quantity, weight, and price per kg are required.' });
    }
    try {
        const batch = await Batch.findById(batchId).populate('customer');
        if (!batch || batch.status !== 'Active') {
            return res.status(404).json({ message: 'Active batch not found' });
        }
        const customer = batch.customer;
        const balanceBefore = customer.balance;
        const totalAmount = parseFloat(weight) * parseFloat(pricePerKg);
        customer.balance += totalAmount;
        await customer.save();
        batch.status = 'Completed';
        batch.endDate = new Date();
        batch.endingBalance = customer.balance;
        await batch.save();
        await Transaction.create({
            type: 'BUY_BACK',
            customer: customer._id,
            amount: totalAmount,
            buyBackQuantity: quantity,
            buyBackWeight: weight,
            buyBackPricePerKg: pricePerKg,
            balanceBefore: balanceBefore,
            balanceAfter: customer.balance,
            notes: `Bought back ${quantity} chickens (${weight}kg @ TK ${pricePerKg}/kg)`,
            batch: batch._id,
        });
        res.status(200).json({ message: 'Batch ended and account settled successfully' });
    } catch (error) {
        console.error("BUY BACK ERROR:", error);
        res.status(500).json({ message: 'Server error during buy-back', error });
    }
};


module.exports = { 
    startNewBatch, 
    getBatchesForCustomer, 
    buyBackAndEndBatch,
    addDiscount,       // <-- EXPORT NEW
    removeDiscount     // <-- EXPORT NEW
};