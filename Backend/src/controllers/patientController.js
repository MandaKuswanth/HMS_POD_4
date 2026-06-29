const Patient = require("../models/Patient");
const User = require("../models/User");
const Role = require("../models/Role");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
const { sendEmail } = require("../utils/sendEmail");
const asyncHandler = require("../middleware/asyncHandler");
const { paginateQuery } = require("../utils/pagination");

// ─── Create Patient ──────────────────────────────────────────────────────────
exports.createPatient = asyncHandler(async (req, res) => {
    const { name, phone, email, gender, bloodGroup, dob, address, emergencyContact } = req.body;

    if (!name || !phone || !email || !dob) {
        throw new ApiError(400, "Required fields missing: name, phone, email, dob");
    }

    // Check for existing patient
    const existingPatient = await Patient.findOne({
        $or: [{ phone }, { email }],
        isDeleted: false
    });

    if (existingPatient) {
        throw new ApiError(409, "Patient already exists with this phone or email");
    }

    // Check for existing user account
    const existingUser = await User.findOne({
        email: email.trim().toLowerCase(),
        isDeleted: false
    });

    if (existingUser) {
        throw new ApiError(409, "A user account already exists with this email");
    }

    const patientRole = await Role.findOne({ name: "PATIENT", status: true });
    if (!patientRole) {
        throw new ApiError(404, "PATIENT role not found");
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
});

// ─── Get All Patients (Paginated & Searchable) ────────────────────────────────
exports.getPatients = asyncHandler(async (req, res) => {
    const filter = { isDeleted: false };
    const searchFields = ["name", "email", "phone", "UHID"];

    if (req.query.status && req.query.status !== "ALL") {
        filter.status = req.query.status === "ACTIVE";
    }

    if (req.query.gender && req.query.gender !== "ALL") {
        filter.gender = req.query.gender.toLowerCase();
    }

    const result = await paginateQuery({
        model: Patient,
        query: req.query,
        baseFilter: filter,
        searchFields,
        defaultSortField: "createdAt"
    });

    const activeCount = await Patient.countDocuments({ isDeleted: false, status: true });
    const inactiveCount = await Patient.countDocuments({ isDeleted: false, status: false });
    const allCount = activeCount + inactiveCount;

    return res.status(200).json(
        new ApiResponse(200, result.data, "Patients fetched successfully", {
            ...result.pagination,
            counts: { all: allCount, active: activeCount, inactive: inactiveCount }
        })
    );
});

// ─── Autocomplete Patient Search ──────────────────────────────────────────────
exports.getPatientsSearch = asyncHandler(async (req, res) => {
    const q = req.query.q || "";
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);

    const filter = { isDeleted: false, status: true };
    if (q.trim()) {
        filter.$or = [
            { name: { $regex: q.trim(), $options: "i" } },
            { UHID: { $regex: q.trim(), $options: "i" } },
            { phone: { $regex: q.trim(), $options: "i" } }
        ];
    }

    const patients = await Patient.find(filter)
        .select("_id UHID name email phone dob bloodGroup")
        .limit(limit)
        .lean();

    const mapped = patients.map((p) => ({
        _id: p._id,
        UHID: p.UHID,
        patientId: p.UHID, // for compatibility
        name: p.name,
        email: p.email,
        phone: p.phone
    }));

    return res.status(200).json(
        new ApiResponse(200, mapped, "Patients autocomplete fetched successfully")
    );
});

// ─── Get Patient By UHID ─────────────────────────────────────────────────────
exports.getPatientById = asyncHandler(async (req, res) => {
    const { uhid } = req.params;

    const patient = await Patient.findOne({ UHID: uhid, isDeleted: false });
    if (!patient) {
        throw new ApiError(404, "Patient not found");
    }

    return res.status(200).json(
        new ApiResponse(200, patient, "Patient retrieved successfully")
    );
});

// ─── Update Patient ──────────────────────────────────────────────────────────
exports.updatePatient = asyncHandler(async (req, res) => {
    const { uhid } = req.params;

    const patient = await Patient.findOne({ UHID: uhid, isDeleted: false });
    if (!patient) {
        throw new ApiError(404, "Patient not found");
    }

    const allowedUpdates = [
        "name", "phone", "gender", "bloodGroup", "dob", "address", "emergencyContact"
    ];

    allowedUpdates.forEach((update) => {
        if (req.body[update] !== undefined) {
            patient[update] = req.body[update];
        }
    });

    await patient.save();

    return res.status(200).json(
        new ApiResponse(200, patient, "Patient updated successfully")
    );
});

// ─── Delete Patient ──────────────────────────────────────────────────────────
exports.deletePatient = asyncHandler(async (req, res) => {
    const { uhid } = req.params;

    const patient = await Patient.findOne({ UHID: uhid, isDeleted: false });
    if (!patient) {
        throw new ApiError(404, "Patient profile not found");
    }

    const user = await User.findOne({ UHID: uhid, isDeleted: false });

    patient.isDeleted = true;
    patient.status = false;
    patient.deletedAt = new Date();
    patient.deletedBy = req.user?.employeeId || req.user?.id;
    await patient.save();

    if (user) {
        user.isDeleted = true;
        user.status = false;
        user.deletedAt = new Date();
        user.deletedBy = req.user?.employeeId || req.user?.id;
        await user.save();
    }

    // Cancel patient appointments
    const { cancelPatientAppointments } = require("../controllers/appointmentController");
    let cancelledAppointments = 0;
    if (cancelPatientAppointments) {
        cancelledAppointments = await cancelPatientAppointments(
            uhid,
            "Patient profile has been removed from the system"
        );
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            { cancelledAppointments },
            "Patient profile and associated account deleted successfully"
        )
    );
});

// ─── Toggle Patient Status ───────────────────────────────────────────────────
exports.togglePatientStatus = asyncHandler(async (req, res) => {
    const { uhid } = req.params;

    const patient = await Patient.findOne({ UHID: uhid, isDeleted: false });
    if (!patient) {
        throw new ApiError(404, "Patient profile not found");
    }

    const user = await User.findOne({ UHID: uhid, isDeleted: false });
    if (!user) {
        throw new ApiError(404, "User account not found");
    }

    patient.status = !patient.status;
    user.status = patient.status;

    await patient.save();
    await user.save();

    // Cancel appointments if deactivated
    const { cancelPatientAppointments } = require("../controllers/appointmentController");
    let cancelledAppointments = 0;
    if (!patient.status && cancelPatientAppointments) {
        cancelledAppointments = await cancelPatientAppointments(
            uhid,
            "Patient account has been deactivated"
        );
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            { status: patient.status, cancelledAppointments },
            `Patient status updated to ${patient.status ? "Active" : "Inactive"}`
        )
    );
});