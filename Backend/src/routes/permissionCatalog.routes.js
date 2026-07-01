const express = require('express');
const router = express.Router();
const { getCatalog, createPermission, deletePermission } = require('../controllers/permissionCatalog.controller');
const validateToken = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/checkPermission'); // default export, no braces, correct name

router.get('/catalog', validateToken, getCatalog);
router.post('/catalog', validateToken, checkPermission('ROLE_CREATE'), createPermission);
router.delete('/catalog/:key', validateToken, checkPermission('ROLE_UPDATE'), deletePermission);

module.exports = router;