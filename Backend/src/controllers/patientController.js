const crypto = require("crypto");

const Patient = require("../models/Patient");
const User = require("../models/User");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const sendMail = require("../utils/sendEmail");


/*

 CREATE PATIENT

*/

exports.createPatient = async (req, res) => {
    try {
        const {
            name,
            phone,
            email,
            gender,
            dob,
            address,
            emergencyContact,
            bloodGroup,
            allergies
        } = req.body;

        if (!name || !phone || !email || !gender || !dob) {
            return res.status(400).json(
                new ApiError(400, "Name, phone, email, gender and dob are required")
            );
        }

        const normalizedEmail = email.toLowerCase().trim();
        const normalizedGender = gender.toLowerCase().trim();

        if (!["male", "female", "others"].includes(normalizedGender)) {
            return res.status(400).json(
                new ApiError(400, "Gender must be male, female, or others")
            );
        }

        const existingPatient = await Patient.findOne({
            $or: [
                { phone: phone.trim() },
                { email: normalizedEmail }
            ]
        });

        if (existingPatient) {
            return res.status(409).json(
                new ApiError(409, "Patient already exists with this phone or email")
            );
        }

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json(
                new ApiError(409, "User account already exists with this email")
            );
        }

        const rawToken = crypto.randomBytes(32).toString("hex");

        const hashedToken = crypto
            .createHash("sha256")
            .update(rawToken)
            .digest("hex");

        const patient = await Patient.create({
            name: name.trim(),
            phone: phone.trim(),
            email: normalizedEmail,
            gender: normalizedGender,
            dob,
            address,
            emergencyContact,
            bloodGroup,
            allergies,
            status: true,
            authStatus: "INVITED",
            passwordSetToken: hashedToken,
            passwordSetTokenExpiry: Date.now() + 1000 * 60 * 30
        });

        const setPasswordLink = `${process.env.PATIENT_APP_URL}/set-password?token=${rawToken}`;

        try {
            await sendMail({
                to: patient.email,
                subject: "HMS Patient Account Invitation - Set Password",
                text: `Your patient profile has been created. Set your password using this link: ${setPasswordLink}`,
                html: `
                    <p>Dear <b>${patient.name}</b>,</p>
                    <p>Your patient profile has been created successfully.</p>
                    <p>Your UHID is <b>${patient.UHID}</b>.</p>
                    <p>Please set your password using the link below:</p>
                    <a href="${setPasswordLink}">Set Password</a>
                    <p>This link expires in 30 minutes.</p>
                `
            });
        } catch (mailError) {
            console.log("Patient invite mail failed:", mailError.message);
        }

        return res.status(201).json(
            new ApiResponse(201, patient, "Patient created and invite email sent successfully")
        );

    } catch (err) {
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};
/*
GET ALL PATIENTS

*/
exports.getPatients = async (req, res) => {
    try {
        const patients = await Patient.find().sort({ created_at: -1 });

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    patients,
                    count: patients.length
                },
                "Patients fetched successfully"
            )
        );

    } catch (err) {
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};

/*
GET PATIENT BY UHID
*/
exports.getPatientById = async (req, res) => {
    try {
        const { uhid } = req.params;

        const patient = await Patient.findOne({ UHID: uhid });

        if (!patient) {
            return res.status(404).json(
                new ApiError(404, "Patient not found")
            );
        }

        return res.status(200).json(
            new ApiResponse(200, patient, "Patient retrieved successfully")
        );

    } catch (err) {
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};

/*
 UPDATE PATIENT
*/exports.updatePatient = async (req, res) => {
    try {
        const { uhid } = req.params;

        const patient = await Patient.findOne({ UHID: uhid });

        if (!patient) {
            return res.status(404).json(
                new ApiError(404, "Patient not found")
            );
        }

        const {
            name,
            phone,
            email,
            gender,
            dob,
            address,
            emergencyContact,
            bloodGroup,
            allergies,
            status
        } = req.body;

        // Email update + duplicate check
        if (email !== undefined) {
            const normalizedEmail = email.toLowerCase().trim();

            const existingEmail = await Patient.findOne({
                email: normalizedEmail,
                UHID: { $ne: uhid }
            });

            if (existingEmail) {
                return res.status(409).json(
                    new ApiError(409, "Email already exists for another patient")
                );
            }

            patient.email = normalizedEmail;
        }

        // Phone update + duplicate check
        if (phone !== undefined) {
            const normalizedPhone = phone.trim();

            const existingPhone = await Patient.findOne({
                phone: normalizedPhone,
                UHID: { $ne: uhid }
            });

            if (existingPhone) {
                return res.status(409).json(
                    new ApiError(409, "Phone number already exists for another patient")
                );
            }

            patient.phone = normalizedPhone;
        }

        // Name update
        if (name !== undefined) {
            patient.name = name.trim();
        }

        // Gender update + validation
        if (gender !== undefined) {
            const normalizedGender = gender.toLowerCase().trim();

            if (!["male", "female", "others"].includes(normalizedGender)) {
                return res.status(400).json(
                    new ApiError(400, "Gender must be male, female, or others")
                );
            }

            patient.gender = normalizedGender;
        }

        // DOB update
        if (dob !== undefined) {
            patient.dob = dob;
        }

        // Address update
        if (address !== undefined) {
            patient.address = address.trim();
        }

        // Emergency contact update
        if (emergencyContact !== undefined) {
            patient.emergencyContact = {
                name: emergencyContact.name || patient.emergencyContact?.name,
                relation: emergencyContact.relation || patient.emergencyContact?.relation,
                phone: emergencyContact.phone || patient.emergencyContact?.phone
            };
        }

        // Blood group update
        if (bloodGroup !== undefined) {
            patient.bloodGroup = bloodGroup.trim();
        }

        // Allergies update
        if (allergies !== undefined) {
            patient.allergies = allergies.trim();
        }

        // Status update
        if (status !== undefined) {
            patient.status = status;
        }

        const updatedPatient = await patient.save();

        return res.status(200).json(
            new ApiResponse(
                200,
                updatedPatient,
                "Patient updated successfully"
            )
        );

    } catch (err) {
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};

/*
 DELETE PATIENT
*/
exports.deletePatient = async (req, res) => {
    try {
        const { uhid } = req.params;

        const patient = await Patient.findOne({ UHID: uhid });

        if (!patient) {
            return res.status(404).json(
                new ApiError(404, "Patient not found")
            );
        }

        await Patient.deleteOne({ UHID: uhid });

        // Optional: also delete patient login account from User model
        await User.deleteOne({
            roles: "PATIENT",
            patientId: uhid
        });

        return res.status(200).json(
            new ApiResponse(200, null, "Patient deleted successfully")
        );

    } catch (err) {
        return res.status(500).json(
            new ApiError(500, err.message || "Internal Server Error")
        );
    }
};
exports.getPatientProfile = async (req, res) => {
    try {
        const patientId = req.user.patientId;

        if (!patientId) {
            return res.status(400).json(
                new ApiError(400, "Patient ID not found in token")
            );
        }

        const patient = await Patient.findOne({ UHID: patientId });

        if (!patient) {
            return res.status(404).json(
                new ApiError(404, "Patient profile not found")
            );
        }

        return res.status(200).json(
            new ApiResponse(200, patient, "Patient profile fetched successfully")
        );

    } catch (error) {
        return res.status(500).json(
            new ApiError(500, error.message)
        );
    }
};


exports.updatePatientProfile = async (req, res) => {
    try {
        const patientId = req.user.patientId;

        if (!patientId) {
            return res.status(400).json(
                new ApiError(400, "Patient ID not found in token")
            );
        }

        const patient = await Patient.findOne({ UHID: patientId });

        if (!patient) {
            return res.status(404).json(
                new ApiError(404, "Patient profile not found")
            );
        }

        const allowedFields = [
            "name",
            "phone",
            "email",
            "dob",
            "gender",
            "address",
            "emergencyContact"
        ];

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                patient[field] = req.body[field];
            }
        });

        await patient.save();

        return res.status(200).json(
            new ApiResponse(200, patient, "Patient profile updated successfully")
        );

    } catch (error) {
        return res.status(500).json(
            new ApiError(500, error.message)
        );
    }
};