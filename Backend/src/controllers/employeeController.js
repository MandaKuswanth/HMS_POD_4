const Employee = require("../models/Employee");
const User = require("../models/User");
const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");
const Role = require("../models/Role");
const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");

const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const sendEmail = require("../utils/sendEmail");

const jwt = require("jsonwebtoken");
const { getPagination, buildPaginationResponse } = require("../utils/pagination");

const cancelDoctorAppointments = async (doctorEmployeeId, reason) => {
    const appointments = await Appointment.find({
        doctorEmployeeId,
        status: { $nin: ["CANCELLED", "COMPLETED"] }
    });

    let cancelledCount = 0;

    for (const appointment of appointments) {
        appointment.status = "CANCELLED";
        appointment.cancellationReason = reason;

        await appointment.save();

        const patient = await Patient.findOne({
            UHID: appointment.patientId
        });

        if (patient?.email) {
            await sendEmail({
                to: patient.email,
                subject: "HMS Appointment Cancelled",
                html: `
                    <h2>Appointment Cancelled</h2>

                    <p>Hello ${patient.name},</p>

                    <p>Your appointment has been cancelled because the assigned doctor is currently unavailable.</p>

                    <p><strong>Appointment ID:</strong> ${appointment.appointmentId}</p>
                    <p><strong>Date:</strong> ${appointment.date?.toDateString()}</p>
                    <p><strong>Time Slot:</strong> ${appointment.timeSlot}</p>
                    <p><strong>Reason:</strong> ${reason}</p>

                    <p>Please contact hospital reception to book another appointment.</p>

                    <p>Thank you,<br/>HMS Team</p>
                `
            });
        }

        cancelledCount++;
    }

    return cancelledCount;
};



exports.adminAddEmployee = async (req, res) => {
    try {
        const {
            name,
            phone,
            email,
            roles,
            department,
            designation,
            medicalRegistrationNo,
            specialization,
            qualification,
            consultationFee,
            availabilitySlots
        } = req.body;

        if (
            !name ||
            !phone ||
            !email ||
            !roles ||
            !Array.isArray(roles) ||
            roles.length === 0 ||
            !department ||
            !designation
        ) {
            return res.status(400).json(
                new ApiError(400, "Required fields are missing")
            );
        }

        const existingEmp = await Employee.findOne({
            $or: [{ email }, { phone }]
        });

        if (existingEmp) {
            return res.status(409).json(
                new ApiResponse(
                    409,
                    null,
                    "Employee already exists"
                )
            );
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json(
                new ApiResponse(
                    409,
                    null,
                    "User already exists"
                )
            );
        }

        const roleDocs = await Role.find({
            name: {
                $in: roles.map(role =>
                    role.trim().toUpperCase()
                )
            },
            status: true
        });

        if (roleDocs.length !== roles.length) {
            return res.status(404).json(
                new ApiError(
                    404,
                    "One or more roles not found"
                )
            );
        }

        const tempPassword = crypto
            .randomBytes(8)
            .toString("hex");

        console.log(
            `Temporary Password for ${email}: ${tempPassword}`
        );

        const hashedPassword = await bcrypt.hash(
            tempPassword,
            10
        );

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

        console.log("Generated Employee Code:", employee.employeeCode);

        const user = await User.create({
            email,
            passwordHash: hashedPassword,
            employeeId: employee.employeeCode,
            roleIds: roleDocs.map(
                role => role.roleId
            ),
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
                        roleIds: user.roleIds,
                        roles: roleDocs.map(role => ({
                            roleId: role.roleId,
                            name: role.name
                        })),
                        status: user.status,
                        mustResetPassword:
                            user.mustResetPassword
                    }
                },
                "Employee created successfully"
            )
        );

    } catch (err) {
        console.error(err);

        return res.status(500).json(
            new ApiError(
                500,
                err.message || "Internal Server Error"
            )
        );
    }
};

exports.selfRegister = async (req, res) => {
    try {
        const {
            name,
            phone,
            email,
            roles,
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

        if (
            !name ||
            !phone ||
            !email ||
            !roles ||
            !Array.isArray(roles) ||
            roles.length === 0 ||
            !department ||
            !designation ||
            !password ||
            !confirmPassword
        ) {
            return res.status(400).json(
                new ApiError(400, "Required fields are missing")
            );
        }

        const roleDocs = await Role.find({
            name: {
                $in: roles.map(role =>
                    role.trim().toUpperCase()
                )
            },
            status: true
        });

        if (roleDocs.length !== roles.length) {
            return res.status(404).json(
                new ApiError(
                    404,
                    "One or more roles not found"
                )
            );
        }

        const blockedRoles = [
            "OWNER",
            "SUPER_ADMIN",
            "ADMIN"
        ];

        const hasBlockedRole = roleDocs.some(role =>
            blockedRoles.includes(role.name)
        );

        if (hasBlockedRole) {
            return res.status(403).json(
                new ApiError(
                    403,
                    "You cannot register as OWNER, SUPER_ADMIN or ADMIN"
                )
            );
        }

        if (password !== confirmPassword) {
            return res.status(400).json(
                new ApiError(
                    400,
                    "Password and confirm password do not match"
                )
            );
        }

        const existingEmp = await Employee.findOne({
            $or: [{ email }, { phone }]
        });

        if (existingEmp) {
            return res.status(409).json(
                new ApiResponse(
                    409,
                    null,
                    "Employee already exists"
                )
            );
        }

        const existingUser = await User.findOne({
            email
        });

        if (existingUser) {
            return res.status(409).json(
                new ApiResponse(
                    409,
                    null,
                    "User already exists"
                )
            );
        }

        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

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
            roleIds: roleDocs.map(
                role => role.roleId
            ),
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
                <p><strong>Roles:</strong> ${roles.join(", ")}</p>
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
                        roleIds: user.roleIds,
                        roles: roleDocs.map(role => ({
                            roleId: role.roleId,
                            name: role.name
                        })),
                        status: user.status,
                        mustResetPassword:
                            user.mustResetPassword
                    }
                },
                "Registration submitted successfully. Please wait for admin approval."
            )
        );

    } catch (err) {
        console.error(err);

        return res.status(500).json(
            new ApiError(
                500,
                err.message || "Internal Server Error"
            )
        );
    }
};


exports.login = async (req, res) => {
    try {
        console.log("LOGIN BODY:", req.body);

        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json(
                new ApiError(
                    400,
                    "Email and password are required"
                )
            );
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (!user) {
            return res.status(404).json(
                new ApiError(
                    404,
                    `No user found with email: ${email}`
                )
            );
        }

        if (!user.isEmployee) {
            return res.status(409).json(
                new ApiError(
                    409,
                    "Patient accounts cannot login through the employee portal"
                )
            );
        }

        const employee = await Employee.findOne({
            employeeCode: user.employeeId
        });

        const passCheck = await user.isPasswordCorrect(password);

        if (!passCheck) {
            return res.status(401).json(
                new ApiError(
                    401,
                    "Invalid email or password"
                )
            );
        }

        if (!user.status) {
            return res.status(403).json(
                new ApiError(
                    403,
                    "Your account is pending admin approval"
                )
            );
        }

        const roles = await Role.find({
            roleId: { $in: user.roleIds },
            status: true
        }).select("roleId name permissions");

        const permissions = [
            ...new Set(
                roles.flatMap(
                    (role) => role.permissions || []
                )
            )
        ];

        const accessToken = user.generateAccessToken();

        const userData = {
            id: user._id,
            employeeId: user.employeeId,
            name: employee?.name || "",
            email: user.email,

            roleIds: user.roleIds,

            roles: roles.map((role) => ({
                roleId: role.roleId,
                name: role.name
            })),

            permissions,

            status: user.status,
            mustResetPassword: user.mustResetPassword
        };

        if (user.mustResetPassword) {
            return res.status(200).json(
                new ApiResponse(
                    200,
                    {
                        resetRequired: true,
                        token: accessToken,
                        user: userData
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
                    user: userData
                },
                "User is successfully logged-in."
            )
        );

    } catch (err) {
        console.error(err);

        return res.status(500).json(
            new ApiError(
                500,
                err.message || "Internal Server Error"
            )
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

        const isSamePassword = await user.isPasswordCorrect(newPassword);

        if (isSamePassword) {
            return res.status(400).json(
                new ApiError(
                    400,
                    "New password cannot be the same as current password"
                )
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

        const employee = await Employee.findOne({
            email: user.email
        });

        if (!employee) {
            return res.status(404).json(
                new ApiError(
                    404,
                    "Employee profile not found"
                )
            );
        }

        const roles = await Role.find({
            roleId: { $in: user.roleIds }
        }).select("roleId name");

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    employee,
                    user: {
                        ...user.toObject(),
                        roles
                    }
                },
                "Profile retrieved successfully"
            )
        );

    } catch (err) {
        console.error(err);

        return res.status(500).json(
            new ApiError(
                500,
                err.message || "Internal Server Error"
            )
        );
    }
};


exports.getEmployees = async (req, res) => {
    try {
        const { page, limit, skip, sort } = getPagination(req.query);
        const { search, status, role } = req.query;

        let query = {};
        
        // Handle search
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } },
                { employeeCode: { $regex: search, $options: "i" } },
                { designation: { $regex: search, $options: "i" } },
                { department: { $regex: search, $options: "i" } }
            ];
        }

        // Handle employee status filter
        if (status !== undefined && status !== "" && status !== "ALL") {
            query.status = status === "true" || status === "ACTIVE" || status === true;
        }

        // Handle role filter
        if (role && role !== "ALL") {
            const roleDoc = await Role.findOne({ name: role, status: true });
            if (roleDoc) {
                const usersWithRole = await User.find({ roleIds: roleDoc.roleId }).select("employeeId");
                const employeeCodes = usersWithRole.map(u => u.employeeId).filter(Boolean);
                query.employeeCode = { $in: employeeCodes };
            } else {
                query.employeeCode = { $in: [] };
            }
        }

        const [employees, totalRecords] = await Promise.all([
            Employee.find(query).sort(sort).skip(skip).limit(limit),
            Employee.countDocuments(query)
        ]);

        const employeeEmails = employees.map(e => e.email?.toLowerCase());
        const users = await User.find({ email: { $in: employeeEmails } }).select("-passwordHash");
        const roles = await Role.find().select("roleId name");

        const roleMap = new Map(
            roles.map(r => [r.roleId, r.name])
        );

        const employeesWithUser = employees.map(
            (employee) => {
                const empObj = employee.toObject();
                const matchingUser = users.find(
                    (user) => user.email?.toLowerCase() === empObj.email?.toLowerCase()
                );

                const roleNames = matchingUser?.roleIds?.map(roleId => roleMap.get(roleId)) || [];

                return {
                    ...empObj,
                    userId: matchingUser?._id || null,
                    roleIds: matchingUser?.roleIds || [],
                    roles: roleNames,
                    userStatus: matchingUser?.status ?? false,
                    mustResetPassword: matchingUser?.mustResetPassword ?? false
                };
            }
        );

        const pagination = buildPaginationResponse({ page, limit, totalRecords });
        return res.status(200).json(
            new ApiResponse(
                200,
                employeesWithUser,
                "Employees fetched successfully",
                pagination
            )
        );

    } catch (err) {
        console.error(err);
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};


exports.updateEmployee = async (req, res) => {
    try {
        const { employeeCode } = req.params;

        const employee = await Employee.findOne({
            employeeCode
        });

        if (!employee) {
            return res.status(404).json(
                new ApiError(
                    404,
                    "Employee not found"
                )
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
            if (
                req.body[field] !== undefined
            ) {
                employee[field] =
                    req.body[field];
            }
        });

        await employee.save();

        const user = await User.findOne({
            email: oldEmail
        });

        if (user) {

            if (
                req.body.email !== undefined
            ) {
                user.email =
                    req.body.email;
            }

            if (
                req.body.status !== undefined
            ) {
                user.status =
                    req.body.status;
            }

            if (
                req.body.role !== undefined
            ) {

                const roleData =
                    await Role.findOne({
                        name:
                            req.body.role
                                .trim()
                                .toUpperCase(),
                        status: true
                    });

                if (!roleData) {
                    return res.status(404).json(
                        new ApiError(
                            404,
                            "Role not found"
                        )
                    );
                }

                user.roleIds = [
                    roleData.roleId
                ];
            }

            await user.save();
        }

        const updatedRoles =
            user?.roleIds?.length
                ? await Role.find({
                    roleId: {
                        $in:
                            user.roleIds
                    }
                }).select(
                    "roleId name"
                )
                : [];

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    employee,
                    user: user
                        ? {
                            ...user.toObject(),
                            roles:
                                updatedRoles
                        }
                        : null
                },
                "Employee updated successfully"
            )
        );

    } catch (err) {

        console.error(err);

        return res.status(500).json(
            new ApiError(
                500,
                err.message ||
                "Failed to update employee"
            )
        );
    }
};


exports.deleteEmployee = async (req, res) => {
    try {
        const { employeeCode } = req.params;

        const employee = await Employee.findOne({
            employeeCode
        });

        if (!employee) {
            return res.status(404).json(
                new ApiError(
                    404,
                    "Employee not found"
                )
            );
        }

        const user = await User.findOne({
            employeeId: employee.employeeCode
        });

        let cancelledAppointments = 0;

        if (user) {

            const doctorRole =
                await Role.findOne({
                    name: "DOCTOR",
                    status: true
                });

            const isDoctor =
                doctorRole &&
                user.roleIds?.includes(
                    doctorRole.roleId
                );

            if (isDoctor) {
                cancelledAppointments =
                    await cancelDoctorAppointments(
                        employee.employeeCode,
                        "Doctor has been removed from the hospital system"
                    );
            }
        }

        await Employee.deleteOne({
            employeeCode
        });

        await User.deleteOne({
            employeeId:
                employee.employeeCode
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    employeeCode:
                        employee.employeeCode,
                    name: employee.name,
                    email: employee.email,
                    cancelledAppointments
                },
                `Employee deleted successfully. ${cancelledAppointments} related appointment(s) cancelled.`
            )
        );

    } catch (err) {

        console.error(err);

        return res.status(500).json(
            new ApiError(
                500,
                err.message ||
                "Failed to delete employee"
            )
        );
    }
};


exports.getPendingEmployees = async (req, res) => {
    try {
        const { page, limit, skip, sort } = getPagination(req.query);

        const totalRecords = await User.countDocuments({ status: false });

        const pendingUsers = await User.find({ status: false })
            .select("-passwordHash")
            .sort(sort)
            .skip(skip)
            .limit(limit);

        const employees = await Employee.find({
            email: {
                $in: pendingUsers.map(user => user.email)
            }
        });

        const roles = await Role.find().select("roleId name");
        const roleMap = new Map(
            roles.map(role => [role.roleId, role.name])
        );

        const pendingEmployees = pendingUsers.map((user) => {
            const employee = employees.find(
                emp => emp.email?.toLowerCase() === user.email?.toLowerCase()
            );

            const roleNames = user.roleIds?.map(roleId => roleMap.get(roleId)) || [];

            return {
                user: {
                    ...user.toObject(),
                    roles: roleNames
                },
                employee
            };
        });

        const pagination = buildPaginationResponse({ page, limit, totalRecords });
        return res.status(200).json(
            new ApiResponse(
                200,
                pendingEmployees,
                "Pending employees fetched successfully",
                pagination
            )
        );

    } catch (err) {
        console.error(err);
        return res.status(500).json(
            new ApiError(
                500,
                err.message ||
                "Internal Server Error"
            )
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

        const employee = await Employee.findOne({
            employeeCode
        });

        if (!employee) {
            return res.status(404).json(
                new ApiError(
                    404,
                    "Employee not found"
                )
            );
        }

        const user = await User.findOne({
            employeeId: employee.employeeCode
        });

        if (!user) {
            return res.status(404).json(
                new ApiError(
                    404,
                    "User account not found"
                )
            );
        }

        const newStatus = !user.status;

        user.status = newStatus;
        employee.status = newStatus;

        await user.save();
        await employee.save();

        let cancelledAppointments = 0;

        if (!newStatus) {

            const doctorRole =
                await Role.findOne({
                    name: "DOCTOR",
                    status: true
                });

            const isDoctor =
                doctorRole &&
                user.roleIds?.includes(
                    doctorRole.roleId
                );

            if (isDoctor) {
                cancelledAppointments =
                    await cancelDoctorAppointments(
                        employee.employeeCode,
                        "Doctor account has been deactivated"
                    );
            }
        }

        await sendEmail({
            to: user.email,
            subject: "HMS Account Status Updated",
            html: `
                <h2>HMS Account Status Updated</h2>

                <p>Hello ${employee.name},</p>

                <p>Your account status has been updated.</p>

                <p>
                    <strong>Status:</strong>
                    ${newStatus ? "ACTIVE" : "INACTIVE"}
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
                    employeeCode:
                        employee.employeeCode,
                    status: newStatus,
                    cancelledAppointments
                },
                `Employee account ${newStatus ? "activated" : "deactivated"} successfully. ${cancelledAppointments} related appointment(s) cancelled.`
            )
        );

    } catch (err) {

        console.error(err);

        return res.status(500).json(
            new ApiError(
                500,
                err.message ||
                "Internal Server Error"
            )
        );
    }
};