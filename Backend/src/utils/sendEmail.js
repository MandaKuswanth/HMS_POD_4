// utils/emailService.js
const SibApiV3Sdk = require('sib-api-v3-sdk');
const dotenv = require('dotenv'); // Ensure dotenv is loaded for this service as well if it's not guaranteed by main app entry

// Load environment variables if not already loaded (good practice for standalone utilities)
dotenv.config();

const defaultClient = SibApiV3Sdk.ApiClient.instance;
// Configure API key authorization: api-key
defaultClient.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const sendEmail = async ({ to, subject, html }) => {
    try {
        if (!process.env.BREVO_API_KEY) {
            console.error("BREVO_API_KEY is not set. Email sending skipped.");
            return;
        }
        if (!process.env.BREVO_SENDER_EMAIL) {
            console.error("BREVO_SENDER_EMAIL is not set. Email sending skipped.");
            return;
        }

        const sender = {
            email: process.env.BREVO_SENDER_EMAIL,
            name: "HMS" // Your hospital management system name
        };
        const receivers = [{ email: to }];

        const sendSmtpEmail = {
            sender: sender,
            to: receivers,
            subject: subject,
            htmlContent: html
        };

        await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log(`Email sent successfully to ${to}`);
    } catch (err) {
        console.log(err);
        console.error("Brevo email error:", err.response ? err.response.text : err.message);
    }
};

module.exports = sendEmail;
