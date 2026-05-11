const express = require('express');
const router = express.Router();
const { signUp,login ,getProfile} = require('../controllers/employeeController');
//const { body } = require("express-validator");
const { body } = require("express-validator");
const auth=require('../middleware/authMiddleware');

//  SIGNUP VALIDATION
const signupValidation = [
  body("email")
    .isEmail()
    .withMessage("Valid email required"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  body("roles")
    .isArray({ min: 1 })
    .withMessage("Roles must be a non-empty array"),

  //  employeeData validations
  body("employeeData.name")
    .notEmpty()
    .withMessage("Name is required"),

  body("employeeData.phone")
    .notEmpty()
    .withMessage("Phone is required"),

  body("employeeData.email")
    .isEmail()
    .withMessage("Valid employee email required"),

  body("employeeData.department")
    .notEmpty()
    .withMessage("Department is required"),

  body("employeeData.designation")
    .notEmpty()
    .withMessage("Designation is required"),

  body("employeeData.status")
    .isIn(["Active", "InActive"])
    .withMessage("Status must be Active or InActive"),

  body("employeeData.joiningDate")
    .notEmpty()
    .withMessage("Joining date is required"),

  body("employeeData.medicalRegistrationNumber")
    .notEmpty()
    .withMessage("Medical registration number is required"),

  body("employeeData.specialization")
    .notEmpty()
    .withMessage("Specialization is required"),

  body("employeeData.qualification")
    .notEmpty()
    .withMessage("Qualification is required"),

  body("employeeData.consultationFee")
    .isNumeric()
    .withMessage("Consultation fee must be a number")
];


const loginValidation = [
  body("email")
    .isEmail()
    .withMessage("Valid email required"),

  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];

router.post("/signup", signupValidation, signUp);
router.post("/login",loginValidation,login);

router.get("/profile", auth, getProfile);
module.exports=router;
