process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");

const nodeRoutes = require("./src/routes/node.route");
const employeeRoutes = require("./src/routes/employeeRoutes");
const patientRoutes = require("./src/routes/patientRoute");
const appointmentRoutes = require("./src/routes/appointmentRoutes");

const errorMiddleware = require("./src/middleware/errorMiddleware");

const app = express();

// Security middleware
app.use(helmet());

app.use(cors({
  origin: "*",
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
app.use("/api/employees", employeeRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/nodes", nodeRoutes);

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