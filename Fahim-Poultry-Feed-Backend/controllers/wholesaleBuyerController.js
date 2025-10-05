const WholesaleBuyer = require('../models/wholesaleBuyerModel');
const Transaction = require('../models/transactionModel');
const mongoose = require('mongoose');

// @desc   Get all wholesale buyers with search
const getBuyers = async (req, res) => {
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
        res.status(500).json({ message: error.message });
    }
};

// @desc   Get a single buyer by ID
const getBuyerById = async (req, res) => {
    try {
        const buyer = await WholesaleBuyer.findById(req.params.id);
        if (!buyer) return res.status(404).json({ message: 'Buyer not found' });
        res.status(200).json(buyer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Create a new wholesale buyer
const createBuyer = async (req, res) => {
    const { name, businessName, phone, address } = req.body;
    try {
        const newBuyer = await WholesaleBuyer.create({ name, businessName, phone, address });
        res.status(201).json(newBuyer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc   Update a wholesale buyer
const updateBuyer = async (req, res) => {
    try {
        const updatedBuyer = await WholesaleBuyer.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedBuyer) return res.status(404).json({ message: 'Buyer not found' });
        res.status(200).json(updatedBuyer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc   Delete a wholesale buyer
const deleteBuyer = async (req, res) => {
    try {
        const buyer = await WholesaleBuyer.findByIdAndDelete(req.params.id);
        if (!buyer) return res.status(404).json({ message: 'Buyer not found' });
        res.status(200).json({ message: 'Buyer deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Add a deposit to a buyer's account
const addDepositToBuyer = async (req, res) => {
    const { id } = req.params;
    const { amount } = req.body;

    if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ message: 'A valid deposit amount is required.' });
    }

    try {
        const buyer = await WholesaleBuyer.findById(id);
        if (!buyer) return res.status(404).json({ message: 'Buyer not found.' });

        const balanceBefore = buyer.balance;
        buyer.balance += amount;
        await buyer.save();
        
        await Transaction.create({
            type: 'DEPOSIT',
            wholesaleBuyer: id,
            amount: amount,
            balanceBefore: balanceBefore,
            balanceAfter: buyer.balance,
            notes: `Deposit of TK ${amount.toFixed(2)} for ${buyer.name}`
        });

        res.status(200).json(buyer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Make a withdrawal from a buyer's account
const makeWithdrawalFromBuyer = async (req, res) => {
    const { id } = req.params;
    const { amount } = req.body;

    if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ message: 'A valid withdrawal amount is required.' });
    }

    try {
        const buyer = await WholesaleBuyer.findById(id);
        if (!buyer) return res.status(404).json({ message: 'Buyer not found.' });

        const balanceBefore = buyer.balance;
        buyer.balance -= amount;
        await buyer.save();
        
        await Transaction.create({
            type: 'WITHDRAWAL',
            wholesaleBuyer: id,
            amount: -amount,
            balanceBefore: balanceBefore,
            balanceAfter: buyer.balance,
            notes: `Withdrawal of TK ${amount.toFixed(2)} by ${buyer.name}`
        });

        res.status(200).json(buyer);
    } catch (error) {
        res.status(500).json({ message: error.message });
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