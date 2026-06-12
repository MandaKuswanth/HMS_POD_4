const mongoose = require("mongoose");
const Counter = require("./Counter");

const appointmentSchema = new mongoose.Schema({
    appointmentId: {
        type: String, unique: true,
    },
    patientId: {
        type: String, trim: true,
    },
    doctorEmployeeId: {
        type: String, trim: true
    },
    date: {
        type: Date,
    },
    timeSlot: {
        type: String,
    },
    status: {
        type: String,
        enum: ["PENDING",
            "BOOKED",
            "CANCELLED",
            "COMPLETED",
            "IN-PROCESS"],
        default: "PENDING"
    },
    createdByEmployeeId: {
        type: String, trim: true
    },
    cancellationReason: {
        type: String,
        default: null
    }
},
    {
        timestamps: true
    });

appointmentSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: 'appointment' },
                { $inc: { seq: 1 } }, // Creates sequence
                { new: true, upsert: true } // upsert is update and insert
            );
            this.appointmentId = `APT-${String(counter.seq).padStart(6, '0')}`; // create 6 digit sequence number
        } catch (err) {
            return next(err);
        }
    }

});

module.exports = mongoose.model("Appointment", appointmentSchema);