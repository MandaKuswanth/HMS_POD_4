// utils/emailTemplates.js

const getAppointmentCancelledTemplate = (patientName, appointment, reason) => `
    <h2>Appointment Cancelled</h2>
    <p>Hello ${patientName},</p>
    <p>Your appointment has been cancelled because the assigned doctor is currently unavailable.</p>
    <p><strong>Appointment ID:</strong> ${appointment.appointmentId}</p>
    <p><strong>Date:</strong> ${appointment.date?.toDateString()}</p>
    <p><strong>Time Slot:</strong> ${appointment.timeSlot}</p>
    <p><strong>Reason:</strong> ${reason}</p>
    <p>Please contact hospital reception to book another appointment.</p>
    <p>Thank you,<br/>HMS Team</p>
`;

const getWelcomeEmployeeTemplate = (name, role, email, tempPassword) => `
    <h2>Welcome to HMS</h2>
    <p>Hello ${name},</p>
    <p>Your employee account has been created successfully.</p>
    <p><strong>Role:</strong> ${role}</p>
    <p><strong>Login Email:</strong> ${email}</p>
    <p><strong>Temporary Password:</strong> ${tempPassword}</p>
    <p>Please login and change your password immediately.</p>
`;

const getSelfRegisterPendingTemplate = (name, email) => `
    <h2>Registration Submitted</h2>
    <p>Hello ${name},</p>
    <p>Your registration for HMS is pending admin approval.</p>
    <p><strong>Email:</strong> ${email}</p>
    <p>You will receive another email once your account is approved.</p>
`;

const getEmployeeApprovedTemplate = (name, tempPassword) => `
    <h2>Account Approved</h2>
    <p>Hello ${name},</p>
    <p>Your employee account has been approved by the admin.</p>
    <p><strong>Temporary Password:</strong> ${tempPassword}</p>
    <p>Please login and change your password immediately.</p>
`;

const getEmployeeRejectedTemplate = (name, reason) => `
    <h2>Registration Rejected</h2>
    <p>Hello ${name},</p>
    <p>Your employee registration has been rejected by the admin.</p>
    <p><strong>Reason:</strong> ${reason}</p>
    <p>Contact HR for more details.</p>
`;

const getPatientWelcomeTemplate = (name, email, uhid) => `
    <h2>Patient Registration Successful</h2>
    <p>Hello ${name},</p>
    <p>Your patient account has been created successfully.</p>
    <p><strong>UHID:</strong> ${uhid}</p>
    <p><strong>Login Email:</strong> ${email}</p>
    <p>You can now login to book appointments and view your medical records.</p>
`;

const getAppointmentConfirmedTemplate = (patientName, date, timeSlot) => `
    <h2>Appointment Confirmed</h2>
    <p>Hello ${patientName},</p>
    <p>Your appointment has been booked successfully for <strong>${date}</strong> at <strong>${timeSlot}</strong>.</p>
    <p>Please arrive 15 minutes early.</p>
`;

const getAppointmentApprovedTemplate = (patientName, date, timeSlot) => `
    <h2>Appointment Approved</h2>
    <p>Hello ${patientName},</p>
    <p>Your appointment request for <strong>${date}</strong> at <strong>${timeSlot}</strong> has been approved.</p>
`;

const getAppointmentRejectedTemplate = (patientName, date, timeSlot, reason) => `
    <h2>Appointment Request Rejected</h2>
    <p>Hello ${patientName},</p>
    <p>Your appointment request for <strong>${date}</strong> at <strong>${timeSlot}</strong> has been rejected.</p>
    <p><strong>Reason:</strong> ${reason}</p>
    <p>Please try booking another slot or contact reception.</p>
`;

const getPasswordResetOTPTemplate = (name, otp) => `
    <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 500px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px; }
                .header { text-align: center; margin-bottom: 30px; }
                .header h1 { color: #0066cc; margin: 0; }
                .content { background-color: white; padding: 20px; border-radius: 5px; }
                .otp-box { background-color: #f0f0f0; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0; border: 2px solid #0066cc; }
                .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0066cc; }
                .info { background-color: #e8f4f8; padding: 10px; border-left: 4px solid #0066cc; margin: 15px 0; font-size: 14px; }
                .footer { text-align: center; font-size: 12px; color: #999; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header"><h1>Password Reset Request</h1></div>
                <div class="content">
                    <p>Hello <strong>${name}</strong>,</p>
                    <p>We received a request to reset your Hospital Management System password.</p>
                    <p>Your One-Time Password (OTP) is:</p>
                    <div class="otp-box"><div class="otp-code">${otp}</div></div>
                    <div class="info">
                        <strong>⏱️ Validity:</strong> This OTP is valid for 10 minutes only.<br>
                        <strong>🔒 Security:</strong> Never share this OTP with anyone.
                    </div>
                </div>
                <div class="footer">
                    <p>© Hospital Management System. This is an automated email, please do not reply.</p>
                </div>
            </div>
        </body>
    </html>
`;

module.exports = {
    getAppointmentCancelledTemplate,
    getWelcomeEmployeeTemplate,
    getSelfRegisterPendingTemplate,
    getEmployeeApprovedTemplate,
    getEmployeeRejectedTemplate,
    getPatientWelcomeTemplate,
    getAppointmentConfirmedTemplate,
    getAppointmentApprovedTemplate,
    getAppointmentRejectedTemplate,
    getPasswordResetOTPTemplate
};
