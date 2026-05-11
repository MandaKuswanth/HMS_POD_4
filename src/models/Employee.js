const mongoose = require("mongoose");
const Counter = require("./Counter");

const employeeSchema = new mongoose.Schema({

    employeeId: {
        type: String,
        unique: true
    },

    name: {
        type: String,
        required: true
    },

    phone: String,

    email: {
        type: String,
        unique: true
    },

    department: {
        type: String,
        enum: ["OPD", "IPD", "Lab", "Pharmacy", "Admin"]
    },

    designation: {
        type: String,
        enum: [
            "Doctor",
            "Nurse",
            "Receptionist",
            "Cashier",
            "Admin"
        ]
    },

    status: {
        type: String,
        enum: ["ACTIVE", "INACTIVE"],
        default: "ACTIVE"
    },

    joiningDate: Date,

    medicalRegistrationNo: {
        type: String,
        unique: true,
        sparse: true
    },

    specialization: String,

    qualification: [String],

    consultationFee: Number,

    availabilitySlots: [String]

}, {
    timestamps: true
});

employeeSchema.pre("save", async function (next) {

    if (this.isNew) {

        try {

            const counter = await Counter.findOneAndUpdate(
                { name: "employee" },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );

            this.employeeId =
                `EMP-${String(counter.seq).padStart(6, "0")}`;

            next();

        } catch (error) {

            next(error);
        }
    }
});

module.exports =
    mongoose.model("Employee", employeeSchema);