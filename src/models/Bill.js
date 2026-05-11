const mongoose = require("mongoose");

const billSchema = new mongoose.Schema({
    patientId: {
        type: String, trim: true
    },
    employeeId: {
        type: String, trim: true
    },
    items: {
        serviceName: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            default: 0,
            required: true
        }
    },
    status: {
        type: String,
        enum: ["PENDING", "PAID", "PARTIAL"]
    },
    createdByEmployeeId: {
        type: String, trim: true
    }
});

module.exports = mongoose.model("Bill", billSchema);