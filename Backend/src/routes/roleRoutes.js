const express = require("express");
const router = express.Router();

const roleController = require("../controllers/roleController");
const auth = require("../middleware/authMiddleware");
const allowPermission = require("../middleware/checkPermission");
const { PERMISSIONS } = require("../constants/permission");

// CREATE ROLE
router.post(
    "/",
    auth,
    allowPermission(PERMISSIONS.ROLE_CREATE),
    roleController.createRole
);

// GET ALL ROLES
router.get(
    "/",
    auth,
    allowPermission(PERMISSIONS.ROLE_VIEW),
    roleController.getRoles
);

// GET ROLE BY ID
router.get(
    "/:roleId",
    auth,
    allowPermission(PERMISSIONS.ROLE_VIEW),
    roleController.getRoleById
);

// UPDATE ROLE
router.put(
    "/:roleId",
    auth,
    allowPermission(PERMISSIONS.ROLE_UPDATE),
    roleController.updateRole
);

// DELETE ROLE
router.delete(
    "/:roleId",
    auth,
    allowPermission(PERMISSIONS.ROLE_DELETE),
    roleController.deleteRole
);

module.exports = router;