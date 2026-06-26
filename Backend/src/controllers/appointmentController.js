const Appointment = require("../models/Appointment");
const Employee = require("../models/Employee");
const Patient = require("../models/Patient");
const User = require("../models/User");
const Role = require("../models/Role");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../middleware/asyncHandler");
const { paginateQuery } = require("../utils/pagination");
const appointmentService = require("../services/appointmentService");

// Helper: load user permissions
const getUserPermissions = async (userId) => {
  const user = await User.findById(userId).lean();
  if (!user) return { user: null, userPermissions: new Set() };

  const roles = await Role.find(
    { roleId: { $in: user.roleIds }, status: true },
    { permissions: 1 },
  ).lean();

  const userPermissions = new Set(roles.flatMap((r) => r.permissions || []));
  return { user, userPermissions };
};

// Helper: compute allowed next statuses
const getAllowedStatuses = (appointment, userPermissions, userEmployeeId) => {
  const { status, doctorEmployeeId } = appointment;
  const hasApprove = userPermissions.has("APPOINTMENT_APPROVE");
  const hasRead = userPermissions.has("APPOINTMENT_READ");

  const isDoctor =
    !hasApprove && hasRead && doctorEmployeeId === userEmployeeId;

  if (hasApprove) {
    return (
      {
        PENDING: ["BOOKED", "CANCELLED"],
        BOOKED: ["IN-PROCESS", "CANCELLED"],
        "IN-PROCESS": ["COMPLETED", "CANCELLED"],
        COMPLETED: [],
        CANCELLED: [],
      }[status] || []
    );
  }

  if (isDoctor) {
    if (status === "BOOKED") return ["IN-PROCESS"];
    if (status === "IN-PROCESS") return ["COMPLETED"];
  }

  return [];
};

// Helper: compute allowed UI actions
const getAllowedActions = (appointment, userPermissions, userEmployeeId) => {
  const actions = [];
  const { status, doctorEmployeeId } = appointment;

  const hasApprove = userPermissions.has("APPOINTMENT_APPROVE");
  const hasRead = userPermissions.has("APPOINTMENT_READ");
  const hasDelete = userPermissions.has("APPOINTMENT_DELETE");

  const isDoctor =
    !hasApprove && hasRead && doctorEmployeeId === userEmployeeId;

  const canUpdateByAdmin =
    hasApprove && ["PENDING", "BOOKED", "IN-PROCESS"].includes(status);
  const canUpdateByDoctor =
    isDoctor && ["BOOKED", "IN-PROCESS"].includes(status);

  if (status === "PENDING" && hasApprove) {
    actions.push("APPROVE", "REJECT");
  }

  if (!["COMPLETED", "IN-PROCESS"].includes(status) && hasDelete) {
    actions.push("DELETE");
  }

  if (canUpdateByAdmin || canUpdateByDoctor) {
    actions.push("UPDATE_STATUS");
  }

  return actions;
};

// Helper: format appointment
const formatAppointment = (
  appointment,
  patient,
  doctor,
  userPermissions,
  userEmployeeId,
) => ({
  _id: appointment._id,
  appointmentId: appointment.appointmentId,
  patientId: appointment.patientId,
  patientName: patient?.name || "N/A",
  patientPhone: patient?.phone || "N/A",
  patientEmail: patient?.email || "N/A",
  doctorEmployeeId: appointment.doctorEmployeeId,
  doctorName: doctor?.name || "N/A",
  doctorDepartment: doctor?.department || "N/A",
  doctorDesignation: doctor?.designation || "N/A",
  date: appointment.date,
  timeSlot: appointment.timeSlot,
  status: appointment.status,
  reason: appointment.reason || "",
  cancellationReason: appointment.cancellationReason || "",
  completedAt: appointment.completedAt || null,
  createdByEmployeeId: appointment.createdByEmployeeId || null,
  createdAt: appointment.createdAt,
  updatedAt: appointment.updatedAt,
  allowedActions: getAllowedActions(
    appointment,
    userPermissions,
    userEmployeeId,
  ),
  allowedStatuses: getAllowedStatuses(
    appointment,
    userPermissions,
    userEmployeeId,
  ),
});

// ─── Get Standard Slots ────────────────────────────────────────────────────────
exports.getStandardSlots = asyncHandler(async (req, res) => {
  const { generateStandardSlots } = require("../utils/appointmentHelpers");
  const slots = generateStandardSlots();
  return res
    .status(200)
    .json(new ApiResponse(200, slots, "Standard slots fetched successfully"));
});

// ─── Get Doctor Slots ────────────────────────────────────────────────────────
exports.getDoctorSlots = asyncHandler(async (req, res) => {
  const { doctorEmployeeId, date } = req.query;

  const slotsData = await appointmentService.getDoctorSlots(
    doctorEmployeeId,
    date,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, slotsData, "Doctor slots fetched successfully"));
});

// ─── Create Appointment ──────────────────────────────────────────────────────
exports.createAppointment = asyncHandler(async (req, res) => {
  const { patientId, doctorEmployeeId, date, timeSlot, reason } = req.body;
  const createdByEmployeeId = req.user.employeeId || null;

  const appointment = await appointmentService.createAppointment({
    patientId,
    doctorEmployeeId,
    date,
    timeSlot,
    reason,
    createdByEmployeeId,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, appointment, "Appointment created successfully"),
    );
});

// ─── Get Appointments List ───────────────────────────────────────────────────
exports.getAppointments = asyncHandler(async (req, res) => {
  const { user, userPermissions } = await getUserPermissions(req.user.id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const baseFilter = { isDeleted: false };

  if (userPermissions.has("APPOINTMENT_APPROVE")) {
    // admin / receptionist -> see all
  } else if (userPermissions.has("APPOINTMENT_READ")) {
    // doctor -> see only own
    const doctor = await Employee.findOne(
      { employeeCode: user.employeeId, isDeleted: false },
      { employeeCode: 1 },
    ).lean();

    if (!doctor) {
      throw new ApiError(404, "Doctor profile not found");
    }

    baseFilter.doctorEmployeeId = doctor.employeeCode;
  } else if (!user.isEmployee) {
    // patient portal
    baseFilter.patientId = user.UHID;
  } else {
    throw new ApiError(403, "You are not allowed to view appointments");
  }

  if (req.query.status) {
    baseFilter.status = req.query.status;
  }

  if (req.query.patientId) {
    baseFilter.patientId = req.query.patientId;
  }

  const searchFields = [
    "patientId",
    "doctorEmployeeId",
    "appointmentId",
    "reason",
  ];

  const result = await paginateQuery({
    model: Appointment,
    query: req.query,
    baseFilter,
    searchFields,
    defaultSortField: "date",
  });

  const patientIds = [...new Set(result.data.map((a) => a.patientId))];
  const doctorIds = [...new Set(result.data.map((a) => a.doctorEmployeeId))];

  const [patients, doctors] = await Promise.all([
    Patient.find(
      { UHID: { $in: patientIds } },
      { UHID: 1, name: 1, phone: 1, email: 1 },
    ).lean(),
    Employee.find(
      { employeeCode: { $in: doctorIds } },
      { employeeCode: 1, name: 1, department: 1, designation: 1 },
    ).lean(),
  ]);

  const patientMap = new Map(patients.map((p) => [p.UHID, p]));
  const doctorMap = new Map(doctors.map((d) => [d.employeeCode, d]));

  const formattedAppointments = result.data.map((appointment) =>
    formatAppointment(
      appointment,
      patientMap.get(appointment.patientId),
      doctorMap.get(appointment.doctorEmployeeId),
      userPermissions,
      user.employeeId,
    ),
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        formattedAppointments,
        "Appointments fetched successfully",
        result.pagination,
      ),
    );
});

// ─── Autocomplete Appointment Search ─────────────────────────────────────────
exports.getAppointmentsSearch = asyncHandler(async (req, res) => {
  const q = req.query.q || "";
  const status = req.query.status || "";
  const patientId = req.query.patientId || "";
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);

  const filter = { isDeleted: false };

  if (status) {
    filter.status = status.toUpperCase();
  }
  if (patientId) {
    filter.patientId = patientId;
  }

  if (q.trim()) {
    filter.$or = [
      { appointmentId: { $regex: q.trim(), $options: "i" } },
      { reason: { $regex: q.trim(), $options: "i" } },
    ];
  }

  const appointments = await Appointment.find(filter)
    .select(
      "_id appointmentId patientId doctorEmployeeId date timeSlot status reason",
    )
    .limit(limit)
    .lean();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        appointments,
        "Appointments autocomplete fetched successfully",
      ),
    );
});

// ─── Get Appointment By ID ───────────────────────────────────────────────────
exports.getAppointmentById = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const { user, userPermissions } = await getUserPermissions(req.user.id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const appointment = await Appointment.findOne({
    appointmentId,
    isDeleted: false,
  });
  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  const isDoctor =
    userPermissions.has("APPOINTMENT_READ") &&
    !userPermissions.has("APPOINTMENT_APPROVE");
  if (isDoctor && appointment.doctorEmployeeId !== user.employeeId) {
    throw new ApiError(403, "You can only view your own appointments");
  } else if (!user.isEmployee && appointment.patientId !== user.UHID) {
    throw new ApiError(403, "You can only view your own appointments");
  }

  const [patient, doctor] = await Promise.all([
    Patient.findOne({ UHID: appointment.patientId, isDeleted: false }).lean(),
    Employee.findOne({
      employeeCode: appointment.doctorEmployeeId,
      isDeleted: false,
    }).lean(),
  ]);

  const formatted = formatAppointment(
    appointment,
    patient,
    doctor,
    userPermissions,
    user.employeeId,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, formatted, "Appointment retrieved successfully"),
    );
});

// ─── Update Appointment Status ────────────────────────────────────────────────
exports.updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const { status, cancellationReason } = req.body;
  const { user, userPermissions } = await getUserPermissions(req.user.id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const appointment = await appointmentService.updateAppointmentStatus({
    appointmentId,
    newStatus: status,
    cancellationReason,
    userPermissions,
    userEmployeeId: user.employeeId,
  });

  const [patient, fullDoctor] = await Promise.all([
    Patient.findOne({ UHID: appointment.patientId, isDeleted: false }).lean(),
    Employee.findOne({
      employeeCode: appointment.doctorEmployeeId,
      isDeleted: false,
    }).lean(),
  ]);

  const formatted = formatAppointment(
    appointment,
    patient,
    fullDoctor,
    userPermissions,
    user.employeeId,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        formatted,
        "Appointment status updated successfully",
      ),
    );
});

// ─── Delete Appointment ──────────────────────────────────────────────────────
exports.deleteAppointment = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;

  const appointment = await Appointment.findOne({
    appointmentId,
    isDeleted: false,
  });
  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  if (["COMPLETED", "IN-PROCESS"].includes(appointment.status)) {
    throw new ApiError(
      400,
      "Cannot delete appointments that are completed or in process",
    );
  }

  appointment.isDeleted = true;
  await appointment.save();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Appointment deleted successfully"));
});
