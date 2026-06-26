const express = require("express");
const router = express.Router();

const employeeController = require("../controllers/employeeController");
const verifyToken = require("../middleware/authMiddleware");
const allowPermission = require("../middleware/checkPermission");
const validateRequest = require("../middleware/validateRequest");

const {
    createEmployeeValidation,
    selfRegisterValidation,
    updateEmployeeValidation
} = require("../validators/employee");

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
    selfRegisterValidation,
    validateRequest,
    employeeController.selfRegister
);

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
*/

router.get(
    "/profile",
    verifyToken,
    employeeController.getProfile
);

/*
|--------------------------------------------------------------------------
| Employee Management
|--------------------------------------------------------------------------
*/
router.get(
    "/search",
    verifyToken,
    employeeController.getEmployeesSearch
);

router.post(
    "/admin/add-employee",
    verifyToken,
    allowPermission(PERMISSIONS.EMPLOYEE_CREATE),
    createEmployeeValidation,
    validateRequest,
    employeeController.adminAddEmployee
);

router.get(
    "/employees",
    verifyToken,
    allowPermission(PERMISSIONS.EMPLOYEE_READ),
    employeeController.getEmployees
);

router.put(
    "/employees/:employeeCode",
    verifyToken,
    allowPermission(PERMISSIONS.EMPLOYEE_UPDATE),
    updateEmployeeValidation,
    validateRequest,
    employeeController.updateEmployee
);

router.delete(
    "/employees/:employeeCode",
    verifyToken,
    allowPermission(PERMISSIONS.EMPLOYEE_DELETE),
    employeeController.deleteEmployee
);

router.put(
    "/employees/:employeeCode/toggle-status",
    verifyToken,
    allowPermission(PERMISSIONS.EMPLOYEE_UPDATE),
    employeeController.toggleEmployeeStatus
);

/*
|--------------------------------------------------------------------------
| Employee Approval Workflow
|--------------------------------------------------------------------------
*/
router.get(
    "/pending-approvals",
    verifyToken,
    allowPermission(PERMISSIONS.EMPLOYEE_READ),
    employeeController.getPendingEmployees
);

router.put(
    "/employees/:employeeCode/approve",
    verifyToken,
    allowPermission(PERMISSIONS.EMPLOYEE_UPDATE),
    employeeController.approveEmployee
);

router.put(
    "/employees/:employeeCode/reject",
    verifyToken,
    allowPermission(PERMISSIONS.EMPLOYEE_UPDATE),
    employeeController.rejectEmployee
);

/*
|--------------------------------------------------------------------------
| Doctors specific
|--------------------------------------------------------------------------
*/
router.get(
    "/doctors",
    verifyToken,
    employeeController.getDoctorsList
);

module.exports = router;