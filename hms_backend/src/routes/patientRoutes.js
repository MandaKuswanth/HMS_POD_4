const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const allowRoles = require("../middleware/roleMiddleware");

const {
    createPatient,
    getPatients,
    getPatientById,
    updatePatient,
    deletePatient
} = require("../controllers/patientController");


router.post("/patients", auth, allowRoles("ADMIN", "RECEPTIONIST"), createPatient);
router.get("/patients", auth, allowRoles("ADMIN", "RECEPTIONIST"), getPatients);
router.get("/patients/:uhid", auth, allowRoles("ADMIN", "RECEPTIONIST"), getPatientById);
router.put("/patients/:uhid", auth, allowRoles("ADMIN", "RECEPTIONIST"), updatePatient);
router.delete("/patients/:uhid", auth, allowRoles("ADMIN", "RECEPTIONIST"), deletePatient);


//react-native
router.put(
    "/patient-profile/:uhid",
    auth,
    updatePatient
);
router.get(
    "/patient-profile/:uhid",
    auth,
    getPatientById
);
module.exports = router;