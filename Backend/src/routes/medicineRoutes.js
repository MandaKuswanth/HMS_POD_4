const express = require("express");
const router = express.Router();
const medicineController = require("../controllers/medicineController");
const verifyJWT = require("../middleware/authMiddleware");
const allowPermission = require("../middleware/checkPermission");

router.post(
    "/",
    verifyJWT,
    allowPermission("INVENTORY_CREATE"), // or MEDICINE_CREATE/INVENTORY_CREATE
    medicineController.createMedicine
);

router.get(
    "/",
    verifyJWT,
    allowPermission("INVENTORY_READ"),
    medicineController.getMedicines
);

router.get(
    "/search",
    verifyJWT,
    medicineController.getMedicinesSearch
);

router.get(
    "/:id",
    verifyJWT,
    allowPermission("INVENTORY_READ"),
    medicineController.getMedicineById
);

router.put(
    "/:id",
    verifyJWT,
    allowPermission("INVENTORY_UPDATE"),
    medicineController.updateMedicine
);

router.delete(
    "/:id",
    verifyJWT,
    allowPermission("INVENTORY_DELETE"),
    medicineController.deleteMedicine
);

module.exports = router;
