const Role = require("../models/Role");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const { getPagination, buildPaginationResponse } = require("../utils/pagination");

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

exports.getRoles = async (req, res) => {
    try {
        // 1. Extract pagination parameters
        const { page, limit, skip, sort } = getPagination(req.query);

        // 2. Fetch data and count in parallel
        const [roles, totalRecords] = await Promise.all([
            Role.find()
                .sort(sort)
                .skip(skip)
                .limit(limit),
            Role.countDocuments()
        ]);

        // 3. Build response using the standard contract
        const pagination = buildPaginationResponse({ page, limit, totalRecords });

        return res.status(200).json(
            new ApiResponse(
                200,
                roles,
                "Roles fetched successfully",
                pagination // Include the standard pagination object
            )
        );
    } catch (err) {
        console.error(err);
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
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