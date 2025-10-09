const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const saleSchema = new Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer', // This links the sale to a specific customer
    required: false,
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product', // Links to a specific product
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    price: { // We store the price at the time of sale
      type: Number,
      required: true,
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
  },

    batch: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Batch'
    },

// Add the new 'wholesaleBuyer' field
wholesaleBuyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WholesaleBuyer',
},

}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);