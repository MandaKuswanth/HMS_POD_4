const router = require("express").Router();

const auth = require("../middleware/authMiddleware");
const allowPermission = require("../middleware/checkPermission");

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
    allowPermission("APPOINTMENT_VIEW"),
    getDoctors
);

router.get(
    "/slots",
    auth,
    allowPermission("APPOINTMENT_VIEW"),
    getDoctorSlots
);

router.post(
    "/patient-appointments",
    auth,
    allowPermission("APPOINTMENT_CREATE"),
    bookAppointment
);

router.get(
    "/my-appointments",
    auth,
    allowPermission("APPOINTMENT_VIEW"),
    getMyAppointments
);

router.put(
    "/patient-appointments/:appointmentId",
    auth,
    allowPermission("APPOINTMENT_CREATE"),
    updateMyAppointment
);

router.put(
    "/patient-appointments/:appointmentId/cancel",
    auth,
    allowPermission("APPOINTMENT_CANCEL"),
    cancelMyAppointment
);

module.exports = router;