require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Employee = require("../models/Employee");
const User = require("../models/User");
const Role = require("../models/Role");

const seedSuperAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB Connected");

        const email = "superadmin@hms.com";
        const mobile = "9999899999";
        const plainPassword = "Password123";

        const superAdminRole = await Role.findOne({
            name: "SUPER_ADMIN",
            status: true
        });

        if (!superAdminRole) {
            console.log("SUPER_ADMIN role not found");
            process.exit(1);
        }

        const passwordHash = await bcrypt.hash(
            plainPassword,
            10
        );

        await User.deleteOne({ email });
        await Employee.deleteOne({ email });

        const employee = await Employee.create({
            name: "System Super Administrator",
            email,
            phone: mobile,
            department: "ADMINISTRATION",
            designation: "SUPER_ADMIN",
            status: true
        });

        await User.create({
            email,
            mobile,

            passwordHash,

            isEmployee: true,
            status: true,

            employeeId: employee.employeeCode,

            roleIds: [superAdminRole.roleId],

            mustResetPassword: false,

            createdBy: "SYSTEM"
        });

        const createdUser = await User.findOne({ email });

        const isMatch = await bcrypt.compare(
            plainPassword,
            createdUser.passwordHash
        );

        console.log("Password hash check:", isMatch);

        console.log("================================");
        console.log("SUPER ADMIN CREATED");
        console.log("Employee ID :", employee.employeeCode);
        console.log("Email       :", email);
        console.log("Password    :", plainPassword);
        console.log("Role        : SUPER_ADMIN");
        console.log("================================");

        process.exit(0);

    } catch (error) {
        console.error("SUPER_ADMIN seeding failed:", error);
        process.exit(1);
    }
};

seedSuperAdmin();