const mongoose = require("mongoose");
const { Schema } = mongoose;

const auditEventSchema = new Schema(
    {
        userId: {
            type: String,
            required: true,
            trim: true
        },
        action: {
            type: String,
            required: true,
            trim: true
        },
        details: {
            type: String,
            default: ""
        },
        ipAddress: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: {
            createdAt: true,
            updatedAt: false
        }
    }
);

auditEventSchema.index({ createdAt: 1 });
auditEventSchema.index({ userId: 1 });
auditEventSchema.index({ action: 1 });

module.exports = mongoose.model("AuditEvent", auditEventSchema);
