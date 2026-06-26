const { sendEmail } = require('../utils/sendEmail');
const templates = require('../utils/emailTemplates');

class EmailService {
    async sendPasswordResetOTP(email, otp, name) {
        const html = templates.getPasswordResetOTPTemplate(name, otp);
        await sendEmail({
            to: email,
            subject: "Password Reset OTP - Hospital Management System",
            html
        });
    }

    async sendWelcomeEmployee(email, name, role, tempPassword) {
        const html = templates.getWelcomeEmployeeTemplate(name, role, email, tempPassword);
        await sendEmail({
            to: email,
            subject: "Welcome to HMS",
            html
        });
    }

    async sendSelfRegisterPending(email, name) {
        const html = templates.getSelfRegisterPendingTemplate(name, email);
        await sendEmail({
            to: email,
            subject: "Registration Pending Approval - HMS",
            html
        });
    }

    async sendEmployeeApproved(email, name, tempPassword) {
        const html = templates.getEmployeeApprovedTemplate(name, tempPassword);
        await sendEmail({
            to: email,
            subject: "HMS Account Approved",
            html
        });
    }

    async sendEmployeeRejected(email, name, reason) {
        const html = templates.getEmployeeRejectedTemplate(name, reason);
        await sendEmail({
            to: email,
            subject: "HMS Registration Rejected",
            html
        });
    }

    async sendPatientWelcome(email, name, uhid) {
        const html = templates.getPatientWelcomeTemplate(name, email, uhid);
        await sendEmail({
            to: email,
            subject: "Welcome to HMS",
            html
        });
    }

    async sendAppointmentCancelled(email, patientName, appointment, reason) {
        const html = templates.getAppointmentCancelledTemplate(patientName, appointment, reason);
        await sendEmail({
            to: email,
            subject: "HMS Appointment Cancelled",
            html
        });
    }

    async sendAppointmentConfirmed(email, patientName, date, timeSlot) {
        const html = templates.getAppointmentConfirmedTemplate(patientName, date, timeSlot);
        await sendEmail({
            to: email,
            subject: "HMS Appointment Confirmed",
            html
        });
    }

    async sendAppointmentApproved(email, patientName, date, timeSlot) {
        const html = templates.getAppointmentApprovedTemplate(patientName, date, timeSlot);
        await sendEmail({
            to: email,
            subject: "HMS Appointment Approved",
            html
        });
    }

    async sendAppointmentRejected(email, patientName, date, timeSlot, reason) {
        const html = templates.getAppointmentRejectedTemplate(patientName, date, timeSlot, reason);
        await sendEmail({
            to: email,
            subject: "HMS Appointment Rejected",
            html
        });
    }
}

module.exports = new EmailService();
