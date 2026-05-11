const mongoose = require("mongoose");
const Counter = require("./Counter");

const patientSchema = new mongoose.Schema({

    UHID: {
        type: String,
        unique: true
    },

    name: {
        type: String,
        required: true
    },

    phone: String,

    email: String,

    gender: String,

    dob: Date,

    address: String,

    emergencyContact: String,

    status: {
        type: String,
        enum: ["ACTIVE", "INACTIVE"],
        default: "ACTIVE"
    }

}, {
    timestamps: true
});

patientSchema.pre("save", async function (next) {

    if (this.isNew) {

        const counter = await Counter.findOneAndUpdate(
            { name: "patient" },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );

        this.UHID =
            `UHID-${String(counter.seq).padStart(6, "0")}`;

        next();
    }
});

module.exports =
    mongoose.model("Patient", patientSchema);