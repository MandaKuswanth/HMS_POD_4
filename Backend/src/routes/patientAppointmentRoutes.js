const router = require("express").Router();

const auth = require("../middleware/authMiddleware");

const {
    getDoctors,
    getDoctorSlots,
    bookAppointment,
    getMyAppointments,
    updateMyAppointment,
    cancelMyAppointment,
} = require("../controllers/patientAppointmentController");

router.get(
    "/doctors",
    auth,
    getDoctors
);

router.get(
    "/slots",
    auth,
    getDoctorSlots
);

router.post(
    "/patient-appointments",
    auth,
    bookAppointment
);

router.get(
    "/my-appointments",
    auth,
    getMyAppointments
);

router.put(
    "/patient-appointments/:appointmentId",
    auth,
    updateMyAppointment
);

router.put(
    "/patient-appointments/:appointmentId/cancel",
    auth,
    cancelMyAppointment
);

module.exports = router;