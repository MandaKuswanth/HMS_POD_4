const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const allowPermission = require("../middleware/checkPermission");
const { PERMISSIONS } = require("../constants/permission"); // 1. Import Constants

const {
    createPatient,
    getPatients,
    getPatientById,
    updatePatient,
    deletePatient,
    togglePatientStatus
} = require("../controllers/patientController");

// Use PERMISSIONS.KEY instead of hardcoded strings
router.post(
    "/",
    authMiddleware,
    allowPermission(PERMISSIONS.PATIENT_CREATE),
    createPatient
);

router.get(
    "/",
    authMiddleware,
    allowPermission(PERMISSIONS.PATIENT_VIEW), // Maps to "PATIENT_READ"
    getPatients
);

router.get(
    "/:uhid",
    authMiddleware,
    allowPermission(PERMISSIONS.PATIENT_VIEW), // Maps to "PATIENT_READ"
    getPatientById
);

router.put(
    "/:uhid",
    authMiddleware,
    allowPermission(PERMISSIONS.PATIENT_UPDATE),
    updatePatient
);

router.delete(
    "/:uhid",
    authMiddleware,
    allowPermission(PERMISSIONS.PATIENT_DELETE),
    deletePatient
);

router.patch(
    "/:uhid/status",
    authMiddleware,
    allowPermission(PERMISSIONS.PATIENT_UPDATE),
    togglePatientStatus
);

module.exports = router;