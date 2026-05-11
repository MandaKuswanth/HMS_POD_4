const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { createEmployee, login, getProfile } = require("../controllers/employeeController");
const Employee = require("../models/Employee");
const validate = require("../middleware/validate");
const auth = require("../middleware/authMiddleware");

const employeeValidation = [
    body("email")
        .isEmail()
        .withMessage("Valid email is required"),
    body("password")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters"),
];

router.post("/signup-employee", employeeValidation, validate, createEmployee);
router.post("/login", employeeValidation, validate, login);
router.post("/me",auth, getProfile);

module.exports = router;