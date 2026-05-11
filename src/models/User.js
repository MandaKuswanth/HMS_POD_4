const mongoose = require("mongoose")
const { Schema } = mongoose;

const userSchema = new Schema({
    email: { type: String, unique: true, required: true, trim: true },
    passwordHash: { type: String, required: true },
    status: { type: Boolean, default: true },
    roles: { type: String, enum: ["OWNER", "ADMIN", "DOCTOR", "RECEPTIONIST", "CASHIER", "NURSE", "LAB_TECH", "PHARMACIST",], required: true },
    employeeId: { type: String, required: true },
    lastLogin: { type: Date, default: null },
}, {
    timestamps: {
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
})

const jwt = require("jsonwebtoken");

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            id: this._id,
            email: this.email
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN
        }
    );
};


module.exports = mongoose.model("user", userSchema)