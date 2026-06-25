const express = require("express");
const router = express.Router();

const appointmentController = require("../controllers/appointmentController");
const auth = require("../middleware/authMiddleware");
const allowPermission = require("../middleware/checkPermission");
const { PERMISSIONS } = require("../constants/permission");

// CREATE APPOINTMENT
router.post(
  "/",
  auth,
  allowPermission(PERMISSIONS.APPOINTMENT_CREATE),
  appointmentController.createAppointment
);

// GET ALL APPOINTMENTS
router.get(
  "/",
  auth,
  allowPermission(PERMISSIONS.APPOINTMENT_READ),
  appointmentController.getAppointments
);

// AUTOCOMPLETE APPOINTMENT SEARCH
router.get(
  "/search",
  auth,
  appointmentController.getAppointmentsSearch
);

// APPROVE APPOINTMENT
router.put(
  "/:appointmentId/approve",
  auth,
  allowPermission(PERMISSIONS.APPOINTMENT_UPDATE),
  appointmentController.approveAppointment
);

// REJECT APPOINTMENT
router.put(
  "/:appointmentId/reject",
  auth,
  allowPermission(PERMISSIONS.APPOINTMENT_UPDATE),
  appointmentController.rejectAppointment
);

// UPDATE APPOINTMENT STATUS
router.put(
  "/:appointmentId/status",
  auth,
  allowPermission(PERMISSIONS.APPOINTMENT_UPDATE),
  appointmentController.updateAppointmentStatus
);

// GET SINGLE APPOINTMENT
router.get(
  "/:appointmentId",
  auth,
  allowPermission(PERMISSIONS.APPOINTMENT_READ),
  appointmentController.getAppointmentById
);

// UPDATE APPOINTMENT
router.put(
  "/:appointmentId",
  auth,
  allowPermission(PERMISSIONS.APPOINTMENT_UPDATE),
  appointmentController.updateAppointment
);

// DELETE APPOINTMENT
router.delete(
  "/:appointmentId",
  auth,
  allowPermission(PERMISSIONS.APPOINTMENT_DELETE),
  appointmentController.deleteAppointment
);

module.exports = router;
