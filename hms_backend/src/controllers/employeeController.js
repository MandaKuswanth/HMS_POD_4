const Employee = require("../models/Employee");
const User = require("../models/User");
const crypto = require("node:crypto")

const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const sendEmail = require("../utils/sendEmail");

exports.selfRegister = async(req, res) => {
    try {
        const {
            name,
            phone,
            email,
            role,
            department,
            designation,
            medicalRegistrationNo,
            specialization,
            qualification,
            consultationFee,
            availabilitySlots,
            password
        } = req.body;

        const existingEmp = await Employee.findOne({
            $or: [{ email }, { phone }]
        });

        if (existingEmp) {
            return res.status(409).json(
                new ApiResponse(409, null, "Employee already exists")
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // status: false — inactive until admin activates
        const employee = await Employee.create({
            name,
            phone,
            email,
            department,
            designation,
            medicalRegistrationNo,
            specialization,
            qualification,
            consultationFee,
            availabilitySlots,
            status: false
        });

        const user = await User.create({
            email,
            passwordHash: hashedPassword,
            employeeId: employee.employeeCode,
            roles: role,
            mustResetPassword: false,
            status: false // inactive until admin activates
        });

        await sendEmail({

            to: email,

            subject: "HMS Employee Account Created",

            html: `
        <h2>Welcome to HMS</h2>

        <p>Your account has been created.</p>

        <p>
            <strong>Email:</strong> ${email}
        </p>

        <p>
            Please reset your password after login.
        </p>
    `
        });

        return res.status(201).json(
            new ApiResponse(
                201, {
                    employee,
                    user: {
                        _id: user._id,
                        email: user.email,
                        role: user.roles,
                        status: user.status
                    }
                },
                "Registration successful. Please wait for admin approval."
            )
        );

    } catch (err) {
        console.error(err);
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};

exports.adminAddEmployee = async(req, res) => {
    try {
        const {
            name,
            phone,
            email,
            role,
            department,
            designation,
            medicalRegistrationNo,
            specialization,
            qualification,
            consultationFee,
            availabilitySlots
        } = req.body;

        const existingEmp = await Employee.findOne({
            $or: [{ email }, { phone }]
        });

        if (existingEmp) {
            return res.status(409).json(
                new ApiResponse(409, null, "Employee already exists")
            );
        }

        const tempPassword = crypto.randomBytes(8).toString("hex");

        console.log("Temporary password:", tempPassword);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const employee = await Employee.create({
            name,
            phone,
            email,
            department,
            designation,
            medicalRegistrationNo,
            specialization,
            qualification,
            consultationFee,
            availabilitySlots
        });

        const user = await User.create({
            email,
            passwordHash: hashedPassword,
            employeeId: employee.employeeCode,
            roles: role,
            mustResetPassword: true
        });

        await sendEmail({

            to: email,

            subject: "HMS Employee Account Created",

            html: `
        <h2>Welcome to HMS</h2>

        <p>Your account has been created.</p>

        <p>
            <strong>Email:</strong> ${email}
        </p>

        <p>
            <strong>Temporary Password:</strong> ${tempPassword}
        </p>

        <p>
            Please reset your password after login.
        </p>
    `
        });

        return res.status(201).json(
            new ApiResponse(
                201, {
                    employee,
                    user
                },
                "Employee created successfully"
            )
        );

    } catch (err) {
        console.error(err);
        return res.status(500).json(
            new ApiError(500, "Internal Server Error")
        );
    }
};

exports.login = async(req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        const user = await User.findOne({ email })

        if (!user) {
            return res.status(404).json(
                new ApiError(404, `No user found in database with email id: ${email}`)
            );
        }
        if (!user.status) {

            return res.status(403).json(

                new ApiError(
                    403,
                    'Your account is inactive. Please contact admin.'
                )

            );
        }

        const passCheck = await user.isPasswordCorrect(password);

        if (!passCheck) {
            return res.status(401).json(
                new ApiError(401, "Invalid password")
            );
        }


        if (user.mustResetPassword) {

            const token = user.generateAccessToken();

            return res.status(200).json({
                message: "Password reset required",
                resetRequired: true,
                mustResetPassword: true,
                token: token,

                user: {
                    id: user._id,
                    email: user.email,
                    role: user.roles,
                    mustResetPassword: true
                }
            });
        }


        user.lastLogin = new Date();
        await user.save();

        const accessToken = user.generateAccessToken();

        return res.status(200).json(
            new ApiResponse(
                200, {
                    token: accessToken,
                    employee: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.roles,
                        mustResetPassword: user.mustResetPassword
                    }
                },
                "User is successfully logged-in."
            )
        );
    } catch (err) {
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
}

exports.resetPassword = async(req, res) => {
    try {
        const { id } = req.user;
        const { newPassword } = req.body;

        const user = await User.findById(id);

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.passwordHash = hashedPassword;
        user.mustResetPassword = false;

        await user.save();

        return res.status(200).json(
            new ApiResponse(200, null, "Password updated successfully")
        );

    } catch (err) {
        return res.status(500).json(
            new ApiError(500, err.message)
        );
    }
};




exports.getProfile = async(req, res) => {
    try {
        const { id } = req.user;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json(
                new ApiError(404, `No user found in database with id: ${id}`)
            );
        }

        const employee = await Employee.findOne({ email: user.email });
        if (!employee) {
            return res.status(404).json(
                new ApiError(404, "Employee profile not found")
            );
        }

        return res.status(200).json(
            new ApiResponse(
                200, { employee },
                "Profile successfully retrieved."
            )
        );

    } catch (err) {
        console.log(err)
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};

exports.getEmployees = async(req, res) => {
    try {
        const employees = await Employee.find();
        const user = await User.find();

        return res.status(200).json(
            new ApiResponse(200, {
                    employees,
                    user
                },
                "Employees fetched successfully"));
    } catch (err) {
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};

exports.updateEmployee = async(req, res) => {
    try {
        const { employeeCode } = req.params;

        const {
            name,
            phone,
            email,
            role,
            department,
            designation,
            medicalRegistrationNo,
            specialization,
            qualification,
            consultationFee,
            availabilitySlots,
            status
        } = req.body;

        const employee = await Employee.findOne({ employeeCode });

        if (!employee) {
            return res.status(404).json(
                new ApiError(404, "Employee not found")
            );
        }

        // Update employee fields — only update what's sent
        if (name !== undefined) employee.name = name;
        if (phone !== undefined) employee.phone = phone;
        if (email !== undefined) employee.email = email;
        if (department !== undefined) employee.department = department;
        if (designation !== undefined) employee.designation = designation;
        if (medicalRegistrationNo !== undefined) employee.medicalRegistrationNo = medicalRegistrationNo;
        if (specialization !== undefined) employee.specialization = specialization;
        if (qualification !== undefined) employee.qualification = qualification;
        if (consultationFee !== undefined) employee.consultationFee = consultationFee;
        if (availabilitySlots !== undefined) employee.availabilitySlots = availabilitySlots;
        if (status !== undefined) employee.status = status; // ✅ handles activation/deactivation

        await employee.save();

        // Sync user — role and status
        const user = await User.findOne({ email: employee.email });

        if (user) {
            if (role !== undefined) user.roles = role;
            if (status !== undefined) user.status = status; // ✅ keep user status in sync
            if (email !== undefined) user.email = email;
            await user.save();
        }

        return res.status(200).json(
            new ApiResponse(200, { employee, user }, "Employee updated successfully")
        );

    } catch (err) {
        console.error(err);
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};

exports.deleteEmployee = async(req, res) => {
    try {
        const { employeeCode } = req.params;

        const employee = await Employee.findOne({ employeeCode });

        if (!employee) {
            return res.status(404).json(
                new ApiError(404, "Employee not found")
            );
        }

        // Delete both employee and user together
        await Employee.deleteOne({ employeeCode });
        await User.deleteOne({ email: employee.email });

        return res.status(200).json(
            new ApiResponse(200, null, "Employee deleted successfully")
        );

    } catch (err) {
        console.error(err);
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};