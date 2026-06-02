const mongoose = require("mongoose");
const Counter = require("./Counter");

const patientSchema = new mongoose.Schema(
    {
        UHID: {
            type: String,
            unique: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        phone: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },

        gender: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            enum: ["male", "female", "others"]
        },

        dob: {
            type: Date,
            required: true
        },

        address: {
            type: String,
            trim: true
        },

        emergencyContact: {
            name: {
                type: String,
                trim: true
            },
            relation: {
                type: String,
                trim: true
            },
            phone: {
                type: String,
                trim: true
            }
        },

        bloodGroup: {
            type: String,
            trim: true
        },

        allergies: {
            type: String,
            trim: true
        },

        status: {
            type: Boolean,
            default: true
        },

        authStatus: {
            type: String,
            enum: ["INVITED", "ACTIVE", "INACTIVE"],
            default: "INVITED"
        },

        passwordSetToken: {
            type: String,
            default: null
        },

        passwordSetTokenExpiry: {
            type: Date,
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

patientSchema.pre("save", async function (next) {
    if (this.isNew && !this.UHID) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: "patient" },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );

            this.UHID = `HMS-${String(counter.seq).padStart(6, "0")}`;
        } catch (err) {
            return next(err);
        }
    }


});

module.exports = mongoose.model("Patient", patientSchema);