require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const employeeRoutes = require("./routes/employeeRoutes");

const app = express();
app.use(express.json());
app.use("/api/employees", employeeRoutes);
app.get("/", (req, res) => res.json({ message: "API running" }));

connectDB()

module.exports = app;
