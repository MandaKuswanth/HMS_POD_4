const express = require("express");
const router = express.Router();

const healthRecordController = require("../controllers/healthRecordController");

const auth = require("../middleware/authMiddleware");
const allowPermission = require("../middleware/checkPermission");

const { PERMISSIONS } = require("../constants/permission");

// CREATE HEALTH RECORD
router.post(
    "/",
    auth,
    allowPermission(PERMISSIONS.HEALTH_RECORD_CREATE),
    healthRecordController.createHealthRecord
);

// GET ALL HEALTH RECORDS
router.get(
    "/",
    auth,
    allowPermission(PERMISSIONS.HEALTH_RECORD_READ),
    healthRecordController.getHealthRecords
);
router.get(
    "/myHealthRecords",
    auth,
    healthRecordController.getMyHealthRecords
);
// GET SINGLE HEALTH RECORD
router.get(
    "/:healthRecordId",
    auth,
    allowPermission(PERMISSIONS.HEALTH_RECORD_READ),
    healthRecordController.getHealthRecordById
);

// UPDATE HEALTH RECORD
router.put(
    "/:healthRecordId",
    auth,
    allowPermission(PERMISSIONS.HEALTH_RECORD_UPDATE),
    healthRecordController.updateHealthRecord
);

// DELETE HEALTH RECORD
router.delete(
    "/:healthRecordId",
    auth,
    allowPermission(PERMISSIONS.HEALTH_RECORD_DELETE),
    healthRecordController.deleteHealthRecord
);

module.exports = router;