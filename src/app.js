require("dotenv").config();
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");
const express = require("express");
const app = express();
const employeeRoutes = require("./routes/employeeRoutes");
app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(morgan("dev"));
 
app.use(express.json()); 
app.use("/api",employeeRoutes); 
app.get("/", (req, res) => res.json({ message: "API is running" }));
 
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err.message));
 
module.exports = app;
 
 