const mongoose = require("mongoose");
const Counter = require("./Counter");

const patientSchema = new mongoose.Schema({

    UHID: { type: String, unique: true },
    patientname: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    gender: { type: String, trim: true, enum: ["female", "male", "others"] },
    dob: { type: Date, required: true },
    address: { type: String },
    emergencyContact: {
        name: { type: String },
        relation: { type: String },
        phone: { type: String }
    },
    status: { type: Boolean, default: true }

});

patientSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: 'Patient' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            this.UHID = `PAT-${String(counter.seq).padStart(6, '0')}`;
        } catch (err) {
            return next(err);
        }
    }

});
module.exports = mongoose.model("Patient", patientSchema);