const PermissionCatalog = require('../models/PermissionCatalog');

exports.getCatalog = async (req, res) => {
    try {
        const permissions = await PermissionCatalog.find({ isActive: true }).sort({ category: 1, label: 1 });

        const grouped = permissions.reduce((acc, perm) => {
            if (!acc[perm.category]) acc[perm.category] = [];
            acc[perm.category].push({
                key: perm.key,
                label: perm.label,
                description: perm.description,
            });
            return acc;
        }, {});

        res.status(200).json({ success: true, data: grouped });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createPermission = async (req, res) => {
    try {
        const { key, label, category, description } = req.body;

        if (!key || !label || !category) {
            return res.status(400).json({ success: false, message: 'key, label and category are required' });
        }

        const exists = await PermissionCatalog.findOne({ key: key.toUpperCase() });
        if (exists) {
            return res.status(409).json({ success: false, message: 'Permission key already exists' });
        }

        const permission = await PermissionCatalog.create({ key: key.toUpperCase(), label, category, description });
        res.status(201).json({ success: true, data: permission });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deletePermission = async (req, res) => {
    try {
        const { key } = req.params;
        await PermissionCatalog.findOneAndUpdate({ key: key.toUpperCase() }, { isActive: false });
        res.status(200).json({ success: true, message: 'Permission deactivated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};