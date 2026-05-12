const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { sign, login, getProfile, resetPassword, signup } = require("../controllers/employee.controller");
const Employee = require("../models/Employee");
const validate = require("../middleware/validate");
const { validateAuth } = require("../middleware/authMiddleware")
const { signupValidation, loginValidation } = require("../validations/employeeValidation");
const allowRole = require("../middleware/roleMiddleware");

router.post("/signup", validateAuth, allowRole("TECHNICIAN", "ADMIN"), signupValidation, validate, signup);
router.post("/login", loginValidation, validate, login);
router.get("/profile", validateAuth, getProfile);
router.post("/reset-password", validateAuth, resetPassword);
module.exports = router;

