const allowPermission = (...permissions) => {
    return (req, res, next) => {

        const userPermissions =
            req.user.permissions || [];

        const allowed =
            permissions.some(permission =>
                userPermissions.includes(permission)
            );

        if (!allowed) {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        next();
    };
};

module.exports = allowPermission;