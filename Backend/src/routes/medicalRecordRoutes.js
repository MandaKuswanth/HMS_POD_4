const express = require('express');
const router = express.Router();
const medicalRecordController = require('../controllers/medicalRecordController');
const authMiddleware = require('../middleware/authMiddleware');
const allowPermission = require('../middleware/checkPermission');
const { PERMISSIONS } = require('../constants/permission');

router.post(
    '/',
    authMiddleware,
    allowPermission(PERMISSIONS.HEALTH_RECORD_CREATE),
    medicalRecordController.createMedicalRecord
);

router.get(
    '/',
    authMiddleware,
    allowPermission(PERMISSIONS.HEALTH_RECORD_READ),
    medicalRecordController.getAllMedicalRecords
);

router.get(
    '/patient/:patientId',
    authMiddleware,
    allowPermission(PERMISSIONS.HEALTH_RECORD_READ),
    medicalRecordController.getMedicalRecordsByPatient
);

router.put(
    '/:recordId',
    authMiddleware,
    allowPermission(PERMISSIONS.HEALTH_RECORD_UPDATE),
    medicalRecordController.updateMedicalRecord
);

router.delete(
    '/:recordId',
    authMiddleware,
    allowPermission(PERMISSIONS.HEALTH_RECORD_DELETE),
    medicalRecordController.deleteMedicalRecord
);

module.exports = router;
