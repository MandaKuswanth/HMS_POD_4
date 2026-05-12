const { body } = require("express-validator");

const signupValidation = [
    body("email").isEmail().withMessage("Valid email required"),

    body("role")
        .isIn(["OWNER", "ADMIN", "DOCTOR", "RECEPTIONIST", "CASHIER", "NURSE", "LAB_TECH", "PHARMACIST"])
        .withMessage("Invalid role"),

    body("name")
        .notEmpty().withMessage("Name is required"),

    body("phone")
        .notEmpty().withMessage("Phone is required"),

    body("department")
        .notEmpty().withMessage("Department is required"),

    body("designation")
        .notEmpty().withMessage("Designation is required"),

    body("qualification")
        .isArray().withMessage("Qualification must be array"),

    body("status")
        .optional()
        .isBoolean().withMessage("Status must be true/false"),

    body("joinngDate")
        .optional()
        .isISO8601().withMessage("Invalid date"),

    body("consultationFee")
        .optional()
        .isNumeric().withMessage("Must be number"),
];


const loginValidation = [
    body("email").isEmail().withMessage("Valid email required"),

    body("password")
        .notEmpty().withMessage("Password is required"),
];

module.exports = {
    signupValidation,
    loginValidation
};