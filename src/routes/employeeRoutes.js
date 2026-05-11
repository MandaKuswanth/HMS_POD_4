const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { createEmployee, login, getProfile, resetPassword } = require("../controllers/employeeController");
const Employee = require("../models/Employee");
const validate = require("../middleware/validate");
const auth = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const employeeValidation = [
    body("email")
        .isEmail()
        .withMessage("Valid email is required"),
    body("password")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters"),
];


router.post("/signup-employee", auth, allowRoles("TECHNICIAN","ADMIN"), employeeValidation, validate, createEmployee);
router.post("/login", employeeValidation, validate, login);
router.post("/me", auth, getProfile);
router.post("/reset-password", auth, resetPassword);

module.exports = router;