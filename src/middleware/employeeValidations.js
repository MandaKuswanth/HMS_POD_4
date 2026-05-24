const { body } = require("express-validator");

const signupValidation = [
  body("email")
    .isEmail().withMessage("Valid email required")
    .normalizeEmail(),

  body("role")
    .isIn(["OWNER",  "ADMIN",  "DOCTOR", "RECEPTIONIST", "CASHIER" , "NURSE", "LAB_TECH" , "PHARMACIST" ])
    .withMessage("Invalid role"),

  body("name")
    .notEmpty().withMessage("Name is required "), 
  body("phone")
    .notEmpty().withMessage("Phone is required")
    .isMobilePhone().withMessage("Invalid phone number"),

  body("department")
    .notEmpty().withMessage("Department is required"),
  body("designation")
    .notEmpty().withMessage("Designation is required"),
  body("qualification")
    .isArray({ min: 1 })
    .withMessage("At least one qualification required"),

  body("status")
    .optional()
    .isBoolean().withMessage("Status must be true/false"),
  body("joiningDate")
    .optional()
    .isISO8601().withMessage("Invalid date")
    .toDate(),

  body("consultationFee")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Must be a valid number"),
  body("medicalRegistrationNo")
    .optional()
    .isString(),

  body("specialization")
    .optional()
    .isString(),
  body("availabilitySlots")
    .optional()
    .isArray()
];

const loginValidation = [
  body("email")
    .isEmail().withMessage("Valid email required"),

  body("password")
    .notEmpty().withMessage("Password is required"),
];

module.exports = {
  signupValidation,
  loginValidation
};
