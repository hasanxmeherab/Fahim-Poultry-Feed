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
        // Consider making notes optional or providing a default based on type
        required: false // Example: Making it optional
    },
    paymentMethod: {
        type: String,
        enum: ['Credit', 'Cash'],
        // Default might depend on transaction type logic in controller
    },
    randomCustomerName: {
        type: String, // Only relevant for certain SALE types
    },

    // Relational Fields (links to other models)
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    wholesaleBuyer: { type: mongoose.Schema.Types.ObjectId, ref: 'WholesaleBuyer' },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // Used for STOCK_ADD/REMOVE
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },

    // Financial Fields
    amount: { type: Number }, // Total for SALE/BUY_BACK/DEPOSIT/WITHDRAWAL/DISCOUNT, +/- based on context
    balanceBefore: { type: Number }, // Customer/Buyer balance before transaction
    balanceAfter: { type: Number }, // Customer/Buyer balance after transaction

    // Inventory Fields (Primarily for STOCK_ADD/REMOVE, but could potentially link SALE items too)
    quantityChange: { type: Number }, // For STOCK_ADD/REMOVE

    // Fields for 'SALE' and 'WHOLESALE_SALE' Type
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // Link to the original product
        quantity: Number,
        price: Number, // Price *per unit* at time of sale
        name: String, // Denormalized name for historical records
        sku: String // OPTIONAL: Denormalized SKU for historical records
    }],
    // Fields specific to WHOLESALE_SALE (if structure differs significantly)
    customItems: [{ // Used specifically for WHOLESALE_SALE where products might not be in inventory
        name: String,
        quantity: Number, // Or maybe just description? Depends on need.
        weight: Number,
        price: Number // Price for this line item (total, not per unit/kg usually)
    }],

    // Fields for 'BUY_BACK' Type
    buyBackQuantity: { type: Number }, // Number of chickens/items
    buyBackWeight: { type: Number }, // Total weight in kg
    buyBackPricePerKg: { type: Number },
    referenceName: { type: String }, // Optional reference

}, { timestamps: true });

// Indexing suggestion for performance
transactionSchema.index({ customer: 1, createdAt: -1 });
transactionSchema.index({ wholesaleBuyer: 1, createdAt: -1 });
transactionSchema.index({ batch: 1, createdAt: -1 });
transactionSchema.index({ type: 1, createdAt: -1 });


module.exports = mongoose.model('Transaction', transactionSchema);