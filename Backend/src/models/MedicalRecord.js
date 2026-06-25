const mongoose = require("mongoose");

const medicalRecordSchema = new mongoose.Schema({
    appointmentId: {
        type: String, trim: true
    },
    patientId: {
        type: String, trim: true
    },
    employeeId: {
        type: String, trim: true
    },
    symptoms: {
        type: String,
        required: true,
    },
    diagnosis: {
        type: String,
        required: true,
    },
    prescriptionItems: {
        name: { type: String },
        dosage: { type: String },
        duration: { type: String }
    },
    notes: {
        type: String,
    }
}, {
    timestamps: {
        createdAt: 'created_at'
    }
});

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);


