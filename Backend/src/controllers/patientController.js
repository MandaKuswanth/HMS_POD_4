const Patient = require("../models/Patient");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const User = require("../models/User");
const Role = require("../models/Role");
const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
const { cancelPatientAppointments } = require("../controllers/appointmentController");
const {sendEmail} = require("../utils/sendEmail");

const escapeRegex = (value = "") => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};
// ─── Create Patient ──────────────────────────────────────────────────────────

exports.createPatient = async (req, res) => {
    try {
        const { name, phone, email, gender, bloodGroup, dob, address, emergencyContact } =
            req.body;

        if (!name || !phone || !email || !dob) {
            return res.status(400).json(new ApiError(400, "Required fields missing: name, phone, email, dob"));
        }

        // Check for existing active patient with same phone or email
        const existingPatient = await Patient.findOne({
            $or: [{ phone }, { email }],
            isDeleted: false
        });

        if (existingPatient) {
            return res.status(409).json(new ApiError(409, "Patient already exists with this phone or email"));
        }

        // Check for existing user with same email (could be an employee)
        const existingUser = await User.findOne({
            email: email.trim().toLowerCase(),
            isDeleted: false
        });

        if (existingUser) {
            return res.status(409).json(
                new ApiError(409, "A user account already exists with this email")
            );
        }

        const patientRole = await Role.findOne({ name: "PATIENT", status: true });
        if (!patientRole) {
            return res.status(404).json(new ApiError(404, "PATIENT role not found"));
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

        const tempPassword = crypto.randomBytes(8).toString("hex");
        console.log("Generated Temporary Password for Patient:", tempPassword);

        const passwordHash = await bcrypt.hash(tempPassword, 10);

        await User.create({
            email: email.trim().toLowerCase(),
            passwordHash,
            isEmployee: false,
            UHID: patient.UHID,
            roleIds: [patientRole.roleId],
            status: true,
            mustResetPassword: true
        });

        try {
            await sendEmail({
                to: patient.email,
                subject: "Welcome to HMS",
                html: `
                    <h2>Patient Registration Successful</h2>
                    <p>Hello ${patient.name},</p>
                    <p>Your patient profile has been successfully registered in HMS.</p>
                    <p><strong>UHID:</strong> ${patient.UHID}</p>
                    <p><strong>Email:</strong> ${patient.email}</p>
                    <p><strong>Temporary Password:</strong> ${tempPassword}</p>
                    <p>Please login and reset your password immediately.</p>
                    <p>Thank you,<br/>HMS Team</p>
                `
            });
        } catch (emailError) {
            console.error("Patient welcome email failed:", emailError);
        }

        return res.status(201).json(
            new ApiResponse(201, { patient, loginEnabled: true }, "Patient created successfully")
        );
    } catch (err) {
        console.error(err);
        return res.status(500).json(new ApiError(500, err.message || "Internal Server Error"));
    }
};

// ─── Get All Patients (paginated) ────────────────────────────────────────────

exports.getPatients = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.max(Number(req.query.limit) || 10, 1);
        const skip = (page - 1) * limit;

        const { search } = req.query;

        const query = { isDeleted: false };

        if (search && search.trim()) {
            const regex = new RegExp(escapeRegex(search.trim()), "i");

            query.$or = [
                { UHID: regex },
                { name: regex },
                { email: regex },
                { phone: regex },
                { gender: regex },
                { address: regex },
                { emergencyContact: regex }
            ];
        }

        const totalRecords = await Patient.countDocuments(query);

        const patients = await Patient.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    records: patients,
                    pagination: {
                        totalRecords,
                        currentPage: page,
                        totalPages: Math.ceil(totalRecords / limit),
                        limit
                    }
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

// ─── Get Patient By UHID ─────────────────────────────────────────────────────

exports.getPatientById = async (req, res) => {
    try {
        const { uhid } = req.params;

        const patient = await Patient.findOne({ UHID: uhid, isDeleted: false });
        if (!patient) {
            return res.status(404).json(new ApiError(404, "Patient not found"));
        }

        return res.status(200).json(
            new ApiResponse(200, patient, "Patient retrieved successfully")
        );
    } catch (err) {
        return res.status(500).json(new ApiError(500, err.message || "Internal Server Error"));
    }
};

// ─── Update Patient ──────────────────────────────────────────────────────────

exports.updatePatient = async (req, res) => {
    try {
        const { uhid } = req.params;

        const patient = await Patient.findOne({ UHID: uhid, isDeleted: false });
        if (!patient) {
            return res.status(404).json(new ApiError(404, "Patient not found"));
        }

        // Check email uniqueness (exclude current patient)
        if (req.body.email && req.body.email !== patient.email) {
            const emailTaken = await Patient.findOne({
                email: req.body.email,
                isDeleted: false,
                UHID: { $ne: uhid }
            });

            if (emailTaken) {
                return res.status(409).json(new ApiError(409, "Email already in use by another patient"));
            }
        }

        // Check phone uniqueness (exclude current patient)
        if (req.body.phone && req.body.phone !== patient.phone) {
            const phoneTaken = await Patient.findOne({
                phone: req.body.phone,
                isDeleted: false,
                UHID: { $ne: uhid }
            });

            if (phoneTaken) {
                return res.status(409).json(new ApiError(409, "Phone already in use by another patient"));
            }
        }

        const allowedFields = [
            "name", "phone", "email", "gender",
            "bloodGroup", "dob", "address", "emergencyContact"
        ];

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                patient[field] = req.body[field];
            }
        });

        await patient.save();

        // Keep user email in sync
        const user = await User.findOne({ UHID: patient.UHID, isDeleted: false });
        if (user && req.body.email !== undefined) {
            user.email = req.body.email.trim().toLowerCase();
            await user.save();
        }

        return res.status(200).json(
            new ApiResponse(200, patient, "Patient updated successfully")
        );
    } catch (err) {
        console.error(err);
        return res.status(500).json(new ApiError(500, err.message || "Internal Server Error"));
    }
};

// ─── Soft Delete Patient ─────────────────────────────────────────────────────

exports.deletePatient = async (req, res) => {
    try {
        const { uhid } = req.params;

        const patient = await Patient.findOne({ UHID: uhid, isDeleted: false });
        if (!patient) {
            return res.status(404).json(new ApiError(404, "Patient not found"));
        }

        // Cancel all active appointments before deleting
        const cancelledAppointments = await cancelPatientAppointments(
            uhid,
            "Patient has been removed from the hospital system"
        );

        // Soft delete patient
        patient.isDeleted = true;
        patient.deletedAt = new Date();
        patient.deletedBy = req.user?.employeeId || req.user?.id;
        patient.status = false;
        await patient.save();

        // Soft delete user account
        const user = await User.findOne({ UHID: patient.UHID, isDeleted: false });
        if (user) {
            user.isDeleted = true;
            user.deletedAt = new Date();
            user.deletedBy = req.user?.employeeId || req.user?.id;
            user.status = false;
            await user.save();
        }

        try {
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
        } catch (emailError) {
            console.error("Patient deletion email failed:", emailError);
        }

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
        return res.status(500).json(new ApiError(500, err.message || "Internal Server Error"));
    }
};

// ─── Toggle Patient Status ───────────────────────────────────────────────────

exports.togglePatientStatus = async (req, res) => {
    try {
        const { uhid } = req.params;

        const patient = await Patient.findOne({ UHID: uhid, isDeleted: false });
        if (!patient) {
            return res.status(404).json(new ApiError(404, "Patient not found"));
        }

        patient.status = !patient.status;
        await patient.save();

        // Keep user status in sync
        const user = await User.findOne({ UHID: patient.UHID, isDeleted: false });
        if (user) {
            user.status = patient.status;
            await user.save();
        }

        try {
            await sendEmail({
                to: patient.email,
                subject: "HMS Patient Status Updated",
                html: `
                    <h2>Patient Status Updated</h2>
                    <p>Hello ${patient.name},</p>
                    <p>Your patient profile status has been updated.</p>
                    <p><strong>Status:</strong> ${patient.status ? "ACTIVE" : "INACTIVE"}</p>
                    ${
                        patient.status
                            ? `<p>Your patient profile is now active.</p>`
                            : `<p>Your patient profile has been deactivated. Please contact hospital administration for more information.</p>`
                    }
                    <p>Thank you,<br/>HMS Team</p>
                `
            });
        } catch (emailError) {
            console.error("Status update email failed:", emailError);
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                patient,
                `Patient status ${patient.status ? "activated" : "deactivated"} successfully`
            )
        );
    } catch (err) {
        console.error(err);
        return res.status(500).json(new ApiError(500, err.message || "Internal Server Error"));
    }
};