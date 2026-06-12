const mongoose = require("mongoose");
const Counter = require("./Counter");

const patientSchema = new mongoose.Schema({

    UHID: { type: String, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    bloodGroup: { type: String, enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] },
    gender: { type: String, trim: true, enum: ["male", "female", "others"] },
    dob: { type: Date, required: true },
    address: {
        street: { type: String },
        city: { type: String },
        state: { type: String },
        pincode: { type: String }
    },
    emergencyContact: {
        name: { type: String },
        relation: { type: String },
        phone: { type: String }
    },
    status: { type: Boolean, default: true }
})


patientSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: 'patient' },
                { $inc: { seq: 1 } }, // Creates sequence
                { new: true, upsert: true } // upsert is update and insert
            );
            this.UHID = `HMS-${String(counter.seq).padStart(6, '0')}`; // create 6 digit sequence number
        } catch (err) {
            return next(err);
        }
    }

});

module.exports = mongoose.model("Patient", patientSchema)