const express = require("express");
const router = express.Router();

const nodeController = require("../controllers/nodeController");
const auth = require("../middleware/authMiddleware");
const allowPermission = require("../middleware/checkPermission");
const { PERMISSIONS } = require("../constants/permission");

// 1. CREATE NODE
router.post(
    "/",
    auth,
    allowPermission(PERMISSIONS.NODE_CREATE),
    nodeController.createNode
);

// 2. GET ALL NODES
router.get(
    "/",
    auth,
    allowPermission(PERMISSIONS.NODE_READ),
    nodeController.getNodes
);

// 3. GET MY MENU (Authenticated access only, no specific permission string needed if everyone can see their menu)
router.get(
    "/my-menu",
    auth,
    nodeController.getMyMenu
);

// 4. GET NODE BY ID
router.get(
    "/:nodeId",
    auth,
    allowPermission(PERMISSIONS.NODE_READ),
    nodeController.getNodeById
);

// 5. UPDATE NODE
router.put(
    "/:nodeId",
    auth,
    allowPermission(PERMISSIONS.NODE_UPDATE),
    nodeController.updateNode
);

module.exports = router;