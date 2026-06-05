require("dotenv").config();
const express = require("express");
const helmet =  require("helmet");
const connectDB = require("./config/db");
const employeeRoutes = require("./routes/employeeRoutes");

const app = express();
app.use(helmet());
app.use(express.json());
app.use("/api/employees", employeeRoutes);
app.get("/", (req, res) => res.json({ message: "API running" }));

connectDB()

module.exports = app;