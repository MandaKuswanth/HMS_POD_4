const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const allowRoles = require("../middleware/roleMiddleware");

const {
    createAppointment,
    getAppointments,
    getAppointmentById,
    updateAppointment,
    deleteAppointment,
} = require("../controllers/appointmentController");


router.post("/appointments", auth, allowRoles("ADMIN", "RECEPTIONIST"), validate, createAppointment);

router.get("/appointments", auth, validate, getAppointments);

router.get("/appointments/:appointmentId", auth, validate, getAppointmentById);

router.put("/appointments/:appointmentId", auth, validate, updateAppointment);

router.delete("/appointments/:appointmentId", auth, validate, deleteAppointment);

module.exports = router;