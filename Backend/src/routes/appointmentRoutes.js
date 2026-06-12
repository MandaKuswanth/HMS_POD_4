const express = require("express");
const router = express.Router();

const appointmentController = require("../controllers/appointmentController");

const auth = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const adminReceptionistAccess = [
    auth,
    allowRoles("ADMIN", "RECEPTIONIST")
];


router.post(
    "/",
    adminReceptionistAccess,
    appointmentController.createAppointment
);


router.get(
    "/",
    auth,
    appointmentController.getAppointments
);

router.put(
    "/:appointmentId/approve",
    adminReceptionistAccess,
    appointmentController.approveAppointment
);

router.put(
    "/:appointmentId/reject",
    adminReceptionistAccess,
    appointmentController.rejectAppointment
);

router.get(
    "/:appointmentId",
    auth,
    appointmentController.getAppointmentById
);

router.put(
    "/:appointmentId",
    adminReceptionistAccess,
    appointmentController.updateAppointment
);


router.delete(
    "/:appointmentId",
    adminReceptionistAccess,
    appointmentController.deleteAppointment
);

module.exports = router;