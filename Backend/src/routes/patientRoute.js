const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const {
    createPatient,
    getPatients,
    getPatientById,
    updatePatient,
    deletePatient
} = require("../controllers/patientController");


router.post(
    "/",
    authMiddleware,
    allowRoles("ADMIN", "RECEPTIONIST"),
    createPatient
);


router.get(
    "/",
    authMiddleware,
    allowRoles("ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE"),
    getPatients
);


router.get(
    "/:uhid",
    authMiddleware,
    allowRoles("ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE"),
    getPatientById
);


router.put(
    "/:uhid",
    authMiddleware,
    allowRoles("ADMIN", "RECEPTIONIST"),
    updatePatient
);


router.delete(
    "/:uhid",
    authMiddleware,
    allowRoles("ADMIN"),
    deletePatient
);

module.exports = router;