const User = require('../models/User');
const Role = require('../models/Role');
const bcrypt = require('bcryptjs');
const ApiError = require('../utils/ApiError');
const crypto = require('node:crypto');

class UserService {
    async createUser({ email, tempPassword, roleName, isEmployee, employeeId, UHID, status = false, mustResetPassword = true }) {
        const existingUser = await User.findOne({ email: email.toLowerCase(), isDeleted: false });
        if (existingUser) {
            throw new ApiError(409, "User already exists with this email");
        }

        const roleDoc = await Role.findOne({ name: roleName.toUpperCase(), status: true });
        if (!roleDoc) {
            throw new ApiError(404, "Role not found");
        }

        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const user = await User.create({
            email: email.toLowerCase(),
            passwordHash: hashedPassword,
            roleIds: [roleDoc.roleId],
            isEmployee,
            employeeId: isEmployee ? employeeId : undefined,
            UHID: !isEmployee ? UHID : undefined,
            status,
            mustResetPassword
        });

        return user;
    }

    async generateResetOTP(email) {
        const user = await User.findOne({ email: email.toLowerCase(), isDeleted: false });
        if (!user) {
            throw new ApiError(404, "User not found with this email");
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        user.resetPasswordOtp = await bcrypt.hash(otp, 10);
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        return { user, otp };
    }

    async changePassword(userId, newPassword) {
        const user = await User.findById(userId);
        if (!user || user.isDeleted) {
            throw new ApiError(404, "User not found");
        }

        const isSamePassword = await user.isPasswordCorrect(newPassword);
        if (isSamePassword) {
            throw new ApiError(400, "New password cannot be the same as current password");
        }

        user.passwordHash = await bcrypt.hash(newPassword, 10);
        user.mustResetPassword = false;
        await user.save();

        return user;
    }
}

module.exports = new UserService();
