const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({

   
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    passwordHash: {
        type: String,
        required: true
    },

    roles: [{
        type: String,
        enum: [
            "OWNER",
            "ADMIN",
            "DOCTOR",
            "RECEPTIONIST",
            "CASHIER",
            "NURSE",
            "LAB_TECH",
            "PHARMACIST"
        ]
    }],
    ref_id: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "ref_type",
    },

    ref_type: {
        type: String,  
        enum: ["Patient", "Doctor", "Receptionist", "Cashier", "Nurse", "Lab_Tech", "Pharmacist"],
        required: true,
    },
    
    lastLoginAt: {
        type: Date,
        default: null,
    },
   reset_token: { type: String, default: null },
    reset_token_expiry: { type: Date, default: null },
    is_verified: { type: Boolean, default: false },
    verification_token: { type: String, default: null },
    verification_token_expiry: { type: Date, default: null },
  },
   {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

module.exports = mongoose.model("User", userSchema);