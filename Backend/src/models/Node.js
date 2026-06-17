const mongoose = require("mongoose");
const Counter = require("./Counter");

const nodeSchema = new mongoose.Schema(
    {
        nodeId: {
            type: String,
            trim: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        path: {
            type: String,
            required: true,
            trim: true
        },

        icon: {
            type: String,
            trim: true,
            default: ""
        },

        permissions: {
            type: [String],
            required: true,
            default: []
        },

        parentNodeId: {
            type: String,
            default: null,
            trim: true
        },

        order: {
            type: Number,
            default: 0
        },

        status: {
            type: Boolean,
            default: true
        },

        isDeleted: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

nodeSchema.pre("save", async function (next) {
    try {
        if (this.isNew && !this.nodeId) {
            const counter = await Counter.findOneAndUpdate(
                { name: "node" },
                { $inc: { seq: 1 } },
                {
                    new: true,
                    upsert: true
                }
            );

            this.nodeId = `NODE-${String(counter.seq).padStart(6, "0")}`;
        }


    } catch (error) {
        next(error);
    }
});

nodeSchema.index({ nodeId: 1 }, { unique: true });
nodeSchema.index({ path: 1 }, { unique: true });
nodeSchema.index({ permissions: 1 });
nodeSchema.index({ parentNodeId: 1 });
nodeSchema.index({ status: 1 });
nodeSchema.index({ isDeleted: 1 });
nodeSchema.index({ order: 1 });

module.exports = mongoose.model("Node", nodeSchema);