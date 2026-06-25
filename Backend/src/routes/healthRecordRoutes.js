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

// GET MY HEALTH RECORDS (For Patients)
router.get(
    "/myHealthRecords",
    auth,
    healthRecordController.getMyHealthRecords
);

// GET ELIGIBLE APPOINTMENTS FOR HEALTH RECORD
router.get(
    "/eligible-appointments",
    auth,
    allowPermission(PERMISSIONS.HEALTH_RECORD_CREATE),
    healthRecordController.getEligibleAppointments
);

// AUTOCOMPLETE HEALTH RECORD SEARCH
router.get(
    "/search",
    auth,
    allowPermission(PERMISSIONS.HEALTH_RECORD_READ),
    healthRecordController.getHealthRecordsSearch
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