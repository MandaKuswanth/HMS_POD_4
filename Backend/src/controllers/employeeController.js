const Employee = require("../models/Employee");
const User = require("../models/User");
const Role = require("../models/Role");

const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../middleware/asyncHandler");
const { paginateQuery } = require("../utils/pagination");

const employeeService = require('../services/employeeService');
const appointmentService = require('../services/appointmentService');

// ─── Admin Add Employee ──────────────────────────────────────────────────────
exports.adminAddEmployee = asyncHandler(async (req, res) => {
    const { employee, user } = await employeeService.createEmployee(req.body, { isAdmin: true });

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
    const { employee, user } = await employeeService.createEmployee(req.body, { isAdmin: false });

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
                    status: user.status,
                    mustResetPassword: user.mustResetPassword
                }
            },
            "Registration submitted successfully. Please wait for admin approval."
        )
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

    // Fetch corresponding users to get their roles
    const employeeCodes = result.data.map(emp => emp.employeeCode);
    const users = await User.find({ employeeId: { $in: employeeCodes }, isDeleted: false }).lean();
    
    // Fetch role details
    const roleIds = [...new Set(users.flatMap(user => user.roleIds || []))];
    const roles = await Role.find({ roleId: { $in: roleIds } }).lean();
    
    const roleMap = new Map(roles.map(r => [r.roleId, r.name]));
    const userMap = new Map(users.map(u => [u.employeeId, u]));

    const enrichedEmployees = result.data.map(emp => {
        const empObj = emp.toObject ? emp.toObject() : emp;
        const user = userMap.get(empObj.employeeCode);
        if (user && user.roleIds && user.roleIds.length > 0) {
            empObj.role = roleMap.get(user.roleIds[0]);
            empObj.roles = user.roleIds.map(rId => roleMap.get(rId)).filter(Boolean);
        }
        return empObj;
    });

    return res.status(200).json(
        new ApiResponse(200, enrichedEmployees, "Employees fetched successfully", result.pagination)
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

    let joiningDateChanged = false;
    let oldJoiningDate = null;
    let newJoiningDate = null;

    allowedUpdates.forEach((update) => {
        if (req.body[update] !== undefined) {
            if (update === "joiningDate") {
                const newDate = new Date(req.body.joiningDate);
                const today = new Date();
                today.setHours(23, 59, 59, 999);
                if (newDate > today) {
                    throw new ApiError(400, "Joining date cannot be in the future");
                }

                // Check if joining date changed
                const existingDateStr = employee.joiningDate ? new Date(employee.joiningDate).toISOString().split('T')[0] : null;
                const newDateStr = newDate.toISOString().split('T')[0];

                if (existingDateStr !== newDateStr) {
                    joiningDateChanged = true;
                    oldJoiningDate = existingDateStr;
                    newJoiningDate = newDateStr;
                }
            }
            employee[update] = req.body[update];
        }
    });

    await employee.save();

    if (joiningDateChanged) {
        const auditDetails = JSON.stringify({
            action: "UPDATE_JOINING_DATE",
            entityType: "EMPLOYEE",
            entityId: employeeCode,
            oldValue: oldJoiningDate,
            newValue: newJoiningDate,
            modifiedBy: req.user?.roles?.[0] || req.user?.employeeId || req.user?.id
        });

        await AuditEvent.create({
            userId: req.user?.employeeId || req.user?.id || "SYSTEM",
            action: "UPDATE_JOINING_DATE",
            details: auditDetails,
            ipAddress: req.ip || ""
        });
    }

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
            cancelledAppointments = await appointmentService.cancelDoctorAppointments(
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
            cancelledAppointments = await appointmentService.cancelDoctorAppointments(
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