// utils/appointmentValidators.js
const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");
const Employee = require("../models/Employee");
const User = require("../models/User");
const Role = require("../models/Role");
const ApiError = require("./ApiError");
const { sendEmail } = require("./sendEmail");

// ─── INTERNAL DATE & SLOT HELPERS (No Cross-File Imports) ────────────────────
const SLOT_BLOCKING_STATUSES = ["PENDING", "BOOKED", "IN-PROCESS"];

const getDateRange = (dateValue) => {
    const startOfDay = new Date(dateValue);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(startOfDay.getDate() + 1);
    return { startOfDay, endOfDay };
};

const normalizeAppointmentDate = (date) => {
    const appointmentDate = new Date(date);
    appointmentDate.setHours(0, 0, 0, 0);
    return appointmentDate;
};

const getTomorrowDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return tomorrow;
};

const getTodayDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
};

const isBeforeDoctorJoiningDate = (appointmentDate, doctor) => {
    if (!doctor.joiningDate) return false;
    return appointmentDate < normalizeAppointmentDate(doctor.joiningDate);
};

const findSlotConflict = async ({ doctorEmployeeId, patientId, date, timeSlot, excludeAppointmentId }) => {
    const { startOfDay, endOfDay } = getDateRange(date);
    const query = {
        date: { $gte: startOfDay, $lt: endOfDay },
        timeSlot,
        status: { $in: SLOT_BLOCKING_STATUSES },
    };
    if (doctorEmployeeId) query.doctorEmployeeId = doctorEmployeeId;
    if (patientId) query.patientId = patientId;
    if (excludeAppointmentId) query._id = { $ne: excludeAppointmentId };

    return Appointment.findOne(query);
};

// ─── BUSINESS VALIDATION LOGIC ───────────────────────────────────────────────
const ALLOWED_STATUSES = new Set(["PENDING", "BOOKED", "IN-PROCESS", "COMPLETED", "CANCELLED"]);

const STATUS_TRANSITIONS = {
    PENDING: ["BOOKED", "CANCELLED"],
    BOOKED: ["IN-PROCESS", "CANCELLED"],
    "IN-PROCESS": ["COMPLETED", "CANCELLED"],
    COMPLETED: [],
    CANCELLED: []
};

const getUserPermissions = async (userId) => {
    const user = await User.findById(userId).lean();
    if (!user) return { user: null, userPermissions: new Set() };

    const roles = await Role.find({ roleId: { $in: user.roleIds }, status: true }, { permissions: 1 }).lean();
    return { user, userPermissions: new Set(roles.flatMap((r) => r.permissions || [])) };
};

const verifyDoctorByPermissions = async (doctorEmployeeCode) => {
    const doctorUser = await User.findOne({ employeeId: doctorEmployeeCode, isDeleted: false, status: true }, { roleIds: 1 }).lean();
    if (!doctorUser) return { valid: false, reason: "Doctor user account not found or is inactive" };

    const roles = await Role.find({ roleId: { $in: doctorUser.roleIds }, status: true }, { permissions: 1 }).lean();
    const perms = new Set(roles.flatMap((r) => r.permissions || []));

    if (!perms.has("HEALTH_RECORD_CREATE")) return { valid: false, reason: "Employee is not a doctor" };
    return { valid: true };
};

const getAllowedActions = (appointment, userPermissions, userEmployeeId) => {
    const actions = [];
    const { status, doctorEmployeeId } = appointment;
    const hasApprove = userPermissions.has("APPOINTMENT_APPROVE");
    const hasRead = userPermissions.has("APPOINTMENT_READ");
    const hasDelete = userPermissions.has("APPOINTMENT_DELETE");

    const isDoctor = !hasApprove && hasRead && doctorEmployeeId === userEmployeeId;

    if (status === "PENDING" && hasApprove) actions.push("APPROVE", "REJECT");
    if (!["COMPLETED", "IN-PROCESS"].includes(status) && hasDelete) actions.push("DELETE");
    if ((hasApprove && ["PENDING", "BOOKED", "IN-PROCESS"].includes(status)) || (isDoctor && ["BOOKED", "IN-PROCESS"].includes(status))) {
        actions.push("UPDATE_STATUS");
    }
    return actions;
};

const getAllowedStatuses = (appointment, userPermissions, userEmployeeId) => {
    const { status, doctorEmployeeId } = appointment;
    if (userPermissions.has("APPOINTMENT_APPROVE")) return STATUS_TRANSITIONS[status] || [];
    if (!userPermissions.has("APPOINTMENT_APPROVE") && userPermissions.has("APPOINTMENT_READ") && doctorEmployeeId === userEmployeeId) {
        if (status === "BOOKED") return ["IN-PROCESS"];
        if (status === "IN-PROCESS") return ["COMPLETED"];
    }
    return [];
};

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
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt,
    allowedActions: getAllowedActions(appointment, userPermissions, userEmployeeId),
    allowedStatuses: getAllowedStatuses(appointment, userPermissions, userEmployeeId)
});

const validateReschedule = async ({ appointment, doctor, date, timeSlot }) => {
    if (appointment.date < getTomorrowDate()) throw new ApiError(400, "Cannot reschedule a past or present appointment");
    if (date) {
        const normalized = normalizeAppointmentDate(date);
        if (Number.isNaN(normalized.getTime())) throw new ApiError(400, "Invalid date format");
        if (normalized < getTomorrowDate()) throw new ApiError(400, "Appointments can only be rescheduled to tomorrow or later");
        if (isBeforeDoctorJoiningDate(normalized, doctor)) throw new ApiError(400, "Before doctor's joining date");
        appointment.date = normalized;
    }
    if (timeSlot) appointment.timeSlot = timeSlot;

    if (SLOT_BLOCKING_STATUSES.includes(appointment.status) && await findSlotConflict({ doctorEmployeeId: appointment.doctorEmployeeId, date: appointment.date, timeSlot: appointment.timeSlot, excludeAppointmentId: appointment._id })) {
        throw new ApiError(409, "Slot already booked for doctor");
    }
    if (await findSlotConflict({ patientId: appointment.patientId, date: appointment.date, timeSlot: appointment.timeSlot, excludeAppointmentId: appointment._id })) {
        throw new ApiError(409, "Patient already has an appointment");
    }
};

const validatePatientAndDoctor = async (patientId, doctorEmployeeId) => {
    const patient = await Patient.findOne({ UHID: patientId, isDeleted: false }, { name: 1, email: 1, status: 1 }).lean();
    if (!patient) throw new ApiError(404, "Patient not found");
    if (!patient.status) throw new ApiError(400, "Patient account is inactive");

    const doctor = await Employee.findOne({ employeeCode: doctorEmployeeId, isDeleted: false }, { name: 1, status: 1, joiningDate: 1 }).lean();
    if (!doctor) throw new ApiError(404, "Doctor not found");
    if (!doctor.status) throw new ApiError(400, "Doctor account is inactive");

    const { valid, reason } = await verifyDoctorByPermissions(doctorEmployeeId);
    if (!valid) throw new ApiError(400, reason);

    return { patient, doctor };
};

const validateAppointmentDateRule = (date, doctor) => {
    const appDate = normalizeAppointmentDate(date);
    if (Number.isNaN(appDate.getTime())) throw new ApiError(400, "Invalid date format");
    if (appDate < getTomorrowDate()) throw new ApiError(400, "Appointments can be booked only from tomorrow onwards");
    if (isBeforeDoctorJoiningDate(appDate, doctor)) throw new ApiError(400, "Appointment cannot be booked before doctor's joining date");
    return appDate;
};

const validateSlotConflicts = async ({ patientId, doctorEmployeeId, date, timeSlot }) => {
    if (await findSlotConflict({ doctorEmployeeId, date, timeSlot })) throw new ApiError(409, "Doctor is already booked for this slot");
    if (await findSlotConflict({ patientId, date, timeSlot })) throw new ApiError(409, "Patient already has an appointment at this date and time slot");
};

const sendAppointmentEmail = (patient, doctor, appointment, date, slot) => {
    if (!patient.email) return;
    sendEmail({
        to: patient.email,
        subject: "Appointment Update Notification - HMS",
        html: `<h2>Appointment Status Notice</h2><p>ID: ${appointment.appointmentId}</p><p>Doctor: Dr. ${doctor.name}</p>`
    }).catch((err) => console.error("Email delivery failed:", err));
};

const validateStatusTransition = (appointment, status, user, permissions) => {
    if (!status) throw new ApiError(400, "Status is required");
    if (!ALLOWED_STATUSES.has(status)) throw new ApiError(400, "Invalid status value");
    if (!STATUS_TRANSITIONS[appointment.status].includes(status)) throw new ApiError(400, `Cannot transition from ${appointment.status} to ${status}`);
    if (["IN-PROCESS", "COMPLETED"].includes(status) && appointment.date > getTodayDate()) throw new ApiError(400, "Cannot mark a future appointment as active or finished");

    const hasApprove = permissions.has("APPOINTMENT_APPROVE");
    if (!hasApprove) {
        if (!permissions.has("APPOINTMENT_READ") || appointment.doctorEmployeeId !== user.employeeId) throw new ApiError(403, "Unauthorized status adjustment scope");
        if (!["IN-PROCESS", "COMPLETED"].includes(status)) throw new ApiError(403, "Doctors can only mark appointments as IN-PROCESS or COMPLETED");
    }
    if (status === "IN-PROCESS" && appointment.status !== "BOOKED") throw new ApiError(400, "Only BOOKED appointments can be marked as IN-PROCESS");
    if (status === "COMPLETED" && appointment.status !== "IN-PROCESS") throw new ApiError(400, "Only IN-PROCESS appointments can be marked as COMPLETED");
};

module.exports = {
    getUserPermissions,
    formatAppointment,
    validateReschedule,
    validatePatientAndDoctor,
    validateAppointmentDateRule,
    validateSlotConflicts,
    sendAppointmentEmail,
    validateStatusTransition,
    findSlotConflict,
    MAX_PAGE_LIMIT: 100
};