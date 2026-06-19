const Appointment = require("../models/Appointment");
const Employee = require("../models/Employee");
const Patient = require("../models/Patient");
const User = require("../models/User");
const Role = require("../models/Role");

const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const sendEmail = require("../utils/sendEmail");
const { getPagination, buildPaginationResponse } = require("../utils/pagination");

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

        const { page, limit, skip, sort } = getPagination(req.query);
        const { search, status, doctor, date } = req.query;

        let matchQuery = {};
        if (roleNames.includes("DOCTOR")) {
            matchQuery.doctorEmployeeId = user.employeeId;
        }

        // Apply direct filters (status, date, doctor)
        if (status && status !== "" && status !== "ALL STATUS" && status !== "ALL") {
            matchQuery.status = status;
        }

        if (doctor && doctor !== "" && doctor !== "ALL DOCTORS" && doctor !== "ALL") {
            // Find doctor by name to get their employeeCode
            const doc = await Employee.findOne({ name: doctor });
            if (doc) {
                matchQuery.doctorEmployeeId = doc.employeeCode;
            } else {
                matchQuery.doctorEmployeeId = "NON_EXISTENT";
            }
        }

        if (date) {
            const parsedDate = new Date(date);
            if (!isNaN(parsedDate.getTime())) {
                const startOfDay = new Date(parsedDate.setHours(0, 0, 0, 0));
                const endOfDay = new Date(parsedDate.setHours(23, 59, 59, 999));
                matchQuery.date = { $gte: startOfDay, $lte: endOfDay };
            }
        }

        // Pipeline stages for resolving names
        const pipeline = [
            { $match: matchQuery },
            {
                $lookup: {
                    from: "patients",
                    localField: "patientId",
                    foreignField: "UHID",
                    as: "patientInfo"
                }
            },
            {
                $lookup: {
                    from: "employees",
                    localField: "doctorEmployeeId",
                    foreignField: "employeeCode",
                    as: "doctorInfo"
                }
            },
            {
                $addFields: {
                    patientName: { $arrayElemAt: ["$patientInfo.name", 0] },
                    doctorName: { $arrayElemAt: ["$doctorInfo.name", 0] }
                }
            },
            {
                $project: {
                    patientInfo: 0,
                    doctorInfo: 0
                }
            }
        ];

        // If search is active, add a match stage after adding names
        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { appointmentId: { $regex: search, $options: "i" } },
                        { patientId: { $regex: search, $options: "i" } },
                        { doctorEmployeeId: { $regex: search, $options: "i" } },
                        { patientName: { $regex: search, $options: "i" } },
                        { doctorName: { $regex: search, $options: "i" } },
                        { timeSlot: { $regex: search, $options: "i" } }
                    ]
                }
            });
        }

        // To get total records after potential search matching, run count
        const countPipeline = [...pipeline, { $count: "total" }];
        const countResult = await Appointment.aggregate(countPipeline);
        const totalRecords = countResult.length > 0 ? countResult[0].total : 0;

        // Apply sort, skip and limit for actual data fetching
        const dataPipeline = [
            ...pipeline,
            { $sort: sort },
            { $skip: skip },
            { $limit: limit }
        ];

        const appointments = await Appointment.aggregate(dataPipeline);

        const pagination = buildPaginationResponse({ page, limit, totalRecords });
        return res.status(200).json(
            new ApiResponse(200, appointments, "Appointments fetched successfully", pagination)
        );

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