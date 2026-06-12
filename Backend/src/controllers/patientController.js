const Patient = require("../models/Patient");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const { cancelPatientAppointments } = require("../controllers/appointmentController");
const sendEmail = require("../utils/sendEmail");


exports.createPatient = async (req, res) => {
    try {
        const {
            name,
            phone,
            email,
            gender,
            bloodGroup,
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
            bloodGroup,
            dob,
            address,
            emergencyContact
        });

        await sendEmail({
            to: patient.email,
            subject: "Welcome to HMS",
            html: `
                <h2>Patient Registration Successful</h2>

                <p>Hello ${patient.name},</p>

                <p>Your patient profile has been successfully registered in HMS.</p>

                <p><strong>UHID:</strong> ${patient.UHID}</p>

                <p>You can use this UHID for future appointments and hospital visits.</p>

                <p>Thank you,<br/>HMS Team</p>
            `
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
            "bloodGroup",
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

        const cancelledAppointments = await cancelPatientAppointments(
            uhid,
            "Patient has been removed from the hospital system"
        );

        await sendEmail({
            to: patient.email,
            subject: "Patient Profile Removed",
            html: `
                <h2>Patient Profile Removed</h2>

                <p>Hello ${patient.name},</p>

                <p>Your patient profile has been removed from HMS.</p>

                <p><strong>UHID:</strong> ${patient.UHID}</p>

                <p>If you believe this was done in error, please contact hospital administration.</p>

                <p>Thank you,<br/>HMS Team</p>
            `
        });

        await Patient.deleteOne({ UHID: uhid });

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    uhid: patient.UHID,
                    name: patient.name,
                    cancelledAppointments
                },
                `Patient deleted successfully. ${cancelledAppointments} related appointment(s) cancelled.`
            )
        );

    } catch (err) {
        console.error(err);
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};


exports.togglePatientStatus = async (req, res) => {
    try {
        const { uhid } = req.params;

        const patient = await Patient.findOne({ UHID: uhid });

        if (!patient) {
            return res.status(404).json({
                message: "Patient not found"
            });
        }

        patient.status = !patient.status;

        await patient.save();

        await sendEmail({
            to: patient.email,
            subject: "HMS Patient Status Updated",
            html: `
                <h2>Patient Status Updated</h2>

                <p>Hello ${patient.name},</p>

                <p>Your patient profile status has been updated.</p>

                <p>
                    <strong>Status:</strong>
                    ${patient.status ? "ACTIVE" : "INACTIVE"}
                </p>

                ${
                    patient.status
                        ? `<p>Your patient profile is now active.</p>`
                        : `<p>Your patient profile has been deactivated. Please contact hospital administration for more information.</p>`
                }

                <p>Thank you,<br/>HMS Team</p>
            `
        });

        res.status(200).json({
            message: "Status updated successfully",
            data: patient
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
};