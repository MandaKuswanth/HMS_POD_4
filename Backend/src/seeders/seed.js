
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function main() {
    console.log("⏳ Connecting MongoDB...");

    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB Connected");

    const Role = require("../models/Role");
    const Employee = require("../models/Employee");
    const User = require("../models/User");
    const Node = require("../models/Node");
    const Patient = require("../models/Patient");
    const Appointment = require("../models/Appointment");

    // =====================================================
    // SUPER ADMIN ROLE
    // =====================================================

    let superAdminRole = await Role.findOne({ name: "SUPER ADMIN" });

    if (!superAdminRole) {
        superAdminRole = await Role.create({
            name: "SUPER ADMIN",
            description: "Full system access",
            permissions: [
                "EMPLOYEE_CREATE",
                "EMPLOYEE_READ",
                "EMPLOYEE_UPDATE",
                "EMPLOYEE_DELETE",
                "EMPLOYEE_APPROVE",
                "EMPLOYEE_REJECT",
                "ROLE_CREATE",
                "ROLE_READ",
                "ROLE_UPDATE",
                "ROLE_DELETE",
                "PATIENT_CREATE",
                "PATIENT_READ",
                "PATIENT_UPDATE",
                "PATIENT_DELETE",
                "PATIENT_PROFILE_READ",
                "PATIENT_PROFILE_UPDATE",
                "APPOINTMENT_CREATE",
                "APPOINTMENT_READ",
                "APPOINTMENT_UPDATE",
                "APPOINTMENT_DELETE",
                "APPOINTMENT_APPROVE",
                "APPOINTMENT_REJECT",
                "APPOINTMENT_CANCEL",
                "DASHBOARD_READ",
                "AUDIT_READ",
                "NODE_READ",
                "BRANCH_READ"
            ],
            status: true
        });

        console.log("✅ SUPER ADMIN role created");
    }

    // =====================================================
    // OTHER ROLES
    // =====================================================

    const roles = [
        {
            name: "ADMIN",
            description: "Branch admin role",
            permissions: [
                "DASHBOARD_READ",
                "EMPLOYEE_CREATE",
                "EMPLOYEE_READ",
                "EMPLOYEE_UPDATE",
                "EMPLOYEE_DELETE",
                "PATIENT_CREATE",
                "PATIENT_READ",
                "PATIENT_UPDATE",
                "PATIENT_DELETE",
                "APPOINTMENT_CREATE",
                "APPOINTMENT_READ",
                "APPOINTMENT_UPDATE",
                "APPOINTMENT_DELETE",
                "APPOINTMENT_APPROVE",
                "APPOINTMENT_REJECT",
                "HEALTH_RECORD_READ"
            ]
        },
        {
            name: "RECEPTIONIST",
            description: "Front desk management",
            permissions: [
                "DASHBOARD_READ",
                "PATIENT_CREATE",
                "PATIENT_READ",
                "PATIENT_UPDATE",
                "APPOINTMENT_CREATE",
                "APPOINTMENT_READ",
                "APPOINTMENT_UPDATE",
                "APPOINTMENT_APPROVE",
                "APPOINTMENT_REJECT"
            ]
        },
        {
            name: "DOCTOR",
            description: "Medical professional",
            permissions: [
                "DASHBOARD_READ",
                "PATIENT_READ",
                "APPOINTMENT_READ",
                "APPOINTMENT_UPDATE",
                "HEALTH_RECORD_CREATE",
                "HEALTH_RECORD_READ",
                "HEALTH_RECORD_UPDATE"
            ]
        }, {
            name: "PATIENT",
            description: "Patient portal access",
            permissions: [
                "PATIENT_PROFILE_READ",
                "PATIENT_PROFILE_UPDATE",
                "APPOINTMENT_CREATE",
                "APPOINTMENT_READ",
                "APPOINTMENT_CANCEL",
                "DASHBOARD_READ"
            ]
        }
    ];

    for (const role of roles) {
        const exists = await Role.findOne({ name: role.name });

        if (!exists) {
            await Role.create({
                ...role,
                status: true
            });

            console.log(`✅ Role created: ${role.name}`);
        }
    }

    // =====================================================
    // NODES
    // =====================================================

    const nodes = [
        {
            name: "Dashboard",
            path: "/dashboard",
            icon: "dashboard",
            permissions: ["DASHBOARD_READ"],
            order: 1
        },
        {
            name: "Employees",
            path: "/employees",
            icon: "groups",
            permissions: ["EMPLOYEE_READ"],
            order: 2
        },
        {
            name: "Pending Staff",
            path: "/pending-employees",
            icon: "pending",
            permissions: ["EMPLOYEE_APPROVE"],
            order: 3
        },
        {
            name: "Patients",
            path: "/patients",
            icon: "personal_injury",
            permissions: ["PATIENT_READ"],
            order: 4
        },
        {
            name: "Appointments",
            path: "/appointments",
            icon: "event_available",
            permissions: ["APPOINTMENT_READ"],
            order: 5
        },
        {
            name: "Health Records",
            path: "/health-records",
            icon: "medical_information",
            permissions: ["HEALTH_RECORD_READ"],
            order: 6
        },
        {
            name: "Roles",
            path: "/roles",
            icon: "admin_panel_settings",
            permissions: ["ROLE_READ"],
            order: 7
        },
        {
            name: "Menu Nodes",
            path: "/nodes",
            icon: "account_tree",
            permissions: ["NODE_READ"],
            order: 8
        },
        {
            name: "Audit Logs",
            path: "/audit-logs",
            icon: "history",
            permissions: ["AUDIT_READ"],
            order: 9
        },
        {
            name: "Branches",
            path: "/branches",
            icon: "business",
            permissions: ["BRANCH_READ"],
            order: 10
        }
    ];

    for (const node of nodes) {
        const exists = await Node.findOne({ path: node.path });

        if (!exists) {
            await Node.create({
                ...node,
                status: true,
                isDeleted: false
            });

            console.log(`✅ Node created: ${node.name}`);
        }
    }

    // =====================================================
    // ADMIN EMPLOYEE
    // =====================================================

    let adminEmployee = await Employee.findOne({
        email: "admin@hms.com"
    });

    if (!adminEmployee) {
        adminEmployee = await Employee.create({
            name: "System Admin",
            email: "admin@hms.com",
            phone: "9999999998",
            department: "Administration",
            designation: "Super Administrator",
            status: true
        });

        console.log("✅ Admin employee created");
    }

    let adminUser = await User.findOne({
        email: "admin@hms.com"
    });

    if (!adminUser) {
        adminUser = await User.create({
            email: "admin@hms.com",
            mobile: "9999999998",
            passwordHash: await bcrypt.hash("Admin@123", 10),
            isEmployee: true,
            status: true,
            roleIds: [superAdminRole.roleId],
            employeeId: adminEmployee.employeeCode,
            mustResetPassword: false
        });

        console.log("✅ Admin user created");
    }

    console.log("🎉 Seed completed successfully");

    await mongoose.disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});