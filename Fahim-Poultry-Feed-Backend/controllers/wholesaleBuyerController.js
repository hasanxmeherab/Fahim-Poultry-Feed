const mongoose = require('mongoose');
const WholesaleBuyer = require('../models/wholesaleBuyerModel');
const Transaction = require('../models/transactionModel');

// @desc   Get all wholesale buyers with search
const getBuyers = async (req, res, next) => {
    try {
        const keyword = req.query.search ? {
            $or: [
                { name: { $regex: req.query.search, $options: 'i' } },
                { businessName: { $regex: req.query.search, $options: 'i' } },
                { phone: { $regex: req.query.search, $options: 'i' } }
            ]
        } : {};
        const buyers = await WholesaleBuyer.find({ ...keyword }).sort({ name: 1 });
        res.status(200).json(buyers);
    } catch (error) {
        next(error);
    }
};

// @desc   Get a single buyer by ID
const getBuyerById = async (req, res, next) => {
    try {
        const buyer = await WholesaleBuyer.findById(req.params.id);
        if (!buyer) return res.status(404).json({ message: 'Buyer not found' });
        res.status(200).json(buyer);
    } catch (error) {
        next(error);
    }
};

// @desc   Create a new wholesale buyer
const createBuyer = async (req, res, next) => {
    const { name, businessName, phone, address } = req.body;
    try {
        const newBuyer = await WholesaleBuyer.create({ name, businessName, phone, address });
        res.status(201).json(newBuyer);
    } catch (error) {
        next(error);
    }
};

// @desc   Update a wholesale buyer
const updateBuyer = async (req, res, next) => {
    try {
        const updatedBuyer = await WholesaleBuyer.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedBuyer) return res.status(404).json({ message: 'Buyer not found' });
        res.status(200).json(updatedBuyer);
    } catch (error) {
        next(error);
    }
};

// @desc   Delete a wholesale buyer
const deleteBuyer = async (req, res, next) => {
    try {
        const buyer = await WholesaleBuyer.findByIdAndDelete(req.params.id);
        if (!buyer) return res.status(404).json({ message: 'Buyer not found' });
        res.status(200).json({ message: 'Buyer deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc   Add a deposit to a buyer's account
const addDepositToBuyer = async (req, res, next) => {
    const { id } = req.params;
    const { amount } = req.body;

    if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ message: 'A valid deposit amount is required.' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const buyer = await WholesaleBuyer.findById(id).session(session);
        if (!buyer) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Buyer not found.' });
        }

        const balanceBefore = buyer.balance;
        buyer.balance += amount;
        
        await Transaction.create([{
            type: 'DEPOSIT',
            wholesaleBuyer: id,
            amount: amount,
            balanceBefore: balanceBefore,
            balanceAfter: buyer.balance,
            notes: `Deposit of TK ${amount.toFixed(2)} for ${buyer.name}`
        }], { session });

        await buyer.save({ session });
        
        await session.commitTransaction();
        session.endSession();

        res.status(200).json(buyer);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};

// @desc   Make a withdrawal from a buyer's account
const makeWithdrawalFromBuyer = async (req, res, next) => {
    const { id } = req.params;
    const { amount } = req.body;

    if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ message: 'A valid withdrawal amount is required.' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const buyer = await WholesaleBuyer.findById(id).session(session);
        if (!buyer) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Buyer not found.' });
        }

        const balanceBefore = buyer.balance;
        buyer.balance -= amount;
        
        await Transaction.create([{
            type: 'WITHDRAWAL',
            wholesaleBuyer: id,
            amount: -amount,
            balanceBefore: balanceBefore,
            balanceAfter: buyer.balance,
            notes: `Withdrawal of TK ${amount.toFixed(2)} by ${buyer.name}`
        }], { session });

        await buyer.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json(buyer);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};

module.exports = {
    getBuyers,
    getBuyerById,
    createBuyer,
    updateBuyer,
    deleteBuyer,
    addDepositToBuyer,
    makeWithdrawalFromBuyer
};