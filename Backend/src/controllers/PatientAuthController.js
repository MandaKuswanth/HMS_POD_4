const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Patient = require("../models/Patient");
const sendMail = require("../utils/sendEmail");

/*
|--------------------------------------------------------------------------
| REGISTER PATIENT
|--------------------------------------------------------------------------
*/
const registerPatient = async (req, res) => {
    try {
        const {
            name,
            gender,
            dob,
            phone,
            email,
            password,
            confirmPassword,
            address,
            emergencyContactName,
            emergencyContactRelation,
            emergencyContactPhone,
            bloodGroup,
            allergies,
        } = req.body;

        if (
            !name ||
            !gender ||
            !dob ||
            !phone ||
            !email ||
            !password ||
            !confirmPassword
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, gender, dob, phone, email, password and confirmPassword are required.",
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Password and confirm password do not match.",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const normalizedGender = gender.toLowerCase().trim();

        if (!["male", "female", "others"].includes(normalizedGender)) {
            return res.status(400).json({
                success: false,
                message: "Gender must be male, female, or others.",
            });
        }

        const existingUser = await User.findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email is already registered.",
            });
        }

        const existingPatientEmail = await Patient.findOne({
            email: normalizedEmail,
        });

        if (existingPatientEmail) {
            return res.status(409).json({
                success: false,
                message: "Patient already exists with this email.",
            });
        }

        const existingPatientPhone = await Patient.findOne({
            phone: phone.trim(),
        });

        if (existingPatientPhone) {
            return res.status(409).json({
                success: false,
                message: "Patient already exists with this phone number.",
            });
        }

        const patient = await Patient.create({
            name: name.trim(),
            gender: normalizedGender,
            dob,
            phone: phone.trim(),
            email: normalizedEmail,
            address,

            emergencyContact: {
                name: emergencyContactName,
                relation: emergencyContactRelation,
                phone: emergencyContactPhone,
            },

            bloodGroup,
            allergies,
        });

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await User.create({
            email: normalizedEmail,
            passwordHash,
            roles: "PATIENT",
            patientId: patient.UHID,
            status: true,
            mustResetPassword: false,
        });

        try {
            await sendMail({
                to: patient.email,
                subject: "Patient Registration Successful",
                text: `Dear ${patient.name}, your registration is successful. Your UHID is ${patient.UHID}.`,
                html: `
                    <p>Dear <b>${patient.name}</b>,</p>
                    <p>Your registration is successful.</p>
                    <p>Your UHID is <b>${patient.UHID}</b>.</p>
                `,
            });
        } catch (mailError) {
            console.log("Mail sending failed:", mailError.message);
        }

        return res.status(201).json({
            success: true,
            message: "Patient registered successfully.",
            data: {
                patient,
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.roles,
                    patientId: user.patientId,
                    status: user.status,
                },
            },
        });
    } catch (error) {
        console.log("Patient registration error:", error);

        return res.status(500).json({
            success: false,
            message: "Patient registration failed.",
            error: error.message,
        });
    }
};

/*
|--------------------------------------------------------------------------
| LOGIN PATIENT
|--------------------------------------------------------------------------
*/
const loginPatient = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required.",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const user = await User.findOne({
            email: normalizedEmail,
            roles: "PATIENT",
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        if (!user.status) {
            return res.status(403).json({
                success: false,
                message: "Patient account is inactive.",
            });
        }

        const isMatch = await user.isPasswordCorrect(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        const patient = await Patient.findOne({
            UHID: user.patientId,
        });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient profile not found.",
            });
        }

        if (!patient.status) {
            return res.status(403).json({
                success: false,
                message: "Patient profile is inactive.",
            });
        }

        user.lastLogin = new Date();
        await user.save();

        const token = user.generateAccessToken();

        return res.status(200).json({
            success: true,
            message: "Patient logged in successfully.",
            data: {
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.roles,
                    patientId: user.patientId,
                    status: user.status,
                },
                patient,
            },
        });
    } catch (error) {
        console.log("Patient login error:", error);

        return res.status(500).json({
            success: false,
            message: "Patient login failed.",
            error: error.message,
        });
    }
};

module.exports = {
    registerPatient,
    loginPatient,
};