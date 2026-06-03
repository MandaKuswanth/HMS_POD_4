const express = require("express");
const router = express.Router();

const employeeController = require("../controllers/employeeController");
const verifyJWT = require("../middleware/authMiddleware");

router.post("/register", employeeController.selfRegister);
router.post("/login", employeeController.login);

router.post("/reset-password", verifyJWT, employeeController.resetPassword);
router.get("/profile", verifyJWT, employeeController.getProfile);

router.post("/admin/add-employee", verifyJWT, employeeController.adminAddEmployee);
router.get("/employees", verifyJWT, employeeController.getEmployees);
router.put("/employees/:employeeCode", verifyJWT, employeeController.updateEmployee);
router.delete("/employees/:employeeCode", verifyJWT, employeeController.deleteEmployee);

router.get("/pending-employees", verifyJWT, employeeController.getPendingEmployees);
router.put("/approve-employee/:userId", verifyJWT, employeeController.approveEmployee);
router.delete("/reject-employee/:userId", verifyJWT, employeeController.rejectEmployee);

router.put("/employees/:employeeCode/toggle-status", verifyJWT, employeeController.toggleEmployeeStatus);

module.exports = router;