const express = require("express");
const router = express.Router();

const appointmentController = require("../controllers/appointmentController");

const auth = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const adminReceptionistAccess = [
    auth,
    allowRoles("ADMIN", "RECEPTIONIST")
];



// PATIENT ROUTES

// Get doctors by department
router.get(
    "/patient/doctors",
    auth,
    allowRoles("PATIENT"),
    appointmentController.getDoctorsForPatient
);

// Get available slots by doctor and date
router.get(
    "/patient/available-slots",
    auth,
    allowRoles("PATIENT"),
    appointmentController.getAvailableSlotsForPatient
);

// Book appointment by patient
router.post(
    "/patient/book",
    auth,
    allowRoles("PATIENT"),
    appointmentController.createPatientAppointment
);

// Get patient's own appointments
router.get(
    "/patient/my-appointments",
    auth,
    allowRoles("PATIENT"),
    appointmentController.getMyAppointments
);

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