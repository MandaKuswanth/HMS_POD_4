const express = require("express");
const router = express.Router();
const prescriptionController = require("../controllers/prescriptionController");
const verifyJWT = require("../middleware/authMiddleware");
const allowPermission = require("../middleware/checkPermission");

router.post(
    "/",
    verifyJWT,
    allowPermission("HEALTH_RECORD_CREATE"), // doctors typically create prescriptions
    prescriptionController.createPrescription
);

router.get(
    "/",
    verifyJWT,
    allowPermission("HEALTH_RECORD_READ"),
    prescriptionController.getPrescriptions
);

router.get(
    "/search",
    verifyJWT,
    prescriptionController.getPrescriptionsSearch
);

router.get(
    "/:id",
    verifyJWT,
    allowPermission("HEALTH_RECORD_READ"),
    prescriptionController.getPrescriptionById
);

router.put(
    "/:id",
    verifyJWT,
    allowPermission("HEALTH_RECORD_UPDATE"),
    prescriptionController.updatePrescription
);

router.delete(
    "/:id",
    verifyJWT,
    allowPermission("HEALTH_RECORD_DELETE"),
    prescriptionController.deletePrescription
);

module.exports = router;
