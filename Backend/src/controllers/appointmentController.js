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
    "PENDING", "BOOKED", "IN-PROCESS", "COMPLETED", "CANCELLED",
]);

exports.createAppointment = async (req, res) => {
    try {
        const { patientId, doctorEmployeeId, date, timeSlot } = req.body;
        const createdByEmployeeId = req.user.employeeId || req.user.id;

        if (!patientId || !doctorEmployeeId || !date || !timeSlot) {
            return res.status(400).json(new ApiError(400, "Missing required fields"));
        }

        const patient = await Patient.findOne({ UHID: patientId });
        if (!patient) return res.status(404).json(new ApiError(404, "Patient not found"));

        const doctor = await Employee.findOne({ employeeCode: doctorEmployeeId });
        if (!doctor) return res.status(404).json(new ApiError(404, "Doctor not found"));

        const doctorUser = await User.findOne({ employeeId: doctor.employeeCode });
        if (!doctorUser) return res.status(404).json(new ApiError(404, "Doctor user account not found"));

        const doctorRole = await Role.findOne({ name: "DOCTOR", status: true });
        if (!doctorRole) return res.status(500).json(new ApiError(500, "Doctor role not configured"));

        const isDoctor = doctorUser.roleIds?.includes(doctorRole.roleId);
        if (!isDoctor) return res.status(400).json(new ApiError(400, "Invalid doctorEmployeeId"));
        if (!doctorUser.status || !doctor.status) return res.status(400).json(new ApiError(400, "Doctor account is inactive"));

        const appointmentDate = normalizeAppointmentDate(date);
        if (appointmentDate < getTomorrowDate()) return res.status(400).json(new ApiError(400, "Appointments can be booked only from tomorrow onwards"));
        if (isBeforeDoctorJoiningDate(appointmentDate, doctor)) return res.status(400).json(new ApiError(400, "Appointment cannot be booked before joining date"));

        const existingAppointment = await findSlotConflict({ doctorEmployeeId, date: appointmentDate, timeSlot });
        if (existingAppointment) return res.status(409).json(new ApiError(409, "Doctor is already booked"));

        const appointment = await Appointment.create({
            patientId, doctorEmployeeId, date: appointmentDate, timeSlot, createdByEmployeeId, status: "BOOKED"
        });

        if (patient.email) {
            await sendEmail({
                to: patient.email,
                subject: "Appointment Confirmation - HMS",
                html: `<p>Dr. ${doctor.name} on ${appointmentDate.toDateString()} at ${timeSlot}</p>`
            });
        }

        return res.status(201).json(new ApiResponse(201, appointment, "Appointment created successfully"));
    } catch (err) {
        return res.status(500).json(new ApiError(500, err.message || "Internal Server Error"));
    }
};

exports.getAppointments = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const roles = await Role.find({ roleId: { $in: user.roleIds }, status: true });
        const roleNames = roles.map(role => role.name);

        let appointments = [];

        // Logic based on role: Doctor sees their own, Admin/Reception sees all.
        // Middleware handles permission checking, Controller handles data scoping.
        if (roleNames.includes("DOCTOR")) {
            appointments = await Appointment.find({ doctorEmployeeId: user.employeeId }).sort({ createdAt: -1 });
        } else {
            appointments = await Appointment.find().sort({ createdAt: -1 });
        }

        return res.status(200).json(new ApiResponse(200, appointments, "Appointments fetched"));
    } catch (err) {
        return res.status(500).json(new ApiError(500, err.message));
    }
};

exports.getAppointmentById = async (req, res) => {
    try {
        const appointment = await Appointment.findOne({ appointmentId: req.params.appointmentId });
        if (!appointment) return res.status(404).json(new ApiError(404, "Not found"));
        return res.status(200).json(new ApiResponse(200, appointment, "Retrieved"));
    } catch (err) {
        return res.status(500).json(new ApiError(500, "Error"));
    }
};

exports.updateAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const appointment = await Appointment.findOne({ appointmentId });
        if (!appointment) return res.status(404).json(new ApiError(404, "Not found"));

        // ... (Your update logic here)
        await appointment.save();
        return res.status(200).json(new ApiResponse(200, appointment, "Updated"));
    } catch (err) {
        return res.status(500).json(new ApiError(500, "Error"));
    }
};

exports.deleteAppointment = async (req, res) => {
    try {
        await Appointment.deleteOne({ appointmentId: req.params.appointmentId });
        return res.status(200).json(new ApiResponse(200, null, "Deleted"));
    } catch (err) {
        return res.status(500).json(new ApiError(500, "Error"));
    }
};

exports.approveAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findOne({ appointmentId: req.params.appointmentId });
        if (!appointment) return res.status(404).json(new ApiError(404, "Not found"));
        appointment.status = "BOOKED";
        await appointment.save();
        return res.status(200).json(new ApiResponse(200, appointment, "Approved"));
    } catch (err) {
        return res.status(500).json(new ApiError(500, "Error"));
    }
};

exports.rejectAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findOne({ appointmentId: req.params.appointmentId });
        if (!appointment) return res.status(404).json(new ApiError(404, "Not found"));
        appointment.status = "CANCELLED";
        await appointment.save();
        return res.status(200).json(new ApiResponse(200, appointment, "Rejected"));
    } catch (err) {
        return res.status(500).json(new ApiError(500, "Error"));
    }
};

exports.cancelPatientAppointments = async (patientId, reason) => {
    return await Appointment.updateMany({ patientId }, { $set: { status: "CANCELLED" } });
};