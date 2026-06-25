const Appointment = require("../models/Appointment");
const Employee = require("../models/Employee");
const Patient = require("../models/Patient");
const User = require("../models/User");
const Role = require("../models/Role");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const { sendEmail } = require("../utils/sendEmail");
const asyncHandler = require("../middleware/asyncHandler");
const { paginateQuery } = require("../utils/pagination");

const {
    normalizeAppointmentDate,
    getTomorrowDate,
    isBeforeDoctorJoiningDate,
    findSlotConflict,
    getTodayDate
} = require("../utils/appointmentHelpers");

// Constants
const ALLOWED_STATUSES = new Set([
    "PENDING",
    "BOOKED",
    "IN-PROCESS",
    "COMPLETED",
    "CANCELLED"
]);

const STATUS_TRANSITIONS = {
    PENDING: ["BOOKED", "CANCELLED"],
    BOOKED: ["IN-PROCESS", "CANCELLED"],
    "IN-PROCESS": ["COMPLETED", "CANCELLED"],
    COMPLETED: [],
    CANCELLED: []
};

const SLOT_BLOCKING_STATUSES = ["PENDING", "BOOKED", "IN-PROCESS"];

// Helper: load user permissions
const getUserPermissions = async (userId) => {
    const user = await User.findById(userId).lean();
    if (!user) return { user: null, userPermissions: new Set() };

    const roles = await Role.find(
        { roleId: { $in: user.roleIds }, status: true },
        { permissions: 1 }
    ).lean();

    const userPermissions = new Set(roles.flatMap((r) => r.permissions || []));
    return { user, userPermissions };
};

// Helper: verify doctor role
const verifyDoctorByPermissions = async (doctorEmployeeCode) => {
    const doctorUser = await User.findOne(
        { employeeId: doctorEmployeeCode, isDeleted: false, status: true },
        { roleIds: 1, status: 1 }
    ).lean();

    if (!doctorUser) {
        return { valid: false, reason: "Doctor user account not found or is inactive" };
    }

    const roles = await Role.find(
        { roleId: { $in: doctorUser.roleIds }, status: true },
        { permissions: 1 }
    ).lean();

    const perms = new Set(roles.flatMap((r) => r.permissions || []));

    if (!perms.has("HEALTH_RECORD_CREATE")) {
        return { valid: false, reason: "Employee is not a doctor" };
    }

    return { valid: true };
};

// Helper: compute allowed next statuses
const getAllowedStatuses = (appointment, userPermissions, userEmployeeId) => {
    const { status, doctorEmployeeId } = appointment;
    const hasApprove = userPermissions.has("APPOINTMENT_APPROVE");
    const hasRead = userPermissions.has("APPOINTMENT_READ");

    const isDoctor = !hasApprove && hasRead && doctorEmployeeId === userEmployeeId;

    if (hasApprove) {
        return STATUS_TRANSITIONS[status] || [];
    }

    if (isDoctor) {
        if (status === "BOOKED") return ["IN-PROCESS"];
        if (status === "IN-PROCESS") return ["COMPLETED"];
    }

    return [];
};

// Helper: compute allowed UI actions
const getAllowedActions = (appointment, userPermissions, userEmployeeId) => {
    const actions = [];
    const { status, doctorEmployeeId } = appointment;

    const hasApprove = userPermissions.has("APPOINTMENT_APPROVE");
    const hasRead = userPermissions.has("APPOINTMENT_READ");
    const hasDelete = userPermissions.has("APPOINTMENT_DELETE");

    const isDoctor = !hasApprove && hasRead && doctorEmployeeId === userEmployeeId;

    const canUpdateByAdmin = hasApprove && ["PENDING", "BOOKED", "IN-PROCESS"].includes(status);
    const canUpdateByDoctor = isDoctor && ["BOOKED", "IN-PROCESS"].includes(status);

    if (status === "PENDING" && hasApprove) {
        actions.push("APPROVE", "REJECT");
    }

    if (!["COMPLETED", "IN-PROCESS"].includes(status) && hasDelete) {
        actions.push("DELETE");
    }

    if (canUpdateByAdmin || canUpdateByDoctor) {
        actions.push("UPDATE_STATUS");
    }

    return actions;
};

// Helper: format appointment
const formatAppointment = (appointment, patient, doctor, userPermissions, userEmployeeId) => ({
    _id: appointment._id,
    appointmentId: appointment.appointmentId,
    patientId: appointment.patientId,
    patientName: patient?.name || "N/A",
    patientPhone: patient?.phone || "N/A",
    patientEmail: patient?.email || "N/A",
    doctorEmployeeId: appointment.doctorEmployeeId,
    doctorName: doctor?.name || "N/A",
    doctorDepartment: doctor?.department || "N/A",
    doctorDesignation: doctor?.designation || "N/A",
    date: appointment.date,
    timeSlot: appointment.timeSlot,
    status: appointment.status,
    reason: appointment.reason || "",
    cancellationReason: appointment.cancellationReason || "",
    completedAt: appointment.completedAt || null,
    createdByEmployeeId: appointment.createdByEmployeeId || null,
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt,
    allowedActions: getAllowedActions(appointment, userPermissions, userEmployeeId),
    allowedStatuses: getAllowedStatuses(appointment, userPermissions, userEmployeeId)
});

// Helper: validate date
const validateAppointmentDate = (date, doctor) => {
    const appointmentDate = normalizeAppointmentDate(date);

    if (Number.isNaN(appointmentDate.getTime())) {
        throw new ApiError(400, "Invalid date format");
    }

    if (appointmentDate < getTomorrowDate()) {
        throw new ApiError(400, "Appointments can be booked only from tomorrow onwards");
    }

    if (isBeforeDoctorJoiningDate(appointmentDate, doctor)) {
        throw new ApiError(400, "Appointment cannot be booked before doctor's joining date");
    }

    return appointmentDate;
};

// Helper: validate slot conflicts
const validateSlotConflicts = async ({ patientId, doctorEmployeeId, date, timeSlot }) => {
    const doctorConflict = await findSlotConflict({
        doctorEmployeeId,
        date,
        timeSlot
    });

    if (doctorConflict) {
        throw new ApiError(409, "Doctor is already booked for this slot on the selected date");
    }

    const patientConflict = await findSlotConflict({
        patientId,
        date,
        timeSlot
    });

    if (patientConflict) {
        throw new ApiError(409, "Patient already has an appointment at this date and time slot");
    }
};

const sendAppointmentEmail = (patient, doctor, appointment, appointmentDate, timeSlot) => {
    if (!patient.email) return;

    sendEmail({
        to: patient.email,
        subject: "Appointment Confirmation - HMS",
        html: `
            <h2>Appointment Confirmed</h2>
            <p>Your appointment has been successfully booked.</p>
            <p><strong>Appointment ID:</strong> ${appointment.appointmentId}</p>
            <p><strong>Doctor:</strong> Dr. ${doctor.name}</p>
            <p><strong>Date:</strong> ${appointmentDate.toDateString()}</p>
            <p><strong>Time:</strong> ${timeSlot}</p>
            <p>Please arrive at least 10 minutes before your scheduled time.</p>
            <p>Thank you,<br/>HMS Team</p>
        `
    }).catch((err) => console.error("Email send failed:", err));
};

const validatePatientAndDoctor = async (patientId, doctorEmployeeId) => {
    const patient = await Patient.findOne(
        { UHID: patientId, isDeleted: false },
        { name: 1, email: 1, status: 1 }
    ).lean();

    if (!patient) throw new ApiError(404, "Patient not found");
    if (!patient.status) throw new ApiError(400, "Patient account is inactive");

    const doctor = await Employee.findOne(
        { employeeCode: doctorEmployeeId, isDeleted: false },
        { name: 1, status: 1, joiningDate: 1 }
    ).lean();

    if (!doctor) {
        throw new ApiError(404, "Doctor not found with provided employee code");
    }

    if (!doctor.status) {
        throw new ApiError(400, "Doctor account is inactive");
    }

    const { valid, reason } = await verifyDoctorByPermissions(doctorEmployeeId);
    if (!valid) throw new ApiError(400, reason);

    return { patient, doctor };
};

// ─── Create Appointment ──────────────────────────────────────────────────────
exports.createAppointment = asyncHandler(async (req, res) => {
    const { patientId, doctorEmployeeId, date, timeSlot, reason } = req.body;
    const createdByEmployeeId = req.user.employeeId || req.user.id;

    if (!patientId || !doctorEmployeeId || !date || !timeSlot) {
        throw new ApiError(400, "Missing required fields: patientId, doctorEmployeeId, date, timeSlot");
    }

    const { patient, doctor } = await validatePatientAndDoctor(patientId, doctorEmployeeId);
    const appointmentDate = validateAppointmentDate(date, doctor);

    await validateSlotConflicts({
        patientId,
        doctorEmployeeId,
        date: appointmentDate,
        timeSlot
    });

    let appointment;
    try {
        appointment = await Appointment.create({
            patientId,
            doctorEmployeeId,
            date: appointmentDate,
            timeSlot,
            reason: reason || "",
            createdByEmployeeId,
            status: "BOOKED"
        });
    } catch (err) {
        if (err.code === 11000) {
            throw new ApiError(409, "This slot was just taken. Please choose a different slot.");
        }
        throw err;
    }

    sendAppointmentEmail(patient, doctor, appointment, appointmentDate, timeSlot);

    return res.status(201).json(
        new ApiResponse(201, appointment, "Appointment created successfully")
    );
});

// ─── Get Appointments List ───────────────────────────────────────────────────
exports.getAppointments = asyncHandler(async (req, res) => {
    const { user, userPermissions } = await getUserPermissions(req.user.id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const baseFilter = { isDeleted: false };

    if (userPermissions.has("APPOINTMENT_APPROVE")) {
        // admin / receptionist -> see all
    } else if (userPermissions.has("APPOINTMENT_READ")) {
        // doctor -> see only own
        const doctor = await Employee.findOne(
            { employeeCode: user.employeeId, isDeleted: false },
            { employeeCode: 1 }
        ).lean();

        if (!doctor) {
            throw new ApiError(404, "Doctor profile not found");
        }

        baseFilter.doctorEmployeeId = doctor.employeeCode;
    } else if (!user.isEmployee) {
        // patient portal
        baseFilter.patientId = user.UHID;
    } else {
        throw new ApiError(403, "You are not allowed to view appointments");
    }

    if (req.query.status) {
        baseFilter.status = req.query.status;
    }

    if (req.query.patientId) {
        baseFilter.patientId = req.query.patientId;
    }

    const searchFields = ["patientId", "doctorEmployeeId", "appointmentId", "reason"];

    const result = await paginateQuery({
        model: Appointment,
        query: req.query,
        baseFilter,
        searchFields,
        defaultSortField: "date"
    });

    const patientIds = [...new Set(result.data.map((a) => a.patientId))];
    const doctorIds = [...new Set(result.data.map((a) => a.doctorEmployeeId))];

    const [patients, doctors] = await Promise.all([
        Patient.find({ UHID: { $in: patientIds } }, { UHID: 1, name: 1, phone: 1, email: 1 }).lean(),
        Employee.find({ employeeCode: { $in: doctorIds } }, { employeeCode: 1, name: 1, department: 1, designation: 1 }).lean()
    ]);

    const patientMap = new Map(patients.map((p) => [p.UHID, p]));
    const doctorMap = new Map(doctors.map((d) => [d.employeeCode, d]));

    const formattedAppointments = result.data.map((appointment) =>
        formatAppointment(
            appointment,
            patientMap.get(appointment.patientId),
            doctorMap.get(appointment.doctorEmployeeId),
            userPermissions,
            user.employeeId
        )
    );

    return res.status(200).json(
        new ApiResponse(200, formattedAppointments, "Appointments fetched successfully", result.pagination)
    );
});

// ─── Autocomplete Appointment Search ─────────────────────────────────────────
exports.getAppointmentsSearch = asyncHandler(async (req, res) => {
    const q = req.query.q || "";
    const status = req.query.status || "";
    const patientId = req.query.patientId || "";
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);

    const filter = { isDeleted: false };

    if (status) {
        filter.status = status.toUpperCase();
    }
    if (patientId) {
        filter.patientId = patientId;
    }

    if (q.trim()) {
        filter.$or = [
            { appointmentId: { $regex: q.trim(), $options: "i" } },
            { reason: { $regex: q.trim(), $options: "i" } }
        ];
    }

    const appointments = await Appointment.find(filter)
        .select("_id appointmentId patientId doctorEmployeeId date timeSlot status reason")
        .limit(limit)
        .lean();

    return res.status(200).json(
        new ApiResponse(200, appointments, "Appointments autocomplete fetched successfully")
    );
});

// ─── Get Appointment By ID ───────────────────────────────────────────────────
exports.getAppointmentById = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;
    const { user, userPermissions } = await getUserPermissions(req.user.id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const appointment = await Appointment.findOne({ appointmentId, isDeleted: false });
    if (!appointment) {
        throw new ApiError(404, "Appointment not found");
    }

    const isDoctor = userPermissions.has("APPOINTMENT_READ") && !userPermissions.has("APPOINTMENT_APPROVE");
    if (isDoctor && appointment.doctorEmployeeId !== user.employeeId) {
        throw new ApiError(403, "You can only view your own appointments");
    } else if (!user.isEmployee && appointment.patientId !== user.UHID) {
        throw new ApiError(403, "You can only view your own appointments");
    }

    const [patient, doctor] = await Promise.all([
        Patient.findOne({ UHID: appointment.patientId, isDeleted: false }).lean(),
        Employee.findOne({ employeeCode: appointment.doctorEmployeeId, isDeleted: false }).lean()
    ]);

    const formatted = formatAppointment(appointment, patient, doctor, userPermissions, user.employeeId);

    return res.status(200).json(
        new ApiResponse(200, formatted, "Appointment retrieved successfully")
    );
});

// ─── Update Appointment Details / Reschedule ─────────────────────────────────
exports.updateAppointment = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;
    const { date, timeSlot, reason } = req.body;
    const { user, userPermissions } = await getUserPermissions(req.user.id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const appointment = await Appointment.findOne({ appointmentId, isDeleted: false });
    if (!appointment) {
        throw new ApiError(404, "Appointment not found");
    }

    const isDoctor = userPermissions.has("APPOINTMENT_READ") && !userPermissions.has("APPOINTMENT_APPROVE");
    if (isDoctor && appointment.doctorEmployeeId !== user.employeeId) {
        throw new ApiError(403, "You can only reschedule your own appointments");
    }

    const doctor = await Employee.findOne({ employeeCode: appointment.doctorEmployeeId, isDeleted: false }).lean();
    if (!doctor) {
        throw new ApiError(404, "Doctor profile not found");
    }

    await validateReschedule({ appointment, doctor, date, timeSlot });

    if (reason !== undefined) {
        appointment.reason = reason;
    }

    await appointment.save();

    const [patient, fullDoctor] = await Promise.all([
        Patient.findOne({ UHID: appointment.patientId, isDeleted: false }).lean(),
        Employee.findOne({ employeeCode: appointment.doctorEmployeeId, isDeleted: false }).lean()
    ]);

    const formatted = formatAppointment(appointment, patient, fullDoctor, userPermissions, user.employeeId);

    return res.status(200).json(
        new ApiResponse(200, formatted, "Appointment updated successfully")
    );
});

// ─── Update Appointment Status ────────────────────────────────────────────────
exports.updateAppointmentStatus = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;
    const { status, cancellationReason } = req.body;
    const { user, userPermissions } = await getUserPermissions(req.user.id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const appointment = await Appointment.findOne({ appointmentId, isDeleted: false });
    if (!appointment) {
        throw new ApiError(404, "Appointment not found");
    }

    if (!status) {
        throw new ApiError(400, "Status is required");
    }

    if (!ALLOWED_STATUSES.has(status)) {
        throw new ApiError(400, "Invalid status value");
    }

    // Business flow validations
    if (["IN-PROCESS", "COMPLETED"].includes(status) && appointment.date > getTodayDate()) {
        throw new ApiError(400, "Cannot mark a future appointment as IN-PROCESS or COMPLETED");
    }

    const allowed = STATUS_TRANSITIONS[appointment.status];
    if (!allowed.includes(status)) {
        throw new ApiError(400, `Cannot transition from ${appointment.status} to ${status}`);
    }

    const hasApprove = userPermissions.has("APPOINTMENT_APPROVE");
    const hasRead = userPermissions.has("APPOINTMENT_READ");

    if (!hasApprove && hasRead) {
        if (appointment.doctorEmployeeId !== user.employeeId) {
            throw new ApiError(403, "You can only update status of your own appointments");
        }
        if (!["IN-PROCESS", "COMPLETED"].includes(status)) {
            throw new ApiError(403, "Doctors can only mark appointments as IN-PROCESS or COMPLETED");
        }
    } else if (!hasApprove) {
        throw new ApiError(403, "You are not authorized to update appointment status");
    }

    appointment.status = status;
    if (status === "COMPLETED") {
        appointment.completedAt = new Date();
    }
    if (status === "CANCELLED") {
        appointment.cancellationReason = cancellationReason || "Cancelled by hospital staff";
    }

    await appointment.save();

    const [patient, doctor] = await Promise.all([
        Patient.findOne({ UHID: appointment.patientId, isDeleted: false }).lean(),
        Employee.findOne({ employeeCode: appointment.doctorEmployeeId, isDeleted: false }).lean()
    ]);

    const formatted = formatAppointment(appointment, patient, doctor, userPermissions, user.employeeId);

    return res.status(200).json(
        new ApiResponse(200, formatted, "Status updated successfully")
    );
});

// ─── Delete Appointment ──────────────────────────────────────────────────────
exports.deleteAppointment = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;
    const { user, userPermissions } = await getUserPermissions(req.user.id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (!userPermissions.has("APPOINTMENT_DELETE")) {
        throw new ApiError(403, "You are not authorized to delete appointments");
    }

    const appointment = await Appointment.findOne({ appointmentId, isDeleted: false });
    if (!appointment) {
        throw new ApiError(404, "Appointment not found");
    }

    if (["IN-PROCESS", "COMPLETED"].includes(appointment.status)) {
        throw new ApiError(400, "Cannot delete appointments that are IN-PROCESS or COMPLETED");
    }

    appointment.isDeleted = true;
    appointment.deletedAt = new Date();
    appointment.deletedBy = user.employeeId || user.id;
    await appointment.save();

    return res.status(200).json(
        new ApiResponse(200, null, "Appointment deleted successfully")
    );
});

// ─── Approve Appointment ─────────────────────────────────────────────────────
exports.approveAppointment = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;
    const { user, userPermissions } = await getUserPermissions(req.user.id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (!userPermissions.has("APPOINTMENT_APPROVE")) {
        throw new ApiError(403, "You do not have permission to approve appointments");
    }

    const appointment = await Appointment.findOne({ appointmentId, isDeleted: false });
    if (!appointment) {
        throw new ApiError(404, "Appointment not found");
    }

    if (appointment.status !== "PENDING") {
        throw new ApiError(400, `Only PENDING appointments can be approved. Current status: ${appointment.status}`);
    }

    appointment.status = "BOOKED";
    await appointment.save();

    const [patient, doctor] = await Promise.all([
        Patient.findOne({ UHID: appointment.patientId, isDeleted: false }).lean(),
        Employee.findOne({ employeeCode: appointment.doctorEmployeeId, isDeleted: false }).lean()
    ]);

    const formatted = formatAppointment(appointment, patient, doctor, userPermissions, user.employeeId);

    // Notify patient
    if (patient?.email) {
        sendEmail({
            to: patient.email,
            subject: "Appointment Approved - HMS",
            html: `
                <h2>Appointment Approved</h2>
                <p>Hello ${patient.name},</p>
                <p>Your appointment has been approved and confirmed.</p>
                <p><strong>Appointment ID:</strong> ${appointment.appointmentId}</p>
                <p><strong>Doctor:</strong> Dr. ${doctor.name}</p>
                <p><strong>Date:</strong> ${appointment.date?.toDateString()}</p>
                <p><strong>Time Slot:</strong> ${appointment.timeSlot}</p>
                <p>Please arrive on time.</p>
                <p>Thank you,<br/>HMS Team</p>
            `
        }).catch((err) => console.error("Email send failed:", err));
    }

    return res.status(200).json(
        new ApiResponse(200, formatted, "Appointment approved successfully")
    );
});

// ─── Reject Appointment ──────────────────────────────────────────────────────
exports.rejectAppointment = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;
    const { reason } = req.body;
    const { user, userPermissions } = await getUserPermissions(req.user.id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (!userPermissions.has("APPOINTMENT_APPROVE")) {
        throw new ApiError(403, "You do not have permission to reject appointments");
    }

    const appointment = await Appointment.findOne({ appointmentId, isDeleted: false });
    if (!appointment) {
        throw new ApiError(404, "Appointment not found");
    }

    if (appointment.status !== "PENDING") {
        throw new ApiError(400, `Only PENDING appointments can be rejected. Current status: ${appointment.status}`);
    }

    appointment.status = "CANCELLED";
    appointment.cancellationReason = reason || "Rejected by administrator";
    await appointment.save();

    const [patient, doctor] = await Promise.all([
        Patient.findOne({ UHID: appointment.patientId, isDeleted: false }).lean(),
        Employee.findOne({ employeeCode: appointment.doctorEmployeeId, isDeleted: false }).lean()
    ]);

    const formatted = formatAppointment(appointment, patient, doctor, userPermissions, user.employeeId);

    // Notify patient
    if (patient?.email) {
        sendEmail({
            to: patient.email,
            subject: "Appointment Rejected - HMS",
            html: `
                <h2>Appointment Request Rejected</h2>
                <p>Hello ${patient.name},</p>
                <p>Unfortunately, your appointment request has been rejected.</p>
                <p><strong>Appointment ID:</strong> ${appointment.appointmentId}</p>
                <p><strong>Reason:</strong> ${appointment.cancellationReason}</p>
                <p>Please contact front desk for scheduling a different time.</p>
                <p>Thank you,<br/>HMS Team</p>
            `
        }).catch((err) => console.error("Email send failed:", err));
    }

    return res.status(200).json(
        new ApiResponse(200, formatted, "Appointment rejected successfully")
    );
});

// ─── Cancel Patient Appointments ─────────────────────────────────────────────
exports.cancelPatientAppointments = async (patientId, reason) => {
    const appointments = await Appointment.find({
        patientId,
        isDeleted: false,
        status: { $nin: ["CANCELLED", "COMPLETED"] }
    });

    let cancelledCount = 0;
    for (const appointment of appointments) {
        appointment.status = "CANCELLED";
        appointment.cancellationReason = reason;
        await appointment.save();
        cancelledCount++;
    }
    return cancelledCount;
};