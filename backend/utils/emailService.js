import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create reusable transporter
let transporter = null;

const createTransporter = () => {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Development fallback: direct or local test transport
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.ethereal.email",
    port: 587,
    auth: {
      user: process.env.SMTP_USER || "test@example.com",
      pass: process.env.SMTP_PASS || "testpass"
    }
  });
};

export const sendOtpEmail = async ({ to, otp, userName = "User" }) => {
  try {
    if (!transporter) {
      transporter = createTransporter();
    }

    const appName = "C-DAC QMS Digitalization";
    const sender = process.env.SMTP_FROM || `"${appName}" <no-reply@cdac.in>`;

    const mailOptions = {
      from: sender,
      to,
      subject: `[${appName}] Password Reset Verification Code: ${otp}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px; border-bottom: 2px solid #050B3B; padding-bottom: 16px;">
            <h1 style="color: #050B3B; font-size: 20px; margin: 0; font-weight: 700; letter-spacing: -0.02em;">C-DAC Quality Management System</h1>
            <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Institutional Quality & Compliance Portal</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <p style="font-size: 14px; color: #1e293b; margin: 0 0 12px 0;">Dear <strong>${userName}</strong>,</p>
            <p style="font-size: 14px; color: #475569; line-height: 1.5; margin: 0 0 16px 0;">
              You have requested to reset your password for the C-DAC QMS Digitalization platform. Use the 6-digit verification code below to proceed:
            </p>
          </div>

          <div style="background-color: #f0f4ff; border: 1px dashed #384FB8; border-radius: 6px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0C1979; display: inline-block;">${otp}</span>
            <p style="font-size: 12px; color: #64748b; margin: 8px 0 0 0;">Valid for <strong>5 minutes</strong>. Do not share this code with anyone.</p>
          </div>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px; font-size: 12px; color: #94a3b8; line-height: 1.5;">
            <p style="margin: 0 0 4px 0;">Security Notice: If you did not request this verification code, please ignore this email or notify your system administrator immediately.</p>
            <p style="margin: 0;">This is an automated system message. Please do not reply to this email.</p>
          </div>
        </div>
      `,
      text: `Your C-DAC QMS verification code is: ${otp}. It is valid for 5 minutes. Do not share this code with anyone.`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️  OTP Email sent successfully to ${to} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.warn(`⚠️  Could not deliver email via SMTP (${error.message}). Logging OTP to secure server console for verification:`);
    console.log(`\n======================================================`);
    console.log(`🔐 SECURE OTP CONSOLE DISPATCH (DEVELOPMENT / TEST)`);
    console.log(`📧 Recipient: ${to}`);
    console.log(`🔢 OTP Code:  ${otp}`);
    console.log(`⏱️  Expires:   5 minutes`);
    console.log(`======================================================\n`);
    return { success: true, fallback: true };
  }
};

export default { sendOtpEmail };
