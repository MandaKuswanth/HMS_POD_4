const HealthRecord = require("../models/HealthRecord");
const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");
const Employee = require("../models/Employee");
const User = require("../models/User");
const Role = require("../models/Role");

const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../middleware/asyncHandler");
const { paginateQuery } = require("../utils/pagination");

// Helper: resolve caller's roles
const getCallerRoles = async (req) => {
    const loggedInEmployeeId = req.user?.employeeId;

    const loggedInUser = loggedInEmployeeId
        ? await User.findOne({ employeeId: loggedInEmployeeId, isDeleted: false })
        : await User.findById(req.user?.id);

    const doctorRole = await Role.findOne({ name: "DOCTOR", status: true });

    const isDoctor = doctorRole && loggedInUser?.roleIds?.includes(doctorRole.roleId);

    return { loggedInUser, loggedInEmployeeId, isDoctor };
};

// ─── Create Health Record ────────────────────────────────────────────────────
exports.createHealthRecord = asyncHandler(async (req, res) => {
    const {
        appointmentId,
        patientId,
        doctorEmployeeId,
        symptoms,
        diagnosis,
        prescription,
        notes
    } = req.body;

    if (!appointmentId || !patientId || !doctorEmployeeId || !symptoms || !diagnosis) {
        throw new ApiError(400, "appointmentId, patientId, doctorEmployeeId, symptoms and diagnosis are required");
    }

    // Appointment validation
    const appointment = await Appointment.findOne({ appointmentId, isDeleted: false });
    if (!appointment) {
        throw new ApiError(400, "Completed appointment not found for this patient");
    }

    if (appointment.status !== "COMPLETED") {
        throw new ApiError(400, `Health records can only be created for COMPLETED appointments. Current status: ${appointment.status}`);
    }

    // Patient validation
    const patient = await Patient.findOne({ UHID: patientId, isDeleted: false });
    if (!patient) {
        throw new ApiError(404, "Patient not found");
    }

    // Doctor validation
    const doctor = await Employee.findOne({ employeeCode: doctorEmployeeId, isDeleted: false });
    if (!doctor) {
        throw new ApiError(404, "Doctor not found");
    }

    if (appointment.patientId !== patientId) {
        throw new ApiError(400, "Appointment does not belong to the specified patient");
    }

    if (appointment.doctorEmployeeId !== doctorEmployeeId) {
        throw new ApiError(400, "Appointment does not belong to the specified doctor");
    }

    const existingRecord = await HealthRecord.findOne({
        appointmentId,
        isDeleted: false
    });

    if (existingRecord) {
        throw new ApiError(409, "Health record already exists for this appointment");
    }

    const { loggedInEmployeeId, isDoctor } = await getCallerRoles(req);
    if (isDoctor && appointment.doctorEmployeeId !== loggedInEmployeeId) {
        throw new ApiError(403, "Doctors can create health records only for their own appointments");
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
});

// ─── Get All Health Records (Paginated) ──────────────────────────────────────
exports.getHealthRecords = asyncHandler(async (req, res) => {
    const { loggedInEmployeeId, isDoctor } = await getCallerRoles(req);
    const baseFilter = { isDeleted: false };

    if (isDoctor) {
        baseFilter.doctorEmployeeId = loggedInEmployeeId;
    }

    if (req.query.patientId) {
        baseFilter.patientId = req.query.patientId;
    }

    const searchFields = ["patientId", "doctorEmployeeId", "diagnosis", "symptoms"];

    const result = await paginateQuery({
        model: HealthRecord,
        query: req.query,
        baseFilter,
        searchFields,
        defaultSortField: "createdAt"
    });

    // Populate patients and doctors names
    const patientIds = [...new Set(result.data.map((r) => r.patientId))];
    const doctorIds = [...new Set(result.data.map((r) => r.doctorEmployeeId))];

    const [patients, doctors] = await Promise.all([
        Patient.find({ UHID: { $in: patientIds } }).select("UHID name").lean(),
        Employee.find({ employeeCode: { $in: doctorIds } }).select("employeeCode name").lean()
    ]);

    const patientMap = new Map(patients.map((p) => [p.UHID, p]));
    const doctorMap = new Map(doctors.map((d) => [d.employeeCode, d]));

    const formattedRecords = result.data.map((record) => ({
        ...record,
        patientName: patientMap.get(record.patientId)?.name || "N/A",
        doctorName: doctorMap.get(record.doctorEmployeeId)?.name || "N/A"
    }));

    return res.status(200).json(
        new ApiResponse(200, formattedRecords, "Health records fetched successfully", result.pagination)
    );
});

// ─── Autocomplete Health Records Search ───────────────────────────────────────
exports.getHealthRecordsSearch = asyncHandler(async (req, res) => {
    const q = req.query.q || "";
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);

    const filter = { isDeleted: false };
    if (q.trim()) {
        filter.$or = [
            { diagnosis: { $regex: q.trim(), $options: "i" } },
            { symptoms: { $regex: q.trim(), $options: "i" } }
        ];
    }

    const records = await HealthRecord.find(filter)
        .select("_id appointmentId patientId doctorEmployeeId symptoms diagnosis")
        .limit(limit)
        .lean();

    return res.status(200).json(
        new ApiResponse(200, records, "Health records autocomplete fetched successfully")
    );
});

// ─── Get Single Health Record By ID ──────────────────────────────────────────
exports.getHealthRecordById = asyncHandler(async (req, res) => {
    const { healthRecordId } = req.params;

    const record = await HealthRecord.findOne({ _id: healthRecordId, isDeleted: false }).lean();
    if (!record) {
        throw new ApiError(404, "Health record not found");
    }

    const { loggedInEmployeeId, isDoctor } = await getCallerRoles(req);
    if (isDoctor && record.doctorEmployeeId !== loggedInEmployeeId) {
        throw new ApiError(403, "Access denied to this health record");
    }

    const [patient, doctor] = await Promise.all([
        Patient.findOne({ UHID: record.patientId }).select("name phone email gender dob bloodGroup address").lean(),
        Employee.findOne({ employeeCode: record.doctorEmployeeId }).select("name department designation").lean()
    ]);

    const formatted = {
        ...record,
        patientName: patient?.name || "N/A",
        patientDetails: patient || null,
        doctorName: doctor?.name || "N/A",
        doctorDetails: doctor || null
    };

    return res.status(200).json(
        new ApiResponse(200, formatted, "Health record fetched successfully")
    );
});

// ─── Get My Health Records (For Patients) ───────────────────────────────────
exports.getMyHealthRecords = asyncHandler(async (req, res) => {
    // Patients see their own records
    const patientUHID = req.user?.UHID;

    if (!patientUHID) {
        throw new ApiError(403, "Only patients can view their health records here");
    }

    const baseFilter = { patientId: patientUHID, isDeleted: false };
    const searchFields = ["diagnosis", "symptoms"];

    const result = await paginateQuery({
        model: HealthRecord,
        query: req.query,
        baseFilter,
        searchFields,
        defaultSortField: "createdAt"
    });

    const doctorIds = [...new Set(result.data.map((r) => r.doctorEmployeeId))];
    const doctors = await Employee.find({ employeeCode: { $in: doctorIds } }).select("employeeCode name").lean();
    const doctorMap = new Map(doctors.map((d) => [d.employeeCode, d]));

    const formatted = result.data.map((record) => ({
        ...record,
        doctorName: doctorMap.get(record.doctorEmployeeId)?.name || "N/A"
    }));

    return res.status(200).json(
        new ApiResponse(200, formatted, "My health records fetched successfully", result.pagination)
    );
});

// ─── Get Eligible Appointments ───────────────────────────────────────────────
exports.getEligibleAppointments = asyncHandler(async (req, res) => {
    const { loggedInEmployeeId, isDoctor } = await getCallerRoles(req);

    const existingRecords = await HealthRecord.find({ isDeleted: false }).select("appointmentId").lean();
    const usedAppointmentIds = existingRecords.map((r) => r.appointmentId);

    const filter = {
        status: "COMPLETED",
        isDeleted: false,
        appointmentId: { $nin: usedAppointmentIds }
    };

    if (isDoctor) {
        filter.doctorEmployeeId = loggedInEmployeeId;
    }

    const appointments = await Appointment.find(filter).sort({ date: -1 }).lean();

    const patientIds = appointments.map((a) => a.patientId);
    const doctorIds = appointments.map((a) => a.doctorEmployeeId);

    const [patients, doctors] = await Promise.all([
        Patient.find({ UHID: { $in: patientIds }, isDeleted: false }).lean(),
        Employee.find({ employeeCode: { $in: doctorIds }, isDeleted: false }).lean()
    ]);

    const patientMap = new Map(patients.map((p) => [p.UHID, p]));
    const doctorMap = new Map(doctors.map((d) => [d.employeeCode, d]));

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
        new ApiResponse(200, records, "Eligible completed appointments fetched successfully")
    );
});

// ─── Update Health Record ────────────────────────────────────────────────────
exports.updateHealthRecord = asyncHandler(async (req, res) => {
    const { healthRecordId } = req.params;
    const { symptoms, diagnosis, prescription, notes } = req.body;

    const record = await HealthRecord.findOne({ healthRecordId: healthRecordId, isDeleted: false });
    if (!record) {
        throw new ApiError(404, "Health record not found");
    }

    const { loggedInEmployeeId, isDoctor } = await getCallerRoles(req);
    if (isDoctor && record.doctorEmployeeId !== loggedInEmployeeId) {
        throw new ApiError(403, "Doctors can update only their own health records");
    }

    if (symptoms !== undefined) record.symptoms = symptoms;
    if (diagnosis !== undefined) record.diagnosis = diagnosis;
    if (prescription !== undefined) record.prescription = prescription;
    if (notes !== undefined) record.notes = notes;

    record.updatedBy = req.user?.employeeId || req.user?.id;
    await record.save();

    return res.status(200).json(
        new ApiResponse(200, record, "Health record updated successfully")
    );
});

// ─── Delete Health Record ────────────────────────────────────────────────────
exports.deleteHealthRecord = asyncHandler(async (req, res) => {
    const { healthRecordId } = req.params;

    const record = await HealthRecord.findOne({ healthRecordId: healthRecordId, isDeleted: false });
    if (!record) {
        throw new ApiError(404, "Health record not found");
    }

    const { loggedInEmployeeId, isDoctor } = await getCallerRoles(req);
    if (isDoctor && record.doctorEmployeeId !== loggedInEmployeeId) {
        throw new ApiError(403, "Doctors can delete only their own health records");
    }

    record.isDeleted = true;
    record.deletedAt = new Date();
    record.deletedBy = req.user?.employeeId || req.user?.id;
    await record.save();

    return res.status(200).json(
        new ApiResponse(200, null, "Health record deleted successfully")
    );
});