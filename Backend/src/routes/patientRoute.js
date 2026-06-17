const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const allowPermission = require("../middleware/checkPermission");

const {
    createPatient,
    getPatients,
    getPatientById,
    updatePatient,
    deletePatient,
    togglePatientStatus
} = require("../controllers/patientController");

router.post(
    "/",
    authMiddleware,
    allowPermission("PATIENT_CREATE"),
    createPatient
);

router.get(
    "/",
    authMiddleware,
    allowPermission("PATIENT_VIEW"),
    getPatients
);

router.get(
    "/:uhid",
    authMiddleware,
    allowPermission("PATIENT_VIEW"),
    getPatientById
);

router.put(
    "/:uhid",
    authMiddleware,
    allowPermission("PATIENT_UPDATE"),
    updatePatient
);

router.delete(
    "/:uhid",
    authMiddleware,
    allowPermission("PATIENT_DELETE"),
    deletePatient
);

router.patch(
    "/:uhid/status",
    authMiddleware,
    allowPermission("PATIENT_UPDATE"),
    togglePatientStatus
);

module.exports = router;