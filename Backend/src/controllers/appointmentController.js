const Appointment = require("../models/Appointment");
const Employee = require("../models/Employee");
const Patient = require("../models/Patient");
const User = require("../models/User");
const Role = require("../models/Role");

const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const {sendEmail} = require("../utils/sendEmail");

const {
    normalizeAppointmentDate,
    getTomorrowDate,
    isBeforeDoctorJoiningDate,
    findSlotConflict
} = require("../utils/appointmentHelpers");

const ALLOWED_STATUSES = new Set([
    "PENDING",
    "BOOKED",
    "IN-PROCESS",
    "COMPLETED",
    "CANCELLED"
]);

// Valid transitions: which statuses can move to which
const STATUS_TRANSITIONS = {
    PENDING: ["BOOKED", "CANCELLED"],
    BOOKED: ["IN-PROCESS", "CANCELLED"],
    "IN-PROCESS": ["COMPLETED", "CANCELLED"],
    COMPLETED: [],
    CANCELLED: []
};

// Statuses that block a slot (used to prevent double-booking)
const SLOT_BLOCKING_STATUSES = ["PENDING", "BOOKED", "IN-PROCESS"];

// ─── Helpers ────────────────────────────────────────────────────────────────

const getActiveDoctor = async (employeeCode) => {
    return Employee.findOne({
        employeeCode,
        isDeleted: false,
        status: true
    });
};

const getActivePatient = async (UHID) => {
    return Patient.findOne({
        UHID,
        isDeleted: false,
        status: true
    });
};

const verifyDoctorRole = async (doctorEmployeeCode) => {
    const doctorUser = await User.findOne({
        employeeId: doctorEmployeeCode,
        isDeleted: false
    });

    if (!doctorUser) return { valid: false, reason: "Doctor user account not found" };

    const roles = await Role.find({ roleId: { $in: doctorUser.roleIds }, status: true });
    const userPermissions = new Set(roles.flatMap((r) => r.permissions || []));

    const isDoctor = userPermissions.has("HEALTH_RECORD_CREATE");
    if (!isDoctor) return { valid: false, reason: "Employee is not a doctor" };

    if (!doctorUser.status) return { valid: false, reason: "Doctor account is inactive" };

    return { valid: true, doctorUser };
};

const getAllowedActions = (appointment, userPermissions, userEmployeeId) => {
    const actions = [];
    const status = appointment.status;

    const hasApprovePerm = userPermissions.has("APPOINTMENT_APPROVE");
    const hasReadPerm = userPermissions.has("APPOINTMENT_READ");
    const hasDeletePerm = userPermissions.has("APPOINTMENT_DELETE");

    const isAssignedDoctor = !hasApprovePerm && hasReadPerm && appointment.doctorEmployeeId === userEmployeeId;

    // Approve / Reject
    if (status === "PENDING" && hasApprovePerm) {
        actions.push("APPROVE");
        actions.push("REJECT");
    }

    // Delete
    if (!["COMPLETED", "IN-PROCESS"].includes(status) && hasDeletePerm) {
        actions.push("DELETE");
    }

    // Update Status
    if (hasApprovePerm) {
        if (["PENDING", "BOOKED", "IN-PROCESS"].includes(status)) {
            actions.push("UPDATE_STATUS");
        }
    } else if (isAssignedDoctor) {
        if (["BOOKED", "IN-PROCESS"].includes(status)) {
            actions.push("UPDATE_STATUS");
        }
    }

    return actions;
};

const getAllowedStatuses = (appointment, userPermissions, userEmployeeId) => {
    const status = appointment.status;
    const hasApprovePerm = userPermissions.has("APPOINTMENT_APPROVE");
    const hasReadPerm = userPermissions.has("APPOINTMENT_READ");
    const isAssignedDoctor = !hasApprovePerm && hasReadPerm && appointment.doctorEmployeeId === userEmployeeId;

    if (hasApprovePerm) {
        return STATUS_TRANSITIONS[status] || [];
    } else if (isAssignedDoctor) {
        if (status === "BOOKED") {
            return ["IN-PROCESS"];
        }
        if (status === "IN-PROCESS") {
            return ["COMPLETED"];
        }
    }
    return [];
};


// ─── Admin: Create Appointment ───────────────────────────────────────────────

exports.createAppointment = async (req, res) => {
    try {
        const { patientId, doctorEmployeeId, date, timeSlot } = req.body;

        const createdByEmployeeId = req.user.employeeId || req.user.id;

        if (!patientId || !doctorEmployeeId || !date || !timeSlot) {
            return res.status(400).json(
                new ApiError(400, "Missing required fields: patientId, doctorEmployeeId, date, timeSlot")
            );
        }

        // Validate patient
        const patient = await Patient.findOne({ UHID: patientId, isDeleted: false });
        if (!patient) {
            return res.status(404).json(new ApiError(404, "Patient not found"));
        }

        if (!patient.status) {
            return res.status(400).json(new ApiError(400, "Patient account is inactive"));
        }

        // Validate doctor employee record
        const doctor = await Employee.findOne({ employeeCode: doctorEmployeeId, isDeleted: false });
        if (!doctor) {
            return res.status(404).json(new ApiError(404, "Doctor not found with provided employee code"));
        }

        if (!doctor.status) {
            return res.status(400).json(new ApiError(400, "Doctor account is inactive"));
        }

        // Validate doctor role
        const { valid, reason } = await verifyDoctorRole(doctorEmployeeId);
        if (!valid) {
            return res.status(400).json(new ApiError(400, reason));
        }

        // Validate date
        const appointmentDate = normalizeAppointmentDate(date);

        if (isNaN(appointmentDate.getTime())) {
            return res.status(400).json(new ApiError(400, "Invalid date format"));
        }

        if (appointmentDate < getTomorrowDate()) {
            return res.status(400).json(
                new ApiError(400, "Appointments can be booked only from tomorrow onwards")
            );
        }

        if (isBeforeDoctorJoiningDate(appointmentDate, doctor)) {
            return res.status(400).json(
                new ApiError(400, "Appointment cannot be booked before doctor's joining date")
            );
        }

        // Check doctor slot conflict
        const doctorConflict = await findSlotConflict({
            doctorEmployeeId,
            date: appointmentDate,
            timeSlot
        });

        if (doctorConflict) {
            return res.status(409).json(
                new ApiError(409, "Doctor is already booked for this slot on the selected date")
            );
        }

        // Check patient conflict — patient can't have two appointments at same time
        const patientConflict = await findSlotConflict({
            patientId,
            date: appointmentDate,
            timeSlot
        });

        if (patientConflict) {
            return res.status(409).json(
                new ApiError(409, "Patient already has an appointment at this date and time slot")
            );
        }

        const appointment = await Appointment.create({
            patientId,
            doctorEmployeeId,
            date: appointmentDate,
            timeSlot,
            createdByEmployeeId,
            status: "BOOKED"
        });

        // Send confirmation email
        if (patient.email) {
            await sendEmail({
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
            });
        }

        return res.status(201).json(
            new ApiResponse(201, appointment, "Appointment created successfully")
        );
    } catch (err) {
        console.error(err);
        return res.status(500).json(new ApiError(500, err.message || "Internal Server Error"));
    }
};

// ─── Get All Appointments (role-filtered, paginated) ─────────────────────────

exports.getAppointments = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.max(Number(req.query.limit) || 10, 1);
        const skip = (page - 1) * limit;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json(new ApiError(404, "User not found"));
        }

        const roles = await Role.find({ roleId: { $in: user.roleIds }, status: true });
        const userPermissions = new Set(roles.flatMap((r) => r.permissions || []));

        let query = { isDeleted: false };

        if (userPermissions.has("APPOINTMENT_APPROVE")) {
            // see all
        } else if (userPermissions.has("APPOINTMENT_READ")) {
            const doctor = await Employee.findOne({
                employeeCode: user.employeeId,
                isDeleted: false
            });

            if (!doctor) {
                return res.status(404).json(new ApiError(404, "Doctor profile not found"));
            }

            query.doctorEmployeeId = doctor.employeeCode;
        } else {
            return res.status(403).json(
                new ApiError(403, "You are not allowed to view appointments")
            );
        }

        const totalRecords = await Appointment.countDocuments(query);

        const appointments = await Appointment.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const patientIds = appointments.map((a) => a.patientId);
        const doctorIds = appointments.map((a) => a.doctorEmployeeId);

        const patients = await Patient.find({ UHID: { $in: patientIds }, isDeleted: false });
        const doctors = await Employee.find({ employeeCode: { $in: doctorIds }, isDeleted: false });

        const patientMap = new Map(patients.map((p) => [p.UHID, p]));
        const doctorMap = new Map(doctors.map((d) => [d.employeeCode, d]));

        const formattedAppointments = appointments.map((appointment) => {
            const patient = patientMap.get(appointment.patientId);
            const doctor = doctorMap.get(appointment.doctorEmployeeId);

            return {
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
                completedAt: appointment.completedAt,
                createdByEmployeeId: appointment.createdByEmployeeId || null,
                createdAt: appointment.createdAt,
                updatedAt: appointment.updatedAt,
                allowedActions: getAllowedActions(appointment, userPermissions, user.employeeId),
                allowedStatuses: getAllowedStatuses(appointment, userPermissions, user.employeeId)
            };
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    records: formattedAppointments,
                    pagination: {
                        totalRecords,
                        currentPage: page,
                        totalPages: Math.ceil(totalRecords / limit),
                        limit
                    }
                },
                "Appointments fetched successfully"
            )
        );
    } catch (err) {
        console.error(err);
        return res.status(500).json(new ApiError(500, err.message || "Internal Server Error"));
    }
};

// ─── Get Appointment By ID ───────────────────────────────────────────────────

exports.getAppointmentById = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        const appointment = await Appointment.findOne({ appointmentId, isDeleted: false });
        if (!appointment) {
            return res.status(404).json(new ApiError(404, "Appointment not found"));
        }

        const patient = await Patient.findOne({ UHID: appointment.patientId, isDeleted: false });
        const doctor = await Employee.findOne({
            employeeCode: appointment.doctorEmployeeId,
            isDeleted: false
        });

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json(new ApiError(404, "User not found"));
        }

        const roles = await Role.find({ roleId: { $in: user.roleIds }, status: true });
        const userPermissions = new Set(roles.flatMap((r) => r.permissions || []));

        return res.status(200).json(
            new ApiResponse(
                200,
                {
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
                    completedAt: appointment.completedAt,
                    createdByEmployeeId: appointment.createdByEmployeeId || null,
                    createdAt: appointment.createdAt,
                    updatedAt: appointment.updatedAt,
                    allowedActions: getAllowedActions(appointment, userPermissions, user.employeeId),
                    allowedStatuses: getAllowedStatuses(appointment, userPermissions, user.employeeId)
                },
                "Appointment retrieved successfully"
            )
        );
    } catch (err) {
        console.error(err);
        return res.status(500).json(new ApiError(500, err.message || "Internal Server Error"));
    }
};

// ─── Update Appointment (date / timeSlot / status — admin/reception) ─────────

exports.updateAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { date, timeSlot, status } = req.body;

        const appointment = await Appointment.findOne({ appointmentId, isDeleted: false });
        if (!appointment) {
            return res.status(404).json(new ApiError(404, "Appointment not found"));
        }

        // Cannot modify a completed or cancelled appointment
        if (["COMPLETED", "CANCELLED"].includes(appointment.status)) {
            return res.status(400).json(
                new ApiError(
                    400,
                    `Cannot modify a ${appointment.status.toLowerCase()} appointment`
                )
            );
        }

        const doctor = await Employee.findOne({
            employeeCode: appointment.doctorEmployeeId,
            isDeleted: false
        });

        if (!doctor) {
            return res.status(404).json(new ApiError(404, "Assigned doctor not found"));
        }

        if (status) {
            if (!ALLOWED_STATUSES.has(status)) {
                return res.status(400).json(new ApiError(400, "Invalid appointment status"));
            }

            const allowed = STATUS_TRANSITIONS[appointment.status];
            if (!allowed.includes(status)) {
                return res.status(400).json(
                    new ApiError(
                        400,
                        `Cannot transition appointment from ${appointment.status} to ${status}`
                    )
                );
            }

            appointment.status = status;

            if (status === "COMPLETED") {
                appointment.completedAt = new Date();
            }
        }

        if (date) {
            const appointmentDate = normalizeAppointmentDate(date);

            if (isNaN(appointmentDate.getTime())) {
                return res.status(400).json(new ApiError(400, "Invalid date format"));
            }

            if (appointmentDate < getTomorrowDate()) {
                return res.status(400).json(
                    new ApiError(400, "Appointments can only be rescheduled from tomorrow onwards")
                );
            }

            if (isBeforeDoctorJoiningDate(appointmentDate, doctor)) {
                return res.status(400).json(
                    new ApiError(400, "Appointment cannot be scheduled before doctor's joining date")
                );
            }

            appointment.date = appointmentDate;
        }

        if (timeSlot) {
            appointment.timeSlot = timeSlot;
        }

        // Check slot conflict if date or timeSlot changed
        if (date || timeSlot) {
            const existing = await findSlotConflict({
                doctorEmployeeId: appointment.doctorEmployeeId,
                date: appointment.date,
                timeSlot: appointment.timeSlot,
                excludeAppointmentId: appointment._id
            });

            if (existing && SLOT_BLOCKING_STATUSES.includes(appointment.status)) {
                return res.status(409).json(new ApiError(409, "Slot already booked for this doctor"));
            }

            // Also check patient conflict if rescheduling
            const patientConflict = await findSlotConflict({
                patientId: appointment.patientId,
                date: appointment.date,
                timeSlot: appointment.timeSlot,
                excludeAppointmentId: appointment._id
            });

            if (patientConflict) {
                return res.status(409).json(
                    new ApiError(409, "Patient already has an appointment at this date and time slot")
                );
            }
        }

        await appointment.save();

        return res.status(200).json(
            new ApiResponse(200, appointment, "Appointment updated successfully")
        );
    } catch (err) {
        console.error(err);
        return res.status(500).json(new ApiError(500, err.message || "Internal Server Error"));
    }
};

// ─── Update Appointment Status (Doctor marks IN-PROCESS / COMPLETED) ─────────

exports.updateAppointmentStatus = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json(new ApiError(400, "Status is required"));
        }

        if (!ALLOWED_STATUSES.has(status)) {
            return res.status(400).json(new ApiError(400, "Invalid status value"));
        }

        const appointment = await Appointment.findOne({ appointmentId, isDeleted: false });
        if (!appointment) {
            return res.status(404).json(new ApiError(404, "Appointment not found"));
        }

        // Validate transition
        const allowed = STATUS_TRANSITIONS[appointment.status];
        if (!allowed.includes(status)) {
            return res.status(400).json(
                new ApiError(
                    400,
                    `Cannot transition from ${appointment.status} to ${status}. Allowed: ${allowed.join(", ") || "none"}`
                )
            );
        }

        // Role-based restriction:
        // Only DOCTOR can mark IN-PROCESS or COMPLETED (for their own appointments)
        // ADMIN/RECEPTIONIST can do status changes via updateAppointment instead
        const user = await User.findById(req.user.id);
        const roles = await Role.find({ roleId: { $in: user.roleIds }, status: true });
        const userPermissions = new Set(roles.flatMap((r) => r.permissions || []));

        const hasApprovePerm = userPermissions.has("APPOINTMENT_APPROVE");
        const hasReadPerm = userPermissions.has("APPOINTMENT_READ");

        if (!hasApprovePerm && hasReadPerm) {
            // Doctor can only update their own appointments
            if (appointment.doctorEmployeeId !== req.user.employeeId) {
                return res.status(403).json(
                    new ApiError(403, "You can only update status of your own appointments")
                );
            }

            // Doctor can only move to IN-PROCESS or COMPLETED (not BOOKED / PENDING / CANCELLED here)
            if (!["IN-PROCESS", "COMPLETED"].includes(status)) {
                return res.status(403).json(
                    new ApiError(403, "Doctors can only mark appointments as IN-PROCESS or COMPLETED")
                );
            }
        }

        // Only BOOKED appointment can move to IN-PROCESS — guard against bad order
        if (status === "IN-PROCESS" && appointment.status !== "BOOKED") {
            return res.status(400).json(
                new ApiError(400, "Only BOOKED appointments can be marked as IN-PROCESS")
            );
        }

        // Only IN-PROCESS appointment can be COMPLETED
        if (status === "COMPLETED" && appointment.status !== "IN-PROCESS") {
            return res.status(400).json(
                new ApiError(400, "Only IN-PROCESS appointments can be marked as COMPLETED")
            );
        }

        appointment.status = status;

        if (status === "COMPLETED") {
            appointment.completedAt = new Date();
        }

        await appointment.save();

        return res.status(200).json(
            new ApiResponse(200, appointment, `Appointment marked as ${status} successfully`)
        );
    } catch (err) {
        console.error(err);
        return res.status(500).json(new ApiError(500, err.message || "Internal Server Error"));
    }
};

// ─── Soft Delete Appointment ─────────────────────────────────────────────────

exports.deleteAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json(new ApiError(404, "User not found"));
        }

        const roles = await Role.find({ roleId: { $in: user.roleIds }, status: true });
        const userPermissions = new Set(roles.flatMap((r) => r.permissions || []));

        if (!userPermissions.has("APPOINTMENT_DELETE")) {
            return res.status(403).json(new ApiError(403, "You are not authorized to delete appointments"));
        }

        const appointment = await Appointment.findOne({ appointmentId, isDeleted: false });
        if (!appointment) {
            return res.status(404).json(new ApiError(404, "Appointment not found"));
        }

        // Cannot delete a completed or in-process appointment
        if (["COMPLETED", "IN-PROCESS"].includes(appointment.status)) {
            return res.status(400).json(
                new ApiError(
                    400,
                    `Cannot delete a ${appointment.status.toLowerCase()} appointment`
                )
            );
        }

        appointment.isDeleted = true;
        appointment.deletedAt = new Date();
        appointment.deletedBy = req.user.employeeId || req.user.id;

        // Auto-cancel if not already cancelled
        if (appointment.status !== "CANCELLED") {
            appointment.status = "CANCELLED";
            appointment.cancellationReason = "Appointment removed by admin";
        }

        await appointment.save();

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    appointmentId: appointment.appointmentId,
                    patientId: appointment.patientId,
                    doctorEmployeeId: appointment.doctorEmployeeId,
                    date: appointment.date,
                    timeSlot: appointment.timeSlot,
                    status: appointment.status
                },
                "Appointment deleted successfully"
            )
        );
    } catch (err) {
        console.error(err);
        return res.status(500).json(new ApiError(500, err.message || "Internal Server Error"));
    }
};

// ─── Approve Appointment (PENDING → BOOKED) ───────────────────────────────────

exports.approveAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json(new ApiError(404, "User not found"));
        }

        const roles = await Role.find({ roleId: { $in: user.roleIds }, status: true });
        const userPermissions = new Set(roles.flatMap((r) => r.permissions || []));

        if (!userPermissions.has("APPOINTMENT_APPROVE")) {
            return res.status(403).json(new ApiError(403, "You are not authorized to approve appointments"));
        }

        const appointment = await Appointment.findOne({ appointmentId, isDeleted: false });
        if (!appointment) {
            return res.status(404).json(new ApiError(404, "Appointment not found"));
        }

        if (appointment.status !== "PENDING") {
            return res.status(400).json(
                new ApiError(400, "Only PENDING appointments can be approved")
            );
        }

        const patient = await Patient.findOne({ UHID: appointment.patientId, isDeleted: false });
        if (!patient) {
            return res.status(404).json(new ApiError(404, "Patient not found"));
        }

        const doctor = await Employee.findOne({
            employeeCode: appointment.doctorEmployeeId,
            isDeleted: false
        });
        if (!doctor) {
            return res.status(404).json(new ApiError(404, "Doctor not found"));
        }

        if (!doctor.status) {
            return res.status(400).json(new ApiError(400, "Doctor is currently inactive"));
        }

        // Re-check slot availability at approval time
        const conflict = await findSlotConflict({
            doctorEmployeeId: appointment.doctorEmployeeId,
            date: appointment.date,
            timeSlot: appointment.timeSlot,
            excludeAppointmentId: appointment._id
        });

        if (conflict) {
            appointment.status = "CANCELLED";
            appointment.cancellationReason =
                "Requested slot became unavailable before approval";
            await appointment.save();

            return res.status(409).json(
                new ApiResponse(
                    409,
                    appointment,
                    "Requested slot is no longer available. Appointment has been cancelled."
                )
            );
        }

        appointment.status = "BOOKED";
        appointment.createdByEmployeeId = req.user.employeeId || req.user.id;
        await appointment.save();

        if (patient.email) {
            await sendEmail({
                to: patient.email,
                subject: "Appointment Approved - HMS",
                html: `
                    <h2>Appointment Approved</h2>
                    <p>Hello ${patient.name},</p>
                    <p>Your appointment request has been approved.</p>
                    <p><strong>Appointment ID:</strong> ${appointment.appointmentId}</p>
                    <p><strong>Doctor:</strong> Dr. ${doctor.name}</p>
                    <p><strong>Date:</strong> ${appointment.date?.toDateString()}</p>
                    <p><strong>Time:</strong> ${appointment.timeSlot}</p>
                    <p>Please arrive at least 10 minutes before your scheduled time.</p>
                    <p>Thank you,<br/>HMS Team</p>
                `
            });
        }

        return res.status(200).json(
            new ApiResponse(200, appointment, "Appointment approved successfully")
        );
    } catch (err) {
        console.error(err);
        return res.status(500).json(new ApiError(500, err.message || "Internal Server Error"));
    }
};

// ─── Reject Appointment (PENDING → CANCELLED) ─────────────────────────────────

exports.rejectAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json(new ApiError(404, "User not found"));
        }

        const roles = await Role.find({ roleId: { $in: user.roleIds }, status: true });
        const userPermissions = new Set(roles.flatMap((r) => r.permissions || []));

        if (!userPermissions.has("APPOINTMENT_REJECT")) {
            return res.status(403).json(new ApiError(403, "You are not authorized to reject appointments"));
        }

        const appointment = await Appointment.findOne({ appointmentId, isDeleted: false });
        if (!appointment) {
            return res.status(404).json(new ApiError(404, "Appointment not found"));
        }

        if (appointment.status !== "PENDING") {
            return res.status(400).json(
                new ApiError(400, "Only PENDING appointments can be rejected")
            );
        }

        const patient = await Patient.findOne({ UHID: appointment.patientId, isDeleted: false });
        if (!patient) {
            return res.status(404).json(new ApiError(404, "Patient not found"));
        }

        const doctor = await Employee.findOne({
            employeeCode: appointment.doctorEmployeeId,
            isDeleted: false
        });
        if (!doctor) {
            return res.status(404).json(new ApiError(404, "Doctor not found"));
        }

        appointment.status = "CANCELLED";
        appointment.cancellationReason = "Appointment request rejected by hospital staff";
        await appointment.save();

        if (patient.email) {
            await sendEmail({
                to: patient.email,
                subject: "Appointment Request Rejected - HMS",
                html: `
                    <h2>Appointment Request Rejected</h2>
                    <p>Hello ${patient.name},</p>
                    <p>Your appointment request has been rejected by hospital staff.</p>
                    <p><strong>Appointment ID:</strong> ${appointment.appointmentId}</p>
                    <p><strong>Doctor:</strong> Dr. ${doctor.name}</p>
                    <p><strong>Date:</strong> ${appointment.date?.toDateString()}</p>
                    <p><strong>Time:</strong> ${appointment.timeSlot}</p>
                    <p>Please contact hospital reception or book another available slot.</p>
                    <p>Thank you,<br/>HMS Team</p>
                `
            });
        }

        return res.status(200).json(
            new ApiResponse(200, appointment, "Appointment rejected successfully")
        );
    } catch (err) {
        console.error(err);
        return res.status(500).json(new ApiError(500, err.message || "Internal Server Error"));
    }
};

// ─── Internal: Cancel all appointments for a patient (used on patient delete) ─

exports.cancelPatientAppointments = async (patientId, reason) => {
    const result = await Appointment.updateMany(
        {
            patientId,
            isDeleted: false,
            status: { $in: ["BOOKED", "IN-PROCESS", "PENDING"] }
        },
        {
            $set: {
                status: "CANCELLED",
                cancellationReason: reason
            }
        }
    );

    return result.modifiedCount;
};