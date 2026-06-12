const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

const {
    registerPatient,
    loginPatient
} = require("../controllers/patientAuthController");

const {
    getPatientById,
    updatePatient
} = require("../controllers/patientController");
router.post("/register", registerPatient);

router.post("/login", loginPatient);

//react-native
router.put(
    "/patient-profile/:uhid",
    authMiddleware,
    updatePatient
);
router.get(
    "/patient-profile/:uhid",
    authMiddleware,
    getPatientById
);
module.exports = router;