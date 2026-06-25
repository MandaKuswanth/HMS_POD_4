const Prescription = require("../models/Prescription");
const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");
const Employee = require("../models/Employee");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../middleware/asyncHandler");
const { paginateQuery } = require("../utils/pagination");

// ─── Create Prescription ─────────────────────────────────────────────────────
exports.createPrescription = asyncHandler(async (req, res) => {
    const { appointmentId, patientId, doctorEmployeeId, medicines, notes } = req.body;

    if (!appointmentId || !patientId || !doctorEmployeeId || !Array.isArray(medicines) || medicines.length === 0) {
        throw new ApiError(400, "appointmentId, patientId, doctorEmployeeId, and medicines array are required");
    }

    // Verify appointment is completed
    const appointment = await Appointment.findOne({ appointmentId, isDeleted: false });
    if (!appointment) {
        throw new ApiError(400, "Associated appointment not found");
    }

    if (appointment.status !== "COMPLETED") {
        throw new ApiError(400, `Prescriptions can only be created for COMPLETED appointments. Current status: ${appointment.status}`);
    }

    const patient = await Patient.findOne({ UHID: patientId, isDeleted: false });
    if (!patient) {
        throw new ApiError(404, "Patient not found");
    }

    const doctor = await Employee.findOne({ employeeCode: doctorEmployeeId, isDeleted: false });
    if (!doctor) {
        throw new ApiError(404, "Doctor profile not found");
    }

    const prescription = await Prescription.create({
        appointmentId,
        patientId,
        doctorEmployeeId,
        medicines,
        notes: notes || ""
    });

    return res.status(201).json(
        new ApiResponse(201, prescription, "Prescription created successfully")
    );
});

// ─── Get Prescriptions (Paginated) ───────────────────────────────────────────
exports.getPrescriptions = asyncHandler(async (req, res) => {
    const baseFilter = { isDeleted: false };
    const searchFields = ["prescriptionId", "patientId", "doctorEmployeeId"];

    if (req.query.patientId) {
        baseFilter.patientId = req.query.patientId;
    }
    if (req.query.doctorEmployeeId) {
        baseFilter.doctorEmployeeId = req.query.doctorEmployeeId;
    }

    const result = await paginateQuery({
        model: Prescription,
        query: req.query,
        baseFilter,
        searchFields,
        defaultSortField: "createdAt"
    });

    // Populate patient & doctor names
    const patientIds = [...new Set(result.data.map((p) => p.patientId))];
    const doctorIds = [...new Set(result.data.map((p) => p.doctorEmployeeId))];

    const [patients, doctors] = await Promise.all([
        Patient.find({ UHID: { $in: patientIds } }).select("UHID name").lean(),
        Employee.find({ employeeCode: { $in: doctorIds } }).select("employeeCode name").lean()
    ]);

    const patientMap = new Map(patients.map((p) => [p.UHID, p]));
    const doctorMap = new Map(doctors.map((d) => [d.employeeCode, d]));

    const formatted = result.data.map((pres) => ({
        ...pres,
        patientName: patientMap.get(pres.patientId)?.name || "N/A",
        doctorName: doctorMap.get(pres.doctorEmployeeId)?.name || "N/A"
    }));

    return res.status(200).json(
        new ApiResponse(200, formatted, "Prescriptions fetched successfully", result.pagination)
    );
});

// ─── Autocomplete Prescription Search ────────────────────────────────────────
exports.getPrescriptionsSearch = asyncHandler(async (req, res) => {
    const q = req.query.q || "";
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);

    const filter = { isDeleted: false };
    if (q.trim()) {
        filter.$or = [
            { prescriptionId: { $regex: q.trim(), $options: "i" } },
            { patientId: { $regex: q.trim(), $options: "i" } }
        ];
    }

    const prescriptions = await Prescription.find(filter)
        .select("_id prescriptionId patientId doctorEmployeeId createdAt")
        .limit(limit)
        .lean();

    return res.status(200).json(
        new ApiResponse(200, prescriptions, "Prescriptions autocomplete fetched successfully")
    );
});

// ─── Get Prescription By ID ──────────────────────────────────────────────────
exports.getPrescriptionById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const prescription = await Prescription.findOne({ _id: id, isDeleted: false }).lean();
    if (!prescription) {
        throw new ApiError(404, "Prescription not found");
    }

    const [patient, doctor] = await Promise.all([
        Patient.findOne({ UHID: prescription.patientId }).select("UHID name phone gender dob").lean(),
        Employee.findOne({ employeeCode: prescription.doctorEmployeeId }).select("employeeCode name department designation").lean()
    ]);

    const formatted = {
        ...prescription,
        patientDetails: patient || null,
        doctorDetails: doctor || null
    };

    return res.status(200).json(
        new ApiResponse(200, formatted, "Prescription fetched successfully")
    );
});

// ─── Update Prescription ─────────────────────────────────────────────────────
exports.updatePrescription = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { medicines, notes } = req.body;

    const prescription = await Prescription.findOne({ _id: id, isDeleted: false });
    if (!prescription) {
        throw new ApiError(404, "Prescription not found");
    }

    if (medicines !== undefined) {
        if (!Array.isArray(medicines) || medicines.length === 0) {
            throw new ApiError(400, "medicines must be a non-empty array");
        }
        prescription.medicines = medicines;
    }

    if (notes !== undefined) prescription.notes = notes;

    await prescription.save();

    return res.status(200).json(
        new ApiResponse(200, prescription, "Prescription updated successfully")
    );
});

// ─── Delete Prescription ─────────────────────────────────────────────────────
exports.deletePrescription = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const prescription = await Prescription.findOne({ _id: id, isDeleted: false });
    if (!prescription) {
        throw new ApiError(404, "Prescription not found");
    }

    prescription.isDeleted = true;
    await prescription.save();

    return res.status(200).json(
        new ApiResponse(200, null, "Prescription deleted successfully")
    );
});
