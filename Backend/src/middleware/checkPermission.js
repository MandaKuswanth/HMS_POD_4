const checkPermission = (requiredPermission) => {
    return (req, res, next) => {
        try {
            const user = req.user;

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized. Access token is missing or invalid."
                });
            }

            const permissions = user.permissions || [];

            if (!permissions.includes(requiredPermission)) {
                return res.status(403).json({
                    success: false,
                    message: `Access denied. Missing required permission: ${requiredPermission}`
                });
            }

            return next();
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message || "Internal Permission check failed"
            });
        }
    };
};

module.exports = checkPermission;
