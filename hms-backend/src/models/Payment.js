const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({

    billId: { type: String, required: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ["CASH", "CARD", "UPI"], required: true },
    paidAt: { type: Date, default: Date.now },
    receivedByEmployeeId: { type: String, required: true }
});

module.exports = mongoose.model("Payment", paymentSchema);