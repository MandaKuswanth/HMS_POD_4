const express = require("express");
const router = express.Router();

const employeeController = require("../controllers/employeeController");
const verifyJWT = require("../middleware/authMiddleware");
const allowPermission = require("../middleware/checkPermission");

const { selfRegistrationValidation } = require("../middleware/employeeValidations");
const validateRequest = require("../middleware/validate");
const { PERMISSIONS } = require("../constants/permission");

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

router.post(
    "/register",
    selfRegistrationValidation,
    validateRequest,
    employeeController.selfRegister
);

router.post("/login", employeeController.login);

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
*/

router.post(
    "/reset-password",
    verifyJWT,
    employeeController.resetPassword
);

router.get(
    "/profile",
    verifyJWT,
    employeeController.getProfile
);

/*
|--------------------------------------------------------------------------
| Employee Management
|--------------------------------------------------------------------------
*/

router.post(
    "/admin/add-employee",
    verifyJWT,
    allowPermission(PERMISSIONS.EMPLOYEE_CREATE),
    employeeController.adminAddEmployee
);

router.get(
    "/employees",
    verifyJWT,
    allowPermission(PERMISSIONS.EMPLOYEE_VIEW), // Maps to "EMPLOYEE_READ"
    employeeController.getEmployees
);

router.put(
    "/employees/:employeeCode",
    verifyJWT,
    allowPermission(PERMISSIONS.EMPLOYEE_UPDATE),
    employeeController.updateEmployee
);

router.delete(
    "/employees/:employeeCode",
    verifyJWT,
    allowPermission(PERMISSIONS.EMPLOYEE_DELETE),
    employeeController.deleteEmployee
);

router.put(
    "/employees/:employeeCode/toggle-status",
    verifyJWT,
    allowPermission(PERMISSIONS.EMPLOYEE_UPDATE),
    employeeController.toggleEmployeeStatus
);

/*
|--------------------------------------------------------------------------
| Employee Approval Workflow
|--------------------------------------------------------------------------
*/

router.get(
    "/pending-employees",
    verifyJWT,
    allowPermission(PERMISSIONS.EMPLOYEE_VIEW),
    employeeController.getPendingEmployees
);

// Updated to use granular permissions
router.put(
    "/approve-employee/:userId",
    verifyJWT,
    allowPermission(PERMISSIONS.EMPLOYEE_APPROVE), // Now uses specific approval permission
    employeeController.approveEmployee
);

// Updated to use granular permissions
router.delete(
    "/reject-employee/:userId",
    verifyJWT,
    allowPermission(PERMISSIONS.EMPLOYEE_REJECT), // Now uses specific reject permission
    employeeController.rejectEmployee
);

module.exports = router;