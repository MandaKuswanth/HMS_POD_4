const mongoose = require("mongoose");
const { Schema } = mongoose;
const Counter = require("./Counter");

const prescriptionSchema = new Schema(
    {
        prescriptionId: {
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
        medicines: [
            {
                medicineId: {
                    type: Schema.Types.ObjectId,
                    ref: "Medicine",
                    required: true
                },
                name: {
                    type: String,
                    required: true
                },
                dosage: {
                    type: String,
                    required: true
                },
                duration: {
                    type: String,
                    required: true
                },
                instructions: {
                    type: String,
                    default: ""
                }
            }
        ],
        notes: {
            type: String,
            default: ""
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

prescriptionSchema.pre("save", async function (next) {
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: "prescription" },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            this.prescriptionId = `PRC-${String(counter.seq).padStart(6, "0")}`;
        } catch (err) {
            return next(err);
        }
    }
});


prescriptionSchema.index({ appointmentId: 1 });
prescriptionSchema.index({ patientId: 1 });
prescriptionSchema.index({ doctorEmployeeId: 1 });
prescriptionSchema.index({ isDeleted: 1 });

module.exports = mongoose.model("Prescription", prescriptionSchema);
