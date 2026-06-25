const Employee = require("../models/Employee");
const User = require("../models/User");
const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");
const Role = require("../models/Role");
const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const { sendEmail } = require("../utils/sendEmail");
const asyncHandler = require("../middleware/asyncHandler");
const { paginateQuery } = require("../utils/pagination");

// Internal helper: cancel doctor appointments on deactivation/deletion
const cancelDoctorAppointments = async (doctorEmployeeId, reason) => {
    const appointments = await Appointment.find({
        doctorEmployeeId,
        isDeleted: false,
        status: { $nin: ["CANCELLED", "COMPLETED"] }
    });

    let cancelledCount = 0;

    for (const appointment of appointments) {
        appointment.status = "CANCELLED";
        appointment.cancellationReason = reason;
        await appointment.save();

        const patient = await Patient.findOne({
            UHID: appointment.patientId,
            isDeleted: false
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

// ─── Admin Add Employee ──────────────────────────────────────────────────────
exports.adminAddEmployee = asyncHandler(async (req, res) => {
    const {
        name, phone, email, role, department, designation,
        medicalRegistrationNo, joiningDate, specialization,
        qualification, consultationFee, availabilitySlots
    } = req.body;

    if (!name || !phone || !email || !role || !department || !designation) {
        throw new ApiError(400, "Required fields are missing");
    }

    const existingEmp = await Employee.findOne({
        $or: [{ email }, { phone }],
        isDeleted: false
    });

    if (existingEmp) {
        throw new ApiError(409, "Employee already exists with this email or phone");
    }

    const existingUser = await User.findOne({ email, isDeleted: false });
    if (existingUser) {
        throw new ApiError(409, "User already exists with this email");
    }

    const roleDoc = await Role.findOne({ name: role.trim().toUpperCase(), status: true });
    if (!roleDoc) {
        throw new ApiError(404, "Role not found");
    }

    const tempPassword = crypto.randomBytes(8).toString("hex");
    console.log(`Temporary Password for ${email}: ${tempPassword}`);

    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const employee = await Employee.create({
        name, phone, email, department, designation,
        joiningDate, medicalRegistrationNo, specialization,
        qualification, consultationFee, availabilitySlots,
        status: true
    });

    const user = await User.create({
        email,
        passwordHash: hashedPassword,
        employeeId: employee.employeeCode,
        roleIds: [roleDoc.roleId],
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
            <p><strong>Role:</strong> ${roleDoc.name}</p>
            <p><strong>Temporary Password:</strong> ${tempPassword}</p>
            <p>Please login and reset your password immediately.</p>
            <p><a href="http://localhost:4200/login" target="_blank">Login to HMS Portal</a></p>
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
                    role: { roleId: roleDoc.roleId, name: roleDoc.name },
                    status: user.status,
                    mustResetPassword: user.mustResetPassword
                }
            },
            "Employee created successfully"
        )
    );
});

// ─── Self Registration ───────────────────────────────────────────────────────
exports.selfRegister = asyncHandler(async (req, res) => {
    const {
        name, phone, email, role, department, designation,
        medicalRegistrationNo, joiningDate, specialization,
        qualification, consultationFee, availabilitySlots,
        password, confirmPassword
    } = req.body;

    if (!name || !phone || !email || !role || !department || !designation || !password || !confirmPassword) {
        throw new ApiError(400, "Required fields are missing");
    }

    const roleDoc = await Role.findOne({ name: role.trim().toUpperCase(), status: true });
    if (!roleDoc) {
        throw new ApiError(404, "Role not found");
    }

    const blockedRoles = new Set(["OWNER", "SUPER_ADMIN", "SUPER ADMIN", "ADMIN"]);
    if (blockedRoles.has(roleDoc.name)) {
        throw new ApiError(403, "You cannot register as OWNER, SUPER_ADMIN or ADMIN");
    }

    if (password !== confirmPassword) {
        throw new ApiError(400, "Password and confirm password do not match");
    }

    if (password.length < 8) {
        throw new ApiError(400, "Password must be at least 8 characters");
    }

    const existingEmp = await Employee.findOne({
        $or: [{ email }, { phone }],
        isDeleted: false
    });

    if (existingEmp) {
        throw new ApiError(409, "Employee already exists");
    }

    const existingUser = await User.findOne({ email, isDeleted: false });
    if (existingUser) {
        throw new ApiError(409, "User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const employee = await Employee.create({
        name, phone, email, department, designation,
        joiningDate, medicalRegistrationNo, specialization,
        qualification, consultationFee, availabilitySlots,
        status: false
    });

    const user = await User.create({
        email,
        passwordHash: hashedPassword,
        employeeId: employee.employeeCode,
        roleIds: [roleDoc.roleId],
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
                    role: { roleId: roleDoc.roleId, name: roleDoc.name },
                    status: user.status,
                    mustResetPassword: user.mustResetPassword
                }
            },
            "Registration submitted successfully. Please wait for admin approval."
        )
    );
});

// ─── Login ───────────────────────────────────────────────────────────────────
exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({
        email: email.trim().toLowerCase(),
        isDeleted: false
    });

    if (!user) {
        throw new ApiError(404, `No user found with email: ${email}`);
    }

    if (!user.isEmployee) {
        throw new ApiError(409, "Patient accounts cannot login through the employee portal");
    }

    const passCheck = await user.isPasswordCorrect(password);
    if (!passCheck) {
        throw new ApiError(401, "Invalid email or password");
    }

    if (!user.status) {
        throw new ApiError(403, "Your account is pending admin approval or has been deactivated");
    }

    const employee = await Employee.findOne({
        employeeCode: user.employeeId,
        isDeleted: false
    });

    if (!employee || !employee.status) {
        throw new ApiError(403, "Your employee profile is inactive or has been removed");
    }

    const roles = await Role.find({
        roleId: { $in: user.roleIds },
        status: true
    }).select("roleId name permissions");

    const roleNames = roles.map((role) => role.name);
    const permissions = [...new Set(roles.flatMap((role) => role.permissions || []))];

    const accessToken = user.generateAccessToken(roleNames, permissions);
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const userData = {
        id: user._id,
        employeeId: user.employeeId,
        name: employee.name,
        email: user.email,
        roleIds: user.roleIds,
        roles: roles.map((role) => ({ roleId: role.roleId, name: role.name })),
        permissions,
        status: user.status,
        mustResetPassword: user.mustResetPassword
    };

    return res.status(200).json(
        new ApiResponse(
            200,
            { resetRequired: user.mustResetPassword, token: accessToken, user: userData },
            "User is successfully logged-in."
        )
    );
});

// ─── Reset Password ───────────────────────────────────────────────────────────
exports.resetPassword = asyncHandler(async (req, res) => {
    const { id } = req.user;
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
        throw new ApiError(400, "New password and confirm password are required");
    }

    if (newPassword !== confirmPassword) {
        throw new ApiError(400, "Passwords do not match");
    }

    if (newPassword.length < 8) {
        throw new ApiError(400, "Password must be at least 8 characters");
    }

    const user = await User.findById(id);
    if (!user || user.isDeleted) {
        throw new ApiError(404, "User not found");
    }

    const isSamePassword = await user.isPasswordCorrect(newPassword);
    if (isSamePassword) {
        throw new ApiError(400, "New password cannot be the same as current password");
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.mustResetPassword = false;
    await user.save();

    return res.status(200).json(
        new ApiResponse(200, null, "Password updated successfully")
    );
});

// ─── Get Profile ─────────────────────────────────────────────────────────────
exports.getProfile = asyncHandler(async (req, res) => {
    const { id } = req.user;

    const user = await User.findById(id).select("-passwordHash");
    if (!user || user.isDeleted) {
        throw new ApiError(404, "User not found");
    }

    const employee = await Employee.findOne({ email: user.email, isDeleted: false });
    if (!employee) {
        throw new ApiError(404, "Employee profile not found");
    }

    const roles = await Role.find({ roleId: { $in: user.roleIds } }).select("roleId name");

    return res.status(200).json(
        new ApiResponse(
            200,
            { employee, user: { ...user.toObject(), roles } },
            "Profile retrieved successfully"
        )
    );
});

// ─── Get All Employees (Paginated & Searchable) ──────────────────────────────
exports.getEmployees = asyncHandler(async (req, res) => {
    const filter = { isDeleted: false };
    const searchFields = ["name", "email", "phone", "employeeCode", "department", "designation"];

    const result = await paginateQuery({
        model: Employee,
        query: req.query,
        baseFilter: filter,
        searchFields,
        defaultSortField: "createdAt"
    });

    return res.status(200).json(
        new ApiResponse(200, result.data, "Employees fetched successfully", result.pagination)
    );
});

// ─── Autocomplete Employee Search ────────────────────────────────────────────
exports.getEmployeesSearch = asyncHandler(async (req, res) => {
    const q = req.query.q || "";
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);

    const filter = { isDeleted: false, status: true };
    if (q.trim()) {
        filter.$or = [
            { name: { $regex: q.trim(), $options: "i" } },
            { employeeCode: { $regex: q.trim(), $options: "i" } }
        ];
    }

    const employees = await Employee.find(filter)
        .select("_id employeeCode name email phone designation department")
        .limit(limit)
        .lean();

    return res.status(200).json(
        new ApiResponse(200, employees, "Employees autocomplete fetched successfully")
    );
});

// ─── Autocomplete Doctors Search ─────────────────────────────────────────────
exports.getDoctorsSearch = asyncHandler(async (req, res) => {
    const q = req.query.q || "";
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);

    const doctorRole = await Role.findOne({ name: "DOCTOR", status: true }).lean();
    if (!doctorRole) {
        return res.status(200).json(new ApiResponse(200, [], "DOCTOR role not found"));
    }

    const doctorUsers = await User.find({
        roleIds: doctorRole.roleId,
        isDeleted: false,
        status: true
    }).select("employeeId").lean();

    const employeeCodes = doctorUsers.map((u) => u.employeeId).filter(Boolean);

    const filter = {
        employeeCode: { $in: employeeCodes },
        isDeleted: false,
        status: true
    };

    if (q.trim()) {
        filter.name = { $regex: q.trim(), $options: "i" };
    }

    const doctors = await Employee.find(filter)
        .select("_id employeeCode name email specialization qualification consultationFee availabilitySlots")
        .limit(limit)
        .lean();

    return res.status(200).json(
        new ApiResponse(200, doctors, "Doctors autocomplete fetched successfully")
    );
});

// ─── Get Doctors List ────────────────────────────────────────────────────────
exports.getDoctorsList = asyncHandler(async (req, res) => {
    const doctorRole = await Role.findOne({ name: "DOCTOR", status: true }).lean();
    if (!doctorRole) {
        return res.status(200).json(
            new ApiResponse(200, [], "DOCTOR role not found", {
                page: 1, limit: 10, totalItems: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false
            })
        );
    }

    const doctorUsers = await User.find({
        roleIds: doctorRole.roleId,
        isDeleted: false,
        status: true
    }).select("employeeId").lean();

    const employeeCodes = doctorUsers.map((u) => u.employeeId).filter(Boolean);

    const filter = {
        employeeCode: { $in: employeeCodes },
        isDeleted: false
    };

    const searchFields = ["name", "email", "phone", "employeeCode", "department", "designation", "specialization"];

    const result = await paginateQuery({
        model: Employee,
        query: req.query,
        baseFilter: filter,
        searchFields,
        defaultSortField: "createdAt"
    });

    return res.status(200).json(
        new ApiResponse(200, result.data, "Doctors fetched successfully", result.pagination)
    );
});

// ─── Update Employee ─────────────────────────────────────────────────────────
exports.updateEmployee = asyncHandler(async (req, res) => {
    const { employeeCode } = req.params;

    const employee = await Employee.findOne({ employeeCode, isDeleted: false });
    if (!employee) {
        throw new ApiError(404, "Employee not found");
    }

    const allowedUpdates = [
        "name", "phone", "department", "designation", "joiningDate",
        "medicalRegistrationNo", "specialization", "qualification",
        "consultationFee", "availabilitySlots"
    ];

    allowedUpdates.forEach((update) => {
        if (req.body[update] !== undefined) {
            employee[update] = req.body[update];
        }
    });

    await employee.save();

    return res.status(200).json(
        new ApiResponse(200, employee, "Employee details updated successfully")
    );
});

// ─── Toggle Status ───────────────────────────────────────────────────────────
exports.toggleEmployeeStatus = asyncHandler(async (req, res) => {
    const { employeeCode } = req.params;

    const employee = await Employee.findOne({ employeeCode, isDeleted: false });
    if (!employee) {
        throw new ApiError(404, "Employee profile not found");
    }

    const user = await User.findOne({ employeeId: employeeCode, isDeleted: false });
    if (!user) {
        throw new ApiError(404, "User account not found");
    }

    employee.status = !employee.status;
    user.status = employee.status;

    await employee.save();
    await user.save();

    let cancelledAppointments = 0;
    if (!employee.status) {
        const doctorRole = await Role.findOne({ name: "DOCTOR", status: true });
        const isDoctor = doctorRole && user.roleIds?.includes(doctorRole.roleId);

        if (isDoctor) {
            cancelledAppointments = await cancelDoctorAppointments(
                employeeCode,
                "Doctor account has been deactivated"
            );
        }
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            { status: employee.status, cancelledAppointments },
            `Employee status updated to ${employee.status ? "Active" : "Inactive"}`
        )
    );
});

// ─── Delete Employee ─────────────────────────────────────────────────────────
exports.deleteEmployee = asyncHandler(async (req, res) => {
    const { employeeCode } = req.params;

    const employee = await Employee.findOne({ employeeCode, isDeleted: false });
    if (!employee) {
        throw new ApiError(404, "Employee profile not found");
    }

    const user = await User.findOne({ employeeId: employeeCode, isDeleted: false });

    employee.isDeleted = true;
    employee.status = false;
    employee.deletedAt = new Date();
    employee.deletedBy = req.user?.employeeId || req.user?.id;
    await employee.save();

    let cancelledAppointments = 0;
    if (user) {
        user.isDeleted = true;
        user.status = false;
        user.deletedAt = new Date();
        user.deletedBy = req.user?.employeeId || req.user?.id;
        await user.save();

        const doctorRole = await Role.findOne({ name: "DOCTOR", status: true });
        const isDoctor = doctorRole && user.roleIds?.includes(doctorRole.roleId);

        if (isDoctor) {
            cancelledAppointments = await cancelDoctorAppointments(
                employeeCode,
                "Doctor has been removed from the hospital system"
            );
        }
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            { cancelledAppointments },
            "Employee profile and associated user account deleted successfully"
        )
    );
});

// ─── Get Pending Employees ───────────────────────────────────────────────────
exports.getPendingEmployees = asyncHandler(async (req, res) => {
    const filter = { status: false, isDeleted: false };
    const searchFields = ["name", "email", "phone", "department", "designation"];

    const result = await paginateQuery({
        model: Employee,
        query: req.query,
        baseFilter: filter,
        searchFields,
        defaultSortField: "createdAt"
    });

    return res.status(200).json(
        new ApiResponse(200, result.data, "Pending employees fetched successfully", result.pagination)
    );
});

// ─── Approve Employee ────────────────────────────────────────────────────────
exports.approveEmployee = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findOne({ _id: userId, isDeleted: false });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const employee = await Employee.findOne({ employeeCode: user.employeeId, isDeleted: false });
    if (!employee) {
        throw new ApiError(404, "Associated employee profile not found");
    }

    user.status = true;
    employee.status = true;

    await user.save();
    await employee.save();

    await sendEmail({
        to: employee.email,
        subject: "HMS Account Approved",
        html: `
            <h2>Account Approved</h2>
            <p>Hello ${employee.name},</p>
            <p>Your HMS employee account has been approved by admin.</p>
            <p>You can now login to the HMS portal using your credentials.</p>
            <p><a href="http://localhost:4200/login" target="_blank">Login to Portal</a></p>
        `
    });

    return res.status(200).json(
        new ApiResponse(200, { user, employee }, "Employee registration approved successfully")
    );
});

// ─── Reject Employee ────────────────────────────────────────────────────────
exports.rejectEmployee = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findOne({ _id: userId, isDeleted: false });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const employee = await Employee.findOne({ employeeCode: user.employeeId, isDeleted: false });

    // Permanent deletion for rejected registrations
    await User.deleteOne({ _id: userId });
    if (employee) {
        await Employee.deleteOne({ employeeCode: user.employeeId });
    }

    if (employee) {
        await sendEmail({
            to: employee.email,
            subject: "HMS Registration Rejected",
            html: `
                <h2>Registration Rejected</h2>
                <p>Hello ${employee.name},</p>
                <p>Unfortunately, your HMS registration request has been rejected by the administrator.</p>
                <p>Please contact the HR or administration department for clarifications.</p>
            `
        });
    }

    return res.status(200).json(
        new ApiResponse(200, null, "Employee registration rejected and deleted")
    );
});