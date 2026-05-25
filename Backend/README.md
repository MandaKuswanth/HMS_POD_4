# HMS_POD_4
HOSPITAL MANAGEMENT SYSTEM 


# HMS Backend - Hospital Management System API

This is the backend API for a **Hospital Management System (HMS)** built with **Node.js, Express.js, MongoDB, Mongoose, JWT Authentication, bcryptjs, and role-based access control**.

The backend supports employee management, public employee registration, admin approval, login, password reset, patient management, appointment booking, doctor validation, appointment status updates, and email notifications.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Run the Project](#run-the-project)
- [Application Setup](#application-setup)
- [Authentication](#authentication)
- [Roles](#roles)
- [API Response Format](#api-response-format)
- [Employee APIs](#employee-apis)
- [Patient APIs](#patient-apis)
- [Appointment APIs](#appointment-apis)
- [Sample Testing Flow](#sample-testing-flow)
- [Postman Setup](#postman-setup)
- [Security Notes](#security-notes)
- [Author](#author)

---

## Features

- Employee self-registration
- Admin-created employee accounts
- Admin approval for pending employees
- Employee rejection workflow
- Employee active/inactive status toggle
- Login using JWT authentication
- First-time password reset flow
- Role-based API access
- Patient CRUD operations
- Appointment booking
- Doctor validation before appointment creation
- Duplicate appointment slot prevention
- Appointment status management
- Email notifications
- Global error handling
- Consistent API response format

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | Backend web framework |
| MongoDB | Database |
| Mongoose | MongoDB object modeling |
| JWT | Authentication |
| bcryptjs | Password hashing |
| dotenv | Environment variable management |
| cors | Cross-origin request handling |
| helmet | Security headers |
| morgan | Request logging |
| nodemon | Development server reload |
| Brevo / SMTP | Email notifications |

---

## Project Structure

```txt
Backend/
│
├── src/
│   ├── controllers/
│   │   ├── employeeController.js
│   │   ├── patientController.js
│   │   └── appointmentController.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── roleMiddleware.js
│   │   ├── validate.js
│   │   └── errorMiddleware.js
│   │
│   ├── models/
│   │   ├── Employee.js
│   │   ├── User.js
│   │   ├── Patient.js
│   │   └── Appointment.js
│   │
│   ├── routes/
│   │   ├── employeeRoutes.js
│   │   ├── patientRoute.js
│   │   ├── appointmentRoutes.js
│   │   └── node.route.js
│   │
│   └── utils/
│       ├── ApiResponse.js
│       ├── ApiError.js
│       └── sendEmail.js
│
├── .env
├── app.js
├── server.js
├── package.json
└── README.md
```

---

## Installation

Clone the repository:

```bash
git clone <your-repository-url>
```

Move into the backend directory:

```bash
cd HMS_BACKEND/Backend
```

Install dependencies:

```bash
npm install
```

---

## Environment Variables

Create a `.env` file in the root backend directory.

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/hms_backend
ACCESS_TOKEN_SECRET=your_access_token_secret
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=your_sender_email@example.com
```

Example:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/hms_backend
ACCESS_TOKEN_SECRET=hms_secret_key_123
BREVO_API_KEY=xkeysib-your-brevo-key
BREVO_SENDER_EMAIL=admin@hms.com
```

---

## Run the Project

Development mode:

```bash
npm run dev
```

Using nodemon directly:

```bash
npx nodemon server.js
```

Production/start command:

```bash
npm start
```

Server URL:

```txt
http://localhost:5000
```

Health check:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Checks whether API is running |

Expected response:

```json
{
  "message": "API running"
}
```

---

## Application Setup

Example `app.js` setup:

```js
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

app.use(helmet());

app.use(
  cors({
    origin: "http://localhost:4200",
    credentials: true
  })
);

app.use(morgan("dev"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  return res.status(200).json({
    message: "API running"
  });
});

app.use("/api/employees", employeeRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/nodes", nodeRoutes);

app.use(errorMiddleware);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
  });

module.exports = app;
```

---

## Authentication

Protected APIs require JWT token in the request header.

```txt
Authorization: Bearer YOUR_TOKEN
```

Example:

```txt
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

JWT payload should include:

```js
{
  id: this._id,
  email: this.email,
  role: this.roles,
  employeeId: this.employeeId
}
```

Example token generation method:

```js
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
      role: this.roles,
      employeeId: this.employeeId
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "1d"
    }
  );
};
```

---

## Roles

| Role | Description |
|---|---|
| OWNER | Highest-level system role |
| ADMIN | Manages employees, approvals, patients, and appointments |
| DOCTOR | Views assigned appointments |
| NURSE | Can view patient and appointment-related data |
| RECEPTIONIST | Manages patients and appointments |
| LAB_TECHNICIAN | Lab-related employee role |

Example role middleware:

```js
const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied"
      });
    }

    next();
  };
};

module.exports = allowRoles;
```

---

## API Response Format

Success response format:

```json
{
  "statusCode": 200,
  "data": {},
  "message": "Success message",
  "success": true,
  "errors": []
}
```

Error response format:

```json
{
  "statusCode": 400,
  "data": null,
  "message": "Error message",
  "success": false,
  "errors": []
}
```

Missing fields response example:

```json
{
  "statusCode": 400,
  "data": {
    "missingFields": [
      "password",
      "confirmPassword",
      "medicalRegistrationNo"
    ]
  },
  "message": "Missing required fields: password, confirmPassword, medicalRegistrationNo",
  "success": false,
  "errors": []
}
```

---

# Employee APIs

Base URL:

```txt
http://localhost:5000/api/employees
```

## Employee Endpoint Summary

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Employee self-registration |
| POST | `/login` | Public | Employee/admin login |
| POST | `/reset-password` | Authenticated | Reset password after login |
| GET | `/profile` | Authenticated | Get logged-in user profile |
| POST | `/admin/add-employee` | Admin | Admin creates an employee |
| GET | `/employees` | Admin | Get all employees |
| PUT | `/employees/:employeeCode` | Admin | Update employee details |
| DELETE | `/employees/:employeeCode` | Admin | Delete employee |
| GET | `/pending-employees` | Admin | Get employees waiting for approval |
| PUT | `/approve-employee/:userId` | Admin | Approve employee registration |
| DELETE | `/reject-employee/:userId` | Admin | Reject employee registration |
| PUT | `/employees/:employeeCode/toggle-status` | Admin | Activate/deactivate employee account |

---

## Employee Self Registration

| Item | Value |
|---|---|
| Method | POST |
| Endpoint | `/api/employees/register` |
| Auth Required | No |
| Purpose | Allows employees to register from the public/landing page |

### Request Body - Doctor Registration

```json
{
  "name": "Manda Kuswanth",
  "email": "kuswanth34@gmail.com",
  "phone": "1122334455",
  "department": "General Medicine",
  "designation": "Junior Doctor",
  "role": "DOCTOR",
  "medicalRegistrationNo": "RP-00000002",
  "specialization": "Internal Medicine",
  "qualification": [
    "MBBS",
    "MD"
  ],
  "consultationFee": 800,
  "availabilitySlots": [
    "09:00 AM - 11:00 AM"
  ],
  "password": "Doctor@123",
  "confirmPassword": "Doctor@123"
}
```

### Success Response

```json
{
  "statusCode": 201,
  "data": {
    "employee": {},
    "user": {
      "email": "kuswanth34@gmail.com",
      "role": "DOCTOR",
      "status": false
    }
  },
  "message": "Registration submitted successfully. Please wait for admin approval.",
  "success": true,
  "errors": []
}
```

---

## Login

| Item | Value |
|---|---|
| Method | POST |
| Endpoint | `/api/employees/login` |
| Auth Required | No |
| Purpose | Authenticates user and returns JWT token |

### Request Body

```json
{
  "email": "kuswanth34@gmail.com",
  "password": "Doctor@123"
}
```

### Success Response

```json
{
  "statusCode": 200,
  "data": {
    "resetRequired": false,
    "token": "JWT_TOKEN_HERE",
    "user": {
      "_id": "USER_ID",
      "employeeId": "EMP-000002",
      "name": "Manda Kuswanth",
      "email": "kuswanth34@gmail.com",
      "role": "DOCTOR",
      "mustResetPassword": false,
      "status": true
    }
  },
  "message": "User is successfully logged-in.",
  "success": true,
  "errors": []
}
```

---

## Reset Password

| Item | Value |
|---|---|
| Method | POST |
| Endpoint | `/api/employees/reset-password` |
| Auth Required | Yes |
| Purpose | Updates password for logged-in user |

### Headers

```txt
Authorization: Bearer YOUR_TOKEN
```

### Request Body

```json
{
  "newPassword": "NewPassword@123",
  "confirmPassword": "NewPassword@123"
}
```

### Success Response

```json
{
  "statusCode": 200,
  "data": null,
  "message": "Password updated successfully",
  "success": true,
  "errors": []
}
```

---

## Admin Add Employee

| Item | Value |
|---|---|
| Method | POST |
| Endpoint | `/api/employees/admin/add-employee` |
| Auth Required | Yes |
| Access | ADMIN |
| Purpose | Admin creates employee and sends temporary password by email |

### Request Body - Doctor

```json
{
  "name": "Doctor One",
  "email": "doctorone@gmail.com",
  "phone": "9876543210",
  "department": "General Medicine",
  "designation": "Senior Doctor",
  "role": "DOCTOR",
  "medicalRegistrationNo": "DOC-0001",
  "specialization": "Internal Medicine",
  "qualification": [
    "MBBS",
    "MD"
  ],
  "consultationFee": 800,
  "availabilitySlots": [
    "10:00 AM - 12:00 PM"
  ]
}
```

---

## Role-Based Required Fields

| Role / Flow | Required Fields |
|---|---|
| Common fields | `name`, `phone`, `email`, `role`, `department`, `designation` |
| Self-registration | `password`, `confirmPassword` |
| DOCTOR | `medicalRegistrationNo`, `specialization`, `qualification`, `consultationFee`, `availabilitySlots` |
| NURSE | `qualification`, `department` |
| RECEPTIONIST | `department` |
| Admin-created employee | Password is not required; system generates temporary password |

---

# Patient APIs

Base URL:

```txt
http://localhost:5000/api/patients
```

## Patient Endpoint Summary

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/` | ADMIN, RECEPTIONIST | Create patient |
| GET | `/` | ADMIN, RECEPTIONIST, DOCTOR, NURSE | Get all patients |
| GET | `/:uhid` | ADMIN, RECEPTIONIST, DOCTOR, NURSE | Get patient by UHID |
| PUT | `/:uhid` | ADMIN, RECEPTIONIST | Update patient |
| DELETE | `/:uhid` | ADMIN | Delete patient |

---

## Create Patient

| Item | Value |
|---|---|
| Method | POST |
| Endpoint | `/api/patients` |
| Auth Required | Yes |

### Request Body

```json
{
  "name": "Ravi Kumar",
  "phone": "9876543210",
  "email": "ravi@gmail.com",
  "gender": "MALE",
  "dob": "2000-01-15",
  "address": "Hyderabad",
  "emergencyContact": "9123456789"
}
```

---

## Get All Patients

| Item | Value |
|---|---|
| Method | GET |
| Endpoint | `/api/patients` |
| Auth Required | Yes |

---

## Get Patient By UHID

| Item | Value |
|---|---|
| Method | GET |
| Endpoint | `/api/patients/:uhid` |
| Example | `/api/patients/HMS-000001` |
| Auth Required | Yes |

---

## Update Patient

| Item | Value |
|---|---|
| Method | PUT |
| Endpoint | `/api/patients/:uhid` |
| Example | `/api/patients/HMS-000001` |
| Auth Required | Yes |

### Request Body

```json
{
  "name": "Ravi Kumar Updated",
  "phone": "9876543211",
  "address": "Bangalore"
}
```

---

## Delete Patient

| Item | Value |
|---|---|
| Method | DELETE |
| Endpoint | `/api/patients/:uhid` |
| Example | `/api/patients/HMS-000001` |
| Auth Required | Yes |

---

# Appointment APIs

Base URL:

```txt
http://localhost:5000/api/appointments
```

## Appointment Endpoint Summary

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/` | ADMIN, RECEPTIONIST | Create appointment |
| GET | `/` | ADMIN, RECEPTIONIST, DOCTOR, NURSE | Get appointments based on user role |
| GET | `/:appointmentId` | ADMIN, RECEPTIONIST, DOCTOR, NURSE | Get appointment by appointment ID |
| PUT | `/:appointmentId` | ADMIN, RECEPTIONIST, DOCTOR | Update appointment |
| DELETE | `/:appointmentId` | ADMIN, RECEPTIONIST | Delete appointment |

---

## Create Appointment

| Item | Value |
|---|---|
| Method | POST |
| Endpoint | `/api/appointments` |
| Auth Required | Yes |
| Purpose | Creates appointment after validating patient, doctor, and slot availability |

### Request Body

```json
{
  "patientId": "HMS-000001",
  "doctorEmployeeId": "EMP-000002",
  "date": "2026-05-25",
  "timeSlot": "10:00 AM - 10:30 AM"
}
```

### Success Response

```json
{
  "statusCode": 201,
  "data": {
    "patientId": "HMS-000001",
    "doctorEmployeeId": "EMP-000002",
    "date": "2026-05-25T00:00:00.000Z",
    "timeSlot": "10:00 AM - 10:30 AM",
    "status": "BOOKED",
    "createdByEmployeeId": "EMP-000001",
    "appointmentId": "APT-000003"
  },
  "message": "Appointment created successfully",
  "success": true,
  "errors": []
}
```

---

## Get Appointments Based On Role

| Item | Value |
|---|---|
| Method | GET |
| Endpoint | `/api/appointments` |
| Auth Required | Yes |
| Purpose | Returns appointments based on logged-in user's role |

### Role Access

| Role | Appointment Access |
|---|---|
| ADMIN | All appointments |
| RECEPTIONIST | All appointments |
| NURSE | All appointments |
| DOCTOR | Only assigned appointments |

---

## Get Appointment By ID

| Item | Value |
|---|---|
| Method | GET |
| Endpoint | `/api/appointments/:appointmentId` |
| Example | `/api/appointments/APT-000003` |
| Auth Required | Yes |

---

## Update Appointment

| Item | Value |
|---|---|
| Method | PUT |
| Endpoint | `/api/appointments/:appointmentId` |
| Example | `/api/appointments/APT-000003` |
| Auth Required | Yes |

### Request Body

```json
{
  "date": "2026-05-26",
  "timeSlot": "11:00 AM - 11:30 AM",
  "status": "IN-PROCESS"
}
```

### Allowed Appointment Status Values

| Status |
|---|
| BOOKED |
| IN-PROCESS |
| COMPLETED |
| CANCELLED |

---

## Delete Appointment

| Item | Value |
|---|---|
| Method | DELETE |
| Endpoint | `/api/appointments/:appointmentId` |
| Example | `/api/appointments/APT-000003` |
| Auth Required | Yes |

---

# Sample Testing Flow

| Step | Action | API |
|---|---|---|
| 1 | Register doctor | `POST /api/employees/register` |
| 2 | Admin login | `POST /api/employees/login` |
| 3 | View pending employees | `GET /api/employees/pending-employees` |
| 4 | Approve doctor | `PUT /api/employees/approve-employee/:userId` |
| 5 | Doctor login | `POST /api/employees/login` |
| 6 | Create patient | `POST /api/patients` |
| 7 | Create appointment | `POST /api/appointments` |
| 8 | View appointments | `GET /api/appointments` |
| 9 | Update appointment status | `PUT /api/appointments/:appointmentId` |

---

# Postman Setup

| Setting | Value |
|---|---|
| Body type | raw |
| Body format | JSON |
| Header | `Content-Type: application/json` |
| Auth header | `Authorization: Bearer YOUR_TOKEN` |

Example JSON body:

```json
{
  "email": "kuswanth34@gmail.com",
  "password": "Doctor@123"
}
```

---

# Security Notes

- Store secrets only in `.env`.
- Do not push `.env` to GitHub.
- Use strong JWT secrets.
- Use HTTPS in production.
- Keep production database credentials private.
- Do not disable TLS certificate verification in production.
- Validate user input before saving to database.
- Hash all passwords before storing them.

Recommended `.gitignore`:

```txt
node_modules
.env
dist
build
logs
*.log
```

---

# Useful Commands

| Command | Description |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Run development server |
| `npx nodemon server.js` | Run server with nodemon |
| `npm start` | Start server |
| `git status` | Check Git status |

---
# Author & Team

This project was developed as part of the **SDE Training Program** by **POD4 - Straw Hats**.

| Name |
|---|
| Manda Kuswanth Sri Sai Syamala Rao|
|Yaswanth | 
|Aishwarya|
|Asmitha|
|Jaisruthi|
|Prasanth|

## Project Details

| Item | Description |
|---|---|
| Project Title | Hospital Management System Backend |
| Team | POD4 - Straw Hats |
| Program | SDE Training |
| Backend Stack | Node.js, Express.js, MongoDB, Mongoose, JWT |


---


# License

This project is for educational and academic use.
