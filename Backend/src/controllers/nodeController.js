const Node = require("../models/Node");
const Role = require("../models/Role");

const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../middlewares/asyncHandler");


const buildNodeResponse = (node) => {
    return {
        nodeId: node.nodeId,
        name: node.name,
        path: node.path,
        icon: node.icon,
        permissions: node.permissions,
        parentNodeId: node.parentNodeId,
        order: node.order,
        status: node.status,
        isDeleted: node.isDeleted,
        createdAt: node.createdAt,
        updatedAt: node.updatedAt
    };
};

const buildMenuTree = (nodes) => {
    const nodeMap = new Map();

    nodes.forEach((node) => {
        nodeMap.set(node.nodeId, {
            nodeId: node.nodeId,
            name: node.name,
            path: node.path,
            icon: node.icon,
            permissions: node.permissions,
            parentNodeId: node.parentNodeId,
            order: node.order,
            children: []
        });
    });

    const menu = [];

    nodeMap.forEach((node) => {
        if (node.parentNodeId && nodeMap.has(node.parentNodeId)) {
            nodeMap.get(node.parentNodeId).children.push(node);
        } else {
            menu.push(node);
        }
    });

    const sortMenu = (items) => {
        items.sort((a, b) => a.order - b.order);

        items.forEach((item) => {
            if (item.children?.length) {
                sortMenu(item.children);
            }
        });
    };

    sortMenu(menu);

    return menu;
};

const getUserPermissions = async (roleIds) => {
    const roles = await Role.find({
        roleId: { $in: roleIds },
        status: true
    });

    const permissions = roles.flatMap((role) => role.permissions);

    return [...new Set(permissions)];
};

exports.createNode = asyncHandler(async (req, res) => {
    const {
        name,
        path,
        icon,
        permissions,
        parentNodeId,
        order,
        status
    } = req.body;

    if (!name || !path) {
        throw new ApiError(400, "Node name and path are required");
    }

    if (!Array.isArray(permissions) || permissions.length === 0) {
        throw new ApiError(400, "At least one permission is required");
    }

    const existingNode = await Node.findOne({
        path,
        isDeleted: false
    });

    if (existingNode) {
        throw new ApiError(409, "Node path already exists");
    }

    if (parentNodeId) {
        const parentNode = await Node.findOne({
            nodeId: parentNodeId,
            isDeleted: false
        });

        if (!parentNode) {
            throw new ApiError(404, "Parent node not found");
        }
    }

    const node = await Node.create({
        name,
        path,
        icon,
        permissions,
        parentNodeId: parentNodeId || null,
        order: order || 0,
        status: status !== undefined ? status : true
    });


    return res.status(201).json(
        new ApiResponse(
            201,
            buildNodeResponse(node),
            "Node created successfully"
        )
    );
});

exports.getNodes = asyncHandler(async (req, res) => {
    const query = {
        isDeleted: false
    };

    if (req.query.status !== undefined) {
        query.status = req.query.status === "true";
    }

    if (req.query.parentNodeId) {
        query.parentNodeId = req.query.parentNodeId;
    }

    const nodes = await Node.find(query).sort({
        order: 1,
        createdAt: -1
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            nodes.map(buildNodeResponse),
            "Nodes fetched successfully"
        )
    );
});

exports.getNodeById = asyncHandler(async (req, res) => {
    const { nodeId } = req.params;

    const node = await Node.findOne({
        nodeId,
        isDeleted: false
    });

    if (!node) {
        throw new ApiError(404, "Node not found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            buildNodeResponse(node),
            "Node fetched successfully"
        )
    );
});

exports.updateNode = asyncHandler(async (req, res) => {
    const { nodeId } = req.params;

    const node = await Node.findOne({
        nodeId,
        isDeleted: false
    });

    if (!node) {
        throw new ApiError(404, "Node not found");
    }

    const oldValue = buildNodeResponse(node);

    const {
        name,
        path,
        icon,
        permissions,
        parentNodeId,
        order,
        status
    } = req.body;

    if (path && path !== node.path) {
        const existingNode = await Node.findOne({
            path,
            nodeId: { $ne: nodeId },
            isDeleted: false
        });

        if (existingNode) {
            throw new ApiError(409, "Node path already exists");
        }

        node.path = path;
    }

    if (parentNodeId !== undefined && parentNodeId !== null) {
        if (parentNodeId === nodeId) {
            throw new ApiError(400, "Node cannot be parent of itself");
        }

        const parentNode = await Node.findOne({
            nodeId: parentNodeId,
            isDeleted: false
        });

        if (!parentNode) {
            throw new ApiError(404, "Parent node not found");
        }

        node.parentNodeId = parentNodeId;
    }

    if (parentNodeId === null) {
        node.parentNodeId = null;
    }

    if (name !== undefined) node.name = name;
    if (icon !== undefined) node.icon = icon;
    if (permissions !== undefined) node.permissions = permissions;
    if (order !== undefined) node.order = order;
    if (status !== undefined) node.status = status;

    await node.save();

    const newValue = buildNodeResponse(node);

    await createAuditLog({
        req,
        action: "NODE_UPDATED",
        entityType: "NODE",
        entityId: node.nodeId,
        oldValue,
        newValue
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            newValue,
            "Node updated successfully"
        )
    );
});


exports.getMyMenu = asyncHandler(async (req, res) => {
    const roleIds = req.user?.roleIds || [];

    if (!roleIds.length) {
        throw new ApiError(403, "No roles found for user");
    }

    const userPermissions = await getUserPermissions(roleIds);

    const nodes = await Node.find({
        status: true,
        isDeleted: false,
        permissions: {
            $in: userPermissions
        }
    }).sort({
        order: 1
    });

    const menuTree = buildMenuTree(nodes);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                permissions: userPermissions,
                menu: menuTree
            },
            "Menu fetched successfully"
        )
    );
});