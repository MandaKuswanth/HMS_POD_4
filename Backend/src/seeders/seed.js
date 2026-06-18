const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Ensure these paths point to your actual file locations
const Role = require("../models/Role");
const Node = require("../models/Node");
const Employee = require("../models/Employee");
const EmployeeUser = require("../models/User"); // Ensure this points to your User model
const Counter = require("../models/Counter");

const MONGO_URI = "mongodb://127.0.0.1:27017/new_hms_db_today";

const seedDatabase = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to Database.");

        await Employee.deleteMany({ email: "admin@hms.com" });
        await EmployeeUser.deleteMany({ email: "admin@hms.com" });

        // 1. Create the Employee Profile FIRST
        // We use .create() so the pre('save') hook runs and generates the employeeCode
        const adminEmployee = await Employee.create({
            name: "System Admin",
            email: "admin@hms.com",
            phone: "9999999998",
            department: "Administration",
            designation: "Chief Administrator",
            status: true
        });

        console.log(`✅ Employee created with code: ${adminEmployee.employeeCode}`);

        // 2. Now create the Auth User using the generated employeeCode
        const hashedPassword = await bcrypt.hash("Admin@123", 10);

        await EmployeeUser.create({
            email: "admin@hms.com",
            mobile: "9999999998",
            passwordHash: hashedPassword,
            isEmployee: true,
            status: true,
            roleIds: ["ROLE-000001"],
            employeeId: adminEmployee.employeeCode, // Linked here
            mustResetPassword: false
        });

        console.log("✅ User account linked to Employee and created successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
};

seedDatabase();