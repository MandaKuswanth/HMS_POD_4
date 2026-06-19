const MedicalRecord = require('../models/MedicalRecord');
const { ApiError } = require('../utils/ApiError');
const { ApiResponse } = require('../utils/ApiResponse');

exports.createMedicalRecord = async (req, res) => {
    try {
        const { appointmentId, patientId, symptoms, diagnosis, prescriptionItems, notes } = req.body;
        
        // employeeId comes from logged in user
        const employeeId = req.user.employeeId;

        const record = await MedicalRecord.create({
            appointmentId,
            patientId,
            employeeId,
            symptoms,
            diagnosis,
            prescriptionItems,
            notes
        });

        res.status(201).json(new ApiResponse(201, record, "Medical record created successfully"));
    } catch (error) {
        res.status(500).json(new ApiError(500, error.message));
    }
};

exports.getMedicalRecordsByPatient = async (req, res) => {
    try {
        const { patientId } = req.params;
        const records = await MedicalRecord.find({ patientId }).sort({ createdAt: -1 });
        res.status(200).json(new ApiResponse(200, records, "Records fetched successfully"));
    } catch (error) {
        res.status(500).json(new ApiError(500, error.message));
    }
};

exports.getAllMedicalRecords = async (req, res) => {
    try {
        const records = await MedicalRecord.find().sort({ createdAt: -1 });
        res.status(200).json(new ApiResponse(200, records, "Records fetched successfully"));
    } catch (error) {
        res.status(500).json(new ApiError(500, error.message));
    }
};

exports.updateMedicalRecord = async (req, res) => {
    try {
        const { recordId } = req.params;
        const record = await MedicalRecord.findByIdAndUpdate(recordId, req.body, { new: true });
        
        if (!record) {
            return res.status(404).json(new ApiError(404, "Medical record not found"));
        }

        res.status(200).json(new ApiResponse(200, record, "Medical record updated successfully"));
    } catch (error) {
        res.status(500).json(new ApiError(500, error.message));
    }
};

exports.deleteMedicalRecord = async (req, res) => {
    try {
        const { recordId } = req.params;
        const record = await MedicalRecord.findByIdAndDelete(recordId);

        if (!record) {
            return res.status(404).json(new ApiError(404, "Medical record not found"));
        }

        res.status(200).json(new ApiResponse(200, null, "Medical record deleted successfully"));
    } catch (error) {
        res.status(500).json(new ApiError(500, error.message));
    }
};
