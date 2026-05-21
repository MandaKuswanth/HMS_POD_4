const express = require("express");
const router = express.Router();

const {
    selfRegister,
    adminAddEmployee,
    updateEmployee,
    deleteEmployee,
    login,
    getProfile,
    resetPassword,
    getEmployees,
    toggleEmployeeStatus
} = require("../controllers/employeeController");

const validate = require("../middleware/validate");
const auth = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const { signupValidation, loginValidation } = require("../middleware/employeeValidations");

// Public
router.post("/register", signupValidation, validate, selfRegister);
router.post("/login", loginValidation, validate, login);

// Authenticated
router.get("/me", auth, getProfile);
router.post("/reset-password", auth, resetPassword);

// Admin only
router.post("/admin/add-employee", auth, allowRoles("ADMIN"), signupValidation, validate, adminAddEmployee);
router.put("/admin/update-employee/:employeeCode", auth, allowRoles("ADMIN"), updateEmployee);
router.delete("/admin/delete-employee/:employeeCode", auth, allowRoles("ADMIN"), deleteEmployee);
router.get("/getEmployees", auth, allowRoles("ADMIN"), getEmployees);

router.patch('/employees/:employeeCode/status', auth, allowRoles("ADMIN"), validate, toggleEmployeeStatus);

module.exports = router;