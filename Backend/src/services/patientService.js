const Patient = require('../models/Patient');
const ApiError = require('../utils/ApiError');
const userService = require('./userService');
const emailService = require('./emailService');

class PatientService {
    async registerPatient({ name, phone, email, password, bloodGroup, gender, dob, address, emergencyContact }) {
        const existingPatient = await Patient.findOne({
            $or: [
                { email: email.trim().toLowerCase() },
                { phone }
            ],
            isDeleted: false
        });

        if (existingPatient) {
            throw new ApiError(409, "Patient already exists with this email or phone");
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

        const user = await userService.createUser({
            email: email.trim().toLowerCase(),
            tempPassword: password,
            roleName: "PATIENT",
            isEmployee: false,
            UHID: patient.UHID,
            status: true,
            mustResetPassword: false
        });

        // Send welcome email
        await emailService.sendPatientWelcome(user.email, patient.name, patient.UHID);

        return { patient, user };
    }
}

module.exports = new PatientService();
