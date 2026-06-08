const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { Schema } = mongoose;

const userSchema = new Schema(
    {
        email: {
            type: String,
            unique: true,
            required: true,
            trim: true,
            lowercase: true
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

        roles: {
            type: String,
            enum: [
                "OWNER",
                "ADMIN",
                "DOCTOR",
                "RECEPTIONIST",
                "CASHIER",
                "NURSE",
                "LAB_TECH",
                "PHARMACIST",
                "TECHNICIAN"
            ],
            required: function () {
                return this.isEmployee;
            }
        },

        employeeId: {
            type: String,
            required: function () {
                return this.isEmployee;
            }
        },
        UHID: {
            type: String,
            default: null
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
        }
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at"
        }
    }
);

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            id: this._id,
            email: this.email,
            role: this.roles,
            isEmployee: this.isEmployee,
            employeeId: this.employeeId,
            UHID: this.UHID
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "1h"
        }
    );
};

module.exports = mongoose.model("User", userSchema);