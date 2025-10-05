const mongoose = require('mongoose');
const Customer = require('../models/customerModel');
const Transaction = require('../models/transactionModel');
const Batch = require('../models/batchModel');

// @desc   Get all customers
// @route  GET /api/customers
const getCustomers = async (req, res) => {
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
    console.error("ERROR IN getCustomers:", error);
    res.status(500).json({ error: error.message });
  }
};

const getCustomer = async (req, res) => {
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
        res.status(500).json({ error: error.message });
    }
};

// @desc   Create a new customer
// @route  POST /api/customers
const createCustomer = async (req, res) => {
  const { name, phone, email, address } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required fields.' });
  }

  try {
    const newCustomer = await Customer.create({ name, phone, email, address });
    res.status(201).json(newCustomer);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'A customer with this phone number already exists.' });
    }
    res.status(500).json({ error: error.message });
  }
};

// --- THIS IS THE DEPOSIT FUNCTION ---
// @desc   Add a deposit to a customer's balance
// @route  PATCH /api/customers/:id/deposit
const addDeposit = async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'No such customer' });
  }

  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'A invalid deposit amount was provided.' });
  }

  try {
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    // Add the amount to the current balance
    const balanceBefore = customer.balance;
    customer.balance += amount;
    const updatedCustomer = await customer.save();
    
    //const balanceBefore = customer.balance - amount; // Recalculate pre-deposit balance
    await Transaction.create({
    type: 'DEPOSIT',
    customer: id,
    amount: amount,
    balanceBefore: balanceBefore,
    balanceAfter: customer.balance,
    notes: `Deposit of $${amount.toFixed(2)} for ${customer.name}`
});

    res.status(200).json(updatedCustomer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//Withdrawal
const makeWithdrawal = async (req, res) => {
    const { id } = req.params;
    const { amount } = req.body;

    if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: 'Invalid withdrawal amount.' });
    }

    try {
        const customer = await Customer.findById(id);
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found.' });
        }

        // Check if the customer has enough balance for the withdrawal
        if (customer.balance < amount) {
            return res.status(400).json({ error: `Insufficient balance. Available: ${customer.balance.toFixed(2)}` });
        }

        const balanceBefore = customer.balance;
        customer.balance -= amount;
        const updatedCustomer = await customer.save();
        
        //const balanceBefore = customer.balance + amount; // Recalculate pre-withdrawal balance
      await Transaction.create({
    type: 'WITHDRAWAL',
    customer: id,
    amount: -amount,
    balanceBefore: balanceBefore,
    balanceAfter: customer.balance,
    notes: `Withdrawal of $${amount.toFixed(2)} by ${customer.name}`
});

        res.status(200).json(updatedCustomer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
const deleteCustomer = async (req, res) => {
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
        res.status(500).json({ error: error.message });
    }
};

//Update Customer
const updateCustomer = async (req, res) => {
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
        res.status(500).json({ error: error.message });
    }
};

//Update Product
const updateProduct = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({error: 'No such product'});
    }

    try {
        const product = await Product.findByIdAndUpdate(id, { ...req.body }, { new: true });
        if (!product) {
            return res.status(404).json({error: 'No such product'});
        }
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//Delete Product
const deleteProduct = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({error: 'No such product'});
    }

    try {
        const product = await Product.findByIdAndDelete(id);
        if (!product) {
            return res.status(404).json({error: 'No such product'});
        }
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//Get Product
const getProduct = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({error: 'No such product'});
    }

    try {
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({error: 'No such product found'});
        }
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const buyFromCustomer = async (req, res) => {
    // Add referenceName to the destructuring
    const { customerId, quantity, weight, pricePerKg, referenceName } = req.body;

    if (!customerId || !quantity || !weight || !pricePerKg) {
        return res.status(400).json({ message: 'Customer ID, quantity, weight, and price are required.' });
    }

    try {
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        const activeBatch = await Batch.findOne({ customer: customerId, status: 'Active' });
        if (!activeBatch) {
            return res.status(400).json({ message: 'Cannot buy from customer with no active batch.' });
        }

        const balanceBefore = customer.balance;
        const totalAmount = parseFloat(weight) * parseFloat(pricePerKg);

        customer.balance += totalAmount;
        await customer.save();

        // Log the detailed buy-back, now including the referenceName
        const newTransaction = await Transaction.create({
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
        });
        
        // Return the full transaction object
        res.status(200).json(newTransaction);

    } catch (error) {
        console.error("BUY_FROM_CUSTOMER ERROR:", error);
        res.status(500).json({ message: 'Server error during buy back', error });
    }
};



// EXPORT ALL FUNCTIONS AT THE END OF THE FILE
module.exports = {
  getCustomers,
  getCustomer,
  createCustomer,
  addDeposit,
  makeWithdrawal,
  deleteCustomer,
  updateCustomer,
  updateProduct, 
  deleteProduct,
  getProduct,
  buyFromCustomer
};