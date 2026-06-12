const { body } = require("express-validator");

const selfRegistrationValidation = [
    body("name")
        .trim()
        .notEmpty().withMessage("Full name is required")
        .isLength({ min: 2 }).withMessage("Full name must be at least 2 characters long"),

    body("email")
        .trim()
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Please enter a valid email address")
        .normalizeEmail(),

    body("phone")
        .trim()
        .notEmpty().withMessage("Phone number is required")
        .matches(/^\d{10}$/).withMessage("Phone number must be exactly 10 digits"),

    body("role")
        .trim()
        .notEmpty().withMessage("Role is required")
        .isIn(["DOCTOR", "RECEPTIONIST", "CASHIER", "NURSE", "LAB_TECH", "PHARMACIST", "TECHNICIAN"])
        .withMessage("Invalid role selected"),

    body("department")
        .trim()
        .notEmpty().withMessage("Department is required"),

    body("designation")
        .trim()
        .notEmpty().withMessage("Designation is required"),

    body("password")
        .notEmpty().withMessage("Password is required")
        .isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),

    body("confirmPassword")
        .notEmpty().withMessage("Please confirm your password")
        .custom((value, { req }) => value === req.body.password)
        .withMessage("Password and confirm password do not match"),

    body("medicalRegistrationNo")
        .custom((value, { req }) => {
            if (req.body.role === "DOCTOR" && (!value || !String(value).trim())) {
                throw new Error("Medical registration number is required for doctors");
            }
            return true;
        })
        .optional({ nullable: true, checkFalsy: true })
        .isString().withMessage("Medical registration number must be text"),

    body("specialization")
        .custom((value, { req }) => {
            if (req.body.role === "DOCTOR" && (!value || !String(value).trim())) {
                throw new Error("Specialization is required for doctors");
            }
            return true;
        })
        .optional({ nullable: true, checkFalsy: true })
        .isString().withMessage("Specialization must be text"),

    body("qualification")
        .custom((value, { req }) => {
            const isRoleThatNeedsQualification = ["DOCTOR", "NURSE"].includes(req.body.role);
            if (isRoleThatNeedsQualification && (!Array.isArray(value) || value.length === 0)) {
                throw new Error("Qualification is required for doctors and nurses");
            }
            return true;
        })
        .optional()
        .isArray({ min: 1 }).withMessage("Qualification must be a non-empty array when provided"),

    body("qualification.*")
        .optional()
        .isString().withMessage("Each qualification must be a string"),

    body("consultationFee")
        .custom((value, { req }) => {
            if (req.body.role === "DOCTOR" && (value === undefined || value === null || value === "")) {
                throw new Error("Consultation fee is required for doctors");
            }
            return true;
        })
        .optional({ nullable: true, checkFalsy: true })
        .isFloat({ min: 0 }).withMessage("Consultation fee must be a non-negative number"),

    body("availabilitySlots")
        .custom((value, { req }) => {
            if (req.body.role === "DOCTOR" && (!Array.isArray(value) || value.length === 0)) {
                throw new Error("Availability slots are required for doctors");
            }
            return true;
        })
        .optional()
        .isArray().withMessage("Availability slots must be an array when provided"),

    body("availabilitySlots.*")
        .optional()
        .isString().withMessage("Each availability slot must be text"),
];


const loginValidation = [
    body("email").isEmail().withMessage("Valid email required"),

    body("password")
        .notEmpty().withMessage("Password is required"),
];

module.exports = {
    selfRegistrationValidation,
    loginValidation
};