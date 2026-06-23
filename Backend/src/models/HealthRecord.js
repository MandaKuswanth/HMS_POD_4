const mongoose = require("mongoose");
const Counter = require("./Counter");

const healthRecordSchema = new mongoose.Schema(
    {
        healthRecordId: {
            type: String,
            trim: true,
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
        prescription: {
            type: String,
            trim: true,
            default: ""
        },
        notes: {
            type: String,
            trim: true,
            default: ""
        },
        createdBy: {
            type: String,
            default: null
        },
        updatedBy: {
            type: String,
            default: null
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
        timestamps: true,
        versionKey: false
    }
);

healthRecordSchema.pre("save", async function (next) {
    try {
        if (this.isNew && !this.healthRecordId) {
            const counter = await Counter.findOneAndUpdate(
                { name: "healthRecord" },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            this.healthRecordId = `HR-${String(counter.seq).padStart(6, "0")}`;
        }
        
    } catch (error) {
        next(error);
    }
});

healthRecordSchema.index({ healthRecordId: 1 }, { unique: true });
healthRecordSchema.index({ appointmentId: 1 }, { unique: true });
healthRecordSchema.index({ patientId: 1 });
healthRecordSchema.index({ doctorEmployeeId: 1 });
healthRecordSchema.index({ isDeleted: 1 });

module.exports = mongoose.model("HealthRecord", healthRecordSchema);