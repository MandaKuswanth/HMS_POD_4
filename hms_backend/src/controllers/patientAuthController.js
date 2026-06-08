const Patient = require("../models/Patient");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

exports.registerPatient = async (req, res) => {
    console.log("REGISTER API HIT");
    console.log(req.body);
    try {
        const {
            name,
            phone,
            email,
            password,
            gender,
            dob,
            address,
            emergencyContact
        } = req.body;

        if (
            !name ||
            !phone ||
            !email ||
            !password ||
            !dob
        ) {
            return res.status(400).json(
                new ApiError(
                    400,
                    "Required fields missing"
                )
            );
        }

        const existingPatient = await Patient.findOne({
            $or: [
                { email },
                { phone }
            ]
        });

        if (existingPatient) {
            return res.status(409).json(
                new ApiError(409, "Patient already exists")
            );
        }

        const existingUser =
            await User.findOne({ email });

        if (existingUser) {

            return res.status(409).json(
                new ApiError(
                    409,
                    "Email already registered"
                )
            );
        }

        const patient = await Patient.create({
            name,
            phone,
            email,
            gender,
            dob,
            address,
            emergencyContact
        });

        const passwordHash = await bcrypt.hash(password, 10);

        await User.create({
            email,
            passwordHash,
            isEmployee: false,
            UHID: patient.UHID
        });

        return res.status(201).json(
            new ApiResponse(
                201,
                patient,
                "Patient registered successfully"
            )
        );


    } catch (err) {
        return res.status(500).json(
            new ApiError(
                500,
                err.message
            )
        );
    }
}

exports.loginPatient = async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        if (!email || !password) {

            return res.status(400).json(
                new ApiError(
                    400,
                    "Email and password are required"
                )
            );
        }

        const user = await User.findOne({
            email,
            isEmployee: false
        });

        if (!user) {
            return res.status(404).json(
                new ApiError(
                    404,
                    "Patient account not found"
                )
            );
        }
        const isValidPassword =
            await user.isPasswordCorrect(
                password
            );

        if (!isValidPassword) {

            return res.status(401).json(
                new ApiError(
                    401,
                    "Invalid credentials"
                )
            );
        }
        const token = user.generateAccessToken();

        const patient = await Patient.findOne({
            UHID: user.UHID
        });

        user.lastLogin = new Date();

        await user.save();

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    patient,
                    token
                },
                "Patient logged in successfully"
            )
        );
    } catch (err) {
        return res.status(500).json(
            new ApiError(
                500,
                err.message
            )
        );
    }
}