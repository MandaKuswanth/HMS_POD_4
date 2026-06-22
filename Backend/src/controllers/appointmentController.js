const Appointment = require("../models/Appointment");
const Employee = require("../models/Employee");
const Patient = require("../models/Patient");
const User = require("../models/User");
const Role = require("../models/Role");

const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

const sendEmail = require("../utils/sendEmail");

const {
    normalizeAppointmentDate,
    getTomorrowDate,
    isBeforeDoctorJoiningDate,
    findSlotConflict,
} = require("../utils/appointmentHelpers");

const ALLOWED_STATUSES = new Set([
    "PENDING",
    "BOOKED",
    "IN-PROCESS",
    "COMPLETED",
    "CANCELLED",
]);


exports.createAppointment = async (req, res) => {
    try {
        const {
            patientId,
            doctorEmployeeId,
            date,
            timeSlot
        } = req.body;

        const createdByEmployeeId =
            req.user.employeeId || req.user.id;

        if (
            !patientId ||
            !doctorEmployeeId ||
            !date ||
            !timeSlot
        ) {
            return res.status(400).json(
                new ApiError(
                    400,
                    "Missing required fields: patientId, doctorEmployeeId, date, timeSlot"
                )
            );
        }

        const patient = await Patient.findOne({
            UHID: patientId
        });

        if (!patient) {
            return res.status(404).json(
                new ApiError(
                    404,
                    "Patient not found with provided UHID"
                )
            );
        }

        const doctor = await Employee.findOne({
            employeeCode: doctorEmployeeId
        });

        if (!doctor) {
            return res.status(404).json(
                new ApiError(
                    404,
                    "Doctor not found with provided employee code"
                )
            );
        }

        const doctorUser = await User.findOne({
            employeeId: doctor.employeeCode
        });

        if (!doctorUser) {
            return res.status(404).json(
                new ApiError(
                    404,
                    "Doctor user account not found"
                )
            );
        }

        const doctorRole = await Role.findOne({
            name: "DOCTOR",
            status: true
        });

        if (!doctorRole) {
            return res.status(500).json(
                new ApiError(
                    500,
                    "Doctor role not configured"
                )
            );
        }

        const isDoctor =
            doctorUser.roleIds?.includes(
                doctorRole.roleId
            );

        if (!isDoctor) {
            return res.status(400).json(
                new ApiError(
                    400,
                    "Invalid doctorEmployeeId, employee is not a doctor"
                )
            );
        }

        if (
            !doctorUser.status ||
            !doctor.status
        ) {
            return res.status(400).json(
                new ApiError(
                    400,
                    "Doctor account is inactive"
                )
            );
        }

        const appointmentDate =
            normalizeAppointmentDate(date);

        if (
            appointmentDate <
            getTomorrowDate()
        ) {
            return res.status(400).json(
                new ApiError(
                    400,
                    "Appointments can be booked only from tomorrow onwards"
                )
            );
        }

        if (
            isBeforeDoctorJoiningDate(
                appointmentDate,
                doctor
            )
        ) {
            return res.status(400).json(
                new ApiError(
                    400,
                    "Appointment cannot be booked before doctor's joining date"
                )
            );
        }

        const existingAppointment =
            await findSlotConflict({
                doctorEmployeeId,
                date: appointmentDate,
                timeSlot
            });

        if (existingAppointment) {
            return res.status(409).json(
                new ApiError(
                    409,
                    "Doctor is already booked for this slot on the selected date"
                )
            );
        }

        const appointment =
            await Appointment.create({
                patientId,
                doctorEmployeeId,
                date: appointmentDate,
                timeSlot,
                createdByEmployeeId,
                status: "BOOKED"
            });

        if (patient.email) {
            await sendEmail({
                to: patient.email,
                subject:
                    "Appointment Confirmation - HMS",
                html: `
                    <h2>Appointment Confirmed</h2>

                    <p>Your appointment has been successfully booked.</p>

                    <p>
                        <strong>Doctor:</strong>
                        Dr. ${doctor.name}
                    </p>

                    <p>
                        <strong>Date:</strong>
                        ${appointmentDate.toDateString()}
                    </p>

                    <p>
                        <strong>Time:</strong>
                        ${timeSlot}
                    </p>

                    <p>
                        Please arrive at least 10 minutes before your scheduled time.
                    </p>

                    <p>
                        Thank you,<br/>
                        HMS Team
                    </p>
                `
            });
        }

        return res.status(201).json(
            new ApiResponse(
                201,
                appointment,
                "Appointment created successfully"
            )
        );

    } catch (err) {

        console.error(err);

        return res.status(500).json(
            new ApiError(
                500,
                err.message ||
                "Internal Server Error"
            )
        );
    }
};

exports.getAppointments = async (req, res) => {
    try {
        const page = Math.max(
            Number(req.query.page) || 1,
            1
        );

        const limit = Math.max(
            Number(req.query.limit) || 10,
            1
        );

        const skip = (page - 1) * limit;

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json(
                new ApiError(404, "User not found")
            );
        }

        const roles = await Role.find({
            roleId: { $in: user.roleIds },
            status: true
        });

        const roleNames = new Set(
            roles.map((role) => role.name)
        );

        let query = {};

        if (
            roleNames.has("SUPER_ADMIN") ||
            roleNames.has("ADMIN") ||
            roleNames.includes("RECEPTIONIST")
        ) {
            query = {};
        } else if (roleNames.includes("DOCTOR")) {
            const doctor = await Employee.findOne({
                employeeCode: user.employeeId
            });

            if (!doctor) {
                return res.status(404).json(
                    new ApiError(
                        404,
                        "Doctor profile not found"
                    )
                );
            }

            query = {
                doctorEmployeeId: doctor.employeeCode
            };
        } else {
            return res.status(403).json(
                new ApiError(
                    403,
                    "You are not allowed to view appointments"
                )
            );
        }

        const totalRecords =
            await Appointment.countDocuments(query);

        const appointments = await Appointment.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const formattedAppointments = await Promise.all(
            appointments.map(async (appointment) => {
                const patient = await Patient.findOne({
                    UHID: appointment.patientId
                });

                const doctor = await Employee.findOne({
                    employeeCode: appointment.doctorEmployeeId
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
                    cancellationReason:
                        appointment.cancellationReason || "",

                    createdByEmployeeId:
                        appointment.createdByEmployeeId || null,

                    createdAt: appointment.createdAt,
                    updatedAt: appointment.updatedAt
                };
            })
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
            new ApiError(
                500,
                err.message || "Internal Server Error"
            )
        );
    }
};
exports.getAppointmentById = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        const appointment = await Appointment.findOne({
            appointmentId
        });

        if (!appointment) {
            return res.status(404).json(
                new ApiError(
                    404,
                    "Appointment not found"
                )
            );
        }

        const patient = await Patient.findOne({
            UHID: appointment.patientId
        });

        const doctor = await Employee.findOne({
            employeeCode: appointment.doctorEmployeeId
        });

        const formattedAppointment = {
            _id: appointment._id,
            appointmentId: appointment.appointmentId,

            patientId: appointment.patientId,
            patientName: patient?.name || "N/A",
            patientPhone: patient?.phone || "N/A",
            patientEmail: patient?.email || "N/A",

            doctorEmployeeId:
                appointment.doctorEmployeeId,

            doctorName:
                doctor?.name || "N/A",

            doctorDepartment:
                doctor?.department || "N/A",

            doctorDesignation:
                doctor?.designation || "N/A",

            date: appointment.date,
            timeSlot: appointment.timeSlot,
            status: appointment.status,

            reason:
                appointment.reason || "",

            cancellationReason:
                appointment.cancellationReason || "",

            createdByEmployeeId:
                appointment.createdByEmployeeId || null,

            createdAt:
                appointment.createdAt,

            updatedAt:
                appointment.updatedAt
        };

        return res.status(200).json(
            new ApiResponse(
                200,
                formattedAppointment,
                "Appointment retrieved successfully"
            )
        );

    } catch (err) {

        console.error(err);

        return res.status(500).json(
            new ApiError(
                500,
                err.message ||
                "Internal Server Error"
            )
        );
    }
};

exports.updateAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { date, timeSlot, status } = req.body;

        const appointment = await Appointment.findOne({
            appointmentId
        });

        if (!appointment) {
            return res.status(404).json(
                new ApiError(
                    404,
                    "Appointment not found"
                )
            );
        }

        const doctor = await Employee.findOne({
            employeeCode: appointment.doctorEmployeeId
        });

        if (!doctor) {
            return res.status(404).json(
                new ApiError(
                    404,
                    "Assigned doctor not found"
                )
            );
        }

        if (status) {
            if (!ALLOWED_STATUSES.has(status)) {
                return res.status(400).json(
                    new ApiError(
                        400,
                        "Invalid appointment status"
                    )
                );
            }

            appointment.status = status;
        }

        if (date) {
            const appointmentDate =
                normalizeAppointmentDate(date);

            if (
                appointmentDate <
                getTomorrowDate()
            ) {
                return res.status(400).json(
                    new ApiError(
                        400,
                        "Appointments can only be rescheduled from tomorrow onwards"
                    )
                );
            }

            if (
                isBeforeDoctorJoiningDate(
                    appointmentDate,
                    doctor
                )
            ) {
                return res.status(400).json(
                    new ApiError(
                        400,
                        "Appointment cannot be scheduled before doctor's joining date"
                    )
                );
            }

            appointment.date = appointmentDate;
        }

        if (timeSlot) {
            appointment.timeSlot = timeSlot;
        }

        if (date || timeSlot || status) {

            const existing =
                await findSlotConflict({
                    doctorEmployeeId:
                        appointment.doctorEmployeeId,
                    date: appointment.date,
                    timeSlot:
                        appointment.timeSlot,
                    excludeAppointmentId:
                        appointment._id
                });

            if (
                existing &&
                [
                    "PENDING",
                    "BOOKED",
                    "IN-PROCESS"
                ].includes(
                    appointment.status
                )
            ) {
                return res.status(409).json(
                    new ApiError(
                        409,
                        "Slot already booked"
                    )
                );
            }
        }

        await appointment.save();

        return res.status(200).json(
            new ApiResponse(
                200,
                appointment,
                "Appointment updated successfully"
            )
        );

    } catch (err) {

        console.error(err);

        return res.status(500).json(
            new ApiError(
                500,
                err.message ||
                "Internal Server Error"
            )
        );
    }
};

exports.deleteAppointment = async (req, res) => {
    try {

        const { appointmentId } = req.params;

        const appointment =
            await Appointment.findOne({
                appointmentId
            });

        if (!appointment) {
            return res.status(404).json(
                new ApiError(
                    404,
                    "Appointment not found"
                )
            );
        }

        await Appointment.deleteOne({
            appointmentId
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    appointmentId:
                        appointment.appointmentId,

                    patientId:
                        appointment.patientId,

                    doctorEmployeeId:
                        appointment.doctorEmployeeId,

                    date:
                        appointment.date,

                    timeSlot:
                        appointment.timeSlot,

                    status:
                        appointment.status
                },
                "Appointment deleted successfully"
            )
        );

    } catch (err) {

        console.error(err);

        return res.status(500).json(
            new ApiError(
                500,
                err.message ||
                "Internal Server Error"
            )
        );
    }
};

exports.approveAppointment = async (req, res) => {
    try {

        const { appointmentId } = req.params;

        const appointment =
            await Appointment.findOne({
                appointmentId
            });

        if (!appointment) {
            return res.status(404).json(
                new ApiError(
                    404,
                    "Appointment not found"
                )
            );
        }

        if (
            appointment.status !== "PENDING"
        ) {
            return res.status(400).json(
                new ApiError(
                    400,
                    "Only pending appointments can be approved"
                )
            );
        }

        const patient =
            await Patient.findOne({
                UHID: appointment.patientId
            });

        if (!patient) {
            return res.status(404).json(
                new ApiError(
                    404,
                    "Patient not found"
                )
            );
        }

        const doctor =
            await Employee.findOne({
                employeeCode:
                    appointment.doctorEmployeeId
            });

        if (!doctor) {
            return res.status(404).json(
                new ApiError(
                    404,
                    "Doctor not found"
                )
            );
        }

        const conflict =
            await findSlotConflict({
                doctorEmployeeId:
                    appointment.doctorEmployeeId,

                date:
                    appointment.date,

                timeSlot:
                    appointment.timeSlot,

                excludeAppointmentId:
                    appointment._id
            });

        if (conflict) {

            appointment.status =
                "CANCELLED";

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

        appointment.createdByEmployeeId =
            req.user.employeeId ||
            req.user.id;

        await appointment.save();

        if (patient.email) {

            await sendEmail({
                to: patient.email,
                subject:
                    "Appointment Approved - HMS",

                html: `
                    <h2>Appointment Approved</h2>

                    <p>Hello ${patient.name},</p>

                    <p>
                        Your appointment request has been approved.
                    </p>

                    <p>
                        <strong>Appointment ID:</strong>
                        ${appointment.appointmentId}
                    </p>

                    <p>
                        <strong>Doctor:</strong>
                        Dr. ${doctor.name}
                    </p>

                    <p>
                        <strong>Date:</strong>
                        ${appointment.date?.toDateString()}
                    </p>

                    <p>
                        <strong>Time:</strong>
                        ${appointment.timeSlot}
                    </p>

                    <p>
                        Please arrive at least 10 minutes before your scheduled time.
                    </p>

                    <p>
                        Thank you,<br/>
                        HMS Team
                    </p>
                `
            });
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                appointment,
                "Appointment approved successfully"
            )
        );

    } catch (err) {

        console.error(err);

        return res.status(500).json(
            new ApiError(
                500,
                err.message ||
                "Internal Server Error"
            )
        );
    }
};

exports.rejectAppointment = async (req, res) => {
    try {

        const { appointmentId } = req.params;

        const appointment =
            await Appointment.findOne({
                appointmentId
            });

        if (!appointment) {
            return res.status(404).json(
                new ApiError(
                    404,
                    "Appointment not found"
                )
            );
        }

        if (
            appointment.status !== "PENDING"
        ) {
            return res.status(400).json(
                new ApiError(
                    400,
                    "Only pending appointments can be rejected"
                )
            );
        }

        const patient =
            await Patient.findOne({
                UHID: appointment.patientId
            });

        if (!patient) {
            return res.status(404).json(
                new ApiError(
                    404,
                    "Patient not found"
                )
            );
        }

        const doctor =
            await Employee.findOne({
                employeeCode:
                    appointment.doctorEmployeeId
            });

        if (!doctor) {
            return res.status(404).json(
                new ApiError(
                    404,
                    "Doctor not found"
                )
            );
        }

        appointment.status = "CANCELLED";

        appointment.cancellationReason =
            "Appointment request rejected by hospital staff";

        await appointment.save();

        if (patient.email) {

            await sendEmail({
                to: patient.email,
                subject:
                    "Appointment Request Rejected - HMS",

                html: `
                    <h2>Appointment Request Rejected</h2>

                    <p>Hello ${patient.name},</p>

                    <p>
                        Your appointment request has been rejected by hospital staff.
                    </p>

                    <p>
                        <strong>Appointment ID:</strong>
                        ${appointment.appointmentId}
                    </p>

                    <p>
                        <strong>Doctor:</strong>
                        Dr. ${doctor.name}
                    </p>

                    <p>
                        <strong>Date:</strong>
                        ${appointment.date?.toDateString()}
                    </p>

                    <p>
                        <strong>Time:</strong>
                        ${appointment.timeSlot}
                    </p>

                    <p>
                        Please contact hospital reception or book another available slot.
                    </p>

                    <p>
                        Thank you,<br/>
                        HMS Team
                    </p>
                `
            });
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                appointment,
                "Appointment rejected successfully"
            )
        );

    } catch (err) {

        console.error(err);

        return res.status(500).json(
            new ApiError(
                500,
                err.message ||
                "Internal Server Error"
            )
        );
    }
};

exports.cancelPatientAppointments = async (
    patientId,
    reason
) => {

    const result =
        await Appointment.updateMany(
            {
                patientId,
                status: {
                    $in: [
                        "BOOKED",
                        "IN-PROCESS"
                    ]
                }
            },
            {
                $set: {
                    status: "CANCELLED",
                    cancellationReason:
                        reason
                }
            }
        );

    return result.modifiedCount;
};