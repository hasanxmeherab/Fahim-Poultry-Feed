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
        next(error); // Pass errors to the central handler
    }
};

// @desc   Get a single customer
// @route  GET /api/customers/:id
const getCustomer = async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        // --- MODIFIED ERROR HANDLING ---
        const error = new Error('Invalid customer ID format.');
        error.statusCode = 400; // Bad Request
        return next(error);
        // --- END MODIFICATION ---
    }

    try {
        const customer = await Customer.findById(id);
        if (!customer) {
            // --- MODIFIED ERROR HANDLING ---
            const error = new Error('No such customer found');
            error.statusCode = 404; // Not Found
            return next(error);
            // --- END MODIFICATION ---
        }
        res.status(200).json(customer);
    } catch (error) {
        next(error); // Pass other errors to the central handler
    }
};

// @desc   Create a new customer
// @route  POST /api/customers
const createCustomer = async (req, res, next) => {
    const { name, phone, email, address } = req.body;

    // Validation for required fields - handled by express-validator now, but good to keep as a fallback
    if (!name || !phone) {
        // --- MODIFIED ERROR HANDLING ---
        const error = new Error('Name and phone are required fields.');
        error.statusCode = 400; // Bad Request
        return next(error);
        // --- END MODIFICATION ---
    }

    try {
        const newCustomer = await Customer.create({ name, phone, email, address });
        res.status(201).json(newCustomer);
    } catch (error) {
        if (error.code === 11000) { // Handle duplicate phone number
            error.statusCode = 400; // Bad Request
            error.message = 'A customer with this phone number already exists.';
        }
        next(error); // Pass modified or other errors to the central handler
    }
};

// @desc   Add a deposit to a customer's balance
// @route  PATCH /api/customers/:id/deposit
const addDeposit = async (req, res, next) => {
    const { id } = req.params;
    const { amount } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        // --- MODIFIED ERROR HANDLING ---
        const error = new Error('Invalid customer ID format.');
        error.statusCode = 400; // Bad Request
        return next(error);
        // --- END MODIFICATION ---
    }

    // Basic validation for amount (express-validator should handle this primarily)
    if (typeof amount !== 'number' || amount <= 0) {
        // --- MODIFIED ERROR HANDLING ---
        const error = new Error('A valid positive deposit amount is required.');
        error.statusCode = 400; // Bad Request
        return next(error);
        // --- END MODIFICATION ---
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const customer = await Customer.findById(id).session(session);
        if (!customer) {
            // --- MODIFIED ERROR HANDLING ---
            const error = new Error('Customer not found.');
            error.statusCode = 404; // Not Found
            await session.abortTransaction();
            session.endSession();
            return next(error);
            // --- END MODIFICATION ---
        }

        const balanceBefore = customer.balance;
        customer.balance += amount;

        await Transaction.create([{
            type: 'DEPOSIT',
            customer: id,
            amount: amount,
            balanceBefore: balanceBefore,
            balanceAfter: customer.balance,
            notes: `Deposit of ${amount.toFixed(2)} for ${customer.name}`
        }], { session });

        const updatedCustomer = await customer.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json(updatedCustomer);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error); // Pass errors to the central handler
    }
};

// @desc   Make a withdrawal from a customer's balance
// @route  PATCH /api/customers/:id/withdrawal
const makeWithdrawal = async (req, res, next) => {
    const { id } = req.params;
    const { amount } = req.body;

    // --- Added ID Validation ---
    if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error('Invalid customer ID format.');
        error.statusCode = 400;
        return next(error);
    }
    // --- End ID Validation ---

    // Basic validation for amount (express-validator should handle this primarily)
    if (typeof amount !== 'number' || amount <= 0) {
        // --- MODIFIED ERROR HANDLING ---
        const error = new Error('Invalid withdrawal amount. Must be a positive number.');
        error.statusCode = 400; // Bad Request
        return next(error);
        // --- END MODIFICATION ---
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const customer = await Customer.findById(id).session(session);
        if (!customer) {
            // --- MODIFIED ERROR HANDLING ---
            const error = new Error('Customer not found.');
            error.statusCode = 404; // Not Found
            await session.abortTransaction();
            session.endSession();
            return next(error);
            // --- END MODIFICATION ---
        }

        if (customer.balance < amount) {
            // --- MODIFIED ERROR HANDLING ---
            const error = new Error(`Insufficient balance. Available: ${customer.balance.toFixed(2)}`);
            error.statusCode = 400; // Bad Request
            await session.abortTransaction();
            session.endSession();
            return next(error);
            // --- END MODIFICATION ---
        }

        const balanceBefore = customer.balance;
        customer.balance -= amount;

        await Transaction.create([{
            type: 'WITHDRAWAL',
            customer: id,
            amount: -amount, // Store withdrawal as negative amount
            balanceBefore: balanceBefore,
            balanceAfter: customer.balance,
            notes: `Withdrawal of ${amount.toFixed(2)} by ${customer.name}`
        }], { session });

        const updatedCustomer = await customer.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json(updatedCustomer);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error); // Pass errors to the central handler
    }
};

// @desc   Delete a customer
// @route  DELETE /api/customers/:id
const deleteCustomer = async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        // --- MODIFIED ERROR HANDLING ---
        const error = new Error('Invalid customer ID format.');
        error.statusCode = 400; // Bad Request
        return next(error);
        // --- END MODIFICATION ---
    }

    try {
        const customer = await Customer.findByIdAndDelete(id);
        if (!customer) {
            // --- MODIFIED ERROR HANDLING ---
            const error = new Error('No such customer found to delete');
            error.statusCode = 404; // Not Found
            return next(error);
            // --- END MODIFICATION ---
        }
        res.status(200).json({ message: 'Customer deleted successfully' });
    } catch (error) {
        next(error); // Pass errors to the central handler
    }
};

// @desc   Update a customer
// @route  PATCH /api/customers/:id
const updateCustomer = async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        // --- MODIFIED ERROR HANDLING ---
        const error = new Error('Invalid customer ID format.');
        error.statusCode = 400; // Bad Request
        return next(error);
        // --- END MODIFICATION ---
    }

    try {
        // { new: true } returns the updated document
        // { runValidators: true } ensures schema validation rules are applied on update
        const customer = await Customer.findByIdAndUpdate(id, { ...req.body }, { new: true, runValidators: true });
        if (!customer) {
            // --- MODIFIED ERROR HANDLING ---
            const error = new Error('No such customer found to update');
            error.statusCode = 404; // Not Found
            return next(error);
            // --- END MODIFICATION ---
        }
        res.status(200).json(customer);
    } catch (error) {
        // Handle potential duplicate phone errors during update
        if (error.code === 11000) {
            error.statusCode = 400;
            error.message = 'Update failed: Phone number may already exist for another customer.';
        }
        next(error); // Pass errors to the central handler
    }
};

// @desc   Buy back chickens from a customer (within an active batch)
// @route  POST /api/customers/buyback
const buyFromCustomer = async (req, res, next) => {
    const { customerId, quantity, weight, pricePerKg, referenceName } = req.body;

    // Basic validation (express-validator preferred for more complex checks)
    if (!customerId || !quantity || !weight || !pricePerKg) {
        // --- MODIFIED ERROR HANDLING ---
        const error = new Error('Customer ID, quantity, weight, and price per kg are required.');
        error.statusCode = 400; // Bad Request
        return next(error);
        // --- END MODIFICATION ---
    }

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
        // --- MODIFIED ERROR HANDLING ---
        const error = new Error('Invalid customer ID format.');
        error.statusCode = 400; // Bad Request
        return next(error);
        // --- END MODIFICATION ---
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const customer = await Customer.findById(customerId).session(session);
        if (!customer) {
            // --- MODIFIED ERROR HANDLING ---
            const error = new Error('Customer not found');
            error.statusCode = 404; // Not Found
            await session.abortTransaction();
            session.endSession();
            return next(error);
            // --- END MODIFICATION ---
        }

        const activeBatch = await Batch.findOne({ customer: customerId, status: 'Active' }).session(session);
        if (!activeBatch) {
            // --- MODIFIED ERROR HANDLING ---
            const error = new Error('Cannot buy from customer with no active batch.');
            error.statusCode = 400; // Bad Request
            await session.abortTransaction();
            session.endSession();
            return next(error);
            // --- END MODIFICATION ---
        }

        const balanceBefore = customer.balance;
        const totalAmount = parseFloat(weight) * parseFloat(pricePerKg);
        if (isNaN(totalAmount) || totalAmount < 0) {
             // --- ADDED VALIDATION ---
            const error = new Error('Invalid calculation for total amount. Check weight and price.');
            error.statusCode = 400; // Bad Request
            await session.abortTransaction();
            session.endSession();
            return next(error);
            // --- END VALIDATION ---
        }


        customer.balance += totalAmount;
        await customer.save({ session });

        const newTransaction = await Transaction.create([{
            type: 'BUY_BACK',
            customer: customer._id,
            amount: totalAmount,
            buyBackQuantity: quantity,
            buyBackWeight: weight,
            buyBackPricePerKg: pricePerKg,
            referenceName: referenceName, // Added referenceName here
            balanceBefore: balanceBefore,
            balanceAfter: customer.balance,
            notes: `Bought back ${quantity} chickens (${weight}kg @ TK ${pricePerKg}/kg)`,
            batch: activeBatch._id,
        }], { session });

        await session.commitTransaction();
        session.endSession();

        // Get the transaction document that was just created
        const createdTransaction = newTransaction[0];

        // Populate the 'customer' field to include their name before sending
        await createdTransaction.populate('customer', 'name');

        // Send the populated transaction back to the frontend
        res.status(200).json(createdTransaction);

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error); // Pass errors to the central handler
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