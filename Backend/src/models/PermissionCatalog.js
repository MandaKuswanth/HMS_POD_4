const mongoose = require('mongoose');
const { Schema } = mongoose;

const permissionCatalogSchema = new Schema(
    {
        key: { type: String, required: true, unique: true, uppercase: true, trim: true },
        label: { type: String, required: true, trim: true },
        category: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('PermissionCatalog', permissionCatalogSchema);