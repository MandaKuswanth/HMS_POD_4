const User = require("../models/User");
const Employee = require("../models/Employee");
const Patient = require("../models/Patient");
const Role = require("../models/Role");
const jwt = require("jsonwebtoken");
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
    const { email, password } = req.body || {};

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({
        email: email.trim().toLowerCase(),
        isDeleted: false
    });

    if (!user) {
        throw new ApiError(404, "Invalid email or password");
    }

    const isMatch = await user.isPasswordCorrect(password);
    if (!isMatch) {
        throw new ApiError(401, "Invalid email or password");
    }

    if (!user.status) {
        throw new ApiError(403, "Your account has been deactivated or is pending approval");
    }

    let profile = null;
    if (user.isEmployee) {
        profile = await Employee.findOne({ employeeCode: user.employeeId, isDeleted: false });
        if (!profile || !profile.status) {
            throw new ApiError(403, "Employee profile is inactive or missing");
        }
    } else {
        profile = await Patient.findOne({ UHID: user.UHID, isDeleted: false });
        if (!profile || !profile.status) {
            throw new ApiError(403, "Patient profile is inactive or missing");
        }
    }

    // Resolve permissions from roles
    const roles = await Role.find({
        roleId: { $in: user.roleIds },
        status: true
    }).select("roleId name permissions");

    const roleNames = roles.map((role) => role.name);
    const permissions = [...new Set(roles.flatMap((role) => role.permissions || []))];

    const accessToken = user.generateAccessToken(roleNames, permissions);
    const refreshToken = user.generateRefreshToken();

    // Save refresh token to user document
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    setRefreshTokenCookie(res, refreshToken);

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
        userData.employee = profile;
    } else {
        userData.UHID = user.UHID;
        userData.name = profile.name;
        userData.patient = profile;
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                accessToken,
                user: userData,
                resetRequired: user.mustResetPassword
            },
            "Login successful"
        )
    );
});

exports.refresh = asyncHandler(async (req, res) => {
    const token = getCookie(req, "refreshToken");

    if (!token) {
        throw new ApiError(401, "Refresh token is missing. Please re-login.");
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
        throw new ApiError(401, "Expired or invalid refresh token. Please re-login.");
    }

    const user = await User.findById(decoded.id);
    if (!user || user.isDeleted || !user.status || user.refreshToken !== token) {
        throw new ApiError(401, "Invalid refresh token session. Please re-login.");
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
