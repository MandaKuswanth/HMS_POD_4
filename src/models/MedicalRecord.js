const mongoose = require("mongoose");

const medicalRecordSchema = new mongoose.Schema({

    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment"
    },

    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient"
    },

    doctorEmployeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee"
    },

    symptoms: String,

    diagnosis: String,

    prescriptionItems: [{
        name: String,
        dosage: String,
        duration: String
    }],

    notes: String

}, {
    timestamps: true
});

module.exports =
    mongoose.model("MedicalRecord", medicalRecordSchema);