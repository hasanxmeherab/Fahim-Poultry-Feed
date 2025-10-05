const mongoose = require('mongoose');
const wholesaleBuyerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    businessName: { type: String },
    phone: { type: String, required: true, unique: true },
    address: { type: String },
    balance: { type: Number, required: true, default: 0 },
}, { timestamps: true });
module.exports = mongoose.model('WholesaleBuyer', wholesaleBuyerSchema);