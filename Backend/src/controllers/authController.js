const authService = require('../services/authService');
const userService = require('../services/userService');
const emailService = require('../services/emailService');
const User = require('../models/User');
const Role = require('../models/Role');
const Employee = require('../models/Employee');
const Patient = require('../models/Patient');
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../middleware/asyncHandler");

// Cookie helper
const getCookie = (req, name) => {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return null;
    const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
        const [key, ...val] = cookie.split("=");
        acc[key.trim()] = decodeURIComponent(val.join("="));
        return acc;
    }, {});
    return cookies[name] || null;
};

// Set refresh token cookie
const setRefreshTokenCookie = (res, token) => {
    res.cookie("refreshToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
};

exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    const { accessToken, refreshToken, userData } = await authService.loginUser(email, password);

    setRefreshTokenCookie(res, refreshToken);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                accessToken,
                refreshToken,
                user: userData
            },
            "Login successful"
        )
    );
});

exports.refresh = asyncHandler(async (req, res) => {
    let token = getCookie(req, "refreshToken");
    if (!token && req.body && req.body.refreshToken) {
        token = req.body.refreshToken;
    }

    if (!token) {
        throw new ApiError(401, "No refresh token found");
    }

    const user = await User.findOne({ refreshToken: token, isDeleted: false });
    if (!user) {
        throw new ApiError(403, "Invalid refresh token");
    }

    if (!user.status) {
        throw new ApiError(403, "Your account has been deactivated");
    }

    let profile = null;
    if (user.isEmployee) {
        profile = await Employee.findOne({ employeeCode: user.employeeId, isDeleted: false });
        if (!profile || !profile.status) {
            throw new ApiError(403, "Employee profile is inactive");
        }
    } else {
        profile = await Patient.findOne({ UHID: user.UHID, isDeleted: false });
        if (!profile || !profile.status) {
            throw new ApiError(403, "Patient profile is inactive");
        }
    }

    // Resolve roles & permissions
    const roles = await Role.find({
        roleId: { $in: user.roleIds },
        status: true
    }).select("roleId name permissions");

    const roleNames = roles.map((role) => role.name);
    const permissions = [...new Set(roles.flatMap((role) => role.permissions || []))];

    // Generate new Access and rotated Refresh tokens
    const newAccessToken = user.generateAccessToken(roleNames, permissions);
    const newRefreshToken = user.generateRefreshToken();

    // Rotate token in DB
    user.refreshToken = newRefreshToken;
    await user.save();

    setRefreshTokenCookie(res, newRefreshToken);

    const userData = {
        id: user._id,
        email: user.email,
        roleIds: user.roleIds,
        roles: roles.map((role) => ({ roleId: role.roleId, name: role.name })),
        permissions,
        isEmployee: user.isEmployee,
        status: user.status,
        mustResetPassword: user.mustResetPassword
    };

    if (user.isEmployee) {
        userData.employeeId = user.employeeId;
        userData.name = profile.name;
    } else {
        userData.UHID = user.UHID;
        userData.name = profile.name;
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
                user: userData
            },
            "Token refreshed successfully"
        )
    );
});

exports.logout = asyncHandler(async (req, res) => {
    const token = getCookie(req, "refreshToken");

    if (token) {
        const user = await User.findOne({ refreshToken: token });
        if (user) {
            user.refreshToken = null;
            await user.save();
        }
    }

    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    });

    return res.status(200).json(
        new ApiResponse(200, null, "Logged out successfully")
    );
});

exports.forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    
    const { user, otp } = await userService.generateResetOTP(email);

    let profileName = "User";
    if (user.isEmployee) {
        const profile = await Employee.findOne({ employeeCode: user.employeeId });
        profileName = profile ? profile.name : "Employee";
    } else {
        const profile = await Patient.findOne({ UHID: user.UHID });
        profileName = profile ? profile.name : "Patient";
    }

    await emailService.sendPasswordResetOTP(email, otp, profileName);

    return res.status(200).json(
        new ApiResponse(200, null, "Password reset OTP sent successfully")
    );
});

exports.verifyResetOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    await authService.verifyResetOtp(email, otp);

    return res.status(200).json(
        new ApiResponse(200, null, "OTP verified successfully")
    );
});

exports.resetPassword = asyncHandler(async (req, res) => {
    const { email, newPassword } = req.body;
    await authService.resetPassword(email, newPassword);

    return res.status(200).json(
        new ApiResponse(200, null, "Password reset successfully")
    );
});

exports.changePassword = asyncHandler(async (req, res) => {
    const { id } = req.user;
    const { newPassword } = req.body;
    await userService.changePassword(id, newPassword);

    return res.status(200).json(
        new ApiResponse(200, null, "Password updated successfully")
    );
});
