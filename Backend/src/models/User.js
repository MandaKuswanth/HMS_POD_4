const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Schema } = mongoose;

const userSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        mobile: {
            type: String,
            trim: true
        },
        passwordHash: {
            type: String,
            required: true
        },
        isEmployee: {
            type: Boolean,
            default: true
        },
        status: {
            type: Boolean,
            default: true
        },
        roleIds: {
            type: [String],
            required: true,
            default: [],
            validate: {
                validator: function (value) {
                    return Array.isArray(value) && value.length > 0;
                },
                message: "At least one role is required"
            }
        },
        UHID: {
            type: String,
            required: function () {
                return !this.isEmployee;
            },
            trim: true
        },
        employeeId: {
            type: String,
            required: function () {
                return this.isEmployee;
            },
            trim: true
        },
        lastLogin: {
            type: Date,
            default: null
        },
        mustResetPassword: {
            type: Boolean,
            default: function () {
                return this.isEmployee;
            }
        },
        // OTP fields for password reset
        resetOTP: {
            type: String,
            default: null,
            select: false // Don't include in queries by default for security
        },
        resetOTPExpiry: {
            type: Date,
            default: null,
            select: false
        },
        resetOTPAttempts: {
            type: Number,
            default: 0,
            select: false
        },
        lastOTPRequestTime: {
            type: Date,
            default: null,
            select: false
        },
        createdBy: {
            type: String,
            default: null
        },
        updatedBy: {
            type: String,
            default: null
        },
        // Soft delete fields
        isDeleted: {
            type: Boolean,
            default: false
        },
        deletedAt: {
            type: Date,
            default: null
        },
        deletedBy: {
            type: String,
            default: null
        }
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at"
        }
    }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ mobile: 1 }, { unique: true, sparse: true });
userSchema.index({ roleIds: 1 });
userSchema.index({ employeeId: 1 }, { unique: true, sparse: true });
userSchema.index({ UHID: 1 }, { unique: true, sparse: true });
userSchema.index({ isDeleted: 1 });
userSchema.index({ resetOTPExpiry: 1 });

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.generateAccessToken = function () {
    const payload = {
        id: this._id,
        email: this.email,
        roleIds: this.roleIds,
        isEmployee: this.isEmployee,
        status: this.status
    };

    if (this.isEmployee) {
        payload.employeeId = this.employeeId;
    } else {
        payload.UHID = this.UHID;
    }

    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "1h"
    });
};

// Generate 6-digit OTP with 10-minute expiry
userSchema.methods.generatePasswordResetOTP = function () {
    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash OTP before storing (similar to password security)
    const hashedOTP = require('crypto')
        .createHash('sha256')
        .update(otp)
        .digest('hex');
    
    // Set OTP expiry to 10 minutes from now
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);
    
    this.resetOTP = hashedOTP;
    this.resetOTPExpiry = otpExpiry;
    this.resetOTPAttempts = 0;
    this.lastOTPRequestTime = new Date();
    
    // Return plain OTP to send via email (not the hashed one)
    return otp;
};

// Verify OTP
userSchema.methods.verifyPasswordResetOTP = function (providedOTP) {
    if (!this.resetOTP || !this.resetOTPExpiry) {
        return { valid: false, message: 'No OTP found' };
    }
    
    if (new Date() > this.resetOTPExpiry) {
        return { valid: false, message: 'OTP has expired' };
    }
    
    const hashedProvidedOTP = require('crypto')
        .createHash('sha256')
        .update(providedOTP)
        .digest('hex');
    
    if (this.resetOTP !== hashedProvidedOTP) {
        this.resetOTPAttempts += 1;
        return { valid: false, message: 'Invalid OTP' };
    }
    
    return { valid: true, message: 'OTP verified successfully' };
};

// Clear OTP after successful reset
userSchema.methods.clearPasswordResetOTP = function () {
    this.resetOTP = null;
    this.resetOTPExpiry = null;
    this.resetOTPAttempts = 0;
};

module.exports = mongoose.model("User", userSchema);