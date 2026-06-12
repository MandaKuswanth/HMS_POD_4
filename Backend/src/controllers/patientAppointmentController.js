const Appointment = require("../models/Appointment");
const Employee = require("../models/Employee");
const User = require("../models/User");

const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

const SLOT_BLOCKING_STATUSES = ["PENDING", "BOOKED", "IN-PROCESS"];

const getDateRange = (dateValue) => {
    const startOfDay = new Date(dateValue);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(startOfDay.getDate() + 1);

    return {
        startOfDay,
        endOfDay,
    };
};

const getPatientId = (req) => {
    return req.user?.UHID || req.user?.uhid || req.user?.patientId;
};

exports.getDoctors = async (req, res) => {
    try {
        const doctorUsers = await User.find({
            roles: "DOCTOR",
            status: true,
        });

        const doctorEmployeeIds = doctorUsers.map(
            (doctor) => doctor.employeeId
        );

        const doctors = await Employee.find({
            employeeCode: {
                $in: doctorEmployeeIds,
            },
            status: true,
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                doctors,
                "Doctors fetched successfully"
            )
        );
    } catch (err) {
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};

exports.getDoctorSlots = async (req, res) => {
    try {
        const { doctorEmployeeId, date } = req.query;

        if (!doctorEmployeeId || !date) {
            return res.status(400).json(
                new ApiError(
                    400,
                    "doctorEmployeeId and date are required"
                )
            );
        }

        const doctor = await Employee.findOne({
            employeeCode: doctorEmployeeId,
            status: true,
        });

        if (!doctor) {
            return res.status(404).json(
                new ApiError(404, "Doctor not found")
            );
        }

        const appointmentDate = new Date(date);
        appointmentDate.setHours(0, 0, 0, 0);

        const { startOfDay, endOfDay } = getDateRange(appointmentDate);

        const allSlots =
            Array.isArray(doctor.availabilitySlots) &&
                doctor.availabilitySlots.length > 0
                ? doctor.availabilitySlots
                : [];

        const appointments = await Appointment.find({
            doctorEmployeeId,
            date: {
                $gte: startOfDay,
                $lt: endOfDay,
            },
            status: {
                $in: SLOT_BLOCKING_STATUSES,
            },
        });

        const bookedSlots = appointments.map(
            (appointment) => appointment.timeSlot
        );

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    allSlots,
                    bookedSlots,
                },
                "Doctor slots fetched successfully"
            )
        );
    } catch (err) {
        return res.status(500).json(
            new ApiError(
                500,
                err.message || "Failed to fetch doctor slots"
            )
        );
    }
};

exports.bookAppointment = async (req, res) => {
    try {
        const { doctorEmployeeId, date, timeSlot, reason } = req.body;

        const patientId = getPatientId(req);

        if (!patientId) {
            return res.status(401).json(
                new ApiError(
                    401,
                    "Patient UHID missing. Please login again."
                )
            );
        }

        if (!doctorEmployeeId || !date || !timeSlot) {
            return res.status(400).json(
                new ApiError(400, "All fields are required")
            );
        }

        const doctor = await Employee.findOne({
            employeeCode: doctorEmployeeId,
            status: true,
        });

        if (!doctor) {
            return res.status(404).json(
                new ApiError(404, "Doctor not found")
            );
        }

        const doctorUser = await User.findOne({
            employeeId: doctor.employeeCode,
            roles: "DOCTOR",
            status: true,
        });

        if (!doctorUser) {
            return res.status(400).json(
                new ApiError(400, "Selected employee is not an active doctor")
            );
        }

        const appointmentDate = new Date(date);
        appointmentDate.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        if (appointmentDate < tomorrow) {
            return res.status(400).json(
                new ApiError(
                    400,
                    "Appointments can be booked only from tomorrow onwards"
                )
            );
        }

        if (doctor.joiningDate) {
            const doctorJoiningDate = new Date(doctor.joiningDate);
            doctorJoiningDate.setHours(0, 0, 0, 0);

            if (appointmentDate < doctorJoiningDate) {
                return res.status(400).json(
                    new ApiError(
                        400,
                        "Appointment cannot be booked before doctor's joining date"
                    )
                );
            }
        }

        const { startOfDay, endOfDay } = getDateRange(appointmentDate);

        const doctorConflict = await Appointment.findOne({
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

        if (doctorConflict) {
            return res.status(409).json(
                new ApiError(409, "Selected slot is already booked")
            );
        }
        const patientConflict = await Appointment.findOne({
            patientId,
            date: {
                $gte: startOfDay,
                $lt: endOfDay,
            },
            timeSlot,
            status: {
                $in: SLOT_BLOCKING_STATUSES,
            },
        });

        if (patientConflict) {
            return res.status(409).json(
                new ApiError(
                    409,
                    "You already have an appointment for this date and time slot"
                )
            );
        }

        const appointment = await Appointment.create({
            patientId,
            doctorEmployeeId,
            date: appointmentDate,
            timeSlot,
            reason: reason || "",
            status: "PENDING",
        });

        return res.status(201).json(
            new ApiResponse(
                201,
                appointment,
                "Appointment request submitted successfully"
            )
        );
    } catch (err) {
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};

exports.getMyAppointments = async (req, res) => {
    try {
        const patientId = getPatientId(req);

        if (!patientId) {
            return res.status(401).json(
                new ApiError(
                    401,
                    "Patient UHID missing. Please login again."
                )
            );
        }

        const appointments = await Appointment.find({
            patientId,
        }).sort({
            createdAt: -1,
        });

        const appointmentList = await Promise.all(
            appointments.map(async (appointment) => {
                const doctor = await Employee.findOne({
                    employeeCode: appointment.doctorEmployeeId,
                });

                return {
                    ...appointment.toObject(),
                    doctorName: doctor?.name || "",
                    specialization: doctor?.specialization || "",
                };
            })
        );

        return res.status(200).json(
            new ApiResponse(
                200,
                appointmentList,
                "Appointments fetched successfully"
            )
        );
    } catch (err) {
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};

exports.updateMyAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { date, timeSlot } = req.body;

        const patientId = getPatientId(req);

        if (!patientId) {
            return res.status(401).json(
                new ApiError(
                    401,
                    "Patient UHID missing. Please login again."
                )
            );
        }

        const appointment = await Appointment.findOne({
            appointmentId,
            patientId,
        });

        if (!appointment) {
            return res.status(404).json(
                new ApiError(404, "Appointment not found")
            );
        }

        if (!["PENDING", "BOOKED"].includes(appointment.status)) {
            return res.status(400).json(
                new ApiError(
                    400,
                    "Only pending or booked appointments can be edited"
                )
            );
        }

        if (!date || !timeSlot) {
            return res.status(400).json(
                new ApiError(400, "Date and time slot are required")
            );
        }

        const appointmentDate = new Date(date);
        appointmentDate.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        if (appointmentDate < tomorrow) {
            return res.status(400).json(
                new ApiError(
                    400,
                    "Appointments can be booked only from tomorrow onwards"
                )
            );
        }

        const doctor = await Employee.findOne({
            employeeCode: appointment.doctorEmployeeId,
            status: true,
        });

        if (!doctor) {
            return res.status(404).json(
                new ApiError(404, "Doctor not found or inactive")
            );
        }

        if (doctor.joiningDate) {
            const doctorJoiningDate = new Date(doctor.joiningDate);
            doctorJoiningDate.setHours(0, 0, 0, 0);

            if (appointmentDate < doctorJoiningDate) {
                return res.status(400).json(
                    new ApiError(
                        400,
                        "Appointment cannot be booked before doctor's joining date"
                    )
                );
            }
        }

        const { startOfDay, endOfDay } = getDateRange(appointmentDate);

        const doctorConflict = await Appointment.findOne({
            _id: {
                $ne: appointment._id,
            },
            doctorEmployeeId: appointment.doctorEmployeeId,
            date: {
                $gte: startOfDay,
                $lt: endOfDay,
            },
            timeSlot,
            status: {
                $in: SLOT_BLOCKING_STATUSES,
            },
        });

        if (doctorConflict) {
            return res.status(409).json(
                new ApiError(409, "Selected slot is already booked")
            );
        }

        const patientConflict = await Appointment.findOne({
            _id: {
                $ne: appointment._id,
            },
            patientId,
            date: {
                $gte: startOfDay,
                $lt: endOfDay,
            },
            timeSlot,
            status: {
                $in: SLOT_BLOCKING_STATUSES,
            },
        });

        if (patientConflict) {
            return res.status(409).json(
                new ApiError(
                    409,
                    "You already have an appointment for this date and time slot"
                )
            );
        }

        appointment.date = appointmentDate;
        appointment.timeSlot = timeSlot;

        await appointment.save();

        return res.status(200).json(
            new ApiResponse(
                200,
                appointment,
                "Appointment updated successfully"
            )
        );
    } catch (err) {
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};

exports.cancelMyAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        const patientId = getPatientId(req);

        if (!patientId) {
            return res.status(401).json(
                new ApiError(
                    401,
                    "Patient UHID missing. Please login again."
                )
            );
        }

        const appointment = await Appointment.findOne({
            appointmentId,
            patientId,
        });

        if (!appointment) {
            return res.status(404).json(
                new ApiError(404, "Appointment not found")
            );
        }

        if (appointment.status === "COMPLETED") {
            return res.status(400).json(
                new ApiError(
                    400,
                    "Completed appointment cannot be cancelled"
                )
            );
        }

        if (appointment.status === "CANCELLED") {
            return res.status(400).json(
                new ApiError(
                    400,
                    "Appointment is already cancelled"
                )
            );
        }

        appointment.status = "CANCELLED";
        appointment.cancellationReason = "Cancelled by patient";

        await appointment.save();

        return res.status(200).json(
            new ApiResponse(
                200,
                appointment,
                "Appointment cancelled successfully"
            )
        );
    } catch (err) {
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};