const Node = require("../models/Node");


exports.createNode = async (req, res) => {
    try {
        const { name, url, roles } = req.body;

        if (!name || !url || !roles) {
            return res.status(400).json({
                success: false,
                message: "Name, url and roles are required"
            });
        }

        const node = await Node.create({
            name,
            url,
            roles
        });

        return res.status(201).json({
            success: true,
            message: "Node created successfully",
            data: node
        });
    } catch (error) {
        console.error("Create Node Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create node"
        });
    }
};



exports.getAllNodes = async (req, res) => {
    try {
        const nodes = await Node.find().sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Nodes fetched successfully",
            data: nodes
        });
    } catch (error) {
        console.error("Get All Nodes Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch nodes"
        });
    }
};



exports.getNodeById = async (req, res) => {
    try {
        const { id } = req.params;

        const node = await Node.findById(id);

        if (!node) {
            return res.status(404).json({
                success: false,
                message: "Node not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Node fetched successfully",
            data: node
        });
    } catch (error) {
        console.error("Get Node By Id Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch node"
        });
    }
};



exports.updateNode = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, url, roles } = req.body;

        const node = await Node.findByIdAndUpdate(
            id,
            {
                name,
                url,
                roles
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!node) {
            return res.status(404).json({
                success: false,
                message: "Node not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Node updated successfully",
            data: node
        });
    } catch (error) {
        console.error("Update Node Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update node"
        });
    }
};



exports.deleteNode = async (req, res) => {
    try {
        const { id } = req.params;

        const node = await Node.findByIdAndDelete(id);

        if (!node) {
            return res.status(404).json({
                success: false,
                message: "Node not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Node deleted successfully",
            data: node
        });
    } catch (error) {
        console.error("Delete Node Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete node"
        });
    }
};



exports.getRoles = async (req, res) => {
    try {
        const roles = await Node.distinct("roles");

        return res.status(200).json({
            success: true,
            message: "Roles fetched successfully",
            data: roles
        });
    } catch (error) {
        console.error("Get Roles Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch roles"
        });
    }
};