const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({

    billId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Bill"
    },

    amount: Number,

    method: {
        type: String,
        enum: ["CASH", "CARD", "UPI"]
    },

    paidAt: Date,

    receivedByEmployeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee"
    }

}, {
    timestamps: true
});

module.exports =
    mongoose.model("Payment", paymentSchema);