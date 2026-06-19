const express = require("express");
const router = express.Router();

const verifyJWT = require("../middleware/authMiddleware");
const allowPermission = require("../middleware/checkPermission");

const {
    createHealthRecord,
    getHealthRecords,
    getHealthRecordById,
    updateHealthRecord,
    deleteHealthRecord
} = require("../controllers/healthRecordController");

router.post(
    "/",
    verifyJWT,
    allowPermission("HEALTH_RECORD_CREATE"),
    createHealthRecord
);

router.get(
    "/",
    verifyJWT,
    allowPermission("HEALTH_RECORD_VIEW"),
    getHealthRecords
);

router.get(
    "/:healthRecordId",
    verifyJWT,
    allowPermission("HEALTH_RECORD_VIEW"),
    getHealthRecordById
);

router.put(
    "/:healthRecordId",
    verifyJWT,
    allowPermission("HEALTH_RECORD_UPDATE"),
    updateHealthRecord
);

router.delete(
    "/:healthRecordId",
    verifyJWT,
    allowPermission("HEALTH_RECORD_DELETE"),
    deleteHealthRecord
);

module.exports = router;