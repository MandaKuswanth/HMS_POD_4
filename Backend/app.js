process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");
const employeeRoutes = require("./src/routes/employeeRoutes");
const doctorRoutes = require("./src/routes/doctorRoutes");
const patientRoutes = require("./src/routes/patientRoute");
const appointmentRoutes = require("./src/routes/appointmentRoutes");
const patientAuthRoutes = require("./src/routes/patientAuthRoutes");
const patientAppointmentRoutes=require("./src/routes/patientAppointmentRoutes");
const roleRoutes = require("./src/routes/roleRoutes");
const nodeRoutes = require("./src/routes/nodeRoutes");
const healthRecordRoutes = require("./src/routes/healthRecordRoutes");
const authRoutes = require("./src/routes/authRoutes");
const medicineRoutes = require("./src/routes/medicineRoutes");
const prescriptionRoutes = require("./src/routes/prescriptionRoutes");
const consultationRoutes = require("./src/routes/consultationRoutes");
const auditLogRoutes = require("./src/routes/auditLogRoutes");
const errorMiddleware = require("./src/middleware/errorMiddleware");

const app = express();

// Security middleware
app.use(helmet());

app.use(cors({
  origin: "http://localhost:4200",
  credentials: true
}));

// Logs requests
app.use(morgan("dev"));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get("/", (req, res) => {
  return res.status(200).json({
    message: "API running"
  });
});

// API routes
// Auth
app.use("/api/v1/auth", authRoutes);
app.use("/api/auth", authRoutes);

// Employees
app.use("/api/v1/employees", employeeRoutes);
app.use("/api/employees", employeeRoutes);

// Doctors
app.use("/api/v1/doctors", doctorRoutes);
app.use("/api/doctors", doctorRoutes);

// Patients
app.use("/api/v1/patients", patientRoutes);
app.use("/api/patients", patientRoutes);

// Appointments
app.use("/api/v1/appointments", appointmentRoutes);
app.use("/api/appointments", appointmentRoutes);

// Health Records
app.use("/api/v1/health-records", healthRecordRoutes);
app.use("/api/health-records", healthRecordRoutes);

// Roles
app.use("/api/v1/roles", roleRoutes);
app.use("/api/roles", roleRoutes);

// Nodes
app.use("/api/v1/nodes", nodeRoutes);
app.use("/api/nodes", nodeRoutes);

// Medicines
app.use("/api/v1/medicines", medicineRoutes);
app.use("/api/medicines", medicineRoutes);

// Prescriptions
app.use("/api/v1/prescriptions", prescriptionRoutes);
app.use("/api/prescriptions", prescriptionRoutes);

// Consultations
app.use("/api/v1/consultations", consultationRoutes);
app.use("/api/consultations", consultationRoutes);

// Audit Logs
app.use("/api/v1/audit-logs", auditLogRoutes);
app.use("/api/audit-logs", auditLogRoutes);

// Deprecated or helper auth routes
app.use("/api/patient-auth", patientAuthRoutes);
app.use("/api/patientAppointment-auth", patientAppointmentRoutes);

// Global error middleware should always be last
app.use(errorMiddleware);

// Database connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
  });

module.exports = app;