// utils/SendEmail.js
const SibApiV3Sdk = require('sib-api-v3-sdk');
const dotenv = require('dotenv');

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

// ✅ NEW: Send password reset OTP email
const sendPasswordResetOTP = async (email, otp, patientName = "Patient") => {
    const subject = "Password Reset OTP - Hospital Management System";
    
    const html = `
        <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 500px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .header h1 { color: #0066cc; margin: 0; }
                    .content { background-color: white; padding: 20px; border-radius: 5px; }
                    .otp-box { 
                        background-color: #f0f0f0; 
                        padding: 15px; 
                        text-align: center; 
                        border-radius: 5px; 
                        margin: 20px 0;
                        border: 2px solid #0066cc;
                    }
                    .otp-code { 
                        font-size: 32px; 
                        font-weight: bold; 
                        letter-spacing: 5px; 
                        color: #0066cc;
                    }
                    .info { 
                        background-color: #e8f4f8; 
                        padding: 10px; 
                        border-left: 4px solid #0066cc; 
                        margin: 15px 0;
                        font-size: 14px;
                    }
                    .footer { text-align: center; font-size: 12px; color: #999; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Password Reset Request</h1>
                    </div>
                    
                    <div class="content">
                        <p>Hello <strong>${patientName}</strong>,</p>
                        
                        <p>We received a request to reset your Hospital Management System password.</p>
                        
                        <p>Your One-Time Password (OTP) is:</p>
                        
                        <div class="otp-box">
                            <div class="otp-code">${otp}</div>
                        </div>
                        
                        <div class="info">
                            <strong>⏱️ Validity:</strong> This OTP is valid for 10 minutes only.<br>
                            <strong>🔒 Security:</strong> Never share this OTP with anyone.
                        </div>
                        
                        <p><strong>Steps to reset your password:</strong></p>
                        <ol>
                            <li>Enter your OTP on the verification screen</li>
                            <li>Set your new password</li>
                            <li>Confirm your new password</li>
                            <li>Login with your new password</li>
                        </ol>
                        
                        <p style="color: #999; font-size: 13px;">
                            If you didn't request a password reset, please ignore this email and your password will remain unchanged.
                        </p>
                    </div>
                    
                    <div class="footer">
                        <p>© Hospital Management System. This is an automated email, please do not reply.</p>
                    </div>
                </div>
            </body>
        </html>
    `;

    try {
        await sendEmail({
            to: email,
            subject: subject,
            html: html
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to send OTP email:", error);
        return { success: false, error: error.message };
    }
};

module.exports = { sendEmail, sendPasswordResetOTP };
