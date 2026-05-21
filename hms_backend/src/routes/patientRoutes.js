const router = require("express").Router();
const auth = require("../middleware/authMiddleware");

const {
    createPatient,
    getPatients,
    getPatientById,
    updatePatient,
    deletePatient
} = require("../controllers/patientController");


router.post("/patients", auth, createPatient);
router.get("/patients", auth, getPatients);
router.get("/patients/:uhid", auth, getPatientById);
router.put("/patients/:uhid", auth, updatePatient);
router.delete("/patients/:uhid", auth, deletePatient);

module.exports = router;