const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
    billId: {
        type: String, trim: true
    },
    amount: {
        type: Number,
        requried: True,
    },
    method: {
        type: String,
        enum: ["CASH", "CARD", "UPI"]
    },
    receivedByEmployeeId: {
        type: String, trim: true
    }
}, {
    timestamps: {
        paidAt: "created_at"
    }
});

