const Appointment = require("../models/Appointment");
const Employee = require("../models/Employee");
const Patient = require("../models/Patient");
const User = require("../models/User");
const Role = require("../models/Role");

const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const { sendEmail } = require("../utils/sendEmail");

const {
    normalizeAppointmentDate,
    getTomorrowDate,
    isBeforeDoctorJoiningDate,
    findSlotConflict,
    getTodayDate
} = require("../utils/appointmentHelpers");

// ─── Constants ───────────────────────────────────────────────────────────────

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

// Statuses that occupy a slot (used to prevent double-booking)
const SLOT_BLOCKING_STATUSES = ["PENDING", "BOOKED", "IN-PROCESS"];

// Max records per page
const MAX_PAGE_LIMIT = 100;

// ─── Shared Helper: Load user permissions ────────────────────────────────────
//
// WHY A HELPER?
//   The pattern  User → Role → permissions Set  was copy-pasted 6 times across
//   this file. Every change (e.g. adding a new permission key) had to be made
//   in 6 places. One helper = one place to change, impossible to forget a spot.
//
// RETURNS: { user, userPermissions }
//   - user            → the full lean User document (null if not found)
//   - userPermissions → Set of permission strings the user holds
//
// NOTE: We use .lean() here because we only READ from user/roles — no .save().
//       .lean() returns a plain JS object (~3-5x faster than a full Mongoose doc).

const getUserPermissions = async (userId) => {
    const user = await User.findById(userId).lean();
    if (!user) return { user: null, userPermissions: new Set() };

    const roles = await Role.find(
        { roleId: { $in: user.roleIds }, status: true },
        { permissions: 1 }       // project only the field we need
    ).lean();

    const userPermissions = new Set(roles.flatMap((r) => r.permissions || []));
    return { user, userPermissions };
};

// ─── Shared Helper: Verify doctor role via permissions ───────────────────────
//
// WHY REDESIGN?
//   Old version did User.findOne + Role.find just to confirm the employee is a
//   doctor. But we were already loading permissions elsewhere in the same
//   request. By accepting a pre-loaded userPermissions Set we avoid the extra
//   round-trips entirely.
//
//   The check stays the same — a doctor is someone whose user account holds the
//   HEALTH_RECORD_CREATE permission — but now it's free to call.

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

// ─── Shared Helper: Compute allowed UI actions ────────────────────────────────

// ─── Shared Helper: Compute allowed next statuses ─────────────────────────────

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
// ─── Shared Helper: Format appointment for API response ──────────────────────
//
// WHY A FORMATTER?
//   getAppointments and getAppointmentById were building the same response
//   shape manually. Any field change (e.g. adding `notes`) had to be done in
//   two places. One formatter = one place.

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


const validateStatusUpdate = (appointment, status) => {
    if (!ALLOWED_STATUSES.has(status)) {
        throw new ApiError(400, "Invalid appointment status");
    }

    const allowed = STATUS_TRANSITIONS[appointment.status];
    if (!allowed.includes(status)) {
        throw new ApiError(
            400,
            `Cannot transition appointment from ${appointment.status} to ${status}`
        );
    }

    appointment.status = status;
    if (status === "COMPLETED") appointment.completedAt = new Date();
};


const validateReschedule = async ({ appointment, doctor, date, timeSlot }) => {
    if (appointment.date < getTomorrowDate()) {
        throw new ApiError(
            400,
            "Cannot reschedule an appointment that is scheduled for today or has already passed"
        );
    }

    if (date) {
        const normalized = normalizeAppointmentDate(date);

        if (Number.isNaN(normalized.getTime())) {
            throw new ApiError(400, "Invalid date format");
        }

        if (normalized < getTomorrowDate()) {
            throw new ApiError(400, "Appointments can only be rescheduled to tomorrow or later");
        }

        if (isBeforeDoctorJoiningDate(normalized, doctor)) {
            throw new ApiError(400, "Before doctor's joining date");
        }

        appointment.date = normalized;
    }

    if (timeSlot) appointment.timeSlot = timeSlot;

    const doctorConflict = await findSlotConflict({
        doctorEmployeeId: appointment.doctorEmployeeId,
        date: appointment.date,
        timeSlot: appointment.timeSlot,
        excludeAppointmentId: appointment._id
    });

    if (doctorConflict && SLOT_BLOCKING_STATUSES.has(appointment.status)) {
        throw new ApiError(409, "Slot already booked for doctor");
    }

    const patientConflict = await findSlotConflict({
        patientId: appointment.patientId,
        date: appointment.date,
        timeSlot: appointment.timeSlot,
        excludeAppointmentId: appointment._id
    });

    if (patientConflict) {
        throw new ApiError(409, "Patient already has an appointment");
    }
};


const validateCreateInput = ({ patientId, doctorEmployeeId, date, timeSlot }) => {
    if (!patientId || !doctorEmployeeId || !date || !timeSlot) {
        throw new ApiError(
            400,
            "Missing required fields: patientId, doctorEmployeeId, date, timeSlot"
        );
    }
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

const validateAppointmentDate = (date, doctor) => {
    const appointmentDate = normalizeAppointmentDate(date);

    if (Number.isNaN(appointmentDate.getTime())) {
        throw new ApiError(400, "Invalid date format");
    }

    if (appointmentDate < getTomorrowDate()) {
        throw new ApiError(
            400,
            "Appointments can be booked only from tomorrow onwards"
        );
    }

    if (isBeforeDoctorJoiningDate(appointmentDate, doctor)) {
        throw new ApiError(
            400,
            "Appointment cannot be booked before doctor's joining date"
        );
    }

    return appointmentDate;
};

const validateSlotConflicts = async ({ patientId, doctorEmployeeId, date, timeSlot }) => {
    const doctorConflict = await findSlotConflict({
        doctorEmployeeId,
        date,
        timeSlot
    });

    if (doctorConflict) {
        throw new ApiError(
            409,
            "Doctor is already booked for this slot on the selected date"
        );
    }

    const patientConflict = await findSlotConflict({
        patientId,
        date,
        timeSlot
    });

    if (patientConflict) {
        throw new ApiError(
            409,
            "Patient already has an appointment at this date and time slot"
        );
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
    }).catch((error_) => console.error("Email send failed:", error_));
};


const validateStatusInput = (status) => {
    if (!status) {
        throw new ApiError(400, "Status is required");
    }

    if (!ALLOWED_STATUSES.has(status)) {
        throw new ApiError(400, "Invalid status value");
    }
};


const validateAppointmentExists = (appointment) => {
    if (!appointment) {
        throw new ApiError(404, "Appointment not found");
    }
};


const validateFutureRule = (appointment, status) => {
    if (
        ["IN-PROCESS", "COMPLETED"].includes(status) &&
        appointment.date > getTodayDate()
    ) {
        throw new ApiError(
            400,
            "Cannot mark a future appointment as IN-PROCESS or COMPLETED."
        );
    }
};

const validateStatusTransition = (appointment, status) => {
    const allowed = STATUS_TRANSITIONS[appointment.status];

    if (!allowed.includes(status)) {
        throw new ApiError(
            400,
            `Cannot transition from ${appointment.status} to ${status}. Allowed: ${allowed.join(", ") || "none"}`
        );
    }
};

const validateStatusPermissions = (appointment, status, user, permissions) => {
    const hasApprove = permissions.has("APPOINTMENT_APPROVE");
    const hasRead = permissions.has("APPOINTMENT_READ");

    if (hasApprove) return;

    if (hasRead) {
        if (appointment.doctorEmployeeId !== user.employeeId) {
            throw new ApiError(
                403,
                "You can only update status of your own appointments"
            );
        }

        if (!["IN-PROCESS", "COMPLETED"].includes(status)) {
            throw new ApiError(
                403,
                "Doctors can only mark appointments as IN-PROCESS or COMPLETED"
            );
        }

        return;
    }

    throw new ApiError(
        403,
        "You are not authorized to update appointment status"
    );
};

const validateStatusOrder = (appointment, status) => {
    if (status === "IN-PROCESS" && appointment.status !== "BOOKED") {
        throw new ApiError(
            400,
            "Only BOOKED appointments can be marked as IN-PROCESS"
        );
    }

    if (status === "COMPLETED" && appointment.status !== "IN-PROCESS") {
        throw new ApiError(
            400,
            "Only IN-PROCESS appointments can be marked as COMPLETED"
        );
    }
};
// ─── Admin/Reception: Create Appointment ─────────────────────────────────────

exports.createAppointment = async (req, res) => {
    try {
        const { patientId, doctorEmployeeId, date, timeSlot } = req.body;
        const createdByEmployeeId = req.user.employeeId || req.user.id;

        //  Step 1: Input validation
        validateCreateInput({ patientId, doctorEmployeeId, date, timeSlot });
        //  Step 2: Patient + Doctor validation
        const { patient, doctor } = await validatePatientAndDoctor(
            patientId,
            doctorEmployeeId
        );

        //  Step 3: Date validation
        const appointmentDate = validateAppointmentDate(date, doctor);

        //  Step 4: Slot conflicts
        await validateSlotConflicts({
            patientId,
            doctorEmployeeId,
            date: appointmentDate,
            timeSlot
        });

        // Step 5: Create appointment
        let appointment;
        try {
            appointment = await Appointment.create({
                patientId,
                doctorEmployeeId,
                date: appointmentDate,
                timeSlot,
                createdByEmployeeId,
                status: "BOOKED"
            });
        } catch (err) {
            if (err.code === 11000) {
                return res.status(409).json(
                    new ApiError(
                        409,
                        "This slot was just taken. Please choose a different slot."
                    )
                );
            }
            throw err;
        }

        // Step 6: Email (non-blocking)
        sendAppointmentEmail(
            patient,
            doctor,
            appointment,
            appointmentDate,
            timeSlot
        );

        return res.status(201).json(
            new ApiResponse(201, appointment, "Appointment created successfully")
        );

    } catch (err) {
        console.error(err);

        if (err instanceof ApiError) {
            return res.status(err.statusCode || 400).json(err);
        }

        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};

// ─── Get All Appointments (role-filtered, paginated) ─────────────────────────

exports.getAppointments = async (req, res) => {
    try {
        // Clamp limit to MAX_PAGE_LIMIT so no one can request 100 000 records
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), MAX_PAGE_LIMIT);
        const skip = (page - 1) * limit;

        const { user, userPermissions } = await getUserPermissions(req.user.id);
        if (!user) {
            return res.status(404).json(new ApiError(404, "User not found"));
        }

        let query = { isDeleted: false };

        if (userPermissions.has("APPOINTMENT_APPROVE")) {
            // Admin / Receptionist — see all appointments
        } else if (userPermissions.has("APPOINTMENT_READ")) {
            // Doctor — see only their own appointments
            const doctor = await Employee.findOne(
                { employeeCode: user.employeeId, isDeleted: false },
                { employeeCode: 1 }
            ).lean();

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

        // .lean() — we only read these records, never call .save() on them
        const appointments = await Appointment.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Batch-load patients and doctors to avoid N+1 queries
        const patientIds = [...new Set(appointments.map((a) => a.patientId))];
        const doctorIds = [...new Set(appointments.map((a) => a.doctorEmployeeId))];

        const [patients, doctors] = await Promise.all([
            Patient.find(
                { UHID: { $in: patientIds }, isDeleted: false },
                { UHID: 1, name: 1, phone: 1, email: 1 }
            ).lean(),
            Employee.find(
                { employeeCode: { $in: doctorIds }, isDeleted: false },
                { employeeCode: 1, name: 1, department: 1, designation: 1 }
            ).lean()
        ]);

        const patientMap = new Map(patients.map((p) => [p.UHID, p]));
        const doctorMap = new Map(doctors.map((d) => [d.employeeCode, d]));

        const formattedAppointments = appointments.map((appointment) =>
            formatAppointment(
                appointment,
                patientMap.get(appointment.patientId),
                doctorMap.get(appointment.doctorEmployeeId),
                userPermissions,
                user.employeeId
            )
        );

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
//
// FIX: Old version had NO authorization check — any logged-in user could fetch
//      any appointment just by knowing the appointmentId.
//
//      New rules (same as getAppointments):
//        • APPOINTMENT_APPROVE → can see any appointment
//        • APPOINTMENT_READ    → can only see appointments where they are the doctor
//        • anything else       → 403

exports.getAppointmentById = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        const { user, userPermissions } = await getUserPermissions(req.user.id);
        if (!user) {
            return res.status(404).json(new ApiError(404, "User not found"));
        }

        // Must hold at least one appointment permission
        const hasApprovePerm = userPermissions.has("APPOINTMENT_APPROVE");
        const hasReadPerm = userPermissions.has("APPOINTMENT_READ");

        if (!hasApprovePerm && !hasReadPerm) {
            return res.status(403).json(
                new ApiError(403, "You are not allowed to view appointments")
            );
        }

        const appointment = await Appointment.findOne(
            { appointmentId, isDeleted: false }
        ).lean();

        if (!appointment) {
            return res.status(404).json(new ApiError(404, "Appointment not found"));
        }

        // Doctor can only view their own appointments
        if (!hasApprovePerm && hasReadPerm) {
            if (appointment.doctorEmployeeId !== user.employeeId) {
                return res.status(403).json(
                    new ApiError(403, "You can only view your own appointments")
                );
            }
        }

        // Batch fetch patient + doctor in parallel
        const [patient, doctor] = await Promise.all([
            Patient.findOne(
                { UHID: appointment.patientId, isDeleted: false },
                { name: 1, phone: 1, email: 1 }
            ).lean(),
            Employee.findOne(
                { employeeCode: appointment.doctorEmployeeId, isDeleted: false },
                { name: 1, department: 1, designation: 1 }
            ).lean()
        ]);

        return res.status(200).json(
            new ApiResponse(
                200,
                formatAppointment(appointment, patient, doctor, userPermissions, user.employeeId),
                "Appointment retrieved successfully"
            )
        );
    } catch (err) {
        console.error(err);
        return res.status(500).json(new ApiError(500, err.message || "Internal Server Error"));
    }
};

// ─── Update Appointment (reschedule date/timeSlot + status) ──────────────────
//
// FIX 1: Old version had NO permission check — any JWT holder could call this.
//         Now requires APPOINTMENT_APPROVE.
//
// FIX 2: If the appointment's current date+timeSlot is today or in the past,
//         rescheduling is blocked. You cannot reschedule a past appointment.
//         (Example: appointment was for yesterday → you can't change its slot)


exports.updateAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { date, timeSlot, status } = req.body;

        const { user, userPermissions } = await getUserPermissions(req.user.id);

        if (!user) {
            return res.status(404).json(new ApiError(404, "User not found"));
        }

        if (!userPermissions.has("APPOINTMENT_APPROVE")) {
            return res.status(403).json(
                new ApiError(403, "You are not authorized to update appointments")
            );
        }

        const appointment = await Appointment.findOne({
            appointmentId,
            isDeleted: false
        });

        if (!appointment) {
            return res.status(404).json(new ApiError(404, "Appointment not found"));
        }

        if (["COMPLETED", "CANCELLED"].includes(appointment.status)) {
            return res.status(400).json(
                new ApiError(
                    400,
                    `Cannot modify a ${appointment.status.toLowerCase()} appointment`
                )
            );
        }

        const doctor = await Employee.findOne(
            {
                employeeCode: appointment.doctorEmployeeId,
                isDeleted: false
            },
            { joiningDate: 1, status: 1 }
        ).lean();

        if (!doctor) {
            return res.status(404).json(
                new ApiError(404, "Assigned doctor not found")
            );
        }

        // ✅ Apply helpers (reduces complexity drastically)
        if (status) {
            validateStatusUpdate(appointment, status);
        }

        if (date || timeSlot) {
            await validateReschedule({
                appointment,
                doctor,
                date,
                timeSlot
            });
        }

        await appointment.save();

        return res.status(200).json(
            new ApiResponse(200, appointment, "Appointment updated successfully")
        );

    } catch (err) {
        console.error(err);

        // ✅ Centralized error handling for helper-thrown errors
        if (err instanceof ApiError) {
            return res.status(err.statusCode || 400).json(err);
        }

        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};



// ─── Update Appointment Status (Doctor marks IN-PROCESS / COMPLETED) ─────────
//
// FIX: Old version fetched user then immediately ran Role.find without checking
//      if user was null first — would crash with "Cannot read properties of null
//      (reading 'roleIds')".

exports.updateAppointmentStatus = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { status } = req.body;

        //  Step 1: Validate input
        validateStatusInput(status);

        const { user, userPermissions } = await getUserPermissions(req.user.id);

        if (!user) {
            return res.status(404).json(new ApiError(404, "User not found"));
        }

        const appointment = await Appointment.findOne({
            appointmentId,
            isDeleted: false
        });

        validateAppointmentExists(appointment);

        //  Step 2: Business validations
        validateFutureRule(appointment, status);
        validateStatusTransition(appointment, status);
        validateStatusPermissions(appointment, status, user, userPermissions);
        validateStatusOrder(appointment, status);

        // Step 3: Apply update
        appointment.status = status;

        if (status === "COMPLETED") {
            appointment.completedAt = new Date();
        }

        await appointment.save();

        return res.status(200).json(
            new ApiResponse(
                200,
                appointment,
                `Appointment marked as ${status} successfully`
            )
        );

    } catch (err) {
        console.error(err);

        if (err instanceof ApiError) {
            return res.status(err.statusCode || 400).json(err);
        }

        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};

// ─── Soft Delete Appointment ─────────────────────────────────────────────────

exports.deleteAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        const { user, userPermissions } = await getUserPermissions(req.user.id);
        if (!user) {
            return res.status(404).json(new ApiError(404, "User not found"));
        }

        if (!userPermissions.has("APPOINTMENT_DELETE")) {
            return res.status(403).json(
                new ApiError(403, "You are not authorized to delete appointments")
            );
        }

        const appointment = await Appointment.findOne({ appointmentId, isDeleted: false });
        if (!appointment) {
            return res.status(404).json(new ApiError(404, "Appointment not found"));
        }

        if (["COMPLETED", "IN-PROCESS"].includes(appointment.status)) {
            return res.status(400).json(
                new ApiError(400, `Cannot delete a ${appointment.status.toLowerCase()} appointment`)
            );
        }

        appointment.isDeleted = true;
        appointment.deletedAt = new Date();
        appointment.deletedBy = req.user.employeeId || req.user.id;

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

        const { user, userPermissions } = await getUserPermissions(req.user.id);
        if (!user) {
            return res.status(404).json(new ApiError(404, "User not found"));
        }

        if (!userPermissions.has("APPOINTMENT_APPROVE")) {
            return res.status(403).json(
                new ApiError(403, "You are not authorized to approve appointments")
            );
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

        const [patient, doctor] = await Promise.all([
            Patient.findOne(
                { UHID: appointment.patientId, isDeleted: false },
                { name: 1, email: 1 }
            ).lean(),
            Employee.findOne(
                { employeeCode: appointment.doctorEmployeeId, isDeleted: false },
                { name: 1, status: 1 }
            ).lean()
        ]);

        if (!patient) return res.status(404).json(new ApiError(404, "Patient not found"));
        if (!doctor) return res.status(404).json(new ApiError(404, "Doctor not found"));
        if (!doctor.status) return res.status(400).json(new ApiError(400, "Doctor is currently inactive"));

        // Re-check slot availability at approval time (another booking may have taken it)
        const conflict = await findSlotConflict({
            doctorEmployeeId: appointment.doctorEmployeeId,
            date: appointment.date,
            timeSlot: appointment.timeSlot,
            excludeAppointmentId: appointment._id
        });

        if (conflict) {
            appointment.status = "CANCELLED";
            appointment.cancellationReason = "Requested slot became unavailable before approval";
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
            sendEmail({
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
            }).catch((error_) => console.error("Email send failed:", error_));
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

        const { user, userPermissions } = await getUserPermissions(req.user.id);
        if (!user) {
            return res.status(404).json(new ApiError(404, "User not found"));
        }

        if (!userPermissions.has("APPOINTMENT_REJECT")) {
            return res.status(403).json(
                new ApiError(403, "You are not authorized to reject appointments")
            );
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

        const [patient, doctor] = await Promise.all([
            Patient.findOne(
                { UHID: appointment.patientId, isDeleted: false },
                { name: 1, email: 1 }
            ).lean(),
            Employee.findOne(
                { employeeCode: appointment.doctorEmployeeId, isDeleted: false },
                { name: 1 }
            ).lean()
        ]);

        if (!patient) return res.status(404).json(new ApiError(404, "Patient not found"));
        if (!doctor) return res.status(404).json(new ApiError(404, "Doctor not found"));

        appointment.status = "CANCELLED";
        appointment.cancellationReason = "Appointment request rejected by hospital staff";
        await appointment.save();

        if (patient.email) {
            sendEmail({
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
            }).catch((error_) => console.error("Email send failed:", error_));
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