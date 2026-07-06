const Appointment = require("../models/Appointment");
const Employee = require("../models/Employee");
const Patient = require("../models/Patient");
const User = require("../models/User");
const Role = require("../models/Role");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

const {
    getUserPermissions,
    formatAppointment,
    validateReschedule,
    validatePatientAndDoctor,
    validateAppointmentDateRule,
    validateSlotConflicts,
    sendAppointmentEmail,
    validateStatusTransition,
    findSlotConflict,
    MAX_PAGE_LIMIT
} = require("../utils/appointmentValidators");
const escapeRegex = (value = "") => { return value.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`); };
// ─── Admin/Reception: Create Appointment ─────────────────────────────────────
exports.createAppointment = async (req, res) => {
    try {
        const { patientId, doctorEmployeeId, date, timeSlot } = req.body;
        const createdByEmployeeId = req.user.employeeId || req.user.id;

        if (!patientId || !doctorEmployeeId || !date || !timeSlot) {
            throw new ApiError(400, "Missing required fields: patientId, doctorEmployeeId, date, timeSlot");
        }

        // Run validation layers
        const { patient, doctor } = await validatePatientAndDoctor(patientId, doctorEmployeeId);
        const appointmentDate = validateAppointmentDateRule(date, doctor);
        await validateSlotConflicts({ patientId, doctorEmployeeId, date: appointmentDate, timeSlot });

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
                    new ApiError(409, "This slot was just taken. Please choose a different slot.")
                );
            }
            throw err;
        }

        // Non-blocking email notification
        sendAppointmentEmail(patient, doctor, appointment, appointmentDate, timeSlot);

        return res.status(201).json(
            new ApiResponse(201, appointment, "Appointment created successfully")
        );
    } catch (err) {
        console.error(err);
        return res.status(err.statusCode || 500).json(
            err instanceof ApiError ? err : new ApiError(500, err.message || "Internal Server Error")
        );
    }
};

// ─── Get All Appointments (Role-Filtered & Paginated) ────────────────────────
exports.getAppointments = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), MAX_PAGE_LIMIT);
        const skip = (page - 1) * limit;

        const { doctorEmployeeId, status, search, date } = req.query;

        const { user, userPermissions } = await getUserPermissions(req.user.id);

        if (!user) {
            return res.status(404).json(new ApiError(404, "User not found"));
        }

        let query = { isDeleted: false };

        if (userPermissions.has("APPOINTMENT_APPROVE")) {
            if (doctorEmployeeId) {
                query.doctorEmployeeId = doctorEmployeeId;
            }
        } else if (userPermissions.has("APPOINTMENT_READ")) {
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

        if (status && status !== "ALL") {
            query.status = status;
        }
        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            query.date = { $gte: startOfDay, $lte: endOfDay };
        }

        if (search?.trim()) {
            const regex = new RegExp(escapeRegex(search.trim()), "i");

            const [matchedPatients, matchedDoctors] = await Promise.all([
                Patient.find(
                    {
                        isDeleted: false,
                        $or: [
                            { name: regex },
                            { UHID: regex },
                            { phone: regex },
                            { email: regex }
                        ]
                    },
                    { UHID: 1 }
                ).lean(),

                Employee.find(
                    {
                        isDeleted: false,
                        $or: [
                            { name: regex },
                            { employeeCode: regex },
                            { department: regex },
                            { designation: regex },
                            { specialization: regex }
                        ]
                    },
                    { employeeCode: 1 }
                ).lean()
            ]);

            const matchedPatientIds = matchedPatients.map((p) => p.UHID);
            const matchedDoctorIds = matchedDoctors.map((d) => d.employeeCode);

            query.$or = [
                { appointmentId: regex },
                { patientId: regex },
                { doctorEmployeeId: regex },
                { timeSlot: regex },
                { status: regex },
                { patientId: { $in: matchedPatientIds } },
                { doctorEmployeeId: { $in: matchedDoctorIds } }
            ];
        }

        const totalRecords = await Appointment.countDocuments(query);

        const appointments = await Appointment.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

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
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};

// ─── Get Appointment By ID ───────────────────────────────────────────────────
exports.getAppointmentById = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        const { user, userPermissions } = await getUserPermissions(req.user.id);
        if (!user) {
            return res.status(404).json(new ApiError(404, "User not found"));
        }

        const hasApprovePerm = userPermissions.has("APPOINTMENT_APPROVE");
        const hasReadPerm = userPermissions.has("APPOINTMENT_READ");

        if (!hasApprovePerm && !hasReadPerm) {
            return res.status(403).json(
                new ApiError(403, "You are not allowed to view appointments")
            );
        }

        const appointment = await Appointment.findOne({ appointmentId, isDeleted: false }).lean();
        if (!appointment) {
            return res.status(404).json(new ApiError(404, "Appointment not found"));
        }

        if (!hasApprovePerm && hasReadPerm && appointment.doctorEmployeeId !== user.employeeId) {
            return res.status(403).json(
                new ApiError(403, "You can only view your own appointments")
            );
        }

        const [patient, doctor] = await Promise.all([
            Patient.findOne({ UHID: appointment.patientId, isDeleted: false }, { name: 1, phone: 1, email: 1 }).lean(),
            Employee.findOne({ employeeCode: appointment.doctorEmployeeId, isDeleted: false }, { name: 1, department: 1, designation: 1 }).lean()
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

// ─── Update Appointment (Reschedule + Status Tuning) ─────────────────────────
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

        const appointment = await Appointment.findOne({ appointmentId, isDeleted: false });
        if (!appointment) {
            return res.status(404).json(new ApiError(404, "Appointment not found"));
        }

        if (["COMPLETED", "CANCELLED"].includes(appointment.status)) {
            return res.status(400).json(
                new ApiError(400, `Cannot modify a ${appointment.status.toLowerCase()} appointment`)
            );
        }

        const doctor = await Employee.findOne(
            { employeeCode: appointment.doctorEmployeeId, isDeleted: false },
            { joiningDate: 1, status: 1 }
        ).lean();

        if (!doctor) {
            return res.status(404).json(new ApiError(404, "Assigned doctor not found"));
        }

        // Apply decoupled schema business checks
        if (status) {
            validateStatusTransition(appointment, status, user, userPermissions); // Validates transitions & updates parameters internally
            appointment.status = status;
            if (status === "COMPLETED") appointment.completedAt = new Date();
        }

        if (date || timeSlot) {
            await validateReschedule({ appointment, doctor, date, timeSlot });
        }

        await appointment.save();

        return res.status(200).json(
            new ApiResponse(200, appointment, "Appointment updated successfully")
        );
    } catch (err) {
        console.error(err);
        if (err instanceof ApiError) {
            return res.status(err.statusCode || 400).json(err);
        }
        return res.status(500).json(new ApiError(500, err.message || "Internal Server Error"));
    }
};

// ─── Update Appointment Status (Doctor Workflow Stepping) ────────────────────
exports.updateAppointmentStatus = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { status } = req.body;

        const { user, userPermissions } = await getUserPermissions(req.user.id);
        if (!user) {
            return res.status(404).json(new ApiError(404, "User not found"));
        }

        const appointment = await Appointment.findOne({ appointmentId, isDeleted: false });
        if (!appointment) {
            return res.status(404).json(new ApiError(404, "Appointment not found"));
        }

        // Hand off verification steps to validation engine
        validateStatusTransition(appointment, status, user, userPermissions);

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
        if (err instanceof ApiError) {
            return res.status(err.statusCode || 400).json(err);
        }
        return res.status(500).json(new ApiError(500, err.message || "Internal Server Error"));
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
            new ApiResponse(200, {
                appointmentId: appointment.appointmentId,
                patientId: appointment.patientId,
                doctorEmployeeId: appointment.doctorEmployeeId,
                date: appointment.date,
                timeSlot: appointment.timeSlot,
                status: appointment.status
            }, "Appointment deleted successfully")
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
            Patient.findOne({ UHID: appointment.patientId, isDeleted: false }, { name: 1, email: 1 }).lean(),
            Employee.findOne({ employeeCode: appointment.doctorEmployeeId, isDeleted: false }, { name: 1, status: 1 }).lean()
        ]);

        if (!patient) return res.status(404).json(new ApiError(404, "Patient not found"));
        if (!doctor) return res.status(404).json(new ApiError(404, "Doctor not found"));
        if (!doctor.status) return res.status(400).json(new ApiError(400, "Doctor is currently inactive"));

        // Re-check slot availability dynamically at approval runtime
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
                new ApiResponse(409, appointment, "Requested slot is no longer available. Appointment has been cancelled.")
            );
        }

        appointment.status = "BOOKED";
        appointment.createdByEmployeeId = req.user.employeeId || req.user.id;
        await appointment.save();

        if (patient.email) {
            sendAppointmentEmail(patient, doctor, appointment, appointment.date, appointment.timeSlot);
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
            Patient.findOne({ UHID: appointment.patientId, isDeleted: false }, { name: 1, email: 1 }).lean(),
            Employee.findOne({ employeeCode: appointment.doctorEmployeeId, isDeleted: false }, { name: 1 }).lean()
        ]);

        if (!patient) return res.status(404).json(new ApiError(404, "Patient not found"));
        if (!doctor) return res.status(404).json(new ApiError(404, "Doctor not found"));

        appointment.status = "CANCELLED";
        appointment.cancellationReason = "Appointment request rejected by hospital staff";
        await appointment.save();

        if (patient.email) {
            sendAppointmentEmail(patient, doctor, appointment, appointment.date, appointment.timeSlot);
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
exports.getAppointmentFilterOptions = async (req, res) => {
    try {
        const { doctorSearch } = req.query;

        const { user, userPermissions } = await getUserPermissions(req.user.id);

        if (!user) {
            return res.status(404).json(new ApiError(404, "User not found"));
        }

        if (!userPermissions.has("APPOINTMENT_READ")) {
            return res.status(403).json(
                new ApiError(403, "You are not allowed to view appointment filters")
            );
        }

        const doctorRole = await Role.findOne(
            { name: "DOCTOR", status: true },
            { roleId: 1 }
        ).lean();

        if (!doctorRole) {
            return res.status(404).json(
                new ApiError(404, "Doctor role not found")
            );
        }

        const doctorUsers = await User.find(
            {
                roleIds: doctorRole.roleId,
                status: true,
                isDeleted: false
            },
            { employeeId: 1 }
        ).lean();

        const doctorEmployeeIds = doctorUsers.map((user) => user.employeeId);

        const doctorQuery = {
            employeeCode: { $in: doctorEmployeeIds },
            isDeleted: false,
            status: true
        };
        if ( doctorSearch?.trim()) {
            const regex = new RegExp(escapeRegex(doctorSearch.trim()), "i");

            doctorQuery.$or = [
                { name: regex },
                { employeeCode: regex },
                { department: regex },
                { specialization: regex }
            ];
        }

        const doctors = await Employee.find(
            doctorQuery,
            {
                employeeCode: 1,
                name: 1,
                department: 1,
                designation: 1,
                specialization: 1
            }
        )
            .sort({ name: 1 })
            .lean();

        const statuses = [
            "ALL",
            "PENDING",
            "BOOKED",
            "IN-PROCESS",
            "COMPLETED",
            "CANCELLED"
        ];

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    doctors,
                    statuses
                },
                "Appointment filter options fetched successfully"
            )
        );
    } catch (err) {
        console.error(err);
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};