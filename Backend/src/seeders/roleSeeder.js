require("dotenv").config();

const mongoose = require("mongoose");

const Role = require("../models/Role");

const roles = [
    {
        name: "SUPER_ADMIN",
        description: "System Super Administrator",
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

            "ROLE_CREATE",
            "ROLE_READ",
            "ROLE_UPDATE",
            "ROLE_DELETE",

            "NODE_CREATE",
            "NODE_READ",
            "NODE_UPDATE",
            "NODE_DELETE",

            "HEALTH_RECORD_CREATE",
            "HEALTH_RECORD_READ",
            "HEALTH_RECORD_UPDATE",
            "HEALTH_RECORD_DELETE"
        ],
        status: true,
        createdBy: "SYSTEM"
    },

    {
        name: "ADMIN",
        description: "Hospital Administrator",
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

            "HEALTH_RECORD_CREATE",
            "HEALTH_RECORD_READ",
            "HEALTH_RECORD_UPDATE",
            "HEALTH_RECORD_DELETE"
        ],
        status: true,
        createdBy: "SYSTEM"
    },

    {
        name: "DOCTOR",
        description: "Doctor",
        permissions: [
            "DASHBOARD_READ",

            "PATIENT_READ",

            "APPOINTMENT_READ",
            "APPOINTMENT_UPDATE",

            "HEALTH_RECORD_CREATE",
            "HEALTH_RECORD_READ",
            "HEALTH_RECORD_UPDATE"
        ],
        status: true,
        createdBy: "SYSTEM"
    },

    {
        name: "RECEPTIONIST",
        description: "Reception Desk Staff",
        permissions: [
            "DASHBOARD_READ",

            "PATIENT_CREATE",
            "PATIENT_READ",
            "PATIENT_UPDATE",

            "APPOINTMENT_CREATE",
            "APPOINTMENT_READ",
            "APPOINTMENT_UPDATE"
        ],
        status: true,
        createdBy: "SYSTEM"
    },

    {
        name: "NURSE",
        description: "Nursing Staff",
        permissions: [
            "DASHBOARD_READ",

            "PATIENT_READ",

            "APPOINTMENT_READ",

            "HEALTH_RECORD_READ",
            "HEALTH_RECORD_UPDATE"
        ],
        status: true,
        createdBy: "SYSTEM"
    },

    {
        name: "TECHNICIAN",
        description: "Lab Technician",
        permissions: [
            "DASHBOARD_READ",

            "PATIENT_READ",

            "HEALTH_RECORD_READ",
            "HEALTH_RECORD_UPDATE"
        ],
        status: true,
        createdBy: "SYSTEM"
    },

    {
        name: "PATIENT",
        description: "Patient Portal User",
        permissions: [],
        status: true,
        createdBy: "SYSTEM"
    }
];

const seedRoles = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB Connected");

        for (const roleData of roles) {
            const existingRole = await Role.findOne({
                name: roleData.name
            });

            if (!existingRole) {
                const role = await Role.create(roleData);

                console.log(
                    "Created Role:",
                    role.name,
                    role.roleId
                );
            } else {
                console.log(
                    "Role already exists:",
                    existingRole.name
                );
            }
        }

        console.log("Role seeding completed");
        process.exit(0);

    } catch (error) {
        console.error(
            "Role seeding failed:",
            error.message
        );

        process.exit(1);
    }
};

seedRoles();