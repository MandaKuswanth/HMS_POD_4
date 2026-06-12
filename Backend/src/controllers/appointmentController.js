const Appointment = require("../models/Appointment");
const Employee = require("../models/Employee");
const Patient = require("../models/Patient");
const User = require("../models/User");

const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

const sendEmail = require("../utils/sendEmail");

const {
    SLOT_BLOCKING_STATUSES,
    getDateRange,
    normalizeAppointmentDate,
    getTomorrowDate,
    isBeforeDoctorJoiningDate,
} = require("../utils/appointmentHelpers");

exports.cancelPatientAppointments = async (patientId, reason) => {
    const result = await Appointment.updateMany(
        {
            patientId,
            status: {
                $in: ["BOOKED", "IN-PROCESS"],
            },
        },
        {
            $set: {
                status: "CANCELLED",
                cancellationReason: reason,
            },
        }
    );

    return result.modifiedCount;
};

exports.createAppointment = async (req, res) => {
    try {
        const { patientId, doctorEmployeeId, date, timeSlot } = req.body;

        const createdByEmployeeId = req.user.employeeId || req.user.id;

        if (!patientId || !doctorEmployeeId || !date || !timeSlot) {
            return res.status(400).json(
                new ApiError(
                    400,
                    "Missing required fields: patientId, doctorEmployeeId, date, timeSlot"
                )
            );
        }

        const patient = await Patient.findOne({ UHID: patientId });

        if (!patient) {
            return res.status(404).json(
                new ApiError(404, "Patient not found with provided UHID")
            );
        }

        const doctor = await Employee.findOne({
            employeeCode: doctorEmployeeId,
        });

        if (!doctor) {
            return res.status(404).json(
                new ApiError(404, "Doctor not found with provided employee code")
            );
        }

        const doctorUser = await User.findOne({
            employeeId: doctor.employeeCode,
        });

        if (!doctorUser) {
            return res.status(404).json(
                new ApiError(404, "Doctor user account not found")
            );
        }

        if (!doctorUser.roles.includes("DOCTOR")) {
            return res.status(400).json(
                new ApiError(400, "Invalid doctorEmployeeId, employee is not a doctor")
            );
        }

        if (!doctorUser.status || !doctor.status) {
            return res.status(400).json(
                new ApiError(400, "Doctor account is inactive")
            );
        }

        const appointmentDate = normalizeAppointmentDate(date);

        if (appointmentDate < getTomorrowDate()) {
            return res.status(400).json(
                new ApiError(
                    400,
                    "Appointments can be booked only from tomorrow onwards"
                )
            );
        }

        if (isBeforeDoctorJoiningDate(appointmentDate, doctor)) {
            return res.status(400).json(
                new ApiError(
                    400,
                    "Appointment cannot be booked before doctor's joining date"
                )
            );
        }

        const { startOfDay, endOfDay } = getDateRange(appointmentDate);

        const existingAppointment = await Appointment.findOne({
            doctorEmployeeId,
            date: {
                $gte: startOfDay,
                $lt: endOfDay,
            },
            timeSlot,
            status: {
                $in: SLOT_BLOCKING_STATUSES,
            },
        });

        if (existingAppointment) {
            return res.status(409).json(
                new ApiError(
                    409,
                    "Doctor is already booked for this slot on the selected date"
                )
            );
        }

        const appointment = await Appointment.create({
            patientId,
            doctorEmployeeId,
            date: appointmentDate,
            timeSlot,
            createdByEmployeeId,
            status: "BOOKED",
        });

        if (patient.email) {
            await sendEmail({
                to: patient.email,
                subject: "Appointment Confirmation - HMS",
                html: `
                    <h2>Appointment Confirmed</h2>
                    <p>Your appointment has been successfully booked.</p>
                    <p><strong>Doctor:</strong> Dr. ${doctor.name}</p>
                    <p><strong>Date:</strong> ${appointmentDate.toDateString()}</p>
                    <p><strong>Time:</strong> ${timeSlot}</p>
                    <p>Please arrive at least 10 minutes before your scheduled time.</p>
                    <p>Thank you,<br/>HMS Team</p>
                `,
            });
        }

        return res.status(201).json(
            new ApiResponse(201, appointment, "Appointment created successfully")
        );
    } catch (err) {
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};

exports.getAppointments = async (req, res) => {
    try {
        const userRole = req.user.role;

        let appointments = [];

        if (userRole === "ADMIN" || userRole === "RECEPTIONIST") {
            appointments = await Appointment.find().sort({ createdAt: -1 });
        } else if (userRole === "DOCTOR") {
            const doctor = await Employee.findOne({
                email: req.user.email,
            });

            if (!doctor) {
                return res.status(404).json(
                    new ApiError(404, "Doctor profile not found")
                );
            }

            appointments = await Appointment.find({
                doctorEmployeeId: doctor.employeeCode,
            }).sort({ createdAt: -1 });
        } else {
            return res.status(403).json(
                new ApiError(403, "You are not allowed to view appointments")
            );
        }

        const formattedAppointments = await Promise.all(
            appointments.map(async (appointment) => {
                const patient = await Patient.findOne({
                    UHID: appointment.patientId,
                });

                const doctor = await Employee.findOne({
                    employeeCode: appointment.doctorEmployeeId,
                });

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

                    createdByEmployeeId: appointment.createdByEmployeeId || null,

                    createdAt: appointment.createdAt,
                    updatedAt: appointment.updatedAt,
                };
            })
        );

        return res.status(200).json(
            new ApiResponse(
                200,
                formattedAppointments,
                "Appointments fetched successfully"
            )
        );
    } catch (err) {
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};

exports.getAppointmentById = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        const appointment = await Appointment.findOne({ appointmentId });

        if (!appointment) {
            return res.status(404).json(
                new ApiError(404, "Appointment not found")
            );
        }

        return res.status(200).json(
            new ApiResponse(200, appointment, "Appointment retrieved successfully")
        );
    } catch (err) {
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};

exports.updateAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { date, timeSlot, status } = req.body;

        const appointment = await Appointment.findOne({ appointmentId });

        if (!appointment) {
            return res.status(404).json(
                new ApiError(404, "Appointment not found")
            );
        }

        if (status) {
            const allowedStatus = [
                "PENDING",
                "BOOKED",
                "IN-PROCESS",
                "COMPLETED",
                "CANCELLED",
            ];

            if (!allowedStatus.includes(status)) {
                return res.status(400).json(
                    new ApiError(400, "Invalid appointment status")
                );
            }

            appointment.status = status;
        }

        if (date) {
            appointment.date = normalizeAppointmentDate(date);

        }

        if (timeSlot) {
            appointment.timeSlot = timeSlot;
        }

        if (date || timeSlot || status) {
            const { startOfDay, endOfDay } = getDateRange(appointment.date);

            const existing = await Appointment.findOne({
                _id: { $ne: appointment._id },
                doctorEmployeeId: appointment.doctorEmployeeId,
                date: {
                    $gte: startOfDay,
                    $lt: endOfDay,
                },
                timeSlot: appointment.timeSlot,
                status: {
                    $in: SLOT_BLOCKING_STATUSES,
                },
            });

            if (
                existing &&
                SLOT_BLOCKING_STATUSES.includes(appointment.status)
            ) {
                return res.status(409).json(
                    new ApiError(409, "Slot already booked")
                );
            }
        }

        await appointment.save();

        return res.status(200).json(
            new ApiResponse(200, appointment, "Appointment updated successfully")
        );
    } catch (err) {
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};

exports.deleteAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        const appointment = await Appointment.findOne({ appointmentId });

        if (!appointment) {
            return res.status(404).json(
                new ApiError(404, "Appointment not found")
            );
        }

        await Appointment.deleteOne({ appointmentId });

        return res.status(200).json(
            new ApiResponse(200, null, "Appointment deleted successfully")
        );
    } catch (err) {
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};

exports.approveAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        const appointment = await Appointment.findOne({ appointmentId });

        if (!appointment) {
            return res.status(404).json(
                new ApiError(404, "Appointment not found")
            );
        }

        if (appointment.status !== "PENDING") {
            return res.status(400).json(
                new ApiError(400, "Only pending appointments can be approved")
            );
        }

        const patient = await Patient.findOne({
            UHID: appointment.patientId,
        });

        const doctor = await Employee.findOne({
            employeeCode: appointment.doctorEmployeeId,
        });

        const { startOfDay, endOfDay } = getDateRange(appointment.date);

        const conflict = await Appointment.findOne({
            _id: { $ne: appointment._id },
            doctorEmployeeId: appointment.doctorEmployeeId,
            date: {
                $gte: startOfDay,
                $lt: endOfDay,
            },
            timeSlot: appointment.timeSlot,
            status: {
                $in: ["BOOKED", "IN-PROCESS"],
            },
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
                    "Requested slot is no longer available. Appointment request has been cancelled."
                )
            );
        }

        appointment.status = "BOOKED";
        appointment.createdByEmployeeId = req.user.employeeId || req.user.id;

        await appointment.save();

        if (patient?.email) {
            await sendEmail({
                to: patient.email,
                subject: "Appointment Approved - HMS",
                html: `
                    <h2>Appointment Approved</h2>
                    <p>Hello ${patient.name},</p>
                    <p>Your appointment request has been approved.</p>
                    <p><strong>Appointment ID:</strong> ${appointment.appointmentId}</p>
                    <p><strong>Doctor:</strong> Dr. ${doctor?.name || "N/A"}</p>
                    <p><strong>Date:</strong> ${appointment.date?.toDateString()}</p>
                    <p><strong>Time:</strong> ${appointment.timeSlot}</p>
                    <p>Please arrive at least 10 minutes before your scheduled time.</p>
                    <p>Thank you,<br/>HMS Team</p>
                `,
            });
        }

        return res.status(200).json(
            new ApiResponse(200, appointment, "Appointment approved successfully")
        );
    } catch (err) {
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};

exports.rejectAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        const appointment = await Appointment.findOne({ appointmentId });

        if (!appointment) {
            return res.status(404).json(
                new ApiError(404, "Appointment not found")
            );
        }

        if (appointment.status !== "PENDING") {
            return res.status(400).json(
                new ApiError(400, "Only pending appointments can be rejected")
            );
        }

        const patient = await Patient.findOne({
            UHID: appointment.patientId,
        });

        const doctor = await Employee.findOne({
            employeeCode: appointment.doctorEmployeeId,
        });

        appointment.status = "CANCELLED";
        appointment.cancellationReason =
            "Appointment request rejected by hospital staff";

        await appointment.save();

        if (patient?.email) {
            await sendEmail({
                to: patient.email,
                subject: "Appointment Request Rejected - HMS",
                html: `
                    <h2>Appointment Request Rejected</h2>
                    <p>Hello ${patient.name},</p>
                    <p>Your appointment request has been rejected by hospital staff.</p>
                    <p><strong>Appointment ID:</strong> ${appointment.appointmentId}</p>
                    <p><strong>Doctor:</strong> Dr. ${doctor?.name || "N/A"}</p>
                    <p><strong>Date:</strong> ${appointment.date?.toDateString()}</p>
                    <p><strong>Time:</strong> ${appointment.timeSlot}</p>
                    <p>Please contact hospital reception or book another available slot.</p>
                    <p>Thank you,<br/>HMS Team</p>
                `,
            });
        }

        return res.status(200).json(
            new ApiResponse(200, appointment, "Appointment rejected successfully")
        );
    } catch (err) {
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};