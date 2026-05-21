const SibApiV3Sdk = require('sib-api-v3-sdk');

const defaultClient = SibApiV3Sdk.ApiClient.instance;

defaultClient.authentications['api-key'].apiKey =
    process.env.BREVO_API_KEY;

const apiInstance =
    new SibApiV3Sdk.TransactionalEmailsApi();

const sendEmail = async({
    to,
    subject,
    html
}) => {

    try {

        const sender = {
            email: process.env.BREVO_SENDER_EMAIL,
            name: "HMS"
        };

        const receivers = [{
            email: to
        }];

        await apiInstance.sendTransacEmail({

            sender,

            to: receivers,

            subject,

            htmlContent: html
        });

        console.log("Email sent successfully");

    } catch (err) {

        console.error("Brevo email error:", err);
    }

};

module.exports = sendEmail;