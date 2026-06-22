const express = require("express");
const router = express.Router();

const verifyJWT = require("../middleware/authMiddleware");
const allowPermission = require("../middleware/checkPermission");

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
    allowPermission("PATIENT_PROFILE_READ"),
    getPatientById
);

router.put(
    "/profile/:uhid",
    verifyJWT,
    allowPermission("PATIENT_PROFILE_UPDATE"),
    updatePatient
);

module.exports = router;