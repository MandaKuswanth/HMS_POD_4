process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Role = require("../models/Role");
const Employee = require("../models/Employee");
const User = require("../models/User");
const Node = require("../models/Node");

async function main() {
    try {
        console.log("Connecting to MongoDB...");

        await mongoose.connect(process.env.MONGO_URI);

        console.log(" MongoDB Connected");

        const email = process.env.SUPER_ADMIN_EMAIL;
        const mobile = process.env.SUPER_ADMIN_MOBILE;
        const plainPassword = process.env.SUPER_ADMIN_PASSWORD;

        if (!email || !mobile || !plainPassword) {
            throw new Error(
                "SUPER_ADMIN_EMAIL, SUPER_ADMIN_MOBILE and SUPER_ADMIN_PASSWORD must be defined in .env"
            );
        }

        // =====================================================
        // ROLES
        // =====================================================

        const roles = [
            {
                name: "SUPER_ADMIN",
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
                    "HEALTH_RECORD_CREATE",
                    "HEALTH_RECORD_READ",
                    "HEALTH_RECORD_UPDATE",
                    "DASHBOARD_READ",
                    "AUDIT_READ",
                    "NODE_READ",
                    "BRANCH_READ"
                ]
            },
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
            },
            {
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
                    status: true,
                    createdBy: "SYSTEM"
                });

                console.log(` Role created: ${role.name}`);
            }
        }

        const superAdminRole = await Role.findOne({
            name: "SUPER_ADMIN"
        });

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
            const exists = await Node.findOne({
                path: node.path
            });

            if (!exists) {
                await Node.create({
                    ...node,
                    status: true,
                    isDeleted: false
                });

                console.log(` Node created: ${node.name}`);
            }
        }
        // =====================================================
        // SUPER ADMIN EMPLOYEE
        // =====================================================

        let adminEmployee = await Employee.findOne({
            email
        });

        if (adminUser) {
            console.log(" Super Admin user already exists");
        } else {
            adminEmployee = await Employee.create({
                name: "System Super Administrator",
                email,
                phone: mobile,
                department: "ADMINISTRATION",
                designation: "SUPER_ADMIN",
                status: true
            });

            console.log(" Super Admin employee created");
        }

        // =====================================================
        // SUPER ADMIN USER
        // =====================================================

        const adminUser = await User.findOne({
            email
        });

        if (adminUser) {
            console.log(" Super Admin user already exists");
        } else {
            const passwordHash = await bcrypt.hash(
                plainPassword,
                10
            );

            await User.create({
                email,
                mobile,
                passwordHash,
                isEmployee: true,
                status: true,
                roleIds: [superAdminRole.roleId],
                employeeId: adminEmployee.employeeCode,
                mustResetPassword: false,
                createdBy: "SYSTEM"
            });

            console.log("✅ Super Admin user created");
        }

        // =====================================================
        // PASSWORD VERIFICATION
        // =====================================================

        const createdUser = await User.findOne({ email });

        const passwordMatched = await bcrypt.compare(
            plainPassword,
            createdUser.passwordHash
        );

        console.log("--------------------------------");
        console.log("Password Hash Verified :", passwordMatched);
        console.log("--------------------------------");

        // =====================================================
        // COMPLETION
        // =====================================================

        console.log("");
        console.log("========================================");
        console.log("🎉 HMS DATABASE SEEDED SUCCESSFULLY");
        console.log("========================================");
        console.log("Super Admin Details");
        console.log("----------------------------------------");
        console.log(`Employee ID : ${adminEmployee.employeeCode}`);
        console.log(`Email       : ${email}`);
        console.log(`Mobile      : ${mobile}`);
        console.log(`Password    : ${plainPassword}`);
        console.log(`Role        : SUPER_ADMIN`);
        console.log("========================================");

    } catch (error) {
        console.error("❌ Seeding failed:");
        console.error(error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
        console.log("🔌 MongoDB disconnected");
    }
}

try {
    await main();
} catch (err) {
    console.error(err);
    process.exit(1);
}