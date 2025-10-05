const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const batchSchema = new Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
    },
    startDate: {
        type: Date,
        default: Date.now,
        required: true,
    },
    endDate: {
        type: Date,
    },
    status: {
        type: String,
        required: true,
        enum: ['Active', 'Completed'],
        default: 'Active',
    },
    batchNumber: {
        type: Number,
        required: true,
    },
    startingBalance: {
        type: Number,
        required: true,
        default: 0,
    },
    endingBalance: {
        type: Number,
    },

    discounts: [{
        description: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true
        }
    }]

}, { timestamps: true });

module.exports = mongoose.model('Batch', batchSchema);