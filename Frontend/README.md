# HMS Frontend

Hospital Management System frontend application built using **Angular**.

This frontend provides a clean and responsive user interface for hospital staff to manage authentication, dashboard, employees, patients, appointments, and profile information.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technologies Used](#technologies-used)
3. [How the Project Works](#how-the-project-works)
4. [Application Flow](#application-flow)
5. [Authentication Flow](#authentication-flow)
6. [API Communication Flow](#api-communication-flow)
7. [Folder Structure](#folder-structure)
8. [File and Folder Explanation](#file-and-folder-explanation)
9. [Main Features](#main-features)
10. [Role-Based Access](#role-based-access)
11. [Backend API Connection](#backend-api-connection)
12. [Local Storage Usage](#local-storage-usage)
13. [Installation Steps](#installation-steps)
14. [Running the Project](#running-the-project)
15. [Build Project](#build-project)
16. [UI Theme](#ui-theme)
17. [Common Issues and Fixes](#common-issues-and-fixes)
18. [Future Enhancements](#future-enhancements)
19. [Project Status](#project-status)
20. [Author](#author)

---

## Project Overview

The **HMS Frontend** is an Angular-based web application developed for a Hospital Management System.

It is used to manage important hospital operations such as:

- User login
- Employee registration
- Dashboard overview
- Employee management
- Patient management
- Appointment booking
- Profile management
- Role-based page access

The frontend communicates with the backend using REST APIs. The backend handles authentication, database operations, and business logic, while the frontend handles user interface and user interaction.

---

## Technologies Used

- Angular
- TypeScript
- HTML
- CSS
- Angular Material
- Reactive Forms
- Angular Router
- HttpClient
- JWT Authentication
- ngx-toastr
- RxJS
- Local Storage

---

## How the Project Works

When the application starts, Angular loads the root application component.

The routing system checks the current URL and displays the correct page. For example, `/login` opens the login page, `/dashboard` opens the dashboard page, and `/patients` opens the patient list page.

Public pages such as the landing page, login page, and register page can be opened without login.

Private pages such as dashboard, employees, patients, appointments, and profile are protected using an Auth Guard.

After successful login, the backend returns a JWT token. The token is stored in local storage. This token is used to verify the logged-in user and access protected APIs.

Angular services are used to communicate with the backend. Each module has its own service, such as Auth Service, Employee Service, Patient Service, and Appointment Service.

---

## Application Flow

```text
User opens application
        |
        v
Landing Page
        |
        |---------------- Login
        |                    |
        |                    v
        |              User enters email and password
        |                    |
        |                    v
        |              Login API is called
        |                    |
        |                    v
        |              Backend validates user
        |                    |
        |                    v
        |              JWT token is received
        |                    |
        |                    v
        |              Token stored in localStorage
        |                    |
        |                    v
        |              User redirected to Dashboard
        |
        |---------------- Register Employee
                             |
                             v
                    Employee fills registration form
                             |
                             v
                    Register API is called
                             |
                             v
                    Employee data saved in backend
```

After login, the user can access:

```text
Dashboard
   |
   |---- Employee Management
   |
   |---- Patient Management
   |
   |---- Appointment Management
   |
   |---- Profile Page
   |
   |---- Logout
```

---

## Authentication Flow

```text
Login Page
   |
   v
User enters email and password
   |
   v
Angular sends login request to backend
   |
   v
Backend checks user credentials
   |
   v
Backend returns JWT token
   |
   v
Frontend stores token in localStorage
   |
   v
Auth Guard allows protected routes
   |
   v
Auth Interceptor sends token with API requests
   |
   v
User accesses dashboard and other protected pages
```

---

## API Communication Flow

```text
Component
   |
   v
Service
   |
   v
HttpClient
   |
   v
Backend API
   |
   v
Database
```

Example:

```text
Patient List Component
        |
        v
Patient Service
        |
        v
GET /api/patients
        |
        v
Backend returns patient data
        |
        v
Patient data displayed in table
```

---

## Folder Structure

```text
Frontend/
│
├── src/
│   │
│   ├── app/
│   │   │
│   │   ├── core/
│   │   │   │
│   │   │   ├── guards/
│   │   │   │   ├── auth-guard.ts
│   │   │   │   └── role-guard.ts
│   │   │   │
│   │   │   ├── interceptors/
│   │   │   │   └── auth-interceptor.ts
│   │   │   │
│   │   │   └── services/
│   │   │       ├── auth.ts
│   │   │       ├── employee.ts
│   │   │       ├── patient.ts
│   │   │       └── appointment.ts
│   │   │
│   │   ├── features/
│   │   │   │
│   │   │   ├── auth/
│   │   │   │   │
│   │   │   │   ├── login/
│   │   │   │   │   ├── login.ts
│   │   │   │   │   ├── login.html
│   │   │   │   │   └── login.css
│   │   │   │   │
│   │   │   │   └── register/
│   │   │   │       ├── register.ts
│   │   │   │       ├── register.html
│   │   │   │       └── register.css
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── dashboard.ts
│   │   │   │   ├── dashboard.html
│   │   │   │   └── dashboard.css
│   │   │   │
│   │   │   ├── employees/
│   │   │   │   ├── employee-list/
│   │   │   │   │   ├── employee-list.ts
│   │   │   │   │   ├── employee-list.html
│   │   │   │   │   └── employee-list.css
│   │   │   │   │
│   │   │   │   └── employee-dialog/
│   │   │   │       ├── employee-dialog.ts
│   │   │   │       ├── employee-dialog.html
│   │   │   │       └── employee-dialog.css
│   │   │   │
│   │   │   ├── patients/
│   │   │   │   ├── patient-list/
│   │   │   │   │   ├── patient-list.ts
│   │   │   │   │   ├── patient-list.html
│   │   │   │   │   └── patient-list.css
│   │   │   │   │
│   │   │   │   └── patient-dialog/
│   │   │   │       ├── patient-dialog.ts
│   │   │   │       ├── patient-dialog.html
│   │   │   │       └── patient-dialog.css
│   │   │   │
│   │   │   ├── appointments/
│   │   │   │   ├── appointment-list/
│   │   │   │   │   ├── appointment-list.ts
│   │   │   │   │   ├── appointment-list.html
│   │   │   │   │   └── appointment-list.css
│   │   │   │   │
│   │   │   │   └── appointment-dialog/
│   │   │   │       ├── appointment-dialog.ts
│   │   │   │       ├── appointment-dialog.html
│   │   │   │       └── appointment-dialog.css
│   │   │   │
│   │   │   └── profile/
│   │   │       ├── profile.ts
│   │   │       ├── profile.html
│   │   │       └── profile.css
│   │   │
│   │   ├── shared/
│   │   │   │
│   │   │   └── components/
│   │   │       │
│   │   │       ├── navbar/
│   │   │       │   ├── navbar.ts
│   │   │       │   ├── navbar.html
│   │   │       │   └── navbar.css
│   │   │       │
│   │   │       └── sidebar/
│   │   │           ├── sidebar.ts
│   │   │           ├── sidebar.html
│   │   │           └── sidebar.css
│   │   │
│   │   ├── app.config.ts
│   │   ├── app.routes.ts
│   │   ├── app.ts
│   │   ├── app.html
│   │   └── app.css
│   │
│   ├── assets/
│   │
│   ├── index.html
│   ├── main.ts
│   └── styles.css
│
├── angular.json
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

---

## File and Folder Explanation

### Root Project Files

| File / Folder | Description |
|---|---|
| `Frontend/` | Main Angular frontend project folder. |
| `angular.json` | Contains Angular project configuration, build options, styles, and assets configuration. |
| `package.json` | Contains project dependencies, scripts, and project metadata. |
| `package-lock.json` | Stores exact dependency versions installed in the project. |
| `tsconfig.json` | Contains TypeScript compiler configuration. |
| `README.md` | Contains project documentation and setup instructions. |

### Source Files

| File / Folder | Description |
|---|---|
| `src/` | Main source code folder of the Angular project. |
| `src/main.ts` | Main entry point that starts the Angular application. |
| `src/index.html` | Main HTML page where Angular app is rendered. |
| `src/styles.css` | Global CSS file used across the complete project. |
| `src/assets/` | Stores images, icons, logos, and other static files. |

### App Files

| File / Folder | Description |
|---|---|
| `src/app/` | Main application folder containing routes, features, services, and shared components. |
| `app.ts` | Root application component class. |
| `app.html` | Root application template that displays routed components. |
| `app.css` | Root application styling file. |
| `app.config.ts` | Contains application-level providers such as router, HTTP client, animations, and toastr. |
| `app.routes.ts` | Contains all route paths and route guard configuration. |

### Core Folder

| File / Folder | Description |
|---|---|
| `core/` | Contains common logic used throughout the application. |
| `core/services/` | Contains API service files for backend communication. |
| `core/guards/` | Contains route protection logic. |
| `core/interceptors/` | Contains HTTP request modification logic. |

### Core Services

| File | Description |
|---|---|
| `auth.ts` | Handles login, logout, token storage, role checking, and authentication-related logic. |
| `employee.ts` | Handles employee-related API calls such as add, list, update, delete, and profile. |
| `patient.ts` | Handles patient-related API calls such as add, list, update, and view patient details. |
| `appointment.ts` | Handles appointment-related API calls such as booking appointments and viewing appointments. |

### Guards

| File | Description |
|---|---|
| `auth-guard.ts` | Allows access to protected routes only if the user is logged in. |
| `role-guard.ts` | Allows access to specific routes based on the logged-in user role. |

### Interceptors

| File | Description |
|---|---|
| `auth-interceptor.ts` | Automatically attaches JWT token to backend API requests. |

### Features Folder

| File / Folder | Description |
|---|---|
| `features/` | Contains all main pages and modules of the application. |
| `features/auth/` | Contains authentication pages like login and register. |
| `features/dashboard/` | Contains dashboard page files. |
| `features/employees/` | Contains employee management files. |
| `features/patients/` | Contains patient management files. |
| `features/appointments/` | Contains appointment management files. |
| `features/profile/` | Contains logged-in user profile files. |

### Login Files

| File | Description |
|---|---|
| `login.ts` | Handles login form validation, login API call, and redirection after login. |
| `login.html` | Contains the login form UI. |
| `login.css` | Contains styling for the login page. |

### Register Files

| File | Description |
|---|---|
| `register.ts` | Handles employee registration form validation and API call. |
| `register.html` | Contains the employee registration form UI. |
| `register.css` | Contains styling for the registration page. |

### Dashboard Files

| File | Description |
|---|---|
| `dashboard.ts` | Loads dashboard data and handles dashboard logic. |
| `dashboard.html` | Displays dashboard cards, welcome section, and module shortcuts. |
| `dashboard.css` | Contains dashboard page styling. |

### Employee Files

| File | Description |
|---|---|
| `employee-list.ts` | Loads employee data and handles list actions like edit and delete. |
| `employee-list.html` | Displays employees in table or card format. |
| `employee-list.css` | Contains employee list page styling. |
| `employee-dialog.ts` | Handles add and update employee form logic. |
| `employee-dialog.html` | Contains employee add/update dialog form. |
| `employee-dialog.css` | Contains employee dialog styling. |

### Patient Files

| File | Description |
|---|---|
| `patient-list.ts` | Loads patient data and handles patient actions. |
| `patient-list.html` | Displays patient records. |
| `patient-list.css` | Contains patient list page styling. |
| `patient-dialog.ts` | Handles add and update patient form logic. |
| `patient-dialog.html` | Contains patient add/update dialog form. |
| `patient-dialog.css` | Contains patient dialog styling. |

### Appointment Files

| File | Description |
|---|---|
| `appointment-list.ts` | Loads appointment data and handles appointment actions. |
| `appointment-list.html` | Displays appointment records. |
| `appointment-list.css` | Contains appointment list page styling. |
| `appointment-dialog.ts` | Handles appointment booking form logic. |
| `appointment-dialog.html` | Contains appointment booking form UI. |
| `appointment-dialog.css` | Contains appointment dialog styling. |

### Profile Files

| File | Description |
|---|---|
| `profile.ts` | Loads logged-in employee profile details from backend. |
| `profile.html` | Displays profile information such as name, email, role, and department. |
| `profile.css` | Contains profile page styling. |

### Shared Components

| File / Folder | Description |
|---|---|
| `shared/` | Contains reusable UI components. |
| `shared/components/` | Contains common components used in multiple pages. |

### Navbar Files

| File | Description |
|---|---|
| `navbar.ts` | Handles navbar logic such as user display and logout. |
| `navbar.html` | Contains navbar UI. |
| `navbar.css` | Contains navbar styling. |

### Sidebar Files

| File | Description |
|---|---|
| `sidebar.ts` | Handles sidebar menu and navigation logic. |
| `sidebar.html` | Contains sidebar navigation UI. |
| `sidebar.css` | Contains sidebar styling. |

---

## Main Features

### 1. Landing Page

The landing page is the first page of the application. It provides a simple introduction to the Hospital Management System and contains navigation buttons for login and employee registration.

### 2. Login Page

The login page allows users to login using email and password.

After successful login:

- JWT token is stored
- User role is identified
- User is redirected to dashboard

### 3. Employee Registration

The employee registration page allows new employees to register in the system.

It collects details such as:

- Name
- Email
- Phone
- Department
- Designation
- Role
- Joining date
- Doctor-specific details if the employee is a doctor

### 4. Dashboard

The dashboard gives an overview of the hospital system.

It may show:

- Logged-in user information
- Total employees
- Total patients
- Total appointments
- Quick access cards
- Role-based options

### 5. Employee Management

The employee module allows admin users to manage employee information.

Main actions:

- Add employee
- View employee list
- Update employee details
- Delete employee
- View employee profile

### 6. Patient Management

The patient module allows hospital staff to manage patient records.

Main actions:

- Add patient
- View patient list
- Update patient details
- Search patient
- View patient information

### 7. Appointment Management

The appointment module allows staff to book and manage appointments.

Main actions:

- Select patient
- Select doctor
- Select appointment date
- Select time slot
- Book appointment
- View appointment list

### 8. Profile Page

The profile page displays the logged-in employee details.

It shows information such as:

- Name
- Email
- Phone
- Role
- Department
- Designation
- Employee code
- Joining date

### 9. Navbar

The navbar is displayed on authenticated pages.

It may contain:

- Application title
- Logged-in user information
- Logout button

### 10. Sidebar

The sidebar provides navigation links to different modules.

It may contain links such as:

- Dashboard
- Employees
- Patients
- Appointments
- Profile

---

## Role-Based Access

The application supports role-based access.

Example roles:

- ADMIN
- DOCTOR
- RECEPTIONIST
- TECHNICIAN
- NURSE

Example access:

| Role | Access |
|---|---|
| ADMIN | Can access all modules. |
| DOCTOR | Can access dashboard, patients, appointments, and profile. |
| RECEPTIONIST | Can access patients and appointments. |
| TECHNICIAN | Can access assigned modules. |
| NURSE | Can access patients and appointments. |

---

## Backend API Connection

The frontend communicates with the backend using REST APIs.

Default backend URL:

```text
http://localhost:5000/api
```

Example service base URL:

```ts
readonly baseUrl = 'http://localhost:5000/api';
```

Before running the frontend, make sure the backend server is running.

### Important API Examples

| API | Method | Purpose |
|---|---|---|
| `/api/login` | POST | Used to login a user. |
| `/api/register` | POST | Used to register an employee. |
| `/api/employees` | GET | Used to fetch employee list. |
| `/api/patients` | GET | Used to fetch patient list. |
| `/api/appointments` | POST | Used to book an appointment. |
| `/api/profile` | GET | Used to fetch logged-in user profile. |

---

## Local Storage Usage

The frontend stores authentication data in local storage.

Common local storage keys:

- `token`
- `role`
- `user`

Example:

```ts
localStorage.setItem('token', token);
```

The token is removed during logout.

```ts
localStorage.removeItem('token');
```

---

## Installation Steps

### Step 1: Navigate to Frontend Folder

```bash
cd Frontend
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Install Angular Material

```bash
ng add @angular/material
```

### Step 4: Install Toastr

```bash
npm install ngx-toastr @angular/animations
```

---

## Running the Project

Start the Angular development server:

```bash
ng serve
```

Or run:

```bash
npm start
```

The application will run at:

```text
http://localhost:4200
```

---

## Build Project

To create a production build:

```bash
ng build
```

The build files will be generated inside the `dist/` folder.

---

## UI Theme

The application uses a clean hospital-style blue theme.

Common UI style points:

- Blue gradient headers
- White cards
- Rounded corners
- Soft shadows
- Responsive layouts
- Angular Material form fields and buttons
- Clean dashboard cards
- Sidebar navigation for authenticated pages

---

## Common Issues and Fixes

### 1. Backend API Not Working

Make sure the backend server is running on:

```text
http://localhost:5000
```

### 2. CORS Error

Allow the frontend URL in the backend CORS configuration.

Example:

```js
app.use(
  cors({
    origin: 'http://localhost:4200',
    credentials: true
  })
);
```

### 3. Unauthorized Error

Check whether the JWT token is stored in local storage and sent with API requests.

### 4. Angular Material Components Not Working

Make sure the required Angular Material modules are imported in the standalone component.

### 5. Route Not Opening

Check `app.routes.ts` and make sure the path and component are correctly configured.

---

## Future Enhancements

- Add appointment status update
- Add patient search and filtering
- Add employee search and filtering
- Add role-based dashboard statistics
- Add doctor availability calendar
- Add appointment email notifications
- Add dark mode
- Add pagination for large data tables
- Add deployment configuration

---

## Project Status

The HMS Frontend is under development and currently supports the main frontend flow for authentication, dashboard, employee management, patient management, appointment management, and profile management.

---

## Author

**Manda Kuswanth Sri Sai Syamala Rao**

Computer Science and Engineering - Data Science  
Presidency University

---

## Summary

This frontend provides a complete user interface for the Hospital Management System. It connects with backend APIs, manages authentication using JWT, protects routes using guards, and provides separate modules for employees, patients, appointments, dashboard, and profile management.
