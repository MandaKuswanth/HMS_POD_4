const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const roleController = require("../controllers/roleController");
const auth = require("../middleware/authMiddleware");
const allowPermission = require("../middleware/checkPermission");
const { PERMISSIONS } = require("../constants/permission");

router.post(
    "/",
    auth,
    allowPermission(PERMISSIONS.ROLE_CREATE),
    roleController.createRole
);

router.get(
    "/",
    auth,
    allowPermission(PERMISSIONS.ROLE_READ),
    roleController.getRoles
);

const publicSearchLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many search requests from this IP, please try again later"
});

router.get(
    "/search",
    auth,
    roleController.getRolesSearch
);

router.get(
    "/public-search",
    publicSearchLimiter,
    roleController.getPublicRolesSearch
);

router.get(
    "/:roleId",
    auth,
    allowPermission(PERMISSIONS.ROLE_READ),
    roleController.getRoleById
);

router.put(
    "/:roleId",
    auth,
    allowPermission(PERMISSIONS.ROLE_UPDATE),
    roleController.updateRole
);

router.delete(
    "/:roleId",
    auth,
    allowPermission(PERMISSIONS.ROLE_DELETE),
    roleController.deleteRole
);

module.exports = router;