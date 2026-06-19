/**
 * devstart.js
 * Starts an in-memory MongoDB, seeds all data, then boots the Express app.
 * Run with: node devstart.js
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function main() {
    console.log("⏳ Starting in-memory MongoDB...");
    const mongod = await MongoMemoryServer.create({ instance: { port: 27017 } });
    const uri = mongod.getUri();
    process.env.MONGO_URI = uri;
    console.log("✅ MongoDB URI:", uri);

    await mongoose.connect(uri);
    console.log("✅ Mongoose connected");

    // ── Load models ────────────────────────────────────────────────────────────
    const Role     = require("./src/models/Role");
    const Employee = require("./src/models/Employee");
    const User     = require("./src/models/User");
    const Node     = require("./src/models/Node");

    // ── 1. Seed SUPER_ADMIN role ───────────────────────────────────────────────
    let superAdminRole = await Role.findOne({ name: "SUPER_ADMIN" });
    if (!superAdminRole) {
        superAdminRole = await Role.create({
            name: "SUPER_ADMIN",
            description: "Full system access",
            permissions: [
                "EMPLOYEE_CREATE","EMPLOYEE_READ","EMPLOYEE_UPDATE","EMPLOYEE_DELETE","EMPLOYEE_APPROVE","EMPLOYEE_REJECT",
                "ROLE_CREATE","ROLE_READ","ROLE_UPDATE","ROLE_DELETE",
                "PATIENT_CREATE","PATIENT_READ","PATIENT_UPDATE","PATIENT_DELETE","PATIENT_PROFILE_READ","PATIENT_PROFILE_UPDATE",
                "APPOINTMENT_CREATE","APPOINTMENT_READ","APPOINTMENT_UPDATE","APPOINTMENT_DELETE","APPOINTMENT_APPROVE","APPOINTMENT_REJECT","APPOINTMENT_CANCEL",
                "HEALTH_RECORD_CREATE","HEALTH_RECORD_READ","HEALTH_RECORD_UPDATE","HEALTH_RECORD_DELETE",
                "DASHBOARD_READ","AUDIT_READ","NODE_READ","NODE_CREATE","NODE_UPDATE","NODE_DELETE","BRANCH_READ"
            ],
            status: true
        });
        console.log("✅ SUPER_ADMIN role created:", superAdminRole.roleId);
    } else {
        console.log("✅ SUPER_ADMIN role exists:", superAdminRole.roleId);
    }

    // ── 2. Seed other roles ────────────────────────────────────────────────────
    const roles = [
        { name: "ADMIN",         permissions: ["EMPLOYEE_CREATE","EMPLOYEE_READ","EMPLOYEE_UPDATE","EMPLOYEE_DELETE","EMPLOYEE_APPROVE","EMPLOYEE_REJECT","PATIENT_CREATE","PATIENT_READ","PATIENT_UPDATE","PATIENT_DELETE","APPOINTMENT_CREATE","APPOINTMENT_READ","APPOINTMENT_UPDATE","APPOINTMENT_DELETE","APPOINTMENT_APPROVE","APPOINTMENT_REJECT","APPOINTMENT_CANCEL","ROLE_READ","DASHBOARD_READ","NODE_READ"] },
        { name: "DOCTOR",        permissions: ["PATIENT_READ","APPOINTMENT_READ","APPOINTMENT_UPDATE","DASHBOARD_READ"] },
        { name: "NURSE",         permissions: ["PATIENT_READ","APPOINTMENT_READ","DASHBOARD_READ"] },
        { name: "RECEPTIONIST",  permissions: ["PATIENT_CREATE","PATIENT_READ","PATIENT_UPDATE","APPOINTMENT_CREATE","APPOINTMENT_READ","APPOINTMENT_UPDATE","DASHBOARD_READ"] },
        { name: "PATIENT",       permissions: ["PATIENT_PROFILE_READ","PATIENT_PROFILE_UPDATE","APPOINTMENT_CREATE","APPOINTMENT_READ","APPOINTMENT_CANCEL","DASHBOARD_READ"] }
    ];
    for (const r of roles) {
        const exists = await Role.findOne({ name: r.name });
        if (!exists) {
            await Role.create({ ...r, status: true });
            console.log(`✅ Role ${r.name} created`);
        }
    }

    // ── 3. Seed navigation nodes ───────────────────────────────────────────────
    const nodes = [
        { name: "Dashboard",      path: "/dashboard",         icon: "dashboard",           permissions: ["DASHBOARD_READ"],   order: 1 },
        { name: "Employees",      path: "/employees",         icon: "groups",              permissions: ["EMPLOYEE_READ"],    order: 2 },
        { name: "Pending Staff",  path: "/pending-employees", icon: "pending",             permissions: ["EMPLOYEE_APPROVE"], order: 3 },
        { name: "Patients",       path: "/patients",          icon: "personal_injury",     permissions: ["PATIENT_READ"],     order: 4 },
        { name: "Appointments",   path: "/appointments",      icon: "event_available",     permissions: ["APPOINTMENT_READ"], order: 5 },
        { name: "Health Records", path: "/health-records",    icon: "medical_information", permissions: ["HEALTH_RECORD_READ"], order: 6 },
        { name: "Roles",          path: "/roles",             icon: "admin_panel_settings",permissions: ["ROLE_READ"],        order: 7 },
    ];
    for (const n of nodes) {
        const exists = await Node.findOne({ path: n.path });
        if (!exists) {
            await Node.create({ ...n, status: true, isDeleted: false });
            console.log(`✅ Node ${n.name} created`);
        }
    }

    // ── 4. Seed Super Admin employee + user ────────────────────────────────────
    const adminEmail = "admin@hms.com";
    let adminEmployee = await Employee.findOne({ email: adminEmail });
    if (!adminEmployee) {
        adminEmployee = await Employee.create({
            name:        "System Admin",
            email:       adminEmail,
            phone:       "9999999998",
            department:  "Administration",
            designation: "Super Administrator",
            status:      true
        });
        console.log("✅ Admin employee created:", adminEmployee.employeeCode);
    }

    let adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
        const hash = await bcrypt.hash("Admin@123", 10);
        adminUser = await User.create({
            email:             adminEmail,
            passwordHash:      hash,
            isEmployee:        true,
            status:            true,
            roleIds:           [superAdminRole.roleId],
            employeeId:        adminEmployee.employeeCode,
            mustResetPassword: false
        });
        console.log("✅ Admin user created:", adminUser.email);
    }

    // ── 5. Seed test employees for other roles ───────────────────────────────
    const testAccounts = [
        { email: "admin2@hms.com", name: "Admin Two", role: "ADMIN", pass: "Admin@123", designation: "Administrator" },
        { email: "doctor@hms.com", name: "Dr. Test", role: "DOCTOR", pass: "Doctor@123", designation: "Senior Doctor", medicalRegistrationNo: "DOC-100", specialization: "Cardiology", qualification: ["MBBS", "MD"], consultationFee: 1000, availabilitySlots: ["10:00 AM - 11:00 AM"] },
        { email: "nurse@hms.com", name: "Nurse Test", role: "NURSE", pass: "Nurse@123", designation: "Head Nurse" },
        { email: "reception@hms.com", name: "Receptionist Test", role: "RECEPTIONIST", pass: "Reception@123", designation: "Front Desk" },
    ];
    for (const acc of testAccounts) {
        let emp = await Employee.findOne({ email: acc.email });
        if (!emp) {
            const roleDoc = await Role.findOne({ name: acc.role });
            emp = await Employee.create({
                name: acc.name, email: acc.email, phone: "77777777" + Math.floor(10+Math.random()*89),
                department: "General", designation: acc.designation, status: true,
                medicalRegistrationNo: acc.medicalRegistrationNo, specialization: acc.specialization,
                qualification: acc.qualification, consultationFee: acc.consultationFee, availabilitySlots: acc.availabilitySlots
            });
            await User.create({
                email: acc.email, passwordHash: await bcrypt.hash(acc.pass, 10),
                isEmployee: true, status: true, roleIds: [roleDoc.roleId], employeeId: emp.employeeCode, mustResetPassword: false
            });
            console.log(`✅ Test user created: ${acc.email} (${acc.role})`);
        }
    }

    const pendingEmail = "pending.doctor@hms.com";
    let pendingEmp = await Employee.findOne({ email: pendingEmail });
    if (!pendingEmp) {
        const doctorRole = await Role.findOne({ name: "DOCTOR" });
        pendingEmp = await Employee.create({
            name: "Dr. Pending Test", email: pendingEmail,
            phone: "8888888881", department: "General Medicine",
            designation: "Junior Doctor", status: false,
            medicalRegistrationNo: "MED-001",
            specialization: "General Medicine",
            qualification: ["MBBS"], consultationFee: 500,
            availabilitySlots: ["09:00 AM - 11:00 AM"]
        });
        await User.create({
            email: pendingEmail,
            passwordHash: await bcrypt.hash("Doctor@123", 10),
            isEmployee: true, status: false,
            roleIds: [doctorRole.roleId],
            employeeId: pendingEmp.employeeCode,
            mustResetPassword: false
        });
        console.log("✅ Pending doctor created:", pendingEmp.employeeCode);
    }

    // ── 6. Seed patients ───────────────────────────────────────────────────────
    const Patient = require("./src/models/Patient");
    const patientsData = [
        { name: "Ravi Kumar",   phone: "9876543210", email: "ravi@gmail.com",   gender: "male",   dob: new Date("1990-01-15"), address: "Hyderabad", emergencyContact: { phone: "9123456789" } },
        { name: "Priya Sharma", phone: "9876543211", email: "priya@gmail.com",  gender: "female", dob: new Date("1985-05-22"), address: "Mumbai", emergencyContact: { phone: "9123456780" } },
        { name: "Arjun Reddy",  phone: "9876543212", email: "arjun@gmail.com",  gender: "male",   dob: new Date("1995-11-10"), address: "Bangalore", emergencyContact: { phone: "9123456781" } },
    ];
    for (const p of patientsData) {
        const exists = await Patient.findOne({ email: p.email });
        if (!exists) {
            await Patient.create(p);
            console.log(`✅ Patient ${p.name} created`);
        }
    }

    // ── 7. Seed appointments ───────────────────────────────────────────────────
    const Appointment = require("./src/models/Appointment");
    const patients = await Patient.find();
    if (patients.length > 0) {
        const apptData = [
            { patientId: patients[0].UHID, doctorEmployeeId: adminEmployee.employeeCode, date: new Date("2026-06-25"), timeSlot: "09:00 AM - 09:30 AM", status: "PENDING" },
            { patientId: patients[1]?.UHID, doctorEmployeeId: adminEmployee.employeeCode, date: new Date("2026-06-26"), timeSlot: "10:00 AM - 10:30 AM", status: "BOOKED" },
            { patientId: patients[2]?.UHID, doctorEmployeeId: adminEmployee.employeeCode, date: new Date("2026-06-27"), timeSlot: "11:00 AM - 11:30 AM", status: "PENDING" },
        ];
        for (const a of apptData) {
            if (!a.patientId) continue;
            const exists = await Appointment.findOne({ patientId: a.patientId, date: a.date, timeSlot: a.timeSlot });
            if (!exists) {
                await Appointment.create({ ...a, createdByEmployeeId: adminEmployee.employeeCode });
                console.log(`✅ Appointment for ${a.patientId} created`);
            }
        }
    }

    console.log("\n====================================");
    console.log("🔑 LOGIN CREDENTIALS:");
    console.log("   Email   : admin@hms.com");
    console.log("   Password: Admin@123");
    console.log("====================================\n");

    // ── 8. Start Express server (keep mongoose connected) ──────────────────────
    // Do NOT disconnect - app.js will re-use the same mongoose connection
    process.env.DOTENV_LOADED = "1";

    const PORT = process.env.PORT || 3000;
    const app = require("./app");
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`🚀 Server running at http://localhost:${PORT}`);
    });

    process.on("SIGINT",  async () => { await mongod.stop(); process.exit(); });
    process.on("SIGTERM", async () => { await mongod.stop(); process.exit(); });
}

main().catch(err => {
    console.error("❌ Startup failed:", err);
    process.exit(1);
});
