const HealthRecord = require("../models/HealthRecord");
const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");
const Employee = require("../models/Employee");
const User = require("../models/User");
const Role = require("../models/Role");

const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

const escapeRegex = (value = "") => {
    return value.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
};
// ─── Helper: resolve caller's roles ─────────────────────────────────────────

const getCallerRoles = async (req) => {
    const loggedInEmployeeId = req.user?.employeeId;

    const loggedInUser = loggedInEmployeeId
        ? await User.findOne({ employeeId: loggedInEmployeeId, isDeleted: false })
        : await User.findById(req.user?.id);

    const doctorRole = await Role.findOne({ name: "DOCTOR", status: true });

    const isDoctor =
        doctorRole && loggedInUser?.roleIds?.includes(doctorRole.roleId);

    return { loggedInUser, loggedInEmployeeId, isDoctor };
};

// ─── Create Health Record ────────────────────────────────────────────────────

exports.createHealthRecord = async (req, res) => {
    try {
        const {
            appointmentId,
            patientId,
            doctorEmployeeId,
            symptoms,
            diagnosis,
            prescription,
            notes
        } = req.body;

        // Required field validation
        if (!appointmentId || !patientId || !doctorEmployeeId || !symptoms || !diagnosis) {
            return res.status(400).json(
                new ApiError(
                    400,
                    "appointmentId, patientId, doctorEmployeeId, symptoms and diagnosis are required"
                )
            );
        }

        // Appointment must exist and not be soft-deleted
        const appointment = await Appointment.findOne({ appointmentId, isDeleted: false });
        if (!appointment) {
            return res.status(404).json(new ApiError(404, "Appointment not found"));
        }

        // ── CORE RULE: Only COMPLETED appointments can have a health record ──
        if (appointment.status !== "COMPLETED") {
            return res.status(400).json(
                new ApiError(
                    400,
                    `Health records can only be created for COMPLETED appointments. Current status: ${appointment.status}`
                )
            );
        }

        // Validate patient exists and is not deleted
        const patient = await Patient.findOne({ UHID: patientId, isDeleted: false });
        if (!patient) {
            return res.status(404).json(new ApiError(404, "Patient not found"));
        }

        // Validate doctor exists and is not deleted
        const doctor = await Employee.findOne({ employeeCode: doctorEmployeeId, isDeleted: false });
        if (!doctor) {
            return res.status(404).json(new ApiError(404, "Doctor not found"));
        }

        // Cross-check appointment belongs to submitted patientId
        if (appointment.patientId !== patientId) {
            return res.status(400).json(
                new ApiError(400, "Appointment does not belong to the specified patient")
            );
        }

        // Cross-check appointment belongs to submitted doctorEmployeeId
        if (appointment.doctorEmployeeId !== doctorEmployeeId) {
            return res.status(400).json(
                new ApiError(400, "Appointment does not belong to the specified doctor")
            );
        }

        // Prevent duplicate health record for the same appointment
        const existingRecord = await HealthRecord.findOne({
            appointmentId,
            isDeleted: false
        });

        if (existingRecord) {
            return res.status(409).json(
                new ApiError(409, "Health record already exists for this appointment")
            );
        }

        // Doctor ownership: a doctor can only create records for their own appointments
        const { loggedInEmployeeId, isDoctor } = await getCallerRoles(req);

        if (isDoctor && appointment.doctorEmployeeId !== loggedInEmployeeId) {
            return res.status(403).json(
                new ApiError(403, "Doctors can create health records only for their own appointments")
            );
        }

        const createdBy = req.user?.employeeId || req.user?.id;

        const healthRecord = await HealthRecord.create({
            appointmentId,
            patientId,
            doctorEmployeeId,
            symptoms,
            diagnosis,
            prescription: prescription || "",
            notes: notes || "",
            createdBy
        });

        return res.status(201).json(
            new ApiResponse(201, healthRecord, "Health record created successfully")
        );
    } catch (err) {
        console.error(err);
        return res.status(500).json(new ApiError(500, err.message || "Internal Server Error"));
    }
};

// ─── Get All Health Records (paginated, doctor-filtered) ─────────────────────

exports.getHealthRecords = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.max(Number(req.query.limit) || 10, 1);
        const skip = (page - 1) * limit;

        const { search } = req.query;

        const { loggedInEmployeeId, isDoctor } = await getCallerRoles(req);

        const filter = { isDeleted: false };

        if (isDoctor) {
            filter.doctorEmployeeId = loggedInEmployeeId;
        }

        if (search?.trim()) {
            const regex = new RegExp(escapeRegex(search.trim()), "i");

            const [matchedPatients, matchedDoctors] = await Promise.all([
                Patient.find(
                    {
                        isDeleted: false,
                        $or: [
                            { UHID: regex },
                            { name: regex },
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
                            { employeeCode: regex },
                            { name: regex },
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

            filter.$or = [
                { appointmentId: regex },
                { patientId: regex },
                { doctorEmployeeId: regex },
                { symptoms: regex },
                { diagnosis: regex },
                { prescription: regex },
                { notes: regex },
                { patientId: { $in: matchedPatientIds } },
                { doctorEmployeeId: { $in: matchedDoctorIds } }
            ];
        }

        const totalRecords = await HealthRecord.countDocuments(filter);

        const healthRecords = await HealthRecord.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const patientIds = healthRecords.map((r) => r.patientId);
        const doctorIds = healthRecords.map((r) => r.doctorEmployeeId);

        const patients = await Patient.find({
            UHID: { $in: patientIds },
            isDeleted: false
        });

        const doctors = await Employee.find({
            employeeCode: { $in: doctorIds },
            isDeleted: false
        });

        const patientMap = new Map(patients.map((p) => [p.UHID, p]));
        const doctorMap = new Map(doctors.map((d) => [d.employeeCode, d]));

        const records = healthRecords.map((record) => {
            const patient = patientMap.get(record.patientId);
            const doctor = doctorMap.get(record.doctorEmployeeId);

            return {
                ...record.toObject(),
                patientName: patient?.name || "",
                patientPhone: patient?.phone || "",
                doctorName: doctor?.name || "",
                specialization: doctor?.specialization || ""
            };
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    records,
                    pagination: {
                        totalRecords,
                        currentPage: page,
                        totalPages: Math.ceil(totalRecords / limit),
                        limit
                    }
                },
                "Health records fetched successfully"
            )
        );
    } catch (err) {
        console.error(err);
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};
// ─── Get Health Record By ID ─────────────────────────────────────────────────

exports.getHealthRecordById = async (req, res) => {
    try {
        const { healthRecordId } = req.params;

        const healthRecord = await HealthRecord.findOne({ healthRecordId, isDeleted: false });
        if (!healthRecord) {
            return res.status(404).json(new ApiError(404, "Health record not found"));
        }

        // Doctor can only view their own records
        const { loggedInEmployeeId, isDoctor } = await getCallerRoles(req);

        if (isDoctor && healthRecord.doctorEmployeeId !== loggedInEmployeeId) {
            return res.status(403).json(
                new ApiError(403, "You are not authorized to view this health record")
            );
        }

        const patient = await Patient.findOne({ UHID: healthRecord.patientId, isDeleted: false });
        const doctor = await Employee.findOne({
            employeeCode: healthRecord.doctorEmployeeId,
            isDeleted: false
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    ...healthRecord.toObject(),
                    patient: patient
                        ? {
                            UHID: patient.UHID,
                            name: patient.name,
                            phone: patient.phone,
                            email: patient.email,
                            gender: patient.gender,
                            bloodGroup: patient.bloodGroup
                        }
                        : null,
                    doctor: doctor
                        ? {
                            employeeCode: doctor.employeeCode,
                            name: doctor.name,
                            specialization: doctor.specialization,
                            department: doctor.department
                        }
                        : null
                },
                "Health record fetched successfully"
            )
        );
    } catch (err) {
        console.error(err);
        return res.status(500).json(new ApiError(500, err.message || "Internal Server Error"));
    }
};

// ─── Update Health Record ─────────────────────────────────────────────────────

exports.updateHealthRecord = async (req, res) => {
    try {
        const { healthRecordId } = req.params;

        const healthRecord = await HealthRecord.findOne({ healthRecordId, isDeleted: false });
        if (!healthRecord) {
            return res.status(404).json(new ApiError(404, "Health record not found"));
        }

        // Doctor can only update their own records
        const { loggedInEmployeeId, isDoctor } = await getCallerRoles(req);

        if (isDoctor && healthRecord.doctorEmployeeId !== loggedInEmployeeId) {
            return res.status(403).json(
                new ApiError(403, "You are not authorized to update this health record")
            );
        }

        const allowedFields = ["symptoms", "diagnosis", "prescription", "notes"];

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                healthRecord[field] = req.body[field];
            }
        });

        healthRecord.updatedBy = req.user?.employeeId || req.user?.id;

        await healthRecord.save();

        return res.status(200).json(
            new ApiResponse(200, healthRecord, "Health record updated successfully")
        );
    } catch (err) {
        console.error(err);
        return res.status(500).json(new ApiError(500, err.message || "Internal Server Error"));
    }
};

// ─── Soft Delete Health Record ───────────────────────────────────────────────

exports.deleteHealthRecord = async (req, res) => {
    try {
        const { healthRecordId } = req.params;

        const healthRecord = await HealthRecord.findOne({ healthRecordId, isDeleted: false });
        if (!healthRecord) {
            return res.status(404).json(new ApiError(404, "Health record not found"));
        }

        healthRecord.isDeleted = true;
        healthRecord.deletedAt = new Date();
        healthRecord.deletedBy = req.user?.employeeId || req.user?.id;

        await healthRecord.save();

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    healthRecordId: healthRecord.healthRecordId,
                    patientId: healthRecord.patientId,
                    appointmentId: healthRecord.appointmentId
                },
                "Health record deleted successfully"
            )
        );
    } catch (err) {
        console.error(err);
        return res.status(500).json(new ApiError(500, err.message || "Internal Server Error"));
    }
};

// ─── Patient: Get My Health Records ─────────────────────────────────────────

exports.getMyHealthRecords = async (req, res) => {
    try {
        const patientId = req.user.UHID;

        if (!patientId) {
            return res.status(401).json(
                new ApiError(401, "Patient UHID missing. Please login again.")
            );
        }

        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.max(Number(req.query.limit) || 10, 1);
        const skip = (page - 1) * limit;

        const filter = {
            patientId,
            isDeleted: false
        };

        const totalRecords = await HealthRecord.countDocuments(filter);

        const healthRecords = await HealthRecord.find({
            ...filter
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Batch fetch doctors and appointments
        const doctorIds = healthRecords.map((r) => r.doctorEmployeeId);
        const appointmentIds = healthRecords.map((r) => r.appointmentId);

        const doctors = await Employee.find({
            employeeCode: { $in: doctorIds },
            isDeleted: false
        });

        const appointments = await Appointment.find({
            appointmentId: { $in: appointmentIds },
            isDeleted: false
        });

        const doctorMap = new Map(doctors.map((d) => [d.employeeCode, d]));
        const appointmentMap = new Map(appointments.map((a) => [a.appointmentId, a]));

        const records = healthRecords.map((record) => {
            const doctor = doctorMap.get(record.doctorEmployeeId);
            const appointment = appointmentMap.get(record.appointmentId);

            return {
                ...record.toObject(),
                doctorName: doctor?.name || "",
                specialization: doctor?.specialization || "",
                appointmentDate: appointment?.date || null
            };
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    records,
                    pagination: {
                        totalRecords,
                        currentPage: page,
                        totalPages: Math.ceil(totalRecords / limit),
                        limit
                    }
                },
                "Health records fetched successfully"
            )
        );
    } catch (err) {
        console.error(err);
        return res.status(500).json(new ApiError(500, err.message || "Internal Server Error"));
    }
};
exports.getEligibleAppointments = async (req, res) => {
    try {
        const { loggedInEmployeeId, isDoctor } = await getCallerRoles(req);

        const existingRecords = await HealthRecord.find({
            isDeleted: false
        }).select("appointmentId");

        const usedAppointmentIds = existingRecords.map(
            (record) => record.appointmentId
        );

        const filter = {
            status: "COMPLETED",
            isDeleted: false,
            appointmentId: {
                $nin: usedAppointmentIds
            }
        };

        if (isDoctor) {
            filter.doctorEmployeeId = loggedInEmployeeId;
        }

        const appointments = await Appointment.find(filter)
            .sort({ date: -1 });

        const patientIds = appointments.map((a) => a.patientId);
        const doctorIds = appointments.map((a) => a.doctorEmployeeId);

        const patients = await Patient.find({
            UHID: { $in: patientIds },
            isDeleted: false
        });

        const doctors = await Employee.find({
            employeeCode: { $in: doctorIds },
            isDeleted: false
        });

        const patientMap = new Map(
            patients.map((p) => [p.UHID, p])
        );

        const doctorMap = new Map(
            doctors.map((d) => [d.employeeCode, d])
        );

        const records = appointments.map((appointment) => {
            const patient = patientMap.get(appointment.patientId);
            const doctor = doctorMap.get(appointment.doctorEmployeeId);

            return {
                appointmentId: appointment.appointmentId,
                patientId: appointment.patientId,
                patientName: patient?.name || "",
                doctorEmployeeId: appointment.doctorEmployeeId,
                doctorName: doctor?.name || "",
                date: appointment.date,
                timeSlot: appointment.timeSlot,
                status: appointment.status
            };
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                records,
                "Eligible completed appointments fetched successfully"
            )
        );
    } catch (err) {
        console.error(err);
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};
