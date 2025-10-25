const mongoose = require('mongoose');
const Batch = require('../models/batchModel');
const Customer = require('../models/customerModel');
const Transaction = require('../models/transactionModel'); // Keep Transaction if needed elsewhere

// @desc    Start a new batch for a customer (potentially ending the previous one)
// @route   POST /api/batches/start
const startNewBatch = async (req, res, next) => {
    const { customerId } = req.body;

    // --- Added ID Validation ---
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
        const error = new Error('Invalid customer ID format.');
        error.statusCode = 400;
        return next(error);
    }
    // --- End ID Validation ---

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const customer = await Customer.findById(customerId).session(session);
        if (!customer) {
            // --- MODIFIED ERROR HANDLING ---
            const error = new Error('Customer not found');
            error.statusCode = 404;
            await session.abortTransaction();
            session.endSession();
            return next(error);
            // --- END MODIFICATION ---
        }

        let newBatchNumber; // Variable to hold the calculated batch number

        // Find the currently active batch for this customer
        const existingBatch = await Batch.findOne({ customer: customerId, status: 'Active' }).session(session);

        if (existingBatch) {
            // If an active batch exists, complete it
            existingBatch.status = 'Completed';
            existingBatch.endDate = new Date();
            existingBatch.endingBalance = customer.balance; // Record balance at the time of closing
            await existingBatch.save({ session });
            // --- IMPROVEMENT ---
            // Calculate the new batch number based on the one just completed
            newBatchNumber = existingBatch.batchNumber + 1;
            // --- END IMPROVEMENT ---
        } else {
            // --- IMPROVEMENT ---
            // If no active batch exists, this is the first batch
            newBatchNumber = 1;
            // --- END IMPROVEMENT ---
        }

        // --- REMOVED countDocuments ---
        // const batchCount = await Batch.countDocuments({ customer: customerId }).session(session); // Removed this potentially problematic count
        // const newBatchNumber = batchCount + 1; // Replaced calculation
        // --- END REMOVAL ---


        // Create the new batch with the determined batch number
        const createdBatches = await Batch.create([{
            customer: customerId,
            startingBalance: customer.balance, // Record balance at the time of starting
            batchNumber: newBatchNumber, // Use the calculated number
            // Status defaults to 'Active', startDate defaults to Date.now
        }], { session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json(createdBatches[0]); // Send back the newly created batch

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error); // Pass errors to the central handler
    }
};

// --- Other controller functions remain the same ---

// @desc    Get all batches for a single customer
const getBatchesForCustomer = async (req, res, next) => {
    // --- Added ID Validation ---
     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        const error = new Error('Invalid customer ID format.');
        error.statusCode = 400;
        return next(error);
    }
    // --- End ID Validation ---
    try {
        const batches = await Batch.find({ customer: req.params.id }).sort({ startDate: -1 }); // Sort newest first
        res.status(200).json(batches);
    } catch (error) {
        next(error);
    }
};

// @desc    Add a discount to a batch
const addDiscount = async (req, res, next) => {
    const { id } = req.params; // Batch ID
    const { description, amount } = req.body;

    // Validation is handled by batch.validation.js, but basic check is good defense
    if (!description || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        const error = new Error('A valid description and positive amount are required.');
        error.statusCode = 400;
        return next(error);
    }

    // --- Added ID Validation ---
     if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error('Invalid batch ID format.');
        error.statusCode = 400;
        return next(error);
    }
    // --- End ID Validation ---

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const batch = await Batch.findById(id).populate('customer').session(session);
        if (!batch) {
            // --- MODIFIED ERROR HANDLING ---
            const error = new Error('Batch not found.');
            error.statusCode = 404;
            await session.abortTransaction();
            session.endSession();
            return next(error);
            // --- END MODIFICATION ---
        }
        if (batch.status !== 'Active') {
             // --- MODIFIED ERROR HANDLING ---
            const error = new Error('Discounts can only be added to active batches.');
            error.statusCode = 400; // Bad Request
            await session.abortTransaction();
            session.endSession();
            return next(error);
            // --- END MODIFICATION ---
        }

        const customer = batch.customer;
        const discountAmount = parseFloat(amount);

        batch.discounts.push({ description, amount: discountAmount });

        const balanceBefore = customer.balance;
        customer.balance += discountAmount; // Applying discount increases customer balance (reduces debt)

        await Transaction.create([{
            type: 'DISCOUNT',
            customer: customer._id,
            batch: batch._id,
            amount: discountAmount, // Positive amount for discount transaction
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

     // --- Added ID Validation ---
     if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(discountId)) {
        const error = new Error('Invalid Batch or Discount ID format.');
        error.statusCode = 400;
        return next(error);
    }
    // --- End ID Validation ---

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const batch = await Batch.findById(id).populate('customer').session(session);
        if (!batch) {
             // --- MODIFIED ERROR HANDLING ---
            const error = new Error('Batch not found.');
            error.statusCode = 404;
            await session.abortTransaction();
            session.endSession();
            return next(error);
            // --- END MODIFICATION ---
        }
        if (batch.status !== 'Active') {
            // --- MODIFIED ERROR HANDLING ---
            const error = new Error('Discounts can only be removed from active batches.');
            error.statusCode = 400;
            await session.abortTransaction();
            session.endSession();
            return next(error);
            // --- END MODIFICATION ---
        }

        const customer = batch.customer;
        const discountToRemove = batch.discounts.id(discountId); // Find subdocument by ID

        if (!discountToRemove) {
             // --- MODIFIED ERROR HANDLING ---
            const error = new Error('Discount not found in this batch.');
            error.statusCode = 404;
            await session.abortTransaction();
            session.endSession();
            return next(error);
            // --- END MODIFICATION ---
        }

        const discountAmount = discountToRemove.amount;

        const balanceBefore = customer.balance;
        customer.balance -= discountAmount; // Removing discount decreases customer balance (increases debt)

        await Transaction.create([{
            type: 'DISCOUNT_REMOVAL',
            customer: customer._id,
            batch: batch._id,
            amount: -discountAmount, // Negative amount for removal transaction
            balanceBefore: balanceBefore,
            balanceAfter: customer.balance,
            notes: `Discount removed: ${discountToRemove.description} (TK ${discountAmount.toFixed(2)})`
        }], { session });

        // Correct way to remove subdocument using Mongoose >= 5.7
        discountToRemove.remove(); // Remove the subdocument instance
        // Or for older Mongoose: await batch.discounts.pull({ _id: discountId });

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

// @desc    Buy back chickens and end the active batch (DEPRECATED - Use buyFromCustomer + startNewBatch)
// This function might be redundant if buyFromCustomer handles the transaction
// and startNewBatch handles closing the old batch. Consider removing if unused.
const buyBackAndEndBatch = async (req, res, next) => {
    const { quantity, weight, pricePerKg } = req.body;
    const batchId = req.params.id;

     // --- Added ID Validation ---
     if (!mongoose.Types.ObjectId.isValid(batchId)) {
        const error = new Error('Invalid batch ID format.');
        error.statusCode = 400;
        return next(error);
    }
    // --- End ID Validation ---

    // Validation handled by batch.validation.js
    if (!quantity || !weight || !pricePerKg) {
         const error = new Error('Quantity, weight, and price per kg are required.');
         error.statusCode = 400;
         return next(error);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const batch = await Batch.findById(batchId).populate('customer').session(session);
        if (!batch) {
             const error = new Error('Batch not found');
             error.statusCode = 404;
             await session.abortTransaction();
             session.endSession();
             return next(error);
        }
        if (batch.status !== 'Active') {
             const error = new Error('Only active batches can be ended this way.');
             error.statusCode = 400;
             await session.abortTransaction();
             session.endSession();
             return next(error);
        }


        const customer = batch.customer;
        const balanceBefore = customer.balance;
        const totalAmount = parseFloat(weight) * parseFloat(pricePerKg);
         if (isNaN(totalAmount) || totalAmount < 0) {
            const error = new Error('Invalid calculation for total amount. Check weight and price.');
            error.statusCode = 400;
            await session.abortTransaction();
            session.endSession();
            return next(error);
        }

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
            notes: `Bought back ${quantity} chickens (${weight}kg @ TK ${pricePerKg}/kg) and ended batch ${batch.batchNumber}`,
            batch: batch._id, // Link transaction to the batch being closed
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
    buyBackAndEndBatch, // Keep if still used, otherwise remove
    addDiscount,
    removeDiscount
};