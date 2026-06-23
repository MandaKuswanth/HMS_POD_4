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

module.exports = mongoose.model("User", userSchema);