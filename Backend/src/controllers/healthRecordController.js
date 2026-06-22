const HealthRecord = require("../models/HealthRecord");
const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");
const Employee = require("../models/Employee");

const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

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

        if (
            !appointmentId ||
            !patientId ||
            !doctorEmployeeId ||
            !symptoms ||
            !diagnosis
        ) {
            return res.status(400).json(
                new ApiError(
                    400,
                    "appointmentId, patientId, doctorEmployeeId, symptoms and diagnosis are required"
                )
            );
        }

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
            UHID: patientId
        });

        if (!patient) {
            return res.status(404).json(
                new ApiError(
                    404,
                    "Patient not found"
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
                    "Doctor not found"
                )
            );
        }

        if (appointment.patientId !== patientId) {
            return res.status(400).json(
                new ApiError(
                    400,
                    "Appointment does not belong to the specified patient"
                )
            );
        }

        if (
            appointment.doctorEmployeeId !== doctorEmployeeId
        ) {
            return res.status(400).json(
                new ApiError(
                    400,
                    "Appointment does not belong to the specified doctor"
                )
            );
        }

        if (
            appointment.status === "PENDING" ||
            appointment.status === "CANCELLED"
        ) {
            return res.status(400).json(
                new ApiError(
                    400,
                    `Health record cannot be created for ${appointment.status} appointments`
                )
            );
        }

        const existingRecord =
            await HealthRecord.findOne({
                appointmentId
            });

        if (existingRecord) {
            return res.status(409).json(
                new ApiError(
                    409,
                    "Health record already exists for this appointment"
                )
            );
        }

        const createdBy =
            req.user?.employeeId ||
            req.user?.id;

        const healthRecord =
            await HealthRecord.create({
                appointmentId,
                patientId,
                doctorEmployeeId,
                symptoms,
                diagnosis,
                prescription,
                notes,
                createdBy
            });

        return res.status(201).json(
            new ApiResponse(
                201,
                healthRecord,
                "Health record created successfully"
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

exports.getHealthRecords = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.max(Number(req.query.limit) || 10, 1);
        const skip = (page - 1) * limit;

        const totalRecords = await HealthRecord.countDocuments();

        const healthRecords = await HealthRecord.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const records = await Promise.all(
            healthRecords.map(async (record) => {
                const patient = await Patient.findOne({
                    UHID: record.patientId
                });

                const doctor = await Employee.findOne({
                    employeeCode: record.doctorEmployeeId
                });

                return {
                    ...record.toObject(),

                    patientName: patient?.name || "",
                    patientPhone: patient?.phone || "",

                    doctorName: doctor?.name || "",
                    specialization: doctor?.specialization || ""
                };
            })
        );

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
            new ApiError(
                500,
                err.message || "Internal Server Error"
            )
        );
    }
};

exports.getHealthRecordById = async (req, res) => {
    try {
        const { healthRecordId } = req.params;

        const healthRecord = await HealthRecord.findOne({
            healthRecordId
        });

        if (!healthRecord) {
            return res.status(404).json(
                new ApiError(
                    404,
                    "Health record not found"
                )
            );
        }

        const patient = await Patient.findOne({
            UHID: healthRecord.patientId
        });

        const doctor = await Employee.findOne({
            employeeCode: healthRecord.doctorEmployeeId
        });

        const recordDetails = {
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
        };

        return res.status(200).json(
            new ApiResponse(
                200,
                recordDetails,
                "Health record fetched successfully"
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

exports.updateHealthRecord = async (req, res) => {
    try {
        const { healthRecordId } = req.params;

        const healthRecord = await HealthRecord.findOne({
            healthRecordId
        });

        if (!healthRecord) {
            return res.status(404).json(
                new ApiError(
                    404,
                    "Health record not found"
                )
            );
        }

        const allowedFields = [
            "symptoms",
            "diagnosis",
            "prescription",
            "notes"
        ];

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                healthRecord[field] = req.body[field];
            }
        });

        healthRecord.updatedBy =
            req.user?.employeeId ||
            req.user?.id;

        await healthRecord.save();

        return res.status(200).json(
            new ApiResponse(
                200,
                healthRecord,
                "Health record updated successfully"
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

exports.deleteHealthRecord = async (req, res) => {
    try {
        const { healthRecordId } = req.params;

        const healthRecord = await HealthRecord.findOne({
            healthRecordId
        });

        if (!healthRecord) {
            return res.status(404).json(
                new ApiError(
                    404,
                    "Health record not found"
                )
            );
        }

        await HealthRecord.deleteOne({
            healthRecordId
        });

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

        return res.status(500).json(
            new ApiError(
                500,
                err.message || "Internal Server Error"
            )
        );
    }
};