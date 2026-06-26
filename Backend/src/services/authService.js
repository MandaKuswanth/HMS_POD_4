const User = require('../models/User');
const Employee = require('../models/Employee');
const Patient = require('../models/Patient');
const Role = require('../models/Role');
const ApiError = require('../utils/ApiError');
const bcrypt = require('bcryptjs');

class AuthService {
    async loginUser(email, password) {
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

        const roles = await Role.find({
            roleId: { $in: user.roleIds },
            status: true
        }).select("roleId name permissions");

        const roleNames = roles.map(role => role.name);
        const permissions = [...new Set(roles.flatMap(role => role.permissions || []))];

        const accessToken = user.generateAccessToken(roleNames, permissions);
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        user.lastLogin = new Date();
        await user.save();

        const userData = {
            id: user._id,
            email: user.email,
            roleIds: user.roleIds,
            roles: roles.map(role => ({ roleId: role.roleId, name: role.name })),
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

        return { accessToken, refreshToken, userData };
    }

    async verifyResetOtp(email, otp) {
        const user = await User.findOne({
            email: email.toLowerCase(),
            isDeleted: false,
            resetPasswordOtp: { $ne: null },
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            throw new ApiError(400, "OTP is invalid or has expired");
        }

        const isValid = await bcrypt.compare(otp.toString(), user.resetPasswordOtp);
        if (!isValid) {
            throw new ApiError(400, "Invalid OTP");
        }

        return user;
    }

    async resetPassword(email, newPassword) {
        const user = await User.findOne({
            email: email.toLowerCase(),
            isDeleted: false,
            resetPasswordOtp: { $ne: null },
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            throw new ApiError(400, "Session expired. Please request a new OTP");
        }

        const isSamePassword = await user.isPasswordCorrect(newPassword);
        if (isSamePassword) {
            throw new ApiError(400, "New password cannot be the same as current password");
        }

        user.passwordHash = await bcrypt.hash(newPassword, 10);
        user.resetPasswordOtp = undefined;
        user.resetPasswordExpires = undefined;
        user.mustResetPassword = false;
        await user.save();
    }
}

module.exports = new AuthService();
