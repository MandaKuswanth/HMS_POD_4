const Employee = require("../models/Employee");
const User = require("../models/User");
const Customer=require("../models/Customer");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const jwt=require('jsonwebtoken');
exports.createEmployee = async (req, res) => { 
  try { 
    const {
      name,
      email,
      phone,
      password,
      department,
      designation,
      joiningDate,
      medicalRegistrationNo,
      specialization,
      qualification,
      consultationFee,
      availabilitySlots,
      roles
    } = req.body;
    const existingEmployee = await Employee.findOne({
      $or: [{ email }, { phone }],
    });
    if (existingEmployee) {
 
      return res
        .status(409)
        .json(new ApiResponse(409, null, "Employee already exists"));
    }
 
    const employee = await Employee.create(
        {
          name,
          email,
          phone,
          department,
          designation,
          joiningDate,
          medicalRegistrationNo,
          specialization,
          qualification,
          consultationFee,
          availabilitySlots,
        }
    
    );

    const user = await User.create(
      
        {
          email,
          password,
          roles,
          employeeId: employee.employeeCode,
        },
     
    );
 
 
    return res.status(201).json(
      new ApiResponse(
        201,
        {
          employee: employee,
          user: user,
        },
        "Employee created successfully"
      )
    );
  } catch (error) {
 
    console.error("Create Employee Error:", error);
 
    return res.status(500).json(
      new ApiError(
        500,
        error.message || "Internal Server Error"
      )
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
 
        const passCheck = await bcrypt.compare(password, user.passwordHash);
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
    }
 
    catch (err) {
        return res.status(500).json(
            new ApiError(500, "Internal Server Error")
        );
 
    }
}
 
exports.getProfile = async (req, res) => {
    try {
        const { id } = req.user.id;
 
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json(
                new ApiError(404, `No user found in database with id: ${id}`)
            );
        }
 
        const employee = new Employee.findOne({ email: user.email });
 
        if (!employee) {
            return res.status(404).json(
                new ApiError(404, "Employee profile not found")
            );
 
            return res.status(200).json(
                new ApiResponse(200, { employee: employee }, "Profile successfully retrieved.")
            );
        }
    }
    catch (err) {
        return res.status(500).json(
            new ApiError(500, "Internal Server Error")
        );
    };
};