const Patient = require("../models/Patient");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");


exports.createPatient = async (req, res) => {
    try {
        const {
            name,
            phone,
            email,
            gender,
            dob,
            address,
            emergencyContact
        } = req.body;

        if (!name || !phone || !email || !dob) {
            return res.status(400).json(
                new ApiError(400, "Required fields missing")
            );
        }

        const existingPatient = await Patient.findOne({
            $or: [{ phone }, { email }]
        });

        if (existingPatient) {
            return res.status(409).json(
                new ApiError(409, "Patient already exists")
            );
        }

        const patient = await Patient.create({
            name,
            phone,
            email,
            gender,
            dob,
            address,
            emergencyContact
        });

        return res.status(201).json(
            new ApiResponse(201, patient, "Patient created successfully")
        );

    } catch (err) {
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};

exports.getPatients = async (req, res) => {
    try {
        const patients = await Patient.find().sort({ createdAt: -1 });

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    patients,
                    count: patients.length
                },
                "Patients fetched successfully"
            )
        );

    } catch (err) {
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};


exports.getPatientById = async (req, res) => {
    try {
        const { uhid } = req.params;

        const patient = await Patient.findOne({ UHID: uhid });

        if (!patient) {
            return res.status(404).json(
                new ApiError(404, "Patient not found")
            );
        }

        return res.status(200).json(
            new ApiResponse(200, patient, "Patient retrieved successfully")
        );

    } catch (err) {
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};


exports.updatePatient = async (req, res) => {
    try {
        const { uhid } = req.params;

        const patient = await Patient.findOne({ UHID: uhid });

        if (!patient) {
            return res.status(404).json(
                new ApiError(404, "Patient not found")
            );
        }

        const allowedFields = [
            "name",
            "phone",
            "email",
            "gender",
            "dob",
            "address",
            "emergencyContact"
        ];

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                patient[field] = req.body[field];
            }
        });

        await patient.save();

        return res.status(200).json(
            new ApiResponse(200, patient, "Patient updated successfully")
        );

    } catch (err) {
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};


exports.deletePatient = async (req, res) => {
    try {
        const { uhid } = req.params;

        const patient = await Patient.findOne({ UHID: uhid });

        if (!patient) {
            return res.status(404).json(
                new ApiError(404, "Patient not found")
            );
        }

        await Patient.deleteOne({ UHID: uhid });

        return res.status(200).json(
            new ApiResponse(200, null, "Patient deleted successfully")
        );

    } catch (err) {
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};