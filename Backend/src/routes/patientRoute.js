const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const allowPermission = require("../middleware/checkPermission");

const patientController = require("../controllers/patientController");

router.post(
    "/",
    authMiddleware,
    allowPermission("PATIENT_CREATE"),
    patientController.createPatient
);

router.get(
    "/",
    authMiddleware,
    allowPermission("PATIENT_READ"),
    patientController.getPatients
);

router.get(
    "/search",
    authMiddleware,
    patientController.getPatientsSearch
);

router.get(
    "/:uhid",
    authMiddleware,
    allowPermission("PATIENT_READ"),
    patientController.getPatientById
);

router.put(
    "/:uhid",
    authMiddleware,
    allowPermission("PATIENT_UPDATE"),
    patientController.updatePatient
);

router.delete(
    "/:uhid",
    authMiddleware,
    allowPermission("PATIENT_DELETE"),
    patientController.deletePatient
);

router.patch(
    "/:uhid/status",
    authMiddleware,
    allowPermission("PATIENT_UPDATE"),
    patientController.togglePatientStatus
);

module.exports = router;