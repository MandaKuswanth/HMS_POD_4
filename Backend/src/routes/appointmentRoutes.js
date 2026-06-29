const express = require("express");
const router = express.Router();

const appointmentController = require("../controllers/appointmentController");
const verifyToken = require("../middleware/authMiddleware");
const allowPermission = require("../middleware/checkPermission");
const validateRequest = require("../middleware/validateRequest");
const { PERMISSIONS } = require("../constants/permission");

const {
  bookAppointmentValidation,
  updateAppointmentStatusValidation
} = require("../validators/appointment");

// GET STANDARD SLOTS
router.get(
  "/standard-slots",
  verifyToken,
  allowPermission(PERMISSIONS.APPOINTMENT_READ),
  appointmentController.getStandardSlots
);

// GET DOCTOR SLOTS
router.get(
  "/slots",
  verifyToken,
  allowPermission(PERMISSIONS.APPOINTMENT_READ),
  appointmentController.getDoctorSlots
);

// CREATE APPOINTMENT
router.post(
  "/",
  verifyToken,
  allowPermission(PERMISSIONS.APPOINTMENT_CREATE),
  bookAppointmentValidation,
  validateRequest,
  appointmentController.createAppointment
);

// GET ALL APPOINTMENTS
router.get(
  "/",
  verifyToken,
  allowPermission(PERMISSIONS.APPOINTMENT_READ),
  appointmentController.getAppointments
);

// RESCHEDULE APPOINTMENT
router.put(
  "/:appointmentId",
  verifyToken,
  allowPermission(PERMISSIONS.APPOINTMENT_UPDATE),
  bookAppointmentValidation,
  validateRequest,
  appointmentController.updateAppointment
);

// AUTOCOMPLETE APPOINTMENT SEARCH
router.get(
  "/search",
  verifyToken,
  appointmentController.getAppointmentsSearch
);

// UPDATE APPOINTMENT STATUS
router.put(
  "/:appointmentId/status",
  verifyToken,
  allowPermission(PERMISSIONS.APPOINTMENT_UPDATE),
  updateAppointmentStatusValidation,
  validateRequest,
  appointmentController.updateAppointmentStatus
);

// GET SINGLE APPOINTMENT
router.get(
  "/:appointmentId",
  verifyToken,
  allowPermission(PERMISSIONS.APPOINTMENT_READ),
  appointmentController.getAppointmentById
);

// DELETE APPOINTMENT
router.delete(
  "/:appointmentId",
  verifyToken,
  allowPermission(PERMISSIONS.APPOINTMENT_DELETE),
  appointmentController.deleteAppointment
);

module.exports = router;
