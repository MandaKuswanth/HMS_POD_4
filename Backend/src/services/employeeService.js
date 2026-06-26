const Employee = require('../models/Employee');
const User = require('../models/User');
const Role = require('../models/Role');
const ApiError = require('../utils/ApiError');
const userService = require('./userService');
const emailService = require('./emailService');
const crypto = require('node:crypto');

class EmployeeService {
    async createEmployee(data, { isAdmin = false, tempPassword = null } = {}) {
        const {
            name, phone, email, role, department, designation,
            medicalRegistrationNo, joiningDate, specialization,
            qualification, consultationFee, availabilitySlots,
            password
        } = data;

        const existingEmp = await Employee.findOne({
            $or: [{ email: email.toLowerCase() }, { phone }],
            isDeleted: false
        });

        if (existingEmp) {
            throw new ApiError(409, "Employee already exists with this email or phone");
        }

        const roleDoc = await Role.findOne({ name: role.trim().toUpperCase(), status: true });
        if (!roleDoc) {
            throw new ApiError(404, "Role not found");
        }

        if (!isAdmin && !roleDoc.selfRegisterAllowed) {
            throw new ApiError(403, "Self-registration is not allowed for this role");
        }

        const finalPassword = isAdmin ? crypto.randomBytes(8).toString("hex") : password;
        
        const employee = await Employee.create({
            name, phone, email: email.toLowerCase(), department, designation,
            joiningDate, medicalRegistrationNo, specialization,
            qualification, consultationFee, availabilitySlots,
            status: isAdmin // Auto-approve if admin adds, else pending
        });

        const user = await userService.createUser({
            email: email.toLowerCase(),
            tempPassword: finalPassword,
            roleName: role.trim().toUpperCase(),
            isEmployee: true,
            employeeId: employee.employeeCode,
            status: isAdmin, // Auto-approve if admin adds, else pending
            mustResetPassword: isAdmin // Admin created users must reset password. Self-registered ones already chose it.
        });

        if (isAdmin) {
            await emailService.sendWelcomeEmployee(user.email, employee.name, roleDoc.name, finalPassword);
        } else {
            await emailService.sendSelfRegisterPending(user.email, employee.name);
        }

        return { employee, user };
    }
}

module.exports = new EmployeeService();
