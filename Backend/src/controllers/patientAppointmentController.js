const Appointment = require("../models/Appointment");
const Employee = require("../models/Employee");
const Patient = require("../models/Patient");
const User = require("../models/User");
const Role = require("../models/Role");

const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

const {
    SLOT_BLOCKING_STATUSES,
    getDateRange,
    normalizeAppointmentDate,
    getTomorrowDate,
    isBeforeDoctorJoiningDate,
    findSlotConflict,
    generateStandardSlots,
    getPastSlots
} = require("../utils/appointmentHelpers");

const getPatientId = (req) => {
    return req.user?.UHID || req.user?.uhid || req.user?.patientId;
};

// ─── Get Available Doctors ───────────────────────────────────────────────────

exports.getDoctors = async (req, res) => {
    try {
        const { q = "", specialization } = req.query;

        const doctorRole = await Role.findOne({ name: "DOCTOR", status: true });
        if (!doctorRole) {
            return res.status(404).json(new ApiError(404, "DOCTOR role not found"));
        }

        const doctorUsers = await User.find({
            roleIds: doctorRole.roleId,
            status: true,
            isEmployee: true,
            isDeleted: false
        });

        const doctorEmployeeIds = doctorUsers.map((d) => d.employeeId);

        let query = {
            employeeCode: { $in: doctorEmployeeIds },
            status: true,
            isDeleted: false
        };

        if (q) {
            query.$or = [
                { name: { $regex: q, $options: "i" } },
                { specialization: { $regex: q, $options: "i" } }
            ];
        }

        if (specialization && specialization !== "All") {
            query.specialization = specialization;
        }

        const doctors = await Employee.find(query);

        return res.status(200).json(
            new ApiResponse(200, doctors, "Doctors fetched successfully")
        );
    } catch (err) {
        console.error(err);
        return res.status(500).json(new ApiError(500, err.message || "Internal Server Error"));
    }
};

// ─── Get Doctor Slots for a Date ─────────────────────────────────────────────

exports.getDoctorSlots = async (req, res) => {
    try {
        const { doctorEmployeeId, date } = req.query;

        if (!doctorEmployeeId || !date) {
            return res.status(400).json(
                new ApiError(400, "doctorEmployeeId and date are required")
            );
        }

        const doctor = await Employee.findOne({
            employeeCode: doctorEmployeeId,
            status: true,
            isDeleted: false
        });

        if (!doctor) {
            return res.status(404).json(new ApiError(404, "Doctor not found"));
        }

        const appointmentDate = normalizeAppointmentDate(date);

        if (Number.isNaN(appointmentDate.getTime())) {
            return res.status(400).json(new ApiError(400, "Invalid date format"));
        }

        const { startOfDay, endOfDay } = getDateRange(appointmentDate);

        const allSlots =
            Array.isArray(doctor.availabilitySlots) && doctor.availabilitySlots.length > 0
                ? doctor.availabilitySlots
                : generateStandardSlots();

        const appointments = await Appointment.find({
            doctorEmployeeId,
            isDeleted: false,
            date: { $gte: startOfDay, $lt: endOfDay },
            status: { $in: SLOT_BLOCKING_STATUSES }
        });

        const bookedSlots = appointments.map((a) => a.timeSlot);

        return res.status(200).json(
            new ApiResponse(
                200,
                { allSlots, bookedSlots, pastSlots: getPastSlots(allSlots, new Date(), appointmentDate) },
                "Doctor slots fetched successfully"
            )
        );
    } catch (err) {
        return res.status(500).json(
            new ApiError(500, err.message || "Failed to fetch doctor slots")
        );
    }
};

// ─── Get Standard Slots ────────────────────────────────────────────────────────

exports.getStandardSlots = async (req, res) => {
    try {
        const slots = generateStandardSlots();
        return res.status(200).json(
            new ApiResponse(200, slots, "Standard slots fetched successfully")
        );
    } catch (err) {
        return res.status(500).json(
            new ApiError(500, err.message || "Failed to fetch standard slots")
        );
    }
};

// ─── Book Appointment (Patient self-book) ────────────────────────────────────

exports.bookAppointment = async (req, res) => {
    try {
        const { doctorEmployeeId, date, timeSlot, reason } = req.body;

        const patientId = getPatientId(req);
        if (!patientId) {
            return res.status(401).json(
                new ApiError(401, "Patient UHID missing. Please login again.")
            );
        }

        if (!doctorEmployeeId || !date || !timeSlot) {
            return res.status(400).json(new ApiError(400, "doctorEmployeeId, date and timeSlot are required"));
        }

        // Verify patient exists and is active
        const patient = await Patient.findOne({ UHID: patientId, isDeleted: false });
        if (!patient) {
            return res.status(404).json(new ApiError(404, "Patient profile not found"));
        }

        if (!patient.status) {
            return res.status(403).json(
                new ApiError(403, "Your patient account is inactive. Please contact hospital administration.")
            );
        }

        // Verify doctor exists and is active
        const doctor = await Employee.findOne({
            employeeCode: doctorEmployeeId,
            status: true,
            isDeleted: false
        });

        if (!doctor) {
            return res.status(404).json(new ApiError(404, "Doctor not found or is inactive"));
        }

        // Verify doctor has the DOCTOR role and is active
        const doctorRole = await Role.findOne({ name: "DOCTOR", status: true });
        if (!doctorRole) {
            return res.status(404).json(new ApiError(404, "DOCTOR role not found"));
        }

        const doctorUser = await User.findOne({
            employeeId: doctor.employeeCode,
            roleIds: doctorRole.roleId,
            status: true,
            isEmployee: true,
            isDeleted: false
        });

        if (!doctorUser) {
            return res.status(400).json(
                new ApiError(400, "Selected employee is not an active doctor")
            );
        }

        // Validate date
        const appointmentDate = normalizeAppointmentDate(date);

        if (Number.isNaN(appointmentDate.getTime())) {
            return res.status(400).json(new ApiError(400, "Invalid date format"));
        }

        if (appointmentDate < getTodayDate()) {
            return res.status(400).json(
                new ApiError(400, "Appointments cannot be booked for past dates")
            );
        }

        if (isBeforeDoctorJoiningDate(appointmentDate, doctor)) {
            return res.status(400).json(
                new ApiError(400, "Appointment cannot be booked before doctor's joining date")
            );
        }

        // Validate the timeSlot is in the doctor's availability
        if (
            doctor.availabilitySlots &&
            doctor.availabilitySlots.length > 0 &&
            !doctor.availabilitySlots.includes(timeSlot)
        ) {
            return res.status(400).json(
                new ApiError(400, "Selected time slot is not in doctor's availability schedule")
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
                new ApiError(409, "Selected slot is already booked for this doctor")
            );
        }

        // Check patient slot conflict — can't have two appointments at same time
        const patientConflict = await findSlotConflict({
            patientId,
            date: appointmentDate,
            timeSlot
        });

        if (patientConflict) {
            return res.status(409).json(
                new ApiError(409, "You already have an appointment at this date and time slot")
            );
        }

        const appointment = await Appointment.create({
            patientId,
            doctorEmployeeId,
            date: appointmentDate,
            timeSlot,
            reason: reason || "",
            status: "PENDING"
        });

        return res.status(201).json(
            new ApiResponse(201, appointment, "Appointment request submitted successfully")
        );
    } catch (err) {
        console.error(err);
        return res.status(500).json(new ApiError(500, err.message || "Internal Server Error"));
    }
};

// ─── Get My Appointments ──────────────────────────────────────────────────────

exports.getMyAppointments = async (req, res) => {
    try {
        const patientId = getPatientId(req);
        if (!patientId) {
            return res.status(401).json(
                new ApiError(401, "Patient UHID missing. Please login again.")
            );
        }

        const appointments = await Appointment.find({
            patientId,
            isDeleted: false
        }).sort({ createdAt: -1 });

        const doctorIds = appointments.map((a) => a.doctorEmployeeId);
        const doctors = await Employee.find({
            employeeCode: { $in: doctorIds },
            isDeleted: false
        });
        const doctorMap = new Map(doctors.map((d) => [d.employeeCode, d]));

        const appointmentList = appointments.map((appointment) => {
            const doctor = doctorMap.get(appointment.doctorEmployeeId);
            return {
                ...appointment.toObject(),
                doctorName: doctor?.name || "",
                specialization: doctor?.specialization || ""
            };
        });

        return res.status(200).json(
            new ApiResponse(200, appointmentList, "Appointments fetched successfully")
        );
    } catch (err) {
        return res.status(500).json(new ApiError(500, err.message || "Internal Server Error"));
    }
};

// ─── Update My Appointment (reschedule) ───────────────────────────────────────

exports.updateMyAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { date, timeSlot } = req.body;

        const patientId = getPatientId(req);
        if (!patientId) {
            return res.status(401).json(
                new ApiError(401, "Patient UHID missing. Please login again.")
            );
        }

        const appointment = await Appointment.findOne({
            appointmentId,
            patientId,
            isDeleted: false
        });

        if (!appointment) {
            return res.status(404).json(new ApiError(404, "Appointment not found"));
        }

        if (!["PENDING", "BOOKED"].includes(appointment.status)) {
            return res.status(400).json(
                new ApiError(
                    400,
                    `Only PENDING or BOOKED appointments can be rescheduled. Current status: ${appointment.status}`
                )
            );
        }

        if (!date || !timeSlot) {
            return res.status(400).json(new ApiError(400, "Date and time slot are required"));
        }

        const appointmentDate = normalizeAppointmentDate(date);

        if (Number.isNaN(appointmentDate.getTime())) {
            return res.status(400).json(new ApiError(400, "Invalid date format"));
        }

        if (appointmentDate < getTodayDate()) {
            return res.status(400).json(
                new ApiError(400, "Appointments cannot be rescheduled to past dates")
            );
        }

        const doctor = await Employee.findOne({
            employeeCode: appointment.doctorEmployeeId,
            status: true,
            isDeleted: false
        });

        if (!doctor) {
            return res.status(404).json(new ApiError(404, "Doctor not found or is inactive"));
        }

        if (isBeforeDoctorJoiningDate(appointmentDate, doctor)) {
            return res.status(400).json(
                new ApiError(400, "Appointment cannot be booked before doctor's joining date")
            );
        }

        // Validate the timeSlot is in the doctor's availability
        if (
            doctor.availabilitySlots &&
            doctor.availabilitySlots.length > 0 &&
            !doctor.availabilitySlots.includes(timeSlot)
        ) {
            return res.status(400).json(
                new ApiError(400, "Selected time slot is not in doctor's availability schedule")
            );
        }

        const doctorConflict = await findSlotConflict({
            doctorEmployeeId: appointment.doctorEmployeeId,
            date: appointmentDate,
            timeSlot,
            excludeAppointmentId: appointment._id
        });

        if (doctorConflict) {
            return res.status(409).json(
                new ApiError(409, "Selected slot is already booked for this doctor")
            );
        }

        const patientConflict = await findSlotConflict({
            patientId,
            date: appointmentDate,
            timeSlot,
            excludeAppointmentId: appointment._id
        });

        if (patientConflict) {
            return res.status(409).json(
                new ApiError(409, "You already have an appointment at this date and time slot")
            );
        }

        appointment.date = appointmentDate;
        appointment.timeSlot = timeSlot;
        await appointment.save();

        return res.status(200).json(
            new ApiResponse(200, appointment, "Appointment rescheduled successfully")
        );
    } catch (err) {
        return res.status(500).json(new ApiError(500, err.message || "Internal Server Error"));
    }
};

// ─── Cancel My Appointment ───────────────────────────────────────────────────

exports.cancelMyAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        const patientId = getPatientId(req);
        if (!patientId) {
            return res.status(401).json(
                new ApiError(401, "Patient UHID missing. Please login again.")
            );
        }

        const appointment = await Appointment.findOne({
            appointmentId,
            patientId,
            isDeleted: false
        });

        if (!appointment) {
            return res.status(404).json(new ApiError(404, "Appointment not found"));
        }

        if (appointment.status === "COMPLETED") {
            return res.status(400).json(
                new ApiError(400, "Completed appointments cannot be cancelled")
            );
        }

        if (appointment.status === "CANCELLED") {
            return res.status(400).json(
                new ApiError(400, "Appointment is already cancelled")
            );
        }

        if (appointment.status === "IN-PROCESS") {
            return res.status(400).json(
                new ApiError(400, "Cannot cancel an appointment that is currently in process")
            );
        }

        appointment.status = "CANCELLED";
        appointment.cancellationReason = "Cancelled by patient";
        await appointment.save();

        return res.status(200).json(
            new ApiResponse(200, appointment, "Appointment cancelled successfully")
        );
    } catch (err) {
        return res.status(500).json(new ApiError(500, err.message || "Internal Server Error"));
    }
};