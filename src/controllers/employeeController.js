const Employee = require("../models/Employee");
const User = require("../models/User");

const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

exports.createEmployee = async (req, res) => {
    try {
        const {
            name,
            phone,
            email,
            password,
            department,
            designation,
            medicalRegistrationNo,
            specialization,
            qualification,
            consultationFee,
            availabilitySlots,
            role
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
            roles: role
        });

        return res.status(201).json(
            new ApiResponse(
                201,
                {
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

exports.login = async (req, res) => {
    try {
        const { email,
            password
        } = req.body;

        const user = await User.findOne({ email })

        if (!user) {
            return res.status(404).json(
                new ApiError(404, `No user found in database with email id: ${email}`)
            );
        }

        const passCheck = Boolean(await bcrypt.compare(password, user.passwordHash));

        if (!passCheck) {
            return res.status(401).json(
                new ApiError(401, "Invalid password")
            );
        }

        user.last_login = new Date();
        await user.save();

        const accessToken = user.generateAccessToken();

        return res.status(200).json(
            new ApiResponse(200, { token: accessToken }, "User is successfully logged-in.")
        );
    } catch (err) {
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
}

exports.getProfile = async (req, res) => {
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
                200,
                { employee },
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