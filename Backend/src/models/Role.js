const mongoose = require("mongoose");
const { Schema } = mongoose;

const Counter = require("./Counter");

const roleSchema = new Schema(
    {
        roleId: {
            type: String,
            trim: true
        },

        name: {
            type: String,
            required: true,
            trim: true,
            uppercase: true
        },

        description: {
            type: String,
            trim: true
        },

        permissions: {
            type: [String],
            default: []
        },

        status: {
            type: Boolean,
            default: true
        },

        createdBy: {
            type: String,
            default: null
        },

        updatedBy: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
);

roleSchema.pre("save", async function (next) {
    try {
        if (this.isNew && !this.roleId) {
            const counter = await Counter.findOneAndUpdate(
                { name: "role" },
                { $inc: { seq: 1 } },
                {
                    new: true,
                    upsert: true
                }
            );

            this.roleId = `ROLE-${String(counter.seq).padStart(6, "0")}`;
        }

        
    } catch (error) {
        next(error);
    }
});

roleSchema.index({ roleId: 1 }, { unique: true });
roleSchema.index({ name: 1 }, { unique: true });
roleSchema.index({ status: 1 });

module.exports = mongoose.model("Role", roleSchema);