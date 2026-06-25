const express = require("express");
const router = express.Router();
const auditLogController = require("../controllers/auditLogController");
const verifyJWT = require("../middleware/authMiddleware");
const allowPermission = require("../middleware/checkPermission");

router.get(
    "/",
    verifyJWT,
    allowPermission("AUDIT_READ"),
    auditLogController.getAuditLogs
);

module.exports = router;
