const Employee = require("../models/Employee");
const User = require("../models/User");

const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");

const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const sendEmail = require("../utils/sendEmail");

const jwt = require("jsonwebtoken");


exports.adminAddEmployee = async (req, res) => {
    try {
        const {
            name,
            phone,
            email,
            role,
            department,
            designation,
            medicalRegistrationNo,
            specialization,
            qualification,
            consultationFee,
            availabilitySlots
        } = req.body;

        if (!name || !phone || !email || !role || !department || !designation) {
            return res.status(400).json(
                new ApiError(400, "Required fields are missing")
            );
        }

        const existingEmp = await Employee.findOne({
            $or: [{ email }, { phone }]
        });

        if (existingEmp) {
            return res.status(409).json(
                new ApiResponse(409, null, "Employee already exists")
            );
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json(
                new ApiResponse(409, null, "User already exists")
            );
        }

        const tempPassword = crypto.randomBytes(8).toString("hex");
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const employee = await Employee.create({
            name,
            phone,
            email,
            department,
            designation,
            medicalRegistrationNo,
            specialization,
            qualification,
            consultationFee,
            availabilitySlots,
            status: true
        });

        const user = await User.create({
            email,
            passwordHash: hashedPassword,
            employeeId: employee.employeeCode,
            roles: role,
            status: true,
            mustResetPassword: true
        });

        await sendEmail({
            to: email,
            subject: "HMS Employee Account Created",
            html: `
        <h2>Welcome to HMS</h2>

        <p>Your employee account has been created by admin.</p>

        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> ${tempPassword}</p>

        <p>Please login and reset your password immediately.</p>

        <p>
          <a href="http://localhost:4200/login" target="_blank">
            Login to HMS Portal
          </a>
        </p>
      `
        });

        return res.status(201).json(
            new ApiResponse(
                201,
                {
                    employee,
                    user: {
                        _id: user._id,
                        email: user.email,
                        employeeId: user.employeeId,
                        role: user.roles,
                        status: user.status,
                        mustResetPassword: user.mustResetPassword
                    }
                },
                "Employee created successfully"
            )
        );

    } catch (err) {
        console.error(err);
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};


exports.selfRegister = async (req, res) => {
    try {
        const {
            name,
            phone,
            email,
            role,
            department,
            designation,
            medicalRegistrationNo,
            specialization,
            qualification,
            consultationFee,
            availabilitySlots,
            password,
            confirmPassword
        } = req.body;

        if (!name || !phone || !email || !role || !department || !designation || !password || !confirmPassword) {
            return res.status(400).json(
                new ApiError(400, "Required fields are missing")
            );
        }

        const blockedRoles = ["OWNER", "ADMIN"];

        if (blockedRoles.includes(role)) {
            return res.status(403).json(
                new ApiError(403, "You cannot register as OWNER or ADMIN")
            );
        }

        if (password !== confirmPassword) {
            return res.status(400).json(
                new ApiError(400, "Password and confirm password do not match")
            );
        }

        const existingEmp = await Employee.findOne({
            $or: [{ email }, { phone }]
        });

        if (existingEmp) {
            return res.status(409).json(
                new ApiResponse(409, null, "Employee already exists")
            );
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json(
                new ApiResponse(409, null, "User already exists")
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const employee = await Employee.create({
            name,
            phone,
            email,
            department,
            designation,
            medicalRegistrationNo,
            specialization,
            qualification,
            consultationFee,
            availabilitySlots,
            status: false
        });

        const user = await User.create({
            email,
            passwordHash: hashedPassword,
            employeeId: employee.employeeCode,
            roles: role,
            status: false,
            mustResetPassword: false
        });

        await sendEmail({
            to: email,
            subject: "HMS Registration Submitted",
            html: `
        <h2>Registration Submitted</h2>

        <p>Hello ${name},</p>

        <p>Your HMS employee registration has been submitted successfully.</p>

        <p>Your account is currently <strong>pending admin approval</strong>.</p>

        <p>You will be able to login once admin approves your account.</p>
      `
        });

        await sendEmail({
            to: process.env.BREVO_SENDER_EMAIL,
            subject: "New Employee Registration - Approval Required",
            html: `
        <h2>New Employee Registration</h2>

        <p>A new employee has registered and is waiting for approval.</p>

        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Role:</strong> ${role}</p>
        <p><strong>Department:</strong> ${department}</p>
        <p><strong>Designation:</strong> ${designation}</p>

        <p>
          <a href="http://localhost:4200/pending-employees" target="_blank">
            Review Pending Employees
          </a>
        </p>
      `
        });

        return res.status(201).json(
            new ApiResponse(
                201,
                {
                    employee,
                    user: {
                        _id: user._id,
                        email: user.email,
                        employeeId: user.employeeId,
                        role: user.roles,
                        status: user.status
                    }
                },
                "Registration submitted successfully. Please wait for admin approval."
            )
        );

    } catch (err) {
        console.error(err);
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};

exports.login = async (req, res) => {
    try {
        console.log("LOGIN BODY:", req.body);

        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json(
                new ApiError(400, "Email and password are required")
            );
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json(
                new ApiError(404, `No user found with email: ${email}`)
            );
        }

        

        const passCheck = await user.isPasswordCorrect(password);

        if (!passCheck) {
            return res.status(401).json(
                new ApiError(401, "Invalid email or password")
            );
        }

        if (!user.status) {
            return res.status(403).json(
                new ApiError(403, "Your account is pending admin approval")
            );
        }

        const accessToken = user.generateAccessToken();

        const userDecoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        

        if (user.mustResetPassword) {
            return res.status(200).json(
                new ApiResponse(
                    200,
                    {
                        resetRequired: true,
                        token: accessToken,
                        user: {
                            _id: user._id,
                            employeeId: user.employeeId,
                            name: employee?.name || "",
                            email: userDecoded.email,
                            role: userDecoded.role,
                            status: user.status,
                            mustResetPassword: user.mustResetPassword
                        }
                    },
                    "Password reset required"
                )
            );
        }

        user.lastLogin = new Date();
        await user.save();

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    resetRequired: false,
                    token: accessToken,
                    user: {
                        // _id: user._id,
                        employeeId: user.employeeId,
                        // name: employee?.name || "",
                        email: userDecoded.email,
                        role: userDecoded.role,

                        status: user.status,
                        mustResetPassword: user.mustResetPassword
                    }
                },
                "User is successfully logged-in."
            )
        );

    } catch (err) {
        console.error(err);
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { id } = req.user;
        const { newPassword, confirmPassword } = req.body;

        if (!newPassword || !confirmPassword) {
            return res.status(400).json(
                new ApiError(400, "New password and confirm password are required")
            );
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json(
                new ApiError(400, "Passwords do not match")
            );
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json(
                new ApiError(404, "User not found")
            );
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.passwordHash = hashedPassword;
        user.mustResetPassword = false;

        await user.save();

        return res.status(200).json(
            new ApiResponse(200, null, "Password updated successfully")
        );

    } catch (err) {
        console.error(err);
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};


exports.getProfile = async (req, res) => {
    try {
        const { id } = req.user;

        const user = await User.findById(id).select("-passwordHash");

        if (!user) {
            return res.status(404).json(
                new ApiError(404, "User not found")
            );
        }

        const employee = await Employee.findOne({ email: user.email });

        if (!employee) {
            return res.status(404).json(
                new ApiError(404, "Employee profile not found")
            );
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    employee,
                    user
                },
                "Profile retrieved successfully"
            )
        );

    } catch (err) {
        console.error(err);
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};


exports.getEmployees = async (req, res) => {
    try {
        const employees = await Employee.find().sort({ createdAt: -1 });
        const users = await User.find().select("-passwordHash");

        const employeesWithUser = employees.map((employee) => {
            const empObj = employee.toObject();

            const matchingUser = users.find(
                (user) =>
                    user.email?.toLowerCase() === empObj.email?.toLowerCase()
            );

            return {
                ...empObj,
                userId: matchingUser?._id || null,
                role: matchingUser?.roles || "N/A",
                userStatus: matchingUser?.status ?? false,
                mustResetPassword: matchingUser?.mustResetPassword ?? false
            };
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                employeesWithUser,
                "Employees fetched successfully"
            )
        );

    } catch (err) {
        console.error(err);
        return res.status(500).json(
            new ApiError(500, err.message || "Failed to fetch employees")
        );
    }
};


exports.updateEmployee = async (req, res) => {
    try {
        const { employeeCode } = req.params;

        const employee = await Employee.findOne({ employeeCode });

        if (!employee) {
            return res.status(404).json(
                new ApiError(404, "Employee not found")
            );
        }

        const oldEmail = employee.email;

        const allowedFields = [
            "name",
            "phone",
            "email",
            "department",
            "designation",
            "joiningDate",
            "medicalRegistrationNo",
            "specialization",
            "qualification",
            "consultationFee",
            "availabilitySlots",
            "status"
        ];

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                employee[field] = req.body[field];
            }
        });

        await employee.save();

        const user = await User.findOne({ email: oldEmail });

        if (user) {
            if (req.body.email !== undefined) user.email = req.body.email;
            if (req.body.role !== undefined) user.roles = req.body.role;
            if (req.body.status !== undefined) user.status = req.body.status;

            await user.save();
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    employee,
                    user
                },
                "Employee updated successfully"
            )
        );

    } catch (err) {
        console.error(err);
        return res.status(500).json(
            new ApiError(500, err.message || "Failed to update employee")
        );
    }
};


exports.deleteEmployee = async (req, res) => {
    try {
        const { employeeCode } = req.params;

        const employee = await Employee.findOne({ employeeCode });

        if (!employee) {
            return res.status(404).json(
                new ApiError(404, "Employee not found")
            );
        }

        await Employee.deleteOne({ employeeCode });
        await User.deleteOne({ employeeId: employee.employeeCode });

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    employeeCode: employee.employeeCode,
                    name: employee.name,
                    email: employee.email
                },
                "Employee deleted successfully"
            )
        );

    } catch (err) {
        console.error(err);
        return res.status(500).json(
            new ApiError(500, err.message || "Failed to delete employee")
        );
    }
};


exports.getPendingEmployees = async (req, res) => {
    try {
        const pendingUsers = await User.find({ status: false })
            .select("-passwordHash")
            .sort({ createdAt: -1 });


        const employees = await Employee.find({
            email: { $in: pendingUsers.map((user) => user.email) }
        });

        const pendingEmployees = pendingUsers.map((user) => {
            const employee = employees.find(
                (emp) => emp.email.toLowerCase() === user.email.toLowerCase()
            );

            return {
                user: req.user,
                employee
            };
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                pendingEmployees,
                "Pending employees fetched successfully"
            )
        );

    } catch (err) {
        console.error(err);
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};


exports.approveEmployee = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json(
                new ApiError(404, "User not found")
            );
        }

        const employee = await Employee.findOne({ email: user.email });

        if (!employee) {
            return res.status(404).json(
                new ApiError(404, "Employee not found")
            );
        }

        user.status = true;
        employee.status = true;

        await user.save();
        await employee.save();

        await sendEmail({
            to: user.email,
            subject: "HMS Account Approved",
            html: `
        <h2>Account Approved</h2>

        <p>Hello ${employee.name},</p>

        <p>Your HMS account has been approved by admin.</p>

        <p>You can now login to the HMS portal.</p>

        <p>
          <a href="http://localhost:4200/login" target="_blank">
            Login to HMS Portal
          </a>
        </p>
      `
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    user,
                    employee
                },
                "Employee approved successfully"
            )
        );

    } catch (err) {
        console.error(err);
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};


exports.rejectEmployee = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json(
                new ApiError(404, "User not found")
            );
        }

        const employee = await Employee.findOne({ email: user.email });

        await sendEmail({
            to: user.email,
            subject: "HMS Registration Rejected",
            html: `
        <h2>Registration Rejected</h2>

        <p>Hello ${employee?.name || "Employee"},</p>

        <p>Your HMS employee registration request has been rejected by admin.</p>

        <p>Please contact hospital administration for more information.</p>
      `
        });

        if (employee) {
            await Employee.deleteOne({ email: user.email });
        }

        await User.deleteOne({ _id: userId });

        return res.status(200).json(
            new ApiResponse(
                200,
                null,
                "Employee registration rejected successfully"
            )
        );

    } catch (err) {
        console.error(err);
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};


exports.toggleEmployeeStatus = async (req, res) => {
    try {
        const { employeeCode } = req.params;

        const employee = await Employee.findOne({ employeeCode });

        if (!employee) {
            return res.status(404).json(
                new ApiError(404, "Employee not found")
            );
        }

        const user = await User.findOne({ employeeId: employee.employeeCode });

        if (!user) {
            return res.status(404).json(
                new ApiError(404, "User account not found")
            );
        }

        const newStatus = !user.status;

        user.status = newStatus;
        employee.status = newStatus;

        await user.save();
        await employee.save();

        await sendEmail({
            to: user.email,
            subject: "HMS Account Status Updated",
            html: `
        <h2>HMS Account Status Updated</h2>

        <p>Hello ${employee.name},</p>

        <p>Your account status has been updated.</p>

        <p>
          <strong>Status:</strong> ${newStatus ? "ACTIVE" : "INACTIVE"}
        </p>

        ${newStatus
                    ? `
              <p>You can now login to HMS.</p>
              <p>
                <a href="http://localhost:4200/login" target="_blank">
                  Login to HMS Portal
                </a>
              </p>
            `
                    : `
              <p>Your account has been deactivated. Please contact admin.</p>
            `
                }
      `
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    employeeCode: employee.employeeCode,
                    status: newStatus
                },
                `Employee account ${newStatus ? "activated" : "deactivated"} successfully`
            )
        );

    } catch (err) {
        console.error(err);
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};