const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { signup, login, getProfile, resetPassword } = require("../controllers/employeeController");
const Employee = require("../models/Employee");
const validate = require("../middleware/validate");
const auth = require("../middleware/authMiddleware");
const allowrole = require("../middleware/roleMiddleware");

const {signupValidation,loginValidation} = require("../middleware/employeeValidations");


router.post("/signup-employee", auth, allowrole("TECHNICIAN","ADMIN"), signupValidation, validate, signup);
router.post("/login", loginValidation, validate, login);
router.post("/me", auth, getProfile);
router.post("/reset-password", auth, resetPassword);

module.exports = router;