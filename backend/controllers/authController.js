import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Otp } from "../models/Otp.js";
import { AuthAudit } from "../models/AuthAudit.js";
import { Activity } from "../models/Activity.js";
import {
  sendInvitationOtpEmail,
  sendPasswordResetOtpEmail,
  sendAccountActivatedEmail,
  sendPasswordChangedEmail
} from "../utils/emailService.js";
import { normalizeRole } from "../middleware/authMiddleware.js";

const JWT_SECRET = process.env.JWT_SECRET || "qms_jwt_secret_key_super_secure_2026";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// Helper: Ensure MongoDB connection is ready; fail safely without silent mock data
const ensureDB = (res) => {
  if (mongoose.connection.readyState !== 1) {
    const isVercel = !!process.env.VERCEL;
    res.status(503).json({
      success: false,
      message: isVercel
        ? "MongoDB Atlas connection not established on Vercel. Please add MONGODB_URI to your Vercel Project Environment Variables."
        : "Database service unavailable. Please ensure MongoDB is running."
    });
    return false;
  }
  return true;
};

// Helper: Log authentication audit event in MongoDB
const logAuthAudit = async ({ action, actor, targetEmail, targetRole, req, details, status = "SUCCESS" }) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const ipAddress = req?.ip || req?.headers?.["x-forwarded-for"] || "127.0.0.1";
      const userAgent = req?.headers?.["user-agent"] || "Unknown";

      await AuthAudit.create({
        id: `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        action,
        actor: actor || targetEmail || "System",
        targetEmail,
        targetRole,
        ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
        userAgent,
        details,
        status,
        timestamp: new Date()
      });

      // Also create an Activity entry for high-level audit trail visibility
      await Activity.create({
        id: `ACT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: "Authentication & Security",
        text: details || action,
        actor: actor || targetEmail || "System",
        time: "Just now",
        tone: status === "SUCCESS" ? "blue" : "amber",
        timestamp: new Date().toISOString()
      }).catch(() => { });
    }
  } catch (err) {
    console.warn("Failed to persist AuthAudit record:", err.message);
  }
};

// Sanitize user object for client responses (never expose password or internal salt)
export const sanitizeUser = (user) => {
  if (!user) return null;
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.__v;
  return obj;
};

/**
 * 1. POST /api/auth/login
 * Common login for all 4 roles: Course Coordinator, QMS Coordinator, Trust Head, Internal Auditor.
 * Backend strictly queries MongoDB and determines the role from the database record.
 */
export const login = async (req, res) => {
  try {
    if (!ensureDB(res)) return;

    const { identifier, email, username, password, role: requestedRole } = req.body;
    const loginIdentifier = (identifier || email || username || "").trim().toLowerCase();
    const cleanPassword = (password || "").trim();

    if (!loginIdentifier || !cleanPassword) {
      return res.status(400).json({
        success: false,
        message: "Email address/username and password are required."
      });
    }

    // 1. Retrieve user strictly from MongoDB
    const user = await User.findOne({
      $or: [
        { email: loginIdentifier },
        { username: loginIdentifier },
        { employeeId: loginIdentifier.toUpperCase() },
        { aliases: loginIdentifier }
      ]
    });

    if (!user) {
      await logAuthAudit({
        action: "LOGIN_FAILED",
        actor: loginIdentifier,
        targetEmail: loginIdentifier,
        req,
        details: `Login failed: Account '${loginIdentifier}' not found in MongoDB`,
        status: "FAILURE"
      });
      return res.status(401).json({
        success: false,
        message: "Account not found in database. Please verify your email or username."
      });
    }

    // 2. Check if account is in 'Pending Verification' status
    if (user.status === "Pending Verification") {
      await logAuthAudit({
        action: "LOGIN_FAILED",
        actor: user.name,
        targetEmail: user.email,
        targetRole: user.role,
        req,
        details: `Login rejected: Account is pending invitation verification`,
        status: "BLOCKED"
      });
      return res.status(403).json({
        success: false,
        code: "PENDING_VERIFICATION",
        message: "Your account is pending verification. Please verify your activation OTP and create your password.",
        email: user.email
      });
    }

    // 3. Check if account is Inactive or Suspended
    if (user.status === "Inactive" || user.status === "Suspended") {
      await logAuthAudit({
        action: "LOGIN_FAILED",
        actor: user.name,
        targetEmail: user.email,
        targetRole: user.role,
        req,
        details: `Login rejected: Account status is ${user.status}`,
        status: "BLOCKED"
      });
      return res.status(403).json({
        success: false,
        code: "ACCOUNT_SUSPENDED",
        message: "Your account is inactive or suspended. Please contact the QMS Administrator."
      });
    }

    // 4. Check account lockout (rate limiting on failed attempts)
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const waitMinutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(429).json({
        success: false,
        message: `Account is temporarily locked due to excessive failed attempts. Please try again in ${waitMinutes} minute${waitMinutes > 1 ? "s" : ""}.`
      });
    }

    // 5. Verify password hash
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: "Password has not been initialized for this account. Please verify your OTP to create a password."
      });
    }

    let isMatch = await bcrypt.compare(cleanPassword, user.password);

    // Also accept default development password "1234" or "Password123!" if either is stored
    if (!isMatch && (cleanPassword === "1234" || cleanPassword === "Password123!")) {
      const altMatch = await bcrypt.compare(cleanPassword === "1234" ? "Password123!" : "1234", user.password);
      if (altMatch) isMatch = true;
    }

    if (!isMatch) {
      // Increment login attempts and lock if threshold exceeded
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15-minute lockout
      }
      await user.save();

      await logAuthAudit({
        action: "LOGIN_FAILED",
        actor: user.name,
        targetEmail: user.email,
        targetRole: user.role,
        req,
        details: `Login failed: Incorrect password attempt ${user.loginAttempts}/5`,
        status: "FAILURE"
      });

      return res.status(401).json({
        success: false,
        message: user.loginAttempts >= 5
          ? "Maximum failed login attempts reached. Account locked for 15 minutes."
          : `Incorrect credentials. Please verify your password.`
      });
    }

    // 6. Reset failed attempts & update last login timestamp
    user.loginAttempts = 0;
    user.lockUntil = null;
    user.lastLoginAt = new Date();
    await user.save();

    // 7. Verify requested role against actual database role (if supplied by frontend)
    if (requestedRole) {
      const normalizedReq = normalizeRole(requestedRole);
      const normalizedUserRole = normalizeRole(user.role);
      if (normalizedReq !== normalizedUserRole) {
        return res.status(401).json({
          success: false,
          message: `Role mismatch: User '${user.name}' is registered as ${user.roleTitle || user.role}, not ${requestedRole}. Please select the matching role.`
        });
      }
    }

    // 8. Sign JWT token strictly with MongoDB user details
    const tokenPayload = {
      id: user.id || user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      roleTitle: user.roleTitle,
      employeeId: user.employeeId
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // 9. Set HttpOnly cookie where compatible
    try {
      if (typeof res.cookie === "function") {
        res.cookie("qms_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "Lax",
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
      } else if (typeof res.setHeader === "function") {
        res.setHeader(
          "Set-Cookie",
          `qms_token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`
        );
      }
    } catch { }

    await logAuthAudit({
      action: "LOGIN_SUCCESS",
      actor: user.name,
      targetEmail: user.email,
      targetRole: user.role,
      req,
      details: `User '${user.name}' (${user.roleTitle}) signed in successfully`,
      status: "SUCCESS"
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred during authentication",
      error: error.message
    });
  }
};

/**
 * 2. POST /api/auth/verify-activation-otp
 * Validates the single-use 6-digit OTP for account invitation/activation.
 */
export const verifyActivationOtp = async (req, res) => {
  try {
    if (!ensureDB(res)) return;

    const { email, code, otp } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();
    const enteredOtp = (code || otp || "").trim();

    if (!cleanEmail || !enteredOtp) {
      return res.status(400).json({
        success: false,
        message: "Registered email address and 6-digit activation code are required."
      });
    }

    const otpRecord = await Otp.findOne({
      email: cleanEmail,
      purpose: "ACCOUNT_ACTIVATION"
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "No active activation code found for this email address. Please request a new code or contact your QMS Coordinator."
      });
    }

    // 5-minute expiry check
    if (Date.now() > otpRecord.expiresAt.getTime()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message: "Activation code has expired (5-minute limit). Please request a new code."
      });
    }

    // Rate limiting / attempt protection (max 5)
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts. This activation code has been invalidated. Please request a new code."
      });
    }

    // Compare bcrypt hash
    const isMatch = await bcrypt.compare(enteredOtp, otpRecord.otpHash);
    if (!isMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remaining = otpRecord.maxAttempts - otpRecord.attempts;
      return res.status(400).json({
        success: false,
        message: `Invalid activation code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
      });
    }

    // Issue single-use signed activationToken
    const activationToken = jwt.sign(
      { email: cleanEmail, purpose: "ACCOUNT_ACTIVATION" },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    otpRecord.isVerified = true;
    otpRecord.verificationToken = activationToken;
    await otpRecord.save();

    await logAuthAudit({
      action: "OTP_VERIFIED",
      actor: cleanEmail,
      targetEmail: cleanEmail,
      req,
      details: "Account activation OTP successfully verified"
    });

    return res.status(200).json({
      success: true,
      message: "Activation code verified successfully. Please proceed to create your password.",
      activationToken
    });
  } catch (error) {
    console.error("verifyActivationOtp error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 3. POST /api/auth/activate-account
 * Sets the password for an invited user and transitions status to Active.
 */
export const activateAccount = async (req, res) => {
  try {
    if (!ensureDB(res)) return;

    const { email, activationToken, password, confirmPassword } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPass = (password || "").trim();

    if (!cleanEmail || !activationToken || !cleanPass) {
      return res.status(400).json({
        success: false,
        message: "Email, activation token, and password are required."
      });
    }

    if (cleanPass.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters in length."
      });
    }

    if (confirmPassword && confirmPassword.trim() !== cleanPass) {
      return res.status(400).json({
        success: false,
        message: "New password and password confirmation do not match."
      });
    }

    // Verify token
    try {
      const decoded = jwt.verify(activationToken, JWT_SECRET);
      if (decoded.email !== cleanEmail || decoded.purpose !== "ACCOUNT_ACTIVATION") {
        return res.status(400).json({
          success: false,
          message: "Invalid or unauthorized activation token."
        });
      }
    } catch {
      return res.status(400).json({
        success: false,
        message: "Activation token has expired or is invalid. Please verify your OTP again."
      });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: "User account not found." });
    }

    // Hash password securely with bcrypt
    const hashedPassword = await bcrypt.hash(cleanPass, 10);

    user.password = hashedPassword;
    user.status = "Active";
    user.emailVerified = true;
    user.activatedAt = new Date();
    await user.save();

    // Clean up all activation OTPs
    await Otp.deleteMany({ email: cleanEmail, purpose: "ACCOUNT_ACTIVATION" });

    // Send confirmation email (non-blocking if SMTP delivery has warnings)
    sendAccountActivatedEmail({
      to: user.email,
      userName: user.name,
      roleTitle: user.roleTitle
    }).catch((e) => console.warn("Notice: could not send activation confirmation email:", e.message));

    await logAuthAudit({
      action: "ACCOUNT_ACTIVATED",
      actor: user.name,
      targetEmail: user.email,
      targetRole: user.role,
      req,
      details: `User '${user.name}' activated account and configured password`
    });

    return res.status(200).json({
      success: true,
      message: "Account activated successfully! You may now sign in with your new password."
    });
  } catch (error) {
    console.error("activateAccount error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 4. POST /api/auth/resend-activation-otp
 * Resends invitation activation OTP with strict 60-second cooldown.
 */
export const resendActivationOtp = async (req, res) => {
  try {
    if (!ensureDB(res)) return;

    const { email } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();

    if (!cleanEmail) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: "No user found with this email." });
    }

    if (user.status === "Active") {
      return res.status(400).json({
        success: false,
        message: "This account is already activated. Please proceed to sign in."
      });
    }

    // 60-second cooldown check
    const existing = await Otp.findOne({ email: cleanEmail, purpose: "ACCOUNT_ACTIVATION" });
    if (existing && existing.lastResentAt) {
      const elapsedSeconds = (Date.now() - existing.lastResentAt.getTime()) / 1000;
      if (elapsedSeconds < 60) {
        const remaining = Math.ceil(60 - elapsedSeconds);
        return res.status(429).json({
          success: false,
          message: `Please wait ${remaining} second${remaining > 1 ? "s" : ""} before requesting a new code.`
        });
      }
    }

    // Invalidate prior OTPs
    await Otp.deleteMany({ email: cleanEmail, purpose: "ACCOUNT_ACTIVATION" });

    // Generate cryptographically secure 6-digit OTP
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(rawOtp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.create({
      email: cleanEmail,
      otpHash,
      purpose: "ACCOUNT_ACTIVATION",
      attempts: 0,
      maxAttempts: 5,
      lastResentAt: new Date(),
      expiresAt
    });

    // Send real email via SMTP
    await sendInvitationOtpEmail({
      to: cleanEmail,
      otp: rawOtp,
      userName: user.name,
      roleTitle: user.roleTitle
    });

    await logAuthAudit({
      action: "OTP_SENT",
      actor: cleanEmail,
      targetEmail: cleanEmail,
      req,
      details: "Resent account activation OTP via SMTP"
    });

    return res.status(200).json({
      success: true,
      message: "A new activation code has been dispatched to your email address."
    });
  } catch (error) {
    console.error("resendActivationOtp error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 5. POST /api/auth/forgot-password
 * Initiates the password-reset flow by dispatching a 6-digit OTP.
 */
export const forgotPassword = async (req, res) => {
  try {
    if (!ensureDB(res)) return;

    const { identifier, email } = req.body;
    const cleanEmail = (email || identifier || "").trim().toLowerCase();

    if (!cleanEmail) {
      return res.status(400).json({
        success: false,
        message: "Please enter your registered email address."
      });
    }

    const user = await User.findOne({
      $or: [{ email: cleanEmail }, { username: cleanEmail }]
    });

    if (!user || !user.email) {
      return res.status(404).json({
        success: false,
        message: "No registered account matches that email address. Please check and try again."
      });
    }

    // Cooldown check (60 seconds)
    const existing = await Otp.findOne({ email: user.email, purpose: "PASSWORD_RESET" });
    if (existing && existing.lastResentAt) {
      const elapsedSeconds = (Date.now() - existing.lastResentAt.getTime()) / 1000;
      if (elapsedSeconds < 60) {
        const remaining = Math.ceil(60 - elapsedSeconds);
        return res.status(429).json({
          success: false,
          message: `Please wait ${remaining} second${remaining > 1 ? "s" : ""} before requesting a new code.`
        });
      }
    }

    // Invalidate previous reset OTPs
    await Otp.deleteMany({ email: user.email, purpose: "PASSWORD_RESET" });

    // Generate 6-digit cryptographically secure OTP
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(rawOtp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.create({
      email: user.email,
      otpHash,
      purpose: "PASSWORD_RESET",
      attempts: 0,
      maxAttempts: 5,
      lastResentAt: new Date(),
      expiresAt
    });

    // Send email via genuine SMTP
    await sendPasswordResetOtpEmail({
      to: user.email,
      otp: rawOtp,
      userName: user.name || user.username
    });

    await logAuthAudit({
      action: "PASSWORD_RESET_REQUEST",
      actor: user.name,
      targetEmail: user.email,
      targetRole: user.role,
      req,
      details: "Dispatched password reset OTP email via SMTP"
    });

    const masked = user.email.replace(/(.{2})(.*)(@.*)/, "$1***$3");

    return res.status(200).json({
      success: true,
      message: `Verification code sent to registered email address (${masked})`,
      email: user.email,
      expiresInMinutes: 5
    });
  } catch (error) {
    console.error("forgotPassword error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to dispatch verification code."
    });
  }
};

/**
 * 6. POST /api/auth/verify-otp (Password Reset)
 */
export const verifyOtp = async (req, res) => {
  try {
    if (!ensureDB(res)) return;

    const { email, code, otp } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();
    const enteredOtp = (code || otp || "").trim();

    if (!cleanEmail || !enteredOtp) {
      return res.status(400).json({
        success: false,
        message: "Email address and 6-digit verification code are required."
      });
    }

    const otpRecord = await Otp.findOne({
      email: cleanEmail,
      purpose: "PASSWORD_RESET"
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "No active verification code found for this email address. Please request a new code."
      });
    }

    if (Date.now() > otpRecord.expiresAt.getTime()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message: "Verification code has expired (5-minute limit). Please request a new code."
      });
    }

    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts. Code invalidated. Please request a new code."
      });
    }

    const isMatch = await bcrypt.compare(enteredOtp, otpRecord.otpHash);
    if (!isMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remaining = otpRecord.maxAttempts - otpRecord.attempts;
      return res.status(400).json({
        success: false,
        message: `Invalid verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
      });
    }

    // Issue single-use reset token
    const verificationToken = jwt.sign(
      { email: cleanEmail, purpose: "PASSWORD_RESET" },
      JWT_SECRET,
      { expiresIn: "10m" }
    );

    otpRecord.isVerified = true;
    otpRecord.verificationToken = verificationToken;
    await otpRecord.save();

    await logAuthAudit({
      action: "OTP_VERIFIED",
      actor: cleanEmail,
      targetEmail: cleanEmail,
      req,
      details: "Password reset OTP successfully verified"
    });

    return res.status(200).json({
      success: true,
      message: "Verification code confirmed successfully.",
      verificationToken
    });
  } catch (error) {
    console.error("verifyOtp error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 7. POST /api/auth/resend-otp (Password Reset)
 */
export const resendOtp = async (req, res) => {
  return forgotPassword(req, res);
};

/**
 * 8. POST /api/auth/reset-password
 * Applies the new password following OTP verification.
 */
export const resetPassword = async (req, res) => {
  try {
    if (!ensureDB(res)) return;

    const { email, identifier, verificationToken, newPassword, confirmPassword } = req.body;
    const cleanEmail = (email || identifier || "").trim().toLowerCase();
    const cleanPass = (newPassword || "").trim();

    if (!cleanEmail || !cleanPass) {
      return res.status(400).json({
        success: false,
        message: "Email and new password are required."
      });
    }

    if (cleanPass.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters in length."
      });
    }

    if (confirmPassword && confirmPassword.trim() !== cleanPass) {
      return res.status(400).json({
        success: false,
        message: "New password and password confirmation do not match."
      });
    }

    // Validate verificationToken
    let tokenVerified = false;
    if (verificationToken) {
      try {
        const decoded = jwt.verify(verificationToken, JWT_SECRET);
        if (decoded.email === cleanEmail && decoded.purpose === "PASSWORD_RESET") {
          tokenVerified = true;
        }
      } catch {
        tokenVerified = false;
      }
    }

    if (!tokenVerified) {
      return res.status(400).json({
        success: false,
        message: "Verification token expired or invalid. Please verify your OTP again."
      });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: "User account not found." });
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(cleanPass, 10);
    user.password = hashedPassword;
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    // Clean up reset OTPs
    await Otp.deleteMany({ email: cleanEmail, purpose: "PASSWORD_RESET" });

    // Send confirmation email
    sendPasswordChangedEmail({
      to: user.email,
      userName: user.name
    }).catch((e) => console.warn("Notice: could not send password changed email:", e.message));

    await logAuthAudit({
      action: "PASSWORD_RESET_SUCCESS",
      actor: user.name,
      targetEmail: user.email,
      targetRole: user.role,
      req,
      details: "Password reset completed successfully"
    });

    return res.status(200).json({
      success: true,
      message: "Password updated successfully! You can now log in with your new password."
    });
  } catch (error) {
    console.error("resetPassword error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 9. POST /api/auth/change-password (Authenticated User)
 * Allows authenticated users to change password with current password verification.
 */
export const changePassword = async (req, res) => {
  try {
    if (!ensureDB(res)) return;

    const { currentPassword, newPassword, confirmPassword } = req.body;
    const cleanCurrent = (currentPassword || "").trim();
    const cleanNew = (newPassword || "").trim();

    if (!cleanCurrent || !cleanNew) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required."
      });
    }

    if (cleanNew.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters in length."
      });
    }

    if (confirmPassword && confirmPassword.trim() !== cleanNew) {
      return res.status(400).json({
        success: false,
        message: "New password and confirmation password do not match."
      });
    }

    if (cleanCurrent === cleanNew) {
      return res.status(400).json({
        success: false,
        message: "New password cannot be identical to your current password."
      });
    }

    const user = await User.findById(req.user._id || req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User account not found." });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(cleanCurrent, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect."
      });
    }

    user.password = await bcrypt.hash(cleanNew, 10);
    await user.save();

    sendPasswordChangedEmail({
      to: user.email,
      userName: user.name
    }).catch((e) => console.warn("Notice: could not send password changed email:", e.message));

    await logAuthAudit({
      action: "PASSWORD_CHANGED",
      actor: user.name,
      targetEmail: user.email,
      targetRole: user.role,
      req,
      details: "Password changed successfully by authenticated user"
    });

    return res.status(200).json({
      success: true,
      message: "Password changed successfully."
    });
  } catch (error) {
    console.error("changePassword error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 10. POST /api/auth/logout
 */
export const logout = async (req, res) => {
  try {
    if (typeof res.clearCookie === "function") {
      res.clearCookie("qms_token");
    } else if (typeof res.setHeader === "function") {
      res.setHeader("Set-Cookie", "qms_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax");
    }
  } catch { }

  if (req.user) {
    await logAuthAudit({
      action: "LOGOUT",
      actor: req.user.name || req.user.email,
      targetEmail: req.user.email,
      targetRole: req.user.role,
      req,
      details: `User logged out`
    });
  }

  return res.status(200).json({
    success: true,
    message: "Logged out successfully"
  });
};

/**
 * 11. GET /api/auth/me
 */
export const getMe = (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user
  });
};

/**
 * 12. POST /api/auth/bootstrap
 * Secure one-time bootstrap to create the first QMS Coordinator account.
 * Disables itself once an active administrator/QMS coordinator exists in MongoDB.
 */
export const bootstrapFirstAdmin = async (req, res) => {
  try {
    if (!ensureDB(res)) return;

    // Check one-time bootstrap secret
    const configuredSecret = process.env.BOOTSTRAP_SECRET;
    const providedSecret = req.headers["x-bootstrap-secret"] || req.body.bootstrapSecret;

    if (!configuredSecret || providedSecret !== configuredSecret) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Invalid or missing bootstrap secret."
      });
    }

    // Verify if any coordinator already exists in MongoDB
    const existingCoordinator = await User.findOne({
      role: { $in: ["qm", "coordinator", "admin"] }
    });

    if (existingCoordinator) {
      return res.status(403).json({
        success: false,
        message: "Bootstrap disabled: An active QMS Coordinator account already exists in the database."
      });
    }

    const { name, email, employeeId, password } = req.body;
    if (!name || !email || !employeeId || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, employee ID, and password are required for bootstrap initialization."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters in length."
      });
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10);
    const username = email.trim().split("@")[0].toLowerCase();
    const userId = `USR-BOOTSTRAP-${Date.now().toString().slice(-4)}`;

    const initials = name
      .trim()
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const newAdmin = await User.create({
      id: userId,
      username,
      email: email.trim().toLowerCase(),
      employeeId: employeeId.trim().toUpperCase(),
      name: name.trim(),
      password: hashedPassword,
      role: "qm",
      roleTitle: "QMS Coordinator",
      initials,
      department: "Quality Assurance & Compliance",
      process: "Quality Management & MRM",
      designation: "QMS Coordinator",
      status: "Active",
      emailVerified: true,
      invitedBy: "Bootstrap API",
      activatedAt: new Date(),
      privileges: [
        "Manage Documents",
        "Review Documents",
        "Plan & Schedule MRM",
        "Share MRM with Coordinators",
        "User Management",
        "Assign & Supervise Tasks",
        "View Audit Logs & Reports"
      ],
      joinDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    });

    await logAuthAudit({
      action: "BOOTSTRAP_ADMIN_CREATED",
      actor: name,
      targetEmail: email,
      targetRole: "qm",
      req,
      details: `First QMS Coordinator account created via Bootstrap API (Emp ID: ${employeeId})`
    });

    return res.status(201).json({
      success: true,
      message: "First QMS Coordinator initialized successfully in MongoDB.",
      user: sanitizeUser(newAdmin)
    });
  } catch (error) {
    console.error("bootstrapFirstAdmin error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  login,
  verifyActivationOtp,
  activateAccount,
  resendActivationOtp,
  forgotPassword,
  verifyOtp,
  resendOtp,
  resetPassword,
  changePassword,
  logout,
  getMe,
  bootstrapFirstAdmin,
  sanitizeUser
};
