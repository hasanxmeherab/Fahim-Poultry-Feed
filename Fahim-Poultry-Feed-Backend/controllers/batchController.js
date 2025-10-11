const mongoose = require('mongoose');
const Batch = require('../models/batchModel');
const Customer = require('../models/customerModel');
const Transaction = require('../models/transactionModel');

// @desc    Start a new batch for a customer
const startNewBatch = async (req, res, next) => {
    const { customerId } = req.body;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const customer = await Customer.findById(customerId).session(session);
        if (!customer) {
            throw new Error('Customer not found');
        }

        const existingBatch = await Batch.findOne({ customer: customerId, status: 'Active' }).session(session);
        if (existingBatch) {
            existingBatch.status = 'Completed';
            existingBatch.endDate = new Date();
            existingBatch.endingBalance = customer.balance;
            await existingBatch.save({ session });
        }

        const batchCount = await Batch.countDocuments({ customer: customerId }).session(session);
        const newBatchNumber = batchCount + 1;

        const createdBatches = await Batch.create([{
            customer: customerId,
            startingBalance: customer.balance,
            batchNumber: newBatchNumber,
        }], { session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json(createdBatches[0]);

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};

// @desc    Get all batches for a single customer
const getBatchesForCustomer = async (req, res, next) => {
    try {
        const batches = await Batch.find({ customer: req.params.id }).sort({ startDate: -1 });
        res.status(200).json(batches);
    } catch (error) {
        next(error);
    }
};

// @desc    Add a discount to a batch
const addDiscount = async (req, res, next) => {
    const { id } = req.params; // Batch ID
    const { description, amount } = req.body;

    if (!description || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: 'A valid description and positive amount are required.' });
    }
    
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const batch = await Batch.findById(id).populate('customer').session(session);
        if (!batch) throw new Error('Batch not found.');
        if (batch.status !== 'Active') throw new Error('Discounts can only be added to active batches.');

        const customer = batch.customer;
        const discountAmount = parseFloat(amount);

        batch.discounts.push({ description, amount: discountAmount });
        
        const balanceBefore = customer.balance;
        customer.balance += discountAmount;
        
        await Transaction.create([{
            type: 'DISCOUNT',
            customer: customer._id,
            batch: batch._id,
            amount: discountAmount,
            balanceBefore: balanceBefore,
            balanceAfter: customer.balance,
            notes: `Discount applied: ${description} (TK ${discountAmount.toFixed(2)})`
        }], { session });

        await customer.save({ session });
        const updatedBatch = await batch.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json(updatedBatch);

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};

// @desc    Remove a discount from a batch
const removeDiscount = async (req, res, next) => {
    const { id, discountId } = req.params; // Batch ID and Discount ID

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const batch = await Batch.findById(id).populate('customer').session(session);
        if (!batch) throw new Error('Batch not found.');
        if (batch.status !== 'Active') throw new Error('Discounts can only be removed from active batches.');
        
        const customer = batch.customer;
        const discountToRemove = batch.discounts.id(discountId);

        if (!discountToRemove) throw new Error('Discount not found in this batch.');
        
        const discountAmount = discountToRemove.amount;

        const balanceBefore = customer.balance;
        customer.balance -= discountAmount;

        await Transaction.create([{
            type: 'DISCOUNT_REMOVAL',
            customer: customer._id,
            batch: batch._id,
            amount: -discountAmount,
            balanceBefore: balanceBefore,
            balanceAfter: customer.balance,
            notes: `Discount removed: ${discountToRemove.description} (TK ${discountAmount.toFixed(2)})`
        }], { session });

        await batch.discounts.pull({ _id: discountId });
        
        await customer.save({ session });
        const updatedBatch = await batch.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json(updatedBatch);

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};

// @desc    Buy back chickens and end the active batch
const buyBackAndEndBatch = async (req, res, next) => {
    const { quantity, weight, pricePerKg } = req.body;
    const batchId = req.params.id;

    if (!quantity || !weight || !pricePerKg) {
        return res.status(400).json({ message: 'Quantity, weight, and price per kg are required.' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const batch = await Batch.findById(batchId).populate('customer').session(session);
        if (!batch || batch.status !== 'Active') {
            throw new Error('Active batch not found');
        }

        const customer = batch.customer;
        const balanceBefore = customer.balance;
        const totalAmount = parseFloat(weight) * parseFloat(pricePerKg);

        customer.balance += totalAmount;
        await customer.save({ session });

        batch.status = 'Completed';
        batch.endDate = new Date();
        batch.endingBalance = customer.balance;
        await batch.save({ session });
        
        await Transaction.create([{
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
        }], { session });
        
        await session.commitTransaction();
        session.endSession();

        res.status(200).json({ message: 'Batch ended and account settled successfully' });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};

module.exports = { 
    startNewBatch, 
    getBatchesForCustomer, 
    buyBackAndEndBatch,
    addDiscount,      
    removeDiscount   
};