const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const allowPermission = require("../middleware/checkPermission");
const validateRequest = require("../middleware/validateRequest");
const { registerPatientValidation } = require("../validators/patient");

const {
    registerPatient
} = require("../controllers/patientAuthController");

const {
    getPatientById,
    updatePatient
} = require("../controllers/patientController");

/*
|--------------------------------------------------------------------------
| Patient Registration
|--------------------------------------------------------------------------
*/

router.post("/register", registerPatientValidation, validateRequest, registerPatient);

/*
|--------------------------------------------------------------------------
| Patient Profile
|--------------------------------------------------------------------------
*/

router.get(
    "/profile/:uhid",
    verifyToken,
    allowPermission("PATIENT_PROFILE_READ"),
    getPatientById
);

router.put(
    "/profile/:uhid",
    verifyToken,
    allowPermission("PATIENT_PROFILE_UPDATE"),
    updatePatient
);

module.exports = router;