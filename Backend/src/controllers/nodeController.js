const Node = require("../models/Node");
const Role = require("../models/Role");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../middleware/asyncHandler");
const { paginateQuery } = require("../utils/pagination");

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

    const permissions = roles.flatMap((role) => {
        return Array.isArray(role.permissions) ? role.permissions : [];
    });

    return [...new Set(permissions)];
};

const handlePathUpdate = async (node, path, nodeId) => {
    if (!path || path === node.path) return;

    const existingNode = await Node.findOne({
        path,
        nodeId: { $ne: nodeId },
        isDeleted: false
    });

    if (existingNode) {
        throw new ApiError(409, "Node path already exists");
    }

    node.path = path;
};

const handleParentUpdate = async (node, parentNodeId, nodeId) => {
    if (parentNodeId === undefined) return;

    if (parentNodeId === null) {
        node.parentNodeId = null;
        return;
    }

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
};

const handlePermissionsUpdate = (node, permissions) => {
    if (permissions === undefined) return;

    if (!Array.isArray(permissions) || permissions.length === 0) {
        throw new ApiError(400, "At least one permission is required");
    }

    node.permissions = permissions;
};

const applySimpleUpdates = (node, { name, icon, order, status }) => {
    if (name !== undefined) node.name = name;
    if (icon !== undefined) node.icon = icon;
    if (order !== undefined) node.order = order;
    if (status !== undefined) node.status = status;
};

// ─── Create Node ─────────────────────────────────────────────────────────────
exports.createNode = asyncHandler(async (req, res) => {
    const { name, path, icon, permissions, parentNodeId, order, status } = req.body;

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
        status: status ?? true
    });

    return res.status(201).json(
        new ApiResponse(201, buildNodeResponse(node), "Node created successfully")
    );
});

// ─── Get Nodes List (Paginated & Searchable) ─────────────────────────────────
exports.getNodes = asyncHandler(async (req, res) => {
    const baseFilter = { isDeleted: false };

    if (req.query.status !== undefined) {
        baseFilter.status = req.query.status === "true";
    }

    if (req.query.parentNodeId) {
        baseFilter.parentNodeId = req.query.parentNodeId;
    }

    const searchFields = ["name", "path", "nodeId"];

    const result = await paginateQuery({
        model: Node,
        query: req.query,
        baseFilter,
        searchFields,
        defaultSortField: "order"
    });

    const formattedRecords = result.data.map(buildNodeResponse);

    return res.status(200).json(
        new ApiResponse(200, formattedRecords, "Nodes fetched successfully", result.pagination)
    );
});

// ─── Get Node By ID ──────────────────────────────────────────────────────────
exports.getNodeById = asyncHandler(async (req, res) => {
    const { nodeId } = req.params;

    const node = await Node.findOne({ nodeId, isDeleted: false });
    if (!node) {
        throw new ApiError(404, "Node not found");
    }

    return res.status(200).json(
        new ApiResponse(200, buildNodeResponse(node), "Node fetched successfully")
    );
});

// ─── Update Node ─────────────────────────────────────────────────────────────
exports.updateNode = asyncHandler(async (req, res) => {
    const { nodeId } = req.params;

    const node = await Node.findOne({ nodeId, isDeleted: false });
    if (!node) {
        throw new ApiError(404, "Node not found");
    }

    const { name, path, icon, permissions, parentNodeId, order, status } = req.body;

    await handlePathUpdate(node, path, nodeId);
    await handleParentUpdate(node, parentNodeId, nodeId);
    handlePermissionsUpdate(node, permissions);
    applySimpleUpdates(node, { name, icon, order, status });

    await node.save();

    return res.status(200).json(
        new ApiResponse(200, buildNodeResponse(node), "Node updated successfully")
    );
});

// ─── Delete Node ─────────────────────────────────────────────────────────────
exports.deleteNode = asyncHandler(async (req, res) => {
    const { nodeId } = req.params;

    const node = await Node.findOne({ nodeId, isDeleted: false });
    if (!node) {
        throw new ApiError(404, "Node not found");
    }

    node.isDeleted = true;
    node.status = false;
    await node.save();

    await Node.updateMany(
        { parentNodeId: nodeId, isDeleted: false },
        { status: false }
    );

    return res.status(200).json(
        new ApiResponse(200, null, "Node deleted successfully")
    );
});

// ─── Get My Menu ─────────────────────────────────────────────────────────────
exports.getMyMenu = asyncHandler(async (req, res) => {
    const roleIds = req.user?.roleIds || [];

    if (!roleIds.length) {
        throw new ApiError(403, "No roles found for user");
    }

    const userPermissions = await getUserPermissions(roleIds);

    const nodes = await Node.find({
        status: true,
        isDeleted: false,
        permissions: { $in: userPermissions }
    }).sort({ order: 1 });

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

// ─── Autocomplete Node Search ────────────────────────────────────────────────
exports.getNodesSearch = asyncHandler(async (req, res) => {
    const q = req.query.q || "";
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);

    const filter = { isDeleted: false, status: true };
    if (q.trim()) {
        filter.name = { $regex: q.trim(), $options: "i" };
    }

    const nodes = await Node.find(filter)
        .select("_id nodeId name path icon parentNodeId status")
        .limit(limit)
        .lean();

    return res.status(200).json(
        new ApiResponse(200, nodes, "Nodes autocomplete fetched successfully")
    );
});