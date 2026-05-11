const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const {createEmployee,login,getProfile} = require("../controllers/authController");
const Employee = require("../models/Employee");
const validate = require("../middleware/validate");
const auth = require("../middleware/authMiddleware");
 
const employeeValidation=[
    body("email").isEmail().withMessage("Valid email required"),
    body("password").isLength({min:8}).withMessage("Password must be at least 8 characters")
]
const loginValidation=[
    body("email").notEmpty().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password is required"),
]

router.post("/signup-employee", employeeValidation, validate, createEmployee);
router.post("/login-employee",loginValidation,validate,login);
router.get("/my-profile",auth,getProfile);
module.exports = router;