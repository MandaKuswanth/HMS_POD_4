const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const allowPermission = require("../middleware/checkPermission");
const { PERMISSIONS } = require("../constants/permission"); // 1. Import constants

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
    allowPermission(PERMISSIONS.APPOINTMENT_VIEW), // 2. Use PERMISSIONS.KEY
    getDoctors
);

router.get(
    "/slots",
    auth,
    allowPermission(PERMISSIONS.APPOINTMENT_VIEW),
    getDoctorSlots
);

router.post(
    "/patient-appointments",
    auth,
    allowPermission(PERMISSIONS.APPOINTMENT_CREATE),
    bookAppointment
);

router.get(
    "/my-appointments",
    auth,
    allowPermission(PERMISSIONS.APPOINTMENT_VIEW),
    getMyAppointments
);

router.put(
    "/patient-appointments/:appointmentId",
    auth,
    allowPermission(PERMISSIONS.APPOINTMENT_CREATE), // Or APPOINTMENT_UPDATE if preferred
    updateMyAppointment
);

router.put(
    "/patient-appointments/:appointmentId/cancel",
    auth,
    allowPermission(PERMISSIONS.APPOINTMENT_CANCEL),
    cancelMyAppointment
);

module.exports = router;