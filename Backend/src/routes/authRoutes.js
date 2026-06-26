const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const validateRequest = require("../middleware/validateRequest");
const {
    loginValidation,
    forgotPasswordValidation,
    verifyResetOtpValidation,
    resetPasswordValidation,
    changePasswordValidation
} = require("../validators/auth");
const verifyToken = require("../middleware/authMiddleware");

router.post("/login", loginValidation, validateRequest, authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

router.post("/forgot-password", forgotPasswordValidation, validateRequest, authController.forgotPassword);
router.post("/verify-otp", verifyResetOtpValidation, validateRequest, authController.verifyResetOtp);
router.post("/reset-password", resetPasswordValidation, validateRequest, authController.resetPassword);

// Requires login
router.post("/change-password", verifyToken, changePasswordValidation, validateRequest, authController.changePassword);

module.exports = router;
