const Patient = require("../models/Patient");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const Role = require("../models/Role");

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
                { email: email.trim().toLowerCase() },
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

        const existingUser = await User.findOne({
            email: email.trim().toLowerCase()
        });

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
            email: email.trim().toLowerCase(),
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
            email: email.trim().toLowerCase(),
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
            email: email.trim().toLowerCase(),
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

        const token =
            user.generateAccessToken();

        user.lastLogin = new Date();

        await user.save();

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

// ✅ NEW: Forgot Password - Send OTP to Email
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
        const user = await User.findOne({
            email: email.trim().toLowerCase(),
            isEmployee: false,
            isDeleted: false
        });

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
        const { sendPasswordResetOTP } = require("../utils/sendEmail");
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

// ✅ NEW: Verify OTP
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
        const user = await User.findOne({
            email: email.trim().toLowerCase(),
            isEmployee: false,
            isDeleted: false
        }).select("+resetOTP +resetOTPExpiry +resetOTPAttempts");

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
        const verificationToken = require('jsonwebtoken').sign(
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

// ✅ NEW: Reset Password
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

        if (newPassword !== confirmPassword) {
            return res.status(400).json(
                new ApiError(
                    400,
                    "Passwords do not match"
                )
            );
        }

        // Validate password strength (at least 8 chars, 1 uppercase, 1 number)
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
        const user = await User.findOne({
            email: email.trim().toLowerCase(),
            isEmployee: false,
            isDeleted: false
        }).select("+resetOTP +resetOTPExpiry");

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