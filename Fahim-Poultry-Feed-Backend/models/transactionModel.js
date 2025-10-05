const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
    // Core Fields for Every Transaction
    type: {
        type: String,
        required: true,
        enum: ['SALE', 'DEPOSIT', 'WITHDRAWAL', 'STOCK_ADD', 'STOCK_REMOVE', 'BUY_BACK', 'WHOLESALE_SALE', 'DISCOUNT', 'DISCOUNT_REMOVAL']
    },
    notes: {
        type: String,
        required: true
    },

    paymentMethod: {
        type: String,
        enum: ['Credit', 'Cash'],
        default: 'Credit'
    },

    randomCustomerName: {
        type: String,
    },

    

    // Relational Fields (links to other models)
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    wholesaleBuyer: { type: mongoose.Schema.Types.ObjectId, ref: 'WholesaleBuyer' },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },

    // Financial Fields
    amount: { type: Number },
    balanceBefore: { type: Number },
    balanceAfter: { type: Number },

    // Inventory Fields
    quantityChange: { type: Number },

    // Fields for 'SALE' and 'WHOLESALE_SALE' Type
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: Number,
        price: Number,
        name: String // Denormalized name for historical records
    }],
    customItems: [{
        name: String,
        quantity: Number,
        weight: Number,
        price: Number
    }],

    // Fields for 'BUY_BACK' Type
    buyBackQuantity: { type: Number }, // Number of chickens
    buyBackWeight: { type: Number }, // Total weight in kg
    buyBackPricePerKg: { type: Number },
    referenceName: { type: String },

}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);