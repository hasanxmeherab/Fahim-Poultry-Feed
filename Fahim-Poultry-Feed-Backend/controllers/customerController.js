const mongoose = require('mongoose');
const Customer = require('../models/customerModel');
const Transaction = require('../models/transactionModel');
const Batch = require('../models/batchModel');

// @desc   Get all customers
// @route  GET /api/customers
const getCustomers = async (req, res, next) => {
  try {
    const keyword = req.query.search
      ? {
          $or: [
            { name: { $regex: req.query.search, $options: 'i' } }, // Case-insensitive search
            { phone: { $regex: req.query.search, $options: 'i' } },
          ],
        }
      : {}; // If no search query, this is an empty object

    const customers = await Customer.find({ ...keyword }).sort({ createdAt: -1 });
    res.status(200).json(customers);
  } catch (error) {
    next(error);
  }
};

const getCustomer = async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({error: 'No such customer'});
    }

    try {
        const customer = await Customer.findById(id);
        if (!customer) {
            return res.status(404).json({error: 'No such customer found'});
        }
        res.status(200).json(customer);
    } catch (error) {
        next(error);
    }
};

// @desc   Create a new customer
// @route  POST /api/customers
const createCustomer = async (req, res, next) => {
  const { name, phone, email, address } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required fields.' });
  }

  try {
    const newCustomer = await Customer.create({ name, phone, email, address });
    res.status(201).json(newCustomer);
  } catch (error) {
    if (error.code === 11000) {
      error.statusCode = 400;
      error.message = 'A customer with this phone number already exists.';
    }
    next(error);
  }
};

// @desc   Add a deposit to a customer's balance
// @route  PATCH /api/customers/:id/deposit
const addDeposit = async (req, res, next) => {
  const { id } = req.params;
  const { amount } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'No such customer' });
  }

  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'An invalid deposit amount was provided.' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const customer = await Customer.findById(id).session(session);
    if (!customer) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Customer not found.' });
    }

    const balanceBefore = customer.balance;
    customer.balance += amount;
    
    await Transaction.create([{
        type: 'DEPOSIT',
        customer: id,
        amount: amount,
        balanceBefore: balanceBefore,
        balanceAfter: customer.balance,
        notes: `Deposit of $${amount.toFixed(2)} for ${customer.name}`
    }], { session });

    const updatedCustomer = await customer.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json(updatedCustomer);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc   Make a withdrawal from a customer's balance
// @route  PATCH /api/customers/:id/withdrawal
const makeWithdrawal = async (req, res, next) => {
    const { id } = req.params;
    const { amount } = req.body;

    if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: 'Invalid withdrawal amount.' });
    }
    
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const customer = await Customer.findById(id).session(session);
        if (!customer) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ error: 'Customer not found.' });
        }

        if (customer.balance < amount) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ error: `Insufficient balance. Available: ${customer.balance.toFixed(2)}` });
        }

        const balanceBefore = customer.balance;
        customer.balance -= amount;
        
        await Transaction.create([{
            type: 'WITHDRAWAL',
            customer: id,
            amount: -amount,
            balanceBefore: balanceBefore,
            balanceAfter: customer.balance,
            notes: `Withdrawal of $${amount.toFixed(2)} by ${customer.name}`
        }], { session });

        const updatedCustomer = await customer.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json(updatedCustomer);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};

const deleteCustomer = async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({error: 'No such customer'});
    }

    try {
        const customer = await Customer.findByIdAndDelete(id);
        if (!customer) {
            return res.status(404).json({error: 'No such customer'});
        }
        res.status(200).json({ message: 'Customer deleted successfully' });
    } catch (error) {
        next(error);
    }
};

const updateCustomer = async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({error: 'No such customer'});
    }

    try {
        const customer = await Customer.findByIdAndUpdate(id, { ...req.body }, { new: true });
        if (!customer) {
            return res.status(404).json({error: 'No such customer'});
        }
        res.status(200).json(customer);
    } catch (error) {
        next(error);
    }
};

const buyFromCustomer = async (req, res, next) => {
    const { customerId, quantity, weight, pricePerKg, referenceName } = req.body;

    if (!customerId || !quantity || !weight || !pricePerKg) {
        return res.status(400).json({ message: 'Customer ID, quantity, weight, and price are required.' });
    }
    
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const customer = await Customer.findById(customerId).session(session);
        if (!customer) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Customer not found' });
        }

        const activeBatch = await Batch.findOne({ customer: customerId, status: 'Active' }).session(session);
        if (!activeBatch) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Cannot buy from customer with no active batch.' });
        }

        const balanceBefore = customer.balance;
        const totalAmount = parseFloat(weight) * parseFloat(pricePerKg);

        customer.balance += totalAmount;
        await customer.save({ session });
        
        const newTransaction = await Transaction.create([{
            type: 'BUY_BACK',
            customer: customer._id,
            amount: totalAmount,
            buyBackQuantity: quantity,
            buyBackWeight: weight,
            buyBackPricePerKg: pricePerKg,
            referenceName: referenceName,
            balanceBefore: balanceBefore,
            balanceAfter: customer.balance,
            notes: `Bought back ${quantity} chickens (${weight}kg @ TK ${pricePerKg}/kg)`,
            batch: activeBatch._id,
        }], { session });
        
        await session.commitTransaction();
        session.endSession();
        
        res.status(200).json(newTransaction[0]);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};

module.exports = {
  getCustomers,
  getCustomer,
  createCustomer,
  addDeposit,
  makeWithdrawal,
  deleteCustomer,
  updateCustomer,
  buyFromCustomer
};