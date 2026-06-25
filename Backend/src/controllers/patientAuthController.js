const Patient = require("../models/Patient");
const User = require("../models/User");
const Role = require("../models/Role");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const bcrypt = require("bcryptjs");
const asyncHandler = require("../middleware/asyncHandler");

// ─── Register Patient ────────────────────────────────────────────────────────
exports.registerPatient = asyncHandler(async (req, res) => {
    const {
        name,
        phone,
        email,
        password,
        bloodGroup,
        gender,
        dob,
        address,
        emergencyContact
    } = req.body;

    if (!name || !phone || !email || !password || !bloodGroup || !dob) {
        throw new ApiError(400, "Required fields missing");
    }

    const existingPatient = await Patient.findOne({
        $or: [
            { email: email.trim().toLowerCase() },
            { phone }
        ],
        isDeleted: false
    });

    if (existingPatient) {
        throw new ApiError(409, "Patient already exists");
    }

    const existingUser = await User.findOne({
        email: email.trim().toLowerCase(),
        isDeleted: false
    });

    if (existingUser) {
        throw new ApiError(409, "Email already registered");
    }

    const patientRole = await Role.findOne({
        name: "PATIENT",
        status: true
    });

    if (!patientRole) {
        throw new ApiError(404, "PATIENT role not found");
    }

    const patient = await Patient.create({
        name,
        phone,
        email: email.trim().toLowerCase(),
        bloodGroup,
        gender,
        dob,
        address,
        emergencyContact
    });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
        email: email.trim().toLowerCase(),
        passwordHash,
        isEmployee: false,
        UHID: patient.UHID,
        roleIds: [patientRole.roleId],
        status: true,
        mustResetPassword: false
    });

    return res.status(201).json(
        new ApiResponse(
            201,
            {
                patient,
                user: {
                    id: user._id,
                    email: user.email,
                    UHID: user.UHID,
                    roleIds: user.roleIds,
                    status: user.status
                }
            },
            "Patient registered successfully"
        )
    );
});

// ─── Login Patient ───────────────────────────────────────────────────────────
exports.loginPatient = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({
        email: email.trim().toLowerCase(),
        isEmployee: false,
        isDeleted: false
    });

    if (!user) {
        throw new ApiError(404, "Patient account not found");
    }

    if (!user.status) {
        throw new ApiError(403, "Your account is inactive");
    }

    const isValidPassword = await user.isPasswordCorrect(password);
    if (!isValidPassword) {
        throw new ApiError(401, "Invalid credentials");
    }

    const patient = await Patient.findOne({
        UHID: user.UHID,
        isDeleted: false
    });

    if (!patient || !patient.status) {
        throw new ApiError(403, "Your patient profile is inactive or has been removed");
    }

    const roles = await Role.find({
        roleId: { $in: user.roleIds },
        status: true
    }).select("roleId name permissions");

    const roleNames = roles.map((role) => role.name);
    const permissions = [...new Set(roles.flatMap((role) => role.permissions || []))];

    const token = user.generateAccessToken(roleNames, permissions);
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                token,
                patient,
                user: {
                    id: user._id,
                    email: user.email,
                    UHID: user.UHID,
                    roleIds: user.roleIds,
                    roles: roles.map((role) => ({ roleId: role.roleId, name: role.name })),
                    permissions,
                    status: user.status,
                    mustResetPassword: user.mustResetPassword
                }
            },
            "Patient logged in successfully"
        )
    );
});

// ─── Forgot Password ─────────────────────────────────────────────────────────
exports.forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email || email.trim() === "") {
        throw new ApiError(400, "Email is required");
    }

    const user = await User.findOne({
        email: email.trim().toLowerCase(),
        isEmployee: false,
        isDeleted: false
    });

    if (!user) {
        // Security: don't leak account existence
        return res.status(200).json(
            new ApiResponse(
                200,
                { email },
                "If an account with this email exists, an OTP has been sent"
            )
        );
    }

    if (user.lastOTPRequestTime) {
        const timeSinceLastRequest = Date.now() - new Date(user.lastOTPRequestTime).getTime();
        const fifteenMinutesInMs = 15 * 60 * 1000;

        if (timeSinceLastRequest < fifteenMinutesInMs) {
            throw new ApiError(429, "Too many OTP requests. Please wait before requesting another OTP");
        }
    }

    const otp = user.generatePasswordResetOTP();
    await user.save();

    const patient = await Patient.findOne({ UHID: user.UHID });
    const patientName = patient?.name || "Patient";

    const { sendPasswordResetOTP } = require("../utils/sendEmail");
    const emailResult = await sendPasswordResetOTP(user.email, otp, patientName);

    if (!emailResult.success) {
        throw new ApiError(500, "Failed to send OTP. Please try again later");
    }

    return res.status(200).json(
        new ApiResponse(200, { email: user.email }, "OTP sent successfully to your email")
    );
});

// ─── Verify Reset OTP ────────────────────────────────────────────────────────
exports.verifyResetOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        throw new ApiError(400, "Email and OTP are required");
    }

    const user = await User.findOne({
        email: email.trim().toLowerCase(),
        isEmployee: false,
        isDeleted: false
    }).select("+resetOTP +resetOTPExpiry +resetOTPAttempts");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.resetOTPAttempts >= 5) {
        user.clearPasswordResetOTP();
        await user.save();
        throw new ApiError(403, "Too many failed OTP attempts. Please request a new OTP");
    }

    const otpVerification = user.verifyPasswordResetOTP(otp.trim());
    if (!otpVerification.valid) {
        await user.save();
        throw new ApiError(400, otpVerification.message);
    }

    await user.save();

    const verificationToken = require("jsonwebtoken").sign(
        { email: user.email, verified: true },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "10m" }
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            { verificationToken, email: user.email },
            "OTP verified successfully"
        )
    );
});

// ─── Reset Password ──────────────────────────────────────────────────────────
exports.resetPassword = asyncHandler(async (req, res) => {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
        throw new ApiError(400, "Email, new password, and confirm password are required");
    }

    if (newPassword !== confirmPassword) {
        throw new ApiError(400, "Passwords do not match");
    }

    if (newPassword.length < 8) {
        throw new ApiError(400, "Password must be at least 8 characters long");
    }

    if (!/[A-Z]/.test(newPassword)) {
        throw new ApiError(400, "Password must contain at least one uppercase letter");
    }

    if (!/\d/.test(newPassword)) {
        throw new ApiError(400, "Password must contain at least one number");
    }

    const user = await User.findOne({
        email: email.trim().toLowerCase(),
        isEmployee: false,
        isDeleted: false
    }).select("+resetOTP +resetOTPExpiry");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (!user.resetOTP || !user.resetOTPExpiry) {
        throw new ApiError(400, "OTP has expired. Please request a new one");
    }

    if (new Date() > user.resetOTPExpiry) {
        user.clearPasswordResetOTP();
        await user.save();
        throw new ApiError(400, "OTP has expired. Please request a new one");
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = newPasswordHash;
    user.clearPasswordResetOTP();
    user.mustResetPassword = false;
    user.updatedBy = "SYSTEM";
    await user.save();

    return res.status(200).json(
        new ApiResponse(200, { email: user.email }, "Password reset successfully")
    );
});