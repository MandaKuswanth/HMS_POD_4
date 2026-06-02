const Appointment = require("../models/Appointment");
const Employee = require("../models/Employee");
const Patient = require("../models/Patient");
const User = require("../models/User");

const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

const sendEmail = require("../utils/sendEmail");


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

        const patient = await Patient.findOne({
            UHID: patientId
        });

        if (!patient) {
            return res.status(404).json(
                new ApiError(404, "Patient not found with provided UHID")
            );
        }

        const doctor = await Employee.findOne({
            employeeCode: doctorEmployeeId
        });

        if (!doctor) {
            return res.status(404).json(
                new ApiError(404, "Doctor not found with provided employee code")
            );
        }

        const doctorUser = await User.findOne({
            employeeId: doctor.employeeCode
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

        const appointmentDate = new Date(date);

        const existingAppointment = await Appointment.findOne({
            doctorEmployeeId,
            date: appointmentDate,
            timeSlot,
            status: { $in: ["BOOKED", "IN-PROCESS"] }
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
            status: "BOOKED"
        });

        if (patient.email) {
            await sendEmail({
                to: patient.email,
                subject: "Appointment Confirmation - HMS",
                html: `
          <h2>Appointment Confirmed</h2>

          <p>Your appointment has been successfully booked.</p>

          <p><strong>Doctor:</strong> Dr. ${doctor.name}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${timeSlot}</p>

          <p>Please arrive at least 10 minutes before your scheduled time.</p>

          <p>Thank you,<br/>HMS Team</p>
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
                email: req.user.email
            });

            if (!doctor) {
                return res.status(404).json(
                    new ApiError(404, "Doctor profile not found")
                );
            }

            appointments = await Appointment.find({
                doctorEmployeeId: doctor.employeeCode
            }).sort({ createdAt: -1 });
        } else {
            return res.status(403).json(
                new ApiError(403, "You are not allowed to view appointments")
            );
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                appointments,
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
            new ApiResponse(
                200,
                appointment,
                "Appointment retrieved successfully"
            )
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
                "BOOKED",
                "IN-PROCESS",
                "COMPLETED",
                "CANCELLED"
            ];

            if (!allowedStatus.includes(status)) {
                return res.status(400).json(
                    new ApiError(400, "Invalid appointment status")
                );
            }

            appointment.status = status;
        }

        if (date) {
            appointment.date = new Date(date);
        }

        if (timeSlot) {
            appointment.timeSlot = timeSlot;
        }

        if (date || timeSlot) {
            const existing = await Appointment.findOne({
                _id: { $ne: appointment._id },
                doctorEmployeeId: appointment.doctorEmployeeId,
                date: appointment.date,
                timeSlot: appointment.timeSlot,
                status: { $in: ["BOOKED", "IN-PROCESS"] }
            });

            if (existing) {
                return res.status(409).json(
                    new ApiError(409, "Slot already booked")
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
            new ApiResponse(
                200,
                null,
                "Appointment deleted successfully"
            )
        );

    } catch (err) {
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};


exports.createPatientAppointment = async (req, res) => {
    try {
        const patientId = req.user.patientId;

        if (!patientId) {
            return res.status(400).json(
                new ApiError(400, "Patient ID not found in token")
            );
        }

        const { doctorEmployeeId, date, timeSlot, reason } = req.body;

        if (!doctorEmployeeId || !date || !timeSlot) {
            return res.status(400).json(
                new ApiError(
                    400,
                    "Missing required fields: doctorEmployeeId, date, timeSlot"
                )
            );
        }

        const patient = await Patient.findOne({
            UHID: patientId,
        });

        if (!patient) {
            return res.status(404).json(
                new ApiError(404, "Patient not found")
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
                new ApiError(
                    400,
                    "Invalid doctorEmployeeId, employee is not a doctor"
                )
            );
        }

        if (!doctorUser.status || !doctor.status) {
            return res.status(400).json(
                new ApiError(400, "Doctor account is inactive")
            );
        }

        const appointmentDate = new Date(date);
        appointmentDate.setHours(0, 0, 0, 0);

        const existingAppointment = await Appointment.findOne({
            doctorEmployeeId,
            date: appointmentDate,
            timeSlot,
            status: {
                $in: ["BOOKED", "IN-PROCESS"],
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
            reason: reason?.trim() || "-",
            createdByEmployeeId: null,
            createdByPatientId: patientId,
            status: "BOOKED",
        });

        if (patient.email) {
            await sendEmail({
                to: patient.email,
                subject: "Appointment Booking Request - HMS",
                html: `
          <h2>Appointment Booked</h2>

          <p>Your appointment has been successfully booked.</p>

          <p><strong>Doctor:</strong> Dr. ${doctor.name}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${timeSlot}</p>
          <p><strong>Reason:</strong> ${appointment.reason}</p>
          <p><strong>Status:</strong> BOOKED</p>

          <p>Please arrive at least 10 minutes before your scheduled time.</p>

          <p>Thank you,<br/>HMS Team</p>
        `,
            });
        }

        return res.status(201).json(
            new ApiResponse(
                201,
                {
                    appointmentId: appointment.appointmentId,
                    doctorName: doctor.name,
                    date: appointment.date,
                    timeSlot: appointment.timeSlot,
                    reason: appointment.reason,
                    status: appointment.status,
                },
                "Appointment booked successfully"
            )
        );
    } catch (err) {
        console.error(err);

        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};

exports.getMyAppointments = async (req, res) => {
    try {
        const patientId = req.user.patientId;

        if (!patientId) {
            return res.status(400).json(
                new ApiError(400, "Patient ID not found in token")
            );
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const appointments = await Appointment.find({
            patientId,
            date: {
                $gte: today,
            },
            status: {
                $in: ["BOOKED", "IN-PROCESS"],
            },
        })
            .sort({ date: 1 })
            .select("appointmentId doctorEmployeeId date timeSlot reason status")
            .lean();

        const doctorEmployeeIds = appointments
            .map((appointment) => appointment.doctorEmployeeId)
            .filter(Boolean);

        const doctors = await Employee.find({
            employeeCode: {
                $in: doctorEmployeeIds,
            },
        })
            .select("employeeCode name")
            .lean();

        const doctorMap = {};

        doctors.forEach((doctor) => {
            doctorMap[doctor.employeeCode] = doctor.name;
        });

        const appointmentList = appointments.map((appointment) => ({
            appointmentId: appointment.appointmentId,
            doctorName: doctorMap[appointment.doctorEmployeeId] || "Doctor",
            date: appointment.date,
            timeSlot: appointment.timeSlot,
            reason: appointment.reason || "-",
            status: appointment.status,
        }));

        return res.status(200).json(
            new ApiResponse(
                200,
                appointmentList,
                "Patient appointments fetched successfully"
            )
        );
    } catch (error) {
        console.log("Get my appointments error:", error);

        return res.status(500).json(
            new ApiError(500, "Failed to fetch appointments")
        );
    }
};
exports.getDoctorsForPatient = async (req, res) => {
    try {
        const { department } = req.query;

        // Find only active doctor users
        const doctorUsers = await User.find({
            status: true,
            $or: [{ roles: "DOCTOR" }, { role: "DOCTOR" }],
        })
            .select("employeeId")
            .lean();

        const doctorEmployeeCodes = doctorUsers
            .map((user) => user.employeeId)
            .filter(Boolean);

        if (doctorEmployeeCodes.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No doctors found",
                data: [],
            });
        }

        const employeeFilter = {
            status: true,
            employeeCode: { $in: doctorEmployeeCodes },
        };

        if (department) {
            employeeFilter.department = department;
        }

        const doctors = await Employee.find(employeeFilter)
            .select("employeeCode name department specialization availabilitySlots")
            .lean();

        const doctorList = doctors.map((doctor) => ({
            employeeCode: doctor.employeeCode,
            name: doctor.name,
            department: doctor.department,
            specialization: doctor.specialization || "",
            availabilitySlots: doctor.availabilitySlots || [],
        }));

        return res.status(200).json({
            success: true,
            message: "Doctors fetched successfully",
            data: doctorList,
        });
    } catch (error) {
        console.log("Get doctors error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch doctors",
        });
    }
};

// Get available slots for selected doctor and date
exports.getAvailableSlotsForPatient = async (req, res) => {
    try {
        const { doctorEmployeeId, date } = req.query;

        if (!doctorEmployeeId || !date) {
            return res.status(400).json({
                success: false,
                message: "doctorEmployeeId and date are required",
            });
        }

        const doctor = await Employee.findOne({
            employeeCode: doctorEmployeeId,
            status: true,
        })
            .select("employeeCode availabilitySlots")
            .lean();

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found",
            });
        }

        const defaultSlots = [
            "09:00 AM - 09:30 AM",
            "09:30 AM - 10:00 AM",
            "10:00 AM - 10:30 AM",
            "10:30 AM - 11:00 AM",
            "11:00 AM - 11:30 AM",
            "02:00 PM - 02:30 PM",
            "02:30 PM - 03:00 PM",
            "03:00 PM - 03:30 PM",
            "03:30 PM - 04:00 PM",
        ];

        const doctorSlots =
            doctor.availabilitySlots && doctor.availabilitySlots.length > 0
                ? doctor.availabilitySlots
                : defaultSlots;

        const selectedDate = new Date(date);
        selectedDate.setHours(0, 0, 0, 0);

        const nextDate = new Date(selectedDate);
        nextDate.setDate(nextDate.getDate() + 1);

        const bookedAppointments = await Appointment.find({
            doctorEmployeeId,
            date: {
                $gte: selectedDate,
                $lt: nextDate,
            },
            status: {
                $in: ["BOOKED", "IN-PROCESS"],
            },
        })
            .select("timeSlot")
            .lean();

        const bookedSlots = bookedAppointments.map((appt) => appt.timeSlot);

        const availableSlots = doctorSlots.filter(
            (slot) => !bookedSlots.includes(slot)
        );

        return res.status(200).json({
            success: true,
            message: "Available slots fetched successfully",
            data: availableSlots,
        });
    } catch (error) {
        console.log("Get available slots error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch available slots",
        });
    }
};