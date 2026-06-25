const mongoose = require("mongoose");
const { Schema } = mongoose;
const Counter = require("./Counter");

const consultationSchema = new Schema(
    {
        consultationId: {
            type: String,
            unique: true
        },
        appointmentId: {
            type: String,
            required: true,
            trim: true
        },
        patientId: {
            type: String,
            required: true,
            trim: true
        },
        doctorEmployeeId: {
            type: String,
            required: true,
            trim: true
        },
        symptoms: {
            type: String,
            required: true,
            trim: true
        },
        diagnosis: {
            type: String,
            required: true,
            trim: true
        },
        fee: {
            type: Number,
            required: true,
            min: 0
        },
        status: {
            type: String,
            enum: ["PENDING", "COMPLETED", "CANCELLED"],
            default: "COMPLETED"
        },
        isDeleted: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

consultationSchema.pre("save", async function (next) {
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: "consultation" },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            this.consultationId = `CNS-${String(counter.seq).padStart(6, "0")}`;
        } catch (err) {
            return next(err);
        }
    }
});

consultationSchema.index({ consultationId: 1 }, { unique: true });
consultationSchema.index({ appointmentId: 1 });
consultationSchema.index({ patientId: 1 });
consultationSchema.index({ doctorEmployeeId: 1 });
consultationSchema.index({ isDeleted: 1 });

module.exports = mongoose.model("Consultation", consultationSchema);
