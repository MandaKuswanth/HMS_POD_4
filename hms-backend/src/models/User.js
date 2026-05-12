const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, trim: true, unique: true },
    passwordHash: { type: String, required: true },
    status: { type: Boolean, default: true },
    roles: { type: String, enum: ["OWNER", "ADMIN", "DOCTOR", "RECEPTIONIST", "CASHIER", "NURSE", "LAB_TECH", "PHARMACIST", "TECHNICIAN"], required: true },
    employeeId: { type: String, required: true },
    lastLoginAt: { type: Date, default: null },
    mustResetPassword: { type: Boolean, default: true }

},
    {
        timestamps: { createdAt: "created_at", updatedAt: "updated_at", }
    })

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
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "1h"
        }
    );
};
module.exports = mongoose.model("User", userSchema);