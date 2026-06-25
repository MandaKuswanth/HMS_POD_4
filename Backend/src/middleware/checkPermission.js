const Role = require("../models/Role");

const getUserFromRequest = (req) => {
    return req.user?.user || req.user?.data?.user || req.user || {};
};

const checkPermission = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            const user = getUserFromRequest(req);

            console.log("PERMISSION CHECK USER:", {
                email: user.email,
                employeeId: user.employeeId,
                roleIds: user.roleIds,
                requiredPermission
            });

            if (!user?.email) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized"
                });
            }

            const roleIds = Array.isArray(user.roleIds)
                ? user.roleIds.map(String)
                : [];

            if (!roleIds.length) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. No role assigned."
                });
            }

            const roles = await Role.find({
                roleId: { $in: roleIds },
                status: true
            }).lean();

            console.log("FOUND ROLES:", roles.map((role) => ({
                roleId: role.roleId,
                name: role.name,
                code: role.code,
                status: role.status,
                permissionsCount: Array.isArray(role.permissions)
                    ? role.permissions.length
                    : 0
            })));

            if (!roles.length) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. Role not permitted.",
                    roleIds
                });
            }

            const permissions = new Set(
                roles.flatMap(role =>
                    Array.isArray(role.permissions) ? role.permissions : []
                )
            );

            console.log("REQUIRED PERMISSION:", requiredPermission);
            console.log("HAS PERMISSION:", permissions.has(requiredPermission));

            if (!permissions.has(requiredPermission)) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. Permission missing.",
                    requiredPermission,
                    roleIds
                });
            }

            return next();
        } catch (error) {
            console.error("PERMISSION CHECK ERROR:", error);

            return res.status(500).json({
                success: false,
                message: error.message || "Permission check failed"
            });
        }
    };
};

module.exports = checkPermission;
