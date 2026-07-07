const Patient = require("../models/Patient");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const Role = require("../models/Role");
const { validatePassword } = require("../utils/passwordValidator");

const jwt = require("jsonwebtoken");
const { sendPasswordResetOTP } = require("../utils/sendEmail");

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const findPatientUserByEmail = (email, extraSelect = "") => {
    return User.findOne({
        email: normalizeEmail(email),
        isEmployee: false,
        isDeleted: false
    }).select(extraSelect);
};

const buildPatientUserResponse = (user) => ({
    id: user._id,
    email: user.email,
    UHID: user.UHID,
    roleIds: user.roleIds,
    status: user.status
});

exports.registerPatient = async (req, res) => {
    try {
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

        if (
            !name ||
            !phone ||
            !email ||
            !password ||
            !bloodGroup ||
            !dob
        ) {
            return res.status(400).json(
                new ApiError(
                    400,
                    "Required fields missing"
                )
            );
        }

        const existingPatient = await Patient.findOne({
            $or: [
                { email: normalizeEmail(email) },
                { phone }
            ]
        });

        if (existingPatient) {
            return res.status(409).json(
                new ApiError(
                    409,
                    "Patient already exists"
                )
            );
        }

        const existingUser = await findPatientUserByEmail(email);

        if (existingUser) {
            return res.status(409).json(
                new ApiError(
                    409,
                    "Email already registered"
                )
            );
        }

        const patientRole = await Role.findOne({
            name: "PATIENT",
            status: true
        });

        if (!patientRole) {
            return res.status(404).json(
                new ApiError(
                    404,
                    "PATIENT role not found"
                )
            );
        }

        const patient = await Patient.create({
            name,
            phone,
            email: normalizeEmail(email),
            bloodGroup,
            gender,
            dob,
            address,
            emergencyContact
        });

        const passwordHash = await bcrypt.hash(
            password,
            10
        );

        const user = await User.create({
            email: normalizeEmail(email),
            passwordHash,

            isEmployee: false,

            UHID: patient.UHID,

            roleIds: [
                patientRole.roleId
            ],

            status: true,

            mustResetPassword: false
        });

        return res.status(201).json(
            new ApiResponse(
                201,
                {
                    patient,
                    user: buildPatientUserResponse(user)
                },
                "Patient registered successfully"
            )
        );

    } catch (err) {
        console.error(err);

        return res.status(500).json(
            new ApiError(
                500,
                err.message || "Internal Server Error"
            )
        );
    }
};

exports.loginPatient = async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        if (!email || !password) {
            return res.status(400).json(
                new ApiError(
                    400,
                    "Email and password are required"
                )
            );
        }

        const user = await User.findOne({
            email: normalizeEmail(email),
            isEmployee: false
        });

        if (!user) {
            return res.status(404).json(
                new ApiError(
                    404,
                    "Patient account not found"
                )
            );
        }

        if (!user.status) {
            return res.status(403).json(
                new ApiError(
                    403,
                    "Your account is inactive"
                )
            );
        }

        const isValidPassword =
            await user.isPasswordCorrect(
                password
            );

        if (!isValidPassword) {
            return res.status(401).json(
                new ApiError(
                    401,
                    "Invalid credentials"
                )
            );
        }

        //   NEW: Check if temporary password reset is required
        if (user.mustResetPassword) {
            return res.status(200).json(
                new ApiResponse(
                    200,
                    {
                        requiresPasswordReset: true,
                        email: user.email,
                        message: "You must reset your temporary password before accessing the system"
                    },
                    "Temporary password requires reset"
                )
            );
        }

        const patient = await Patient.findOne({
            UHID: user.UHID
        });

        const roles = await Role.find({
            roleId: { $in: user.roleIds }
        }).select(
            "roleId name permissions"
        );

        const permissions = [
            ...new Set(
                roles.flatMap(
                    role =>
                        role.permissions || []
                )
            )
        ];

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.lastLogin = new Date();
        user.refreshToken = refreshToken;

        await user.save();

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    token: accessToken,
                    refreshToken,

                    patient,

                    user: {
                        id: user._id,

                        email: user.email,

                        UHID: user.UHID,

                        roleIds:
                            user.roleIds,

                        roles: roles.map(
                            role => ({
                                roleId:
                                    role.roleId,
                                name:
                                    role.name
                            })
                        ),

                        permissions,

                        status:
                            user.status,

                        mustResetPassword:
                            user.mustResetPassword
                    }
                },
                "Patient logged in successfully"
            )
        );

    } catch (err) {
        console.error(err);

        return res.status(500).json(
            new ApiError(
                500,
                err.message ||
                "Internal Server Error"
            )
        );
    }
};

// Forgot Password - Send OTP to Email
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || email.trim() === "") {
            return res.status(400).json(
                new ApiError(
                    400,
                    "Email is required"
                )
            );
        }

        // Find user by email (patient only)
        const user = await findPatientUserByEmail(email);

        if (!user) {
            // For security: don't reveal if email exists
            return res.status(200).json(
                new ApiResponse(
                    200,
                    { email },
                    "If an account with this email exists, an OTP has been sent"
                )
            );
        }

        // Check if OTP was recently requested (rate limiting - max 3 requests per 15 mins)
        if (user.lastOTPRequestTime) {
            const timeSinceLastRequest = Date.now() - new Date(user.lastOTPRequestTime).getTime();
            const fifteenMinutesInMs = 15 * 60 * 1000;

            if (timeSinceLastRequest < fifteenMinutesInMs) {
                return res.status(429).json(
                    new ApiError(
                        429,
                        "Too many OTP requests. Please wait before requesting another OTP"
                    )
                );
            }
        }

        // Generate OTP
        const otp = user.generatePasswordResetOTP();

        // Save user with OTP
        await user.save();

        // Get patient name for email
        const patient = await Patient.findOne({ UHID: user.UHID });
        const patientName = patient?.name || "Patient";

        // Send OTP via email
        const emailResult = await sendPasswordResetOTP(
            user.email,
            otp,
            patientName
        );

        if (!emailResult.success) {
            return res.status(500).json(
                new ApiError(
                    500,
                    "Failed to send OTP. Please try again later"
                )
            );
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                { email: user.email },
                "OTP sent successfully to your email"
            )
        );

    } catch (err) {
        console.error("Forgot Password Error:", err);

        return res.status(500).json(
            new ApiError(
                500,
                err.message || "Internal Server Error"
            )
        );
    }
};

// Verify OTP
exports.verifyResetOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json(
                new ApiError(
                    400,
                    "Email and OTP are required"
                )
            );
        }

        // Find user with OTP fields (need to explicitly select them)
        const user = await findPatientUserByEmail(
            email,
            "+resetOTP +resetOTPExpiry +resetOTPAttempts"
        );
        if (!user) {
            return res.status(404).json(
                new ApiError(
                    404,
                    "User not found"
                )
            );
        }

        // Check OTP attempts (max 5 failed attempts)
        if (user.resetOTPAttempts >= 5) {
            // Clear the OTP to force new request
            user.clearPasswordResetOTP();
            await user.save();

            return res.status(403).json(
                new ApiError(
                    403,
                    "Too many failed OTP attempts. Please request a new OTP"
                )
            );
        }

        // Verify OTP
        const otpVerification = user.verifyPasswordResetOTP(otp.trim());

        if (!otpVerification.valid) {
            await user.save(); // Save updated attempts

            return res.status(400).json(
                new ApiError(
                    400,
                    otpVerification.message
                )
            );
        }

        // OTP verified successfully - don't clear it yet, wait for password reset
        // But mark that OTP was verified
        await user.save();

        // Return a verification token that will be used for password reset
        const verificationToken = jwt.sign(
            { email: user.email, verified: true },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '10m' } // Short validity like OTP
        );

        return res.status(200).json(
            new ApiResponse(
                200,
                { verificationToken, email: user.email },
                "OTP verified successfully"
            )
        );

    } catch (err) {
        console.error("Verify OTP Error:", err);

        return res.status(500).json(
            new ApiError(
                500,
                err.message || "Internal Server Error"
            )
        );
    }
};

// NEW: Reset Password
exports.resetPassword = async (req, res) => {
    try {
        const { email, newPassword, confirmPassword } = req.body;

        if (!email || !newPassword || !confirmPassword) {
            return res.status(400).json(
                new ApiError(
                    400,
                    "Email, new password, and confirm password are required"
                )
            );
        }

        const passwordError = validatePassword(
            newPassword,
            confirmPassword
        );

        if (passwordError) {
            return res.status(400).json(
                new ApiError(
                    400,
                    passwordError
                )
            );
        }

        // Find user
        const user = await findPatientUserByEmail(
            email,
            "+resetOTP +resetOTPExpiry"
        );

        if (!user) {
            return res.status(404).json(
                new ApiError(
                    404,
                    "User not found"
                )
            );
        }

        // Final OTP verification before allowing password reset
        if (!user.resetOTP || !user.resetOTPExpiry) {
            return res.status(400).json(
                new ApiError(
                    400,
                    "OTP has expired. Please request a new one"
                )
            );
        }

        if (new Date() > user.resetOTPExpiry) {
            user.clearPasswordResetOTP();
            await user.save();

            return res.status(400).json(
                new ApiError(
                    400,
                    "OTP has expired. Please request a new one"
                )
            );
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        // Update password and clear OTP
        user.passwordHash = newPasswordHash;
        user.clearPasswordResetOTP();
        user.mustResetPassword = false; // Reset this flag if it was set
        user.updatedBy = "SYSTEM";

        await user.save();

        return res.status(200).json(
            new ApiResponse(
                200,
                { email: user.email },
                "Password reset successfully"
            )
        );

    } catch (err) {
        console.error("Reset Password Error:", err);

        return res.status(500).json(
            new ApiError(
                500,
                err.message || "Internal Server Error"
            )
        );
    }
};

exports.refreshPatientToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json(new ApiError(401, "Refresh token required"));
        }

        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        } catch (err) {
            if (
                err instanceof jwt.TokenExpiredError ||
                err instanceof jwt.JsonWebTokenError ||
                err instanceof jwt.NotBeforeError
            ) {
                return res
                    .status(403)
                    .json(new ApiError(403, "Invalid or expired refresh token"));
            }

            // Re-throw unexpected errors
            throw err;
        }

        const user = await User.findOne({
            _id: decoded.id,
            isEmployee: false,
            isDeleted: false
        }).select("+refreshToken");

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(403).json(new ApiError(403, "Refresh token revoked"));
        }

        if (!user.status) {
            return res.status(403).json(new ApiError(403, "Account is inactive"));
        }

        const newAccessToken = user.generateAccessToken();
        const newRefreshToken = user.generateRefreshToken();

        user.refreshToken = newRefreshToken;
        await user.save();

        return res.status(200).json(
            new ApiResponse(200, { token: newAccessToken, refreshToken: newRefreshToken }, "Token refreshed")
        );
    } catch (err) {
        return res.status(500).json(new ApiError(500, err.message || "Internal Server Error"));
    }
};

exports.logoutPatient = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (refreshToken) {
            try {
                const decoded = jwt.verify(
                    refreshToken,
                    process.env.REFRESH_TOKEN_SECRET
                );

                await User.findByIdAndUpdate(decoded.id, {
                    refreshToken: null,
                });
            } catch (err) {
                if (
                    err instanceof jwt.TokenExpiredError ||
                    err instanceof jwt.JsonWebTokenError ||
                    err instanceof jwt.NotBeforeError
                ) {
                    // Token is invalid or expired; nothing to revoke.
                } else {
                    throw err;
                }
            }
        }

        return res.status(200).json(new ApiResponse(200, {}, "Logged out successfully"));
    } catch (err) {
        return res.status(500).json(new ApiError(500, err.message || "Internal Server Error"));
    }
};

// NEW: Reset Temporary Password (First Login)
exports.resetTemporaryPassword = async (req, res) => {
    try {
        const { email, newPassword, confirmPassword } = req.body;

        if (!email || !newPassword || !confirmPassword) {
            return res.status(400).json(
                new ApiError(
                    400,
                    "Email, new password, and confirm password are required"
                )
            );
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json(
                new ApiError(
                    400,
                    "New passwords do not match"
                )
            );
        }

        // Validate new password strength (at least 8 chars, 1 uppercase, 1 number)
        if (newPassword.length < 8) {
            return res.status(400).json(
                new ApiError(
                    400,
                    "Password must be at least 8 characters long"
                )
            );
        }

        if (!/[A-Z]/.test(newPassword)) {
            return res.status(400).json(
                new ApiError(
                    400,
                    "Password must contain at least one uppercase letter"
                )
            );
        }

        if (!/\d/.test(newPassword)) {
            return res.status(400).json(
                new ApiError(
                    400,
                    "Password must contain at least one number"
                )
            );
        }

        // Find user
        const user = await findPatientUserByEmail(email);

        if (!user) {
            return res.status(404).json(
                new ApiError(
                    404,
                    "User not found"
                )
            );
        }

        // Prevent password reuse
        const isSamePassword = Boolean(await bcrypt.compare(newPassword, user.passwordHash));
        if (isSamePassword) {
            return res.status(400).json(
                new ApiError(
                    400,
                    "New password cannot be the same as current password"
                )
            );
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        // Update password and clear temporary password flag
        user.passwordHash = newPasswordHash;
        user.mustResetPassword = false;
        user.updatedBy = "SYSTEM";

        await user.save();

        return res.status(200).json(
            new ApiResponse(
                200,
                { email: user.email },
                "Temporary password reset successfully. You can now login with your new password."
            )
        );

    } catch (err) {
        console.error("Reset Temporary Password Error:", err);

        return res.status(500).json(
            new ApiError(
                500,
                err.message || "Internal Server Error"
            )
        );
    }
};