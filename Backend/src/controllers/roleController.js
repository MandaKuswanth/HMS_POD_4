const Role = require("../models/Role");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../middleware/asyncHandler");
const { paginateQuery } = require("../utils/pagination");

// ─── Create Role ─────────────────────────────────────────────────────────────
exports.createRole = asyncHandler(async (req, res) => {
    const { name, description, permissions } = req.body;

    if (!name) {
        throw new ApiError(400, "Role name is required");
    }

    const existingRole = await Role.findOne({
        name: name.trim().toUpperCase()
    });

    if (existingRole) {
        throw new ApiError(409, "Role already exists");
    }

    const role = await Role.create({
        name: name.trim().toUpperCase(),
        description,
        permissions: permissions || [],
        status: true,
        createdBy: req.user?.employeeId || req.user?.id
    });

    return res.status(201).json(
        new ApiResponse(201, role, "Role created successfully")
    );
});

// ─── Get Roles (Paginated & Searchable) ──────────────────────────────────────
exports.getRoles = asyncHandler(async (req, res) => {
    const filter = {};
    const searchFields = ["name", "description"];

    const result = await paginateQuery({
        model: Role,
        query: req.query,
        baseFilter: filter,
        searchFields,
        defaultSortField: "createdAt"
    });

    return res.status(200).json(
        new ApiResponse(200, result.data, "Roles fetched successfully", result.pagination)
    );
});

// ─── Autocomplete Role Search (Authenticated) ──────────────────────────────────
exports.getRolesSearch = asyncHandler(async (req, res) => {
    const q = req.query.q || "";
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);

    const filter = { status: true };
    if (q.trim()) {
        if (q.trim().length < 2) {
            return res.status(200).json(
                new ApiResponse(200, [], "Search term must be at least 2 characters")
            );
        }
        filter.name = { $regex: q.trim(), $options: "i" };
    }

    // Role Visibility Logic
    const userRoles = req.user?.roles || [];
    if (!userRoles.includes("SUPER_ADMIN")) {
        // If not SUPER_ADMIN, cannot see SUPER_ADMIN or ADMIN
        filter.name = { ...filter.name, $nin: [/SUPER_ADMIN/i, /ADMIN/i] };
    }

    const roles = await Role.find(filter)
        .select("_id roleId name description status")
        .limit(limit)
        .lean();

    return res.status(200).json(
        new ApiResponse(200, roles, "Roles autocomplete fetched successfully")
    );
});

// ─── Public Role Search (Self Registration) ──────────────────────────────────
exports.getPublicRolesSearch = asyncHandler(async (req, res) => {
    const q = req.query.q || "";
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);

    const filter = { status: true, selfRegisterAllowed: true };
    
    // Safety check to absolutely prevent ADMIN/SUPER_ADMIN from leaking publicly
    filter.name = { $nin: [/SUPER_ADMIN/i, /ADMIN/i] };

    if (q.trim()) {
        if (q.trim().length < 2) {
            return res.status(200).json(
                new ApiResponse(200, [], "Search term must be at least 2 characters")
            );
        }
        // Merge regex with $nin by using $and
        filter.$and = [
            { name: { $regex: q.trim(), $options: "i" } },
            { name: { $nin: [/SUPER_ADMIN/i, /ADMIN/i] } }
        ];
        delete filter.name;
    }

    const roles = await Role.find(filter)
        .select("_id roleId name description status")
        .limit(limit)
        .lean();

    return res.status(200).json(
        new ApiResponse(200, roles, "Public roles fetched successfully")
    );
});

// ─── Get Role By ID ──────────────────────────────────────────────────────────
exports.getRoleById = asyncHandler(async (req, res) => {
    const { roleId } = req.params;

    const role = await Role.findOne({ roleId });
    if (!role) {
        throw new ApiError(404, "Role not found");
    }

    return res.status(200).json(
        new ApiResponse(200, role, "Role fetched successfully")
    );
});

// ─── Update Role ─────────────────────────────────────────────────────────────
exports.updateRole = asyncHandler(async (req, res) => {
    const { roleId } = req.params;
    const { name, description, permissions, status } = req.body;

    const role = await Role.findOne({ roleId });
    if (!role) {
        throw new ApiError(404, "Role not found");
    }

    if (name && name.trim().toUpperCase() !== role.name) {
        const existingRole = await Role.findOne({
            name: name.trim().toUpperCase()
        });

        if (existingRole) {
            throw new ApiError(409, "Role name already exists");
        }

        role.name = name.trim().toUpperCase();
    }

    if (description !== undefined) {
        role.description = description;
    }

    if (permissions !== undefined) {
        role.permissions = permissions;
    }

    if (status !== undefined) {
        role.status = status;
    }

    role.updatedBy = req.user?.employeeId || req.user?.id;
    await role.save();

    return res.status(200).json(
        new ApiResponse(200, role, "Role updated successfully")
    );
});

// ─── Delete Role ─────────────────────────────────────────────────────────────
exports.deleteRole = asyncHandler(async (req, res) => {
    const { roleId } = req.params;

    const role = await Role.findOne({ roleId });
    if (!role) {
        throw new ApiError(404, "Role not found");
    }

    if (role.name === "SUPER_ADMIN" || role.name === "SUPER ADMIN") {
        throw new ApiError(400, "SUPER_ADMIN role cannot be deleted");
    }

    await Role.deleteOne({ roleId });

    return res.status(200).json(
        new ApiResponse(200, null, "Role deleted successfully")
    );
});