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
            trim: true
        },

        passwordHash: {
            type: String,
            required: true
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
            required: true
        },

        employeeId: {
            type: String,
            required: true
        },

        lastLogin: {
            type: Date,
            default: null
        },

        mustResetPassword: {
            type: Boolean,
            default: true
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
            role: this.roles
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "1h"
        }
    );
};


module.exports = mongoose.model("User", userSchema);