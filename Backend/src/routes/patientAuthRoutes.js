const express = require("express");
const router = express.Router();

const verifyJWT = require("../middleware/authMiddleware");
const allowPermission = require("../middleware/checkPermission");

const {
    registerPatient,
    loginPatient,
    forgotPassword,
    verifyResetOTP,
    resetPassword,
    resetTemporaryPassword
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

// ✅ NEW: Password Reset Endpoints
router.post("/forgot-password", forgotPassword);

router.post("/verify-otp", verifyResetOTP);

router.post("/reset-password", resetPassword);

router.post("/reset-temporary-password", resetTemporaryPassword);

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