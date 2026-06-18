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
                branchId: user.branchId,
                roleIds: user.roleIds,
                requiredPermission
            });

            if (!user || !user.email) {
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

            /*
                IMPORTANT:
                Your Role.status is Boolean.
                So only use status: true.
                Do NOT use "ACTIVE" or "active" here.
            */
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

            // Replace this part in your checkPermission.js
            const permissions = roles.flatMap((role) => (Array.isArray(role.permissions) ? role.permissions : []));

            // --- STRICT DEBUG BLOCK ---
            console.log("DEBUG: Required string:", JSON.stringify(requiredPermission));
            console.log("DEBUG: Database permission array as JSON:", JSON.stringify(permissions));

            // Check specifically for matching
            const isIncluded = permissions.includes(requiredPermission);
            console.log("DEBUG: Does array match string exactly?", isIncluded);
            // --------------------------
            if (!isIncluded) {
                return res.status(403).json({
                    success: false,
                    message: "403-CHECK-PERMISSION-FAILED", // Change this string!
                    requiredPermission,
                    roleIds
                });
            }

            // ... rest of error code
            if (!permissions.includes(requiredPermission)) {
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
