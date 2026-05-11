const mongoose = require("mongoose");

const billSchema = new mongoose.Schema({

    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient"
    },

    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment"
    },

    items: [{
        serviceName: String,
        amount: Number
    }],

    total: Number,

    status: {
        type: String,
        enum: ["PENDING", "PAID", "PARTIAL"],
        default: "PENDING"
    },

    createdByEmployeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee"
    }

}, {
    timestamps: true
});

module.exports =
    mongoose.model("Bill", billSchema);