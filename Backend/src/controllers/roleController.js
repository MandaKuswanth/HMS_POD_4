const Role = require("../models/Role");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

exports.createRole = async (req, res) => {
    try {
        const { name, description, permissions } = req.body;

        if (!name) {
            return res.status(400).json(
                new ApiError(400, "Role name is required")
            );
        }

        const existingRole = await Role.findOne({
            name: name.trim().toUpperCase()
        });

        if (existingRole) {
            return res.status(409).json(
                new ApiError(409, "Role already exists")
            );
        }

        const role = await Role.create({
            name,
            description,
            permissions: permissions || [],
            status: true,
            createdBy: req.user?.employeeId || req.user?.id
        });

        return res.status(201).json(
            new ApiResponse(
                201,
                role,
                "Role created successfully"
            )
        );

    } catch (err) {
        console.error(err);

        return res.status(500).json(
            new ApiError(
                500,
                err.message || "Internal Server Error"
            )
        );
    }
};



// Roles that must never be exposed on the public self-registration form.
const RESTRICTED_SELF_REGISTER_ROLES = ["SUPER_ADMIN", "ADMIN"];

// Public endpoint — no auth required. Returns only the minimal fields
// (roleId, name) needed to populate the self-registration dropdown.
// Deliberately excludes permissions, description, timestamps, etc.
exports.getPublicRegistrableRoles = async (req, res) => {
    try {
        const roles = await Role.find({
            status: true,
            name: { $nin: RESTRICTED_SELF_REGISTER_ROLES }
        })
            .select("roleId name")
            .sort({ name: 1 });

        return res.status(200).json(
            new ApiResponse(
                200,
                roles,
                "Registrable roles fetched successfully"
            )
        );

    } catch (err) {
        console.error(err);

        return res.status(500).json(
            new ApiError(
                500,
                err.message || "Internal Server Error"
            )
        );
    }
};

exports.getRoles = async (req, res) => {
    try {
        const page = Math.max(
            Number.parseInt(req.query.page, 10) || 1,
            1
        );

        const limit = Math.max(
            Number.parseInt(req.query.limit, 10) || 10,
            1
        );

        const skip = (page - 1) * limit;

        const totalRecords = await Role.countDocuments();

        const roles = await Role.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    records: roles,
                    pagination: {
                        totalRecords,
                        currentPage: page,
                        totalPages: Math.ceil(totalRecords / limit),
                        limit
                    }
                },
                "Roles fetched successfully"
            )
        );

    } catch (err) {
        console.error(err);

        return res.status(500).json(
            new ApiError(
                500,
                err.message || "Internal Server Error"
            )
        );
    }
};

exports.getRoleById = async (req, res) => {
    try {
        const { roleId } = req.params;

        const role = await Role.findOne({ roleId });

        if (!role) {
            return res.status(404).json(
                new ApiError(404, "Role not found")
            );
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                role,
                "Role fetched successfully"
            )
        );

    } catch (err) {
        console.error(err);

        return res.status(500).json(
            new ApiError(
                500,
                err.message || "Internal Server Error"
            )
        );
    }
};

exports.updateRole = async (req, res) => {
    try {
        const { roleId } = req.params;

        const role = await Role.findOne({ roleId });

        if (!role) {
            return res.status(404).json(
                new ApiError(404, "Role not found")
            );
        }

        const {
            name,
            description,
            permissions,
            status
        } = req.body;

        if (
            name &&
            name.trim().toUpperCase() !== role.name
        ) {
            const existingRole = await Role.findOne({
                name: name.trim().toUpperCase()
            });

            if (existingRole) {
                return res.status(409).json(
                    new ApiError(
                        409,
                        "Role name already exists"
                    )
                );
            }

            role.name = name;
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

        role.updatedBy =
            req.user?.employeeId || req.user?.id;

        await role.save();

        return res.status(200).json(
            new ApiResponse(
                200,
                role,
                "Role updated successfully"
            )
        );

    } catch (err) {
        console.error(err);

        return res.status(500).json(
            new ApiError(
                500,
                err.message || "Internal Server Error"
            )
        );
    }
};

exports.deleteRole = async (req, res) => {
    try {
        const { roleId } = req.params;

        const role = await Role.findOne({ roleId });

        if (!role) {
            return res.status(404).json(
                new ApiError(404, "Role not found")
            );
        }

        if (role.name === "SUPER_ADMIN") {
            return res.status(400).json(
                new ApiError(
                    400,
                    "SUPER_ADMIN role cannot be deleted"
                )
            );
        }

        await Role.deleteOne({ roleId });

        return res.status(200).json(
            new ApiResponse(
                200,
                null,
                "Role deleted successfully"
            )
        );

    } catch (err) {
        console.error(err);

        return res.status(500).json(
            new ApiError(
                500,
                err.message || "Internal Server Error"
            )
        );
    }
};