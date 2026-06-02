const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const {
    createPatient,
    getPatients,
    getPatientById,
    getPatientProfile,
    updatePatientProfile,
    updatePatient,
    deletePatient
} = require("../controllers/patientController");

// Patient self profile
router.get(
    "/profile/me",
    authMiddleware,
    allowRoles("PATIENT"),
    getPatientProfile
);

// Patient self profile update
router.put(
    "/profile/me",
    authMiddleware,
    allowRoles("PATIENT"),
    updatePatientProfile
);

// Admin / Receptionist create patient
router.post(
    "/",
    authMiddleware,
    allowRoles("ADMIN", "RECEPTIONIST"),
    createPatient
);

// Get all patients
router.get(
    "/",
    authMiddleware,
    allowRoles("ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE"),
    getPatients
);

// Get patient by UHID
router.get(
    "/:uhid",
    authMiddleware,
    allowRoles("ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE"),
    getPatientById
);

// Update patient by UHID
router.put(
    "/:uhid",
    authMiddleware,
    allowRoles("ADMIN", "RECEPTIONIST"),
    updatePatient
);

// Delete patient
router.delete(
    "/:uhid",
    authMiddleware,
    allowRoles("ADMIN"),
    deletePatient
);

module.exports = router;