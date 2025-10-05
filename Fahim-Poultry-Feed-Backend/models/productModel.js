const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  sku: { // Stock Keeping Unit
    type: String,
    required: true,
    unique: true, // Every product needs a unique SKU
  },
  price: {
    type: Number,
    required: true,
    default: 0,
  },
  quantity: { // This is your stock level
    type: Number,
    required: true,
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);