const router = require("express").Router();

const auth = require("../middleware/authMiddleware");

const {
    getDoctors,
    bookAppointment,
    getMyAppointments,
    updateMyAppointment,
    cancelMyAppointment
} = require("../controllers/patientAppointmentController");

router.get(
    "/doctors",
    auth,
    getDoctors
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