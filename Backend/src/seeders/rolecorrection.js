const mongoose = require("mongoose");
const Role = require("../models/Role"); // Ensure this path is correct

const MONGO_URI = "mongodb://127.0.0.1:27017/new_hms_db_today";

const fixRoles = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB...");

        // Use the Mongoose Model method, not db.roles
        const result = await Role.updateOne(
            { roleId: "ROLE-000001" },
            {
                $set: {
                    "permissions": [
                        // --- Employee Permissions ---
                        "EMPLOYEE_CREATE", "EMPLOYEE_READ", "EMPLOYEE_UPDATE",
                        "EMPLOYEE_DELETE", "EMPLOYEE_APPROVE", "EMPLOYEE_REJECT",

                        // --- Role Permissions ---
                        "ROLE_CREATE", "ROLE_READ", "ROLE_UPDATE", "ROLE_DELETE",

                        // --- Patient Permissions ---
                        "PATIENT_CREATE", "PATIENT_READ", "PATIENT_UPDATE",
                        "PATIENT_DELETE", "PATIENT_PROFILE_READ", "PATIENT_PROFILE_UPDATE",

                        // --- Appointment Permissions ---
                        "APPOINTMENT_CREATE", "APPOINTMENT_READ", "APPOINTMENT_UPDATE",
                        "APPOINTMENT_DELETE", "APPOINTMENT_APPROVE", "APPOINTMENT_REJECT",
                        "APPOINTMENT_CANCEL",

                        // --- System / Dashboard Permissions ---
                        "DASHBOARD_READ", "AUDIT_READ", "NODE_READ", "BRANCH_READ"
                    ]
                }
            }
        );

        if (result.modifiedCount > 0) {
            console.log("✅ Successfully updated permissions for Super Admin!");
        } else {
            console.log("⚠️ No changes made (Role might not exist or permissions were already identical).");
        }

    } catch (err) {
        console.error("Error updating role:", err);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

fixRoles();