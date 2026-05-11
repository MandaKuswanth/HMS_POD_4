const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({

    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient"
    },

    doctorEmployeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee"
    },

    date: Date,

    timeSlot: String,

    status: {
        type: String,
        enum: [
            "BOOKED",
            "CANCELLED",
            "COMPLETED"
        ],
        default: "BOOKED"
    },

    createdByEmployeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee"
    }

}, {
    timestamps: true
});

module.exports =
    mongoose.model("Appointment", appointmentSchema);