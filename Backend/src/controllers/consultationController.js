const Consultation = require("../models/Consultation");
const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");
const Employee = require("../models/Employee");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../middleware/asyncHandler");
const { paginateQuery } = require("../utils/pagination");

// ─── Create Consultation ─────────────────────────────────────────────────────
exports.createConsultation = asyncHandler(async (req, res) => {
    const { appointmentId, patientId, doctorEmployeeId, symptoms, diagnosis, fee, status } = req.body;

    if (!appointmentId || !patientId || !doctorEmployeeId || !symptoms || !diagnosis || fee === undefined) {
        throw new ApiError(400, "appointmentId, patientId, doctorEmployeeId, symptoms, diagnosis, and fee are required");
    }

    const appointment = await Appointment.findOne({ appointmentId, isDeleted: false });
    if (!appointment) {
        throw new ApiError(400, "Associated appointment not found");
    }

    const patient = await Patient.findOne({ UHID: patientId, isDeleted: false });
    if (!patient) {
        throw new ApiError(404, "Patient not found");
    }

    const doctor = await Employee.findOne({ employeeCode: doctorEmployeeId, isDeleted: false });
    if (!doctor) {
        throw new ApiError(404, "Doctor profile not found");
    }

    const consultation = await Consultation.create({
        appointmentId,
        patientId,
        doctorEmployeeId,
        symptoms,
        diagnosis,
        fee,
        status: status || "COMPLETED"
    });

    return res.status(201).json(
        new ApiResponse(201, consultation, "Consultation recorded successfully")
    );
});

// ─── Get Consultations (Paginated) ───────────────────────────────────────────
exports.getConsultations = asyncHandler(async (req, res) => {
    const baseFilter = { isDeleted: false };
    const searchFields = ["consultationId", "patientId", "doctorEmployeeId", "diagnosis"];

    if (req.query.patientId) {
        baseFilter.patientId = req.query.patientId;
    }
    if (req.query.doctorEmployeeId) {
        baseFilter.doctorEmployeeId = req.query.doctorEmployeeId;
    }

    const result = await paginateQuery({
        model: Consultation,
        query: req.query,
        baseFilter,
        searchFields,
        defaultSortField: "createdAt"
    });

    const patientIds = [...new Set(result.data.map((c) => c.patientId))];
    const doctorIds = [...new Set(result.data.map((c) => c.doctorEmployeeId))];

    const [patients, doctors] = await Promise.all([
        Patient.find({ UHID: { $in: patientIds } }).select("UHID name").lean(),
        Employee.find({ employeeCode: { $in: doctorIds } }).select("employeeCode name").lean()
    ]);

    const patientMap = new Map(patients.map((p) => [p.UHID, p]));
    const doctorMap = new Map(doctors.map((d) => [d.employeeCode, d]));

    const formatted = result.data.map((c) => ({
        ...c,
        patientName: patientMap.get(c.patientId)?.name || "N/A",
        doctorName: doctorMap.get(c.doctorEmployeeId)?.name || "N/A"
    }));

    return res.status(200).json(
        new ApiResponse(200, formatted, "Consultations fetched successfully", result.pagination)
    );
});

// ─── Autocomplete Consultation Search ────────────────────────────────────────
exports.getConsultationsSearch = asyncHandler(async (req, res) => {
    const q = req.query.q || "";
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);

    const filter = { isDeleted: false };
    if (q.trim()) {
        filter.$or = [
            { consultationId: { $regex: q.trim(), $options: "i" } },
            { diagnosis: { $regex: q.trim(), $options: "i" } }
        ];
    }

    const consultations = await Consultation.find(filter)
        .select("_id consultationId patientId doctorEmployeeId diagnosis")
        .limit(limit)
        .lean();

    return res.status(200).json(
        new ApiResponse(200, consultations, "Consultations autocomplete fetched successfully")
    );
});

// ─── Get Consultation By ID ──────────────────────────────────────────────────
exports.getConsultationById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const consultation = await Consultation.findOne({ _id: id, isDeleted: false }).lean();
    if (!consultation) {
        throw new ApiError(404, "Consultation record not found");
    }

    const [patient, doctor] = await Promise.all([
        Patient.findOne({ UHID: consultation.patientId }).select("UHID name phone gender dob").lean(),
        Employee.findOne({ employeeCode: consultation.doctorEmployeeId }).select("employeeCode name department designation").lean()
    ]);

    const formatted = {
        ...consultation,
        patientDetails: patient || null,
        doctorDetails: doctor || null
    };

    return res.status(200).json(
        new ApiResponse(200, formatted, "Consultation record fetched successfully")
    );
});

// ─── Update Consultation ─────────────────────────────────────────────────────
exports.updateConsultation = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { symptoms, diagnosis, fee, status } = req.body;

    const consultation = await Consultation.findOne({ _id: id, isDeleted: false });
    if (!consultation) {
        throw new ApiError(404, "Consultation record not found");
    }

    if (symptoms !== undefined) consultation.symptoms = symptoms;
    if (diagnosis !== undefined) consultation.diagnosis = diagnosis;
    if (fee !== undefined) consultation.fee = fee;
    if (status !== undefined) consultation.status = status;

    await consultation.save();

    return res.status(200).json(
        new ApiResponse(200, consultation, "Consultation record updated successfully")
    );
});

// ─── Delete Consultation ─────────────────────────────────────────────────────
exports.deleteConsultation = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const consultation = await Consultation.findOne({ _id: id, isDeleted: false });
    if (!consultation) {
        throw new ApiError(404, "Consultation record not found");
    }

    consultation.isDeleted = true;
    await consultation.save();

    return res.status(200).json(
        new ApiResponse(200, null, "Consultation record deleted successfully")
    );
});
