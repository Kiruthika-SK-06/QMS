import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

let transporter = null;
export const sentEmailsLog = []; // In-memory audit log of dispatched emails for test verification

export const isSmtpConfigured = () => {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
};

export const getTransporter = () => {
  if (transporter) return transporter;

  if (isSmtpConfigured()) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    return transporter;
  }

  // If in automated testing mode or local development with test flag
  if (process.env.NODE_ENV === "test" || process.env.ENABLE_TEST_MAILER === "true") {
    transporter = {
      sendMail: async (options) => {
        sentEmailsLog.push({ ...options, date: new Date() });
        return {
          messageId: `test-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          response: "250 Test message accepted"
        };
      }
    };
    return transporter;
  }

  return null;
};

// Reset transporter (useful when environment variables change or for testing)
export const resetTransporter = () => {
  transporter = null;
};

const sendMailWithHandling = async (mailOptions) => {
  const currentTransporter = getTransporter();

  if (!currentTransporter) {
    const errorMsg = "Email delivery failed: SMTP is not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in .env.";
    console.error(`❌ [EMAIL ERROR] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  try {
    const info = await currentTransporter.sendMail(mailOptions);
    console.log(`✉️ [EMAIL SENT] Subject: "${mailOptions.subject}" -> To: ${mailOptions.to} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ [EMAIL DELIVERY ERROR] Failed to send email to ${mailOptions.to}:`, err.message);
    throw new Error(`Email delivery failed: ${err.message}`);
  }
};

const getSender = () => {
  return process.env.MAIL_FROM || process.env.SMTP_FROM || `"C-DAC QMS Portal" <no-reply@cdac.in>`;
};

const getFrontendUrl = () => {
  return process.env.FRONTEND_URL || "http://localhost:5173";
};

/**
 * 1. Account Invitation OTP Email
 */
export const sendInvitationOtpEmail = async ({ to, otp, userName = "Colleague", roleTitle = "Authorized Personnel" }) => {
  const frontendUrl = getFrontendUrl();
  const activationUrl = `${frontendUrl}/login?mode=activate&email=${encodeURIComponent(to)}`;

  const mailOptions = {
    from: getSender(),
    to,
    subject: `[C-DAC QMS] Invitation to Join Quality Management System - Activation Code: ${otp}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #050B3B; padding-bottom: 16px; margin-bottom: 24px;">
          <h2 style="color: #050B3B; margin: 0;">Centre for Development of Advanced Computing</h2>
          <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Institutional Quality Management System (QMS)</p>
        </div>
        <p style="font-size: 15px; color: #1e293b;">Dear <strong>${userName}</strong>,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">
          You have been invited by the QMS Coordinator to join the C-DAC Quality Management System as an authorized <strong>${roleTitle}</strong>.
        </p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">
          To activate your account and configure your secure personal password, please use the 6-digit activation code below:
        </p>
        <div style="background-color: #f0f4ff; border: 1px dashed #384FB8; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0;">
          <div style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0C1979;">${otp}</div>
          <p style="font-size: 12px; color: #64748b; margin: 8px 0 0 0;">This single-use code is valid for <strong>5 minutes</strong>.</p>
        </div>
        <p style="font-size: 13px; color: #475569;">
          You may also complete activation directly through the portal:
          <br/>
          <a href="${activationUrl}" style="color: #384FB8; font-weight: bold; text-decoration: underline;">Open QMS Activation Portal</a>
        </p>
        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px; font-size: 12px; color: #94a3b8;">
          <p style="margin: 0;">Notice: If you were not expecting this invitation, please contact your C-DAC QMS Coordinator.</p>
        </div>
      </div>
    `,
    text: `You have been invited to C-DAC QMS as ${roleTitle}. Your single-use activation code is: ${otp}. It expires in 5 minutes.`
  };

  return sendMailWithHandling(mailOptions);
};

/**
 * 2. Password Reset OTP Email
 */
export const sendPasswordResetOtpEmail = async ({ to, otp, userName = "User" }) => {
  const mailOptions = {
    from: getSender(),
    to,
    subject: `[C-DAC QMS] Password Reset Verification Code: ${otp}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #050B3B; padding-bottom: 16px; margin-bottom: 24px;">
          <h2 style="color: #050B3B; margin: 0;">Centre for Development of Advanced Computing</h2>
          <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Institutional Quality Management System (QMS)</p>
        </div>
        <p style="font-size: 15px; color: #1e293b;">Dear <strong>${userName}</strong>,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">
          A password reset request was initiated for your C-DAC QMS account. Enter the 6-digit verification code below to proceed with resetting your password:
        </p>
        <div style="background-color: #f0f4ff; border: 1px dashed #384FB8; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0;">
          <div style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0C1979;">${otp}</div>
          <p style="font-size: 12px; color: #64748b; margin: 8px 0 0 0;">Valid for <strong>5 minutes</strong>. Never share this code with anyone.</p>
        </div>
        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px; font-size: 12px; color: #94a3b8;">
          <p style="margin: 0;">Security Alert: If you did not request a password reset, please notify your QMS Coordinator immediately.</p>
        </div>
      </div>
    `,
    text: `Your C-DAC QMS password reset verification code is: ${otp}. Valid for 5 minutes.`
  };

  return sendMailWithHandling(mailOptions);
};

/**
 * 3. Account Activation Confirmation Email
 */
export const sendAccountActivatedEmail = async ({ to, userName = "User", roleTitle = "Authorized Personnel" }) => {
  const loginUrl = `${getFrontendUrl()}/login`;

  const mailOptions = {
    from: getSender(),
    to,
    subject: `[C-DAC QMS] Account Activated Successfully`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #050B3B; padding-bottom: 16px; margin-bottom: 24px;">
          <h2 style="color: #050B3B; margin: 0;">C-DAC Quality Management System</h2>
        </div>
        <h3 style="color: #166534; margin: 0 0 12px 0;">✓ Account Successfully Activated</h3>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">
          Dear <strong>${userName}</strong>, your C-DAC QMS account (${roleTitle}) is now active. Your password has been configured.
        </p>
        <p style="margin-top: 20px;">
          <a href="${loginUrl}" style="background-color: #050B3B; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: bold; display: inline-block;">
            Sign in to QMS Workspace
          </a>
        </p>
      </div>
    `,
    text: `Dear ${userName}, your C-DAC QMS account (${roleTitle}) has been activated successfully.`
  };

  return sendMailWithHandling(mailOptions);
};

/**
 * 4. Password Change Confirmation Email
 */
export const sendPasswordChangedEmail = async ({ to, userName = "User" }) => {
  const mailOptions = {
    from: getSender(),
    to,
    subject: `[C-DAC QMS] Security Notice: Your Password Has Been Changed`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #050B3B; padding-bottom: 16px; margin-bottom: 24px;">
          <h2 style="color: #050B3B; margin: 0;">C-DAC Quality Management System</h2>
        </div>
        <h3 style="color: #1e293b; margin: 0 0 12px 0;">Security Notification</h3>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">
          Dear <strong>${userName}</strong>, the password for your C-DAC QMS account (${to}) was successfully changed on ${new Date().toUTCString()}.
        </p>
        <p style="font-size: 13px; color: #b91c1c; font-weight: bold; margin-top: 16px;">
          If you did NOT perform this change, please contact the QMS Administrator immediately.
        </p>
      </div>
    `,
    text: `Dear ${userName}, the password for your C-DAC QMS account was successfully changed on ${new Date().toUTCString()}.`
  };

  return sendMailWithHandling(mailOptions);
};

export default {
  sendInvitationOtpEmail,
  sendPasswordResetOtpEmail,
  sendAccountActivatedEmail,
  sendPasswordChangedEmail,
  isSmtpConfigured,
  getTransporter,
  resetTransporter,
  sentEmailsLog
};
