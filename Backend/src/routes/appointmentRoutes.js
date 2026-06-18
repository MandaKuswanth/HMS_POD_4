const express = require("express");
const router = express.Router();

const appointmentController = require("../controllers/appointmentController");
const auth = require("../middleware/authMiddleware");
const allowPermission = require("../middleware/checkPermission");
const { PERMISSIONS } = require("../constants/permission");


// 1. CREATE APPOINTMENT
router.post(
    "/",
    auth,
    allowPermission(PERMISSIONS.APPOINTMENT_CREATE),
    appointmentController.createAppointment
);

// 2. GET ALL APPOINTMENTS
router.get(
    "/",
    auth,
    allowPermission(PERMISSIONS.APPOINTMENT_VIEW),
    appointmentController.getAppointments
);

// 3. APPROVE APPOINTMENT
router.put(
    "/:appointmentId/approve",
    auth,
    allowPermission(PERMISSIONS.APPOINTMENT_APPROVE),
    appointmentController.approveAppointment
);
// src/routes/appointmentRoutes.js


router.put(
    "/:appointmentId/reject",
    auth,
    allowPermission(PERMISSIONS.APPOINTMENT_REJECT),
    appointmentController.rejectAppointment
);
// 4. REJECT APPOINTMENT
router.put(
    "/:appointmentId/reject",
    auth,
    allowPermission(PERMISSIONS.APPOINTMENT_REJECT),
    appointmentController.rejectAppointment
);

// 5. GET SINGLE APPOINTMENT
router.get(
    "/:appointmentId",
    auth,
    allowPermission(PERMISSIONS.APPOINTMENT_VIEW),
    appointmentController.getAppointmentById
);

// 6. UPDATE APPOINTMENT
router.put(
    "/:appointmentId",
    auth,
    allowPermission(PERMISSIONS.APPOINTMENT_UPDATE),
    appointmentController.updateAppointment
);

// 7. DELETE APPOINTMENT
router.delete(
    "/:appointmentId",
    auth,
    allowPermission(PERMISSIONS.APPOINTMENT_DELETE),
    appointmentController.deleteAppointment
);

module.exports = router;