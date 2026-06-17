const Patient = require("../models/Patient");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const Role = require("../models/Role");

exports.registerPatient = async (req, res) => {
    try {
        const {
            name,
            phone,
            email,
            password,
            bloodGroup,
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
            !bloodGroup ||
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
                { email: email.trim().toLowerCase() },
                { phone }
            ]
        });

        if (existingPatient) {
            return res.status(409).json(
                new ApiError(
                    409,
                    "Patient already exists"
                )
            );
        }

        const existingUser = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (existingUser) {
            return res.status(409).json(
                new ApiError(
                    409,
                    "Email already registered"
                )
            );
        }

        const patientRole = await Role.findOne({
            name: "PATIENT",
            status: true
        });

        if (!patientRole) {
            return res.status(404).json(
                new ApiError(
                    404,
                    "PATIENT role not found"
                )
            );
        }

        const patient = await Patient.create({
            name,
            phone,
            email: email.trim().toLowerCase(),
            bloodGroup,
            gender,
            dob,
            address,
            emergencyContact
        });

        const passwordHash = await bcrypt.hash(
            password,
            10
        );

        const user = await User.create({
            email: email.trim().toLowerCase(),
            passwordHash,

            isEmployee: false,

            UHID: patient.UHID,

            roleIds: [
                patientRole.roleId
            ],

            status: true,

            mustResetPassword: false
        });

        return res.status(201).json(
            new ApiResponse(
                201,
                {
                    patient,
                    user: {
                        id: user._id,
                        email: user.email,
                        UHID: user.UHID,
                        roleIds: user.roleIds,
                        status: user.status
                    }
                },
                "Patient registered successfully"
            )
        );

    } catch (err) {
        console.error(err);

        return res.status(500).json(
            new ApiError(
                500,
                err.message || "Internal Server Error"
            )
        );
    }
};

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
            email: email.trim().toLowerCase(),
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

        if (!user.status) {
            return res.status(403).json(
                new ApiError(
                    403,
                    "Your account is inactive"
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

        const patient = await Patient.findOne({
            UHID: user.UHID
        });

        const roles = await Role.find({
            roleId: { $in: user.roleIds }
        }).select(
            "roleId name permissions"
        );

        const permissions = [
            ...new Set(
                roles.flatMap(
                    role =>
                        role.permissions || []
                )
            )
        ];

        const token =
            user.generateAccessToken();

        user.lastLogin = new Date();

        await user.save();

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    token,

                    patient,

                    user: {
                        id: user._id,

                        email: user.email,

                        UHID: user.UHID,

                        roleIds:
                            user.roleIds,

                        roles: roles.map(
                            role => ({
                                roleId:
                                    role.roleId,
                                name:
                                    role.name
                            })
                        ),

                        permissions,

                        status:
                            user.status,

                        mustResetPassword:
                            user.mustResetPassword
                    }
                },
                "Patient logged in successfully"
            )
        );

    } catch (err) {
        console.error(err);

        return res.status(500).json(
            new ApiError(
                500,
                err.message ||
                "Internal Server Error"
            )
        );
    }
};