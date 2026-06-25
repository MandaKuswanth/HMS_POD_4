const express = require("express");
const router = express.Router();

const employeeController = require("../controllers/employeeController");
const verifyJWT = require("../middleware/authMiddleware");
const allowPermission = require("../middleware/checkPermission");
const validateRequest = require("../middleware/validate");

const {
    selfRegistrationValidation
} = require("../middleware/employeeValidations");

const {
    PERMISSIONS
} = require("../constants/permission");

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

router.post(
    "/login",
    employeeController.login
);

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
router.get(
    "/search",
    verifyJWT,
    employeeController.getEmployeesSearch
);

router.post(
    "/admin/add-employee",
    verifyJWT,
    allowPermission(PERMISSIONS.EMPLOYEE_CREATE),
    employeeController.adminAddEmployee
);

router.get(
    "/employees",
    verifyJWT,
    allowPermission(PERMISSIONS.EMPLOYEE_READ),
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
    allowPermission(PERMISSIONS.EMPLOYEE_READ),
    employeeController.getPendingEmployees
);

router.put(
    "/approve-employee/:userId",
    verifyJWT,
    allowPermission(PERMISSIONS.EMPLOYEE_UPDATE),
    employeeController.approveEmployee
);

router.delete(
    "/reject-employee/:userId",
    verifyJWT,
    allowPermission(PERMISSIONS.EMPLOYEE_DELETE),
    employeeController.rejectEmployee
);

module.exports = router;