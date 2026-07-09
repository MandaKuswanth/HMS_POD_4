const mongoose = require("mongoose");
const Counter = require("./Counter");

const employeeSchema = new mongoose.Schema(
    {
        employeeCode: {
            type: String,
            unique: true
        },
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        phone: {
            type: String,
            required: true,
            unique: true
        },
        department: {
            type: String,
            required: true
        },
        designation: {
            type: String,
            required: true
        },
        status: {
            type: Boolean,
            default: true
        },
        joiningDate: {
            type: Date
        },
        medicalRegistrationNo: {
            type: String
        },
        specialization: {
            type: String
        },
        qualification: {
            type: Array,
            default: []
        },
        consultationFee: {
            type: Number
        },
        availabilitySlots: {
            type: Array
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

employeeSchema.pre("save", async function () {
    if (this.isNew) {
        const counter = await Counter.findOneAndUpdate(
            { name: "employee" },
            { $inc: { seq: 1 } },
            { returnDocument: "after", upsert: true }
        );
        this.employeeCode = `EMP-${String(counter.seq).padStart(6, "0")}`;
    }
});

module.exports = mongoose.model("Employee", employeeSchema);