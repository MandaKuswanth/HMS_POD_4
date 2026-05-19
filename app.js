require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");
const employeeRoutes = require("./src/routes/employeeRoutes");

const app = express();
app.use(helmet());

app.use(cors({
  origin: "http://localhost:4200",
  credentials: true
}));

app.use(morgan("dev"));
app.use(express.json());

app.use("/api", employeeRoutes);

app.get("/", (req, res) => {
  res.json({ message: "API running" });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err.message));

module.exports = app;
