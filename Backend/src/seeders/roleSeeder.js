require("dotenv").config();

const mongoose = require("mongoose");
const Node = require("../models/Node");

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
        name: "Patients",
        path: "/patients",
        icon: "personal_injury",
        permissions: ["PATIENT_READ"],
        order: 3
    },
    {
        name: "Appointments",
        path: "/appointments",
        icon: "event_available",
        permissions: ["APPOINTMENT_READ"],
        order: 4
    },
    {
        name: "Health Records",
        path: "/health-records",
        icon: "medical_information",
        permissions: ["HEALTH_RECORD_READ"],
        order: 5
    },
    {
        name: "Roles",
        path: "/roles",
        icon: "admin_panel_settings",
        permissions: ["ROLE_READ"],
        order: 6
    },
    {
        name: "Menu Nodes",
        path: "/nodes",
        icon: "account_tree",
        permissions: ["NODE_READ"],
        order: 7
    },
    
];

const seedNodes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected");

        for (const item of nodes) {
            const existing = await Node.findOne({
                path: item.path
            });

            if (!existing) {
                const node = await Node.create({
                    ...item,
                    status: true,
                    isDeleted: false
                });

                console.log("Created node:", node.name, node.nodeId);
            } else {
                console.log("Node already exists:", existing.name);
            }
        }

        console.log("Node seed completed");
        process.exit(0);
    } catch (error) {
        console.error("Node seed failed:", error.message);
        process.exit(1);
    }
};

seedNodes(); 

// require("dotenv").config();

// const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");

// const Employee = require("../models/Employee");
// const User = require("../models/User");
// const Role = require("../models/Role");

// const seedAdmin = async () => {
//     try {
//         await mongoose.connect(process.env.MONGO_URI);

//         console.log("MongoDB Connected");

//         const email = "admin3@hms.com";

//         const existingUser = await User.findOne({ email });

//         if (existingUser) {
//             console.log("Admin already exists");
//             process.exit(0);
//         }

//         const superAdminRole = await Role.findOne({
//             name: "SUPER_ADMIN",
//             status: true
//         });

//         if (!superAdminRole) {
//             console.log("SUPER_ADMIN role not found");
//             process.exit(1);
//         }

//         const passwordHash = await bcrypt.hash(
//             "Admin@123",
//             10
//         );

//         // Create Employee first
//         const employee = await Employee.create({
//             name: "System Administrator",
//             email,
//             phone: "9999999996",
//             department: "ADMINISTRATION",
//             designation: "SUPER_ADMIN",
//             status: true
//         });

//         console.log(
//             "Generated Employee Code:",
//             employee.employeeCode
//         );

//         // Create User
//         await User.create({
//             email,
//             mobile: "9999999996",

//             passwordHash,

//             isEmployee: true,
//             status: true,

//             employeeId: employee.employeeCode,

//             roleIds: [superAdminRole.roleId],

//             mustResetPassword: false,

//             createdBy: "SYSTEM"
//         });

//         console.log("================================");
//         console.log("SUPER_ADMIN CREATED");
//         console.log("Employee ID:", employee.employeeCode);
//         console.log("Email      :", email);
//         console.log("Password   : Admin@123");
//         console.log("================================");

//         process.exit(0);

//     } catch (error) {
//         console.error("Admin seeding failed:", error);
//         process.exit(1);
//     }
// };

// seedAdmin();