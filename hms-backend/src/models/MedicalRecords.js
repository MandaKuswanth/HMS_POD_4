const mongoose = require("mongoose");

const medicalRecordSchema = new mongoose.Schema({

    appointmentId: { type: String, required: true },
    patientId: { type: String, required: true },
    doctorEmployeeId: { type: String, required: true },
    symptoms: { type: String, required: true },
    diagnosis: { type: String, required: true },
    prescriptionItems: [{
        name: { type: String, required: true },
        dosage: { type: String, required: true },
        duration: { type: String, required: true }
    }],
    notes: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);

