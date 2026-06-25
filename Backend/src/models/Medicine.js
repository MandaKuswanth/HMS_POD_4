const mongoose = require("mongoose");
const { Schema } = mongoose;

const medicineSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        sku: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        stock: {
            type: Number,
            required: true,
            min: 0,
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
        timestamps: true
    }
);

medicineSchema.index({ name: 1 });
medicineSchema.index({ sku: 1 }, { unique: true });
medicineSchema.index({ isDeleted: 1 });

module.exports = mongoose.model("Medicine", medicineSchema);
