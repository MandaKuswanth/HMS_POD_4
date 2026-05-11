const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const connectDB = require("./config/db");

connectDB();

const app = express();

app.use(cors());

app.use(express.json());

app.use(
    "/api/employees",
    require("./routes/employeeRoutes")
);

app.use(
    "/api/patients",
    require("./routes/patientRoutes")
);

app.use(
    "/api/appointments",
    require("./routes/appointmentRoutes")
);
app.use(
    "/api/users",
    require("./routes/userRoutes")
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log(
        `Server running on port ${PORT}`
    );
});