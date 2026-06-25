const mongoose = require("mongoose");
const Counter = require("./Counter");

const appointmentSchema = new mongoose.Schema(
    {
        appointmentId: {
            type: String,
            unique: true
        },
        patientId: {
            type: String,
            trim: true
        },
        doctorEmployeeId: {
            type: String,
            trim: true
        },
        date: {
            type: Date
        },
        timeSlot: {
            type: String
        },
        status: {
            type: String,
            enum: [
                "PENDING",
                "BOOKED",
                "CANCELLED",
                "COMPLETED",
                "IN-PROCESS"
            ],
            default: "PENDING"
        },
        reason: {
            type: String,
            default: ""
        },
        createdByEmployeeId: {
            type: String,
            trim: true
        },
        cancellationReason: {
            type: String,
            default: null
        },
        completedAt: {
            type: Date,
            default: null
        },
        scheduledAt: {
            type: Date
        },
        // Soft delete fields
        isDeleted: {
            type: Boolean,
            default: false
        },
        deletedAt: {
            type: Date,
            default: null
        },
        deletedBy: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
);

appointmentSchema.index({ doctorEmployeeId: 1, scheduledAt: 1 });
appointmentSchema.index({ status: 1 });

appointmentSchema.pre("save", async function (next) {
    if (this.date) {
        this.scheduledAt = this.date;
    }
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: "appointment" },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            this.appointmentId = `APT-${String(counter.seq).padStart(6, "0")}`;
        } catch (err) {
            return next(err);
        }
    }
});

module.exports = mongoose.model("Appointment", appointmentSchema);