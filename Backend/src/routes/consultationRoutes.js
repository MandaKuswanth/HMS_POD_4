const express = require("express");
const router = express.Router();
const consultationController = require("../controllers/consultationController");
const verifyJWT = require("../middleware/authMiddleware");
const allowPermission = require("../middleware/checkPermission");

router.post(
    "/",
    verifyJWT,
    allowPermission("HEALTH_RECORD_CREATE"), // typically doctor permission
    consultationController.createConsultation
);

router.get(
    "/",
    verifyJWT,
    allowPermission("HEALTH_RECORD_READ"),
    consultationController.getConsultations
);

router.get(
    "/search",
    verifyJWT,
    consultationController.getConsultationsSearch
);

router.get(
    "/:id",
    verifyJWT,
    allowPermission("HEALTH_RECORD_READ"),
    consultationController.getConsultationById
);

router.put(
    "/:id",
    verifyJWT,
    allowPermission("HEALTH_RECORD_UPDATE"),
    consultationController.updateConsultation
);

router.delete(
    "/:id",
    verifyJWT,
    allowPermission("HEALTH_RECORD_DELETE"),
    consultationController.deleteConsultation
);

module.exports = router;
