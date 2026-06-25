const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeeController");
const verifyJWT = require("../middleware/authMiddleware");

router.get("/search", verifyJWT, employeeController.getDoctorsSearch);
router.get("/", verifyJWT, employeeController.getDoctorsList);

module.exports = router;
