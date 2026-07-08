const express = require("express");
const router = express.Router();

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


// Public route — no auth. Must be declared before "/:roleId" so it isn't
// swallowed by the param route. Used to populate the self-registration
// role dropdown with only non-restricted, active roles.
router.get(
    "/public/self-register",
    roleController.getPublicRegistrableRoles
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