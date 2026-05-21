require("dotenv").config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const express = require("express");
const app = express();
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");

const employeeRoutes = require("./src/routes/employeeRoutes");
const appointmentRoutes = require("./src/routes/appointmentRoutes");

app.use(cors());
app.use(express.json());

app.use("/api", employeeRoutes);
app.use("/api", appointmentRoutes);

app.get("/", (req, res) => res.json({ message: "API running" }));

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB connection error:", err.message));

module.exports = app;