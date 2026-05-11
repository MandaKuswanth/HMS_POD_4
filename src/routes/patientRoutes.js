const express = require("express");

const router = express.Router();

const {
    createPatient,
    getPatients
} = require("../controllers/patientController");

router.post("/", createPatient);

router.get("/", getPatients);

module.exports = router;