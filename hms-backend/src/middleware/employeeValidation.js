const { body } = require("express-validator");

const allowedRoles = [
  "OWNER",
  "ADMIN",
  "DOCTOR",
  "RECEPTIONIST",
  "CASHIER",
  "NURSE",
  "LAB_TECH",
  "PHARMACIST",
  "TECHNICIAN",
];

const allowedDepartments = ["OPD", "IPD", "Lab", "Pharmacy", "Admin"];

const signupValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 3 })
    .withMessage("Name must be at least 3 characters"),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .isMobilePhone("en-IN")
    .withMessage("Invalid phone number")
    .custom((value) => {
      if (value.startsWith("0")) {
        throw new Error("Phone number should not start with 0");
      }
      return true;
    }),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),

  body("department")
    .trim()
    .notEmpty()
    .withMessage("Department is required")
    .isIn(allowedDepartments)
    .withMessage("Invalid department"),

  body("designation")
    .trim()
    .notEmpty()
    .withMessage("Designation is required"),

  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn(allowedRoles)
    .withMessage("Invalid role"),

  body("joiningDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid date format"),

  body("medicalRegistrationNo")
    .if(body("role").equals("DOCTOR"))
    .notEmpty()
    .withMessage("Medical registration number is required for doctor"),

  body("specialization")
    .if(body("role").equals("DOCTOR"))
    .notEmpty()
    .withMessage("Specialization is required for doctor"),

  body("qualification")
    .if(body("role").equals("DOCTOR"))
    .notEmpty()
    .withMessage("Qualification is required for doctor"),

  body("consultationFee")
    .if(body("role").equals("DOCTOR"))
    .notEmpty()
    .withMessage("Consultation fee is required for doctor")
    .isNumeric()
    .withMessage("Consultation fee must be a number"),
];

const loginValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

module.exports = {
  signupValidation,
  loginValidation,
};