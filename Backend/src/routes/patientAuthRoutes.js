const express = require("express");
const router = express.Router();

const verifyJWT = require("../middleware/authMiddleware");
const allowPermission = require("../middleware/checkPermission");
const { PERMISSIONS } = require("../constants/permission"); // 1. Import constants

const {
    registerPatient,
    loginPatient
} = require("../controllers/patientAuthController");

const {
    getPatientById,
    updatePatient
} = require("../controllers/patientController");

/*
|--------------------------------------------------------------------------
| Patient Authentication
|--------------------------------------------------------------------------
*/

router.post("/register", registerPatient);

router.post("/login", loginPatient);

/*
|--------------------------------------------------------------------------
| Patient Profile
|--------------------------------------------------------------------------
*/

router.get(
    "/profile/:uhid",
    verifyJWT,
    allowPermission(PERMISSIONS.PATIENT_PROFILE_READ), // 2. Use constant
    getPatientById
);

router.put(
    "/profile/:uhid",
    verifyJWT,
    allowPermission(PERMISSIONS.PATIENT_PROFILE_UPDATE), // 2. Use constant
    updatePatient
);

module.exports = router;