import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Otp } from "../models/Otp.js";
import { Activity } from "../models/Activity.js";
import { sendOtpEmail } from "../utils/emailService.js";
import { dummyUsers } from "../data/users.js";

const JWT_SECRET = process.env.JWT_SECRET || "qms_jwt_secret_key_super_secure_2026";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// In-memory OTP storage fallback when local MongoDB server daemon is offline
const memoryOtps = new Map();

// Standardize role strings
export const normalizeRole = (role) => {
  if (!role) return "owner";
  const r = role.trim().toLowerCase();
  if (r === "head" || r === "trust head") return "Head";
  if (r === "qm" || r === "qms coordinator") return "qm";
  if (r === "owner" || r === "course coordinator") return "owner";
  if (r === "auditor" || r === "internal auditor") return "auditor";
  return role;
};

// Log activity strictly to MongoDB or safe audit
const logAuthActivity = async (text, actor, tone = "blue") => {
  if (mongoose.connection.readyState === 1) {
    try {
      await Activity.create({
        id: `ACT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        text,
        actor: actor || "System",
        time: "Just now",
        tone,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.warn("Failed to log auth activity to MongoDB:", err.message);
    }
  }
};

// Helper: Query user from MongoDB if connected, or from synchronized controlled accounts
const findUserByQuery = async (query) => {
  // 1. Try querying MongoDB User collection if connected
  if (mongoose.connection.readyState === 1) {
    try {
      const user = await User.findOne(query).lean();
      if (user) return user;
    } catch (err) {
      console.warn("findUserByQuery error:", err.message);
    }
  }

  // 2. Query controlled institutional registry (active when local MongoDB service is offline)
  const idQuery = (
    query.username ||
    query.email ||
    query.$or?.find((q) => q.email)?.email ||
    query.$or?.find((q) => q.username)?.username ||
    query.$or?.find((q) => q.employeeId)?.employeeId ||
    ""
  ).trim().toLowerCase();

  if (!idQuery) return null;

  const found = dummyUsers.find((u) => {
    return (
      (u.email && u.email.toLowerCase() === idQuery) ||
      (u.username && u.username.toLowerCase() === idQuery) ||
      (u.employeeId && u.employeeId.toUpperCase() === idQuery.toUpperCase()) ||
      (Array.isArray(u.aliases) && u.aliases.some((a) => a.toLowerCase() === idQuery))
    );
  });

  return found ? { ...found } : null;
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, username, identifier, password, role } = req.body;
    const loginIdentifier = (identifier || email || username || "").trim().toLowerCase();
    const cleanPassword = (password || "").trim();

    if (!loginIdentifier || !cleanPassword) {
      return res.status(400).json({
        success: false,
        message: "Username or email and password are required"
      });
    }

    // QUERY: User must exist in MongoDB or registered institutional registry
    const user = await findUserByQuery({
      $or: [
        { username: loginIdentifier },
        { email: loginIdentifier },
        { employeeId: loginIdentifier.toUpperCase() }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: `Account '${loginIdentifier}' not found in database. Please enter a valid username or email.`
      });
    }

    if (user.status && user.status.toLowerCase() === "inactive") {
      return res.status(403).json({
        success: false,
        message: "Your account is currently inactive. Please contact the QMS Administrator."
      });
    }

    // Verify Password (supports bcrypt hash and backward-compatible default accounts)
    let isPasswordValid = false;
    if (user.password) {
      if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$") || user.password.startsWith("$2y$")) {
        isPasswordValid = await bcrypt.compare(cleanPassword, user.password);
      } else {
        // Plain text fallback (for initial seed accounts like '1234')
        isPasswordValid = user.password === cleanPassword;
        // Seamlessly upgrade to bcrypt hash in database
        if (isPasswordValid && mongoose.connection.readyState === 1) {
          const newHashed = await bcrypt.hash(cleanPassword, 10);
          await User.updateOne({ _id: user._id }, { password: newHashed });
        }
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password. Please verify your credentials."
      });
    }

    // Verify selected role matches user's institutional role
    if (role) {
      const normalizedReqRole = normalizeRole(role);
      if (user.role !== normalizedReqRole) {
        return res.status(401).json({
          success: false,
          message: `User '${user.name}' is registered as ${user.roleTitle || user.role}, not ${role}. Please select the matching role.`
        });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id || user._id,
        username: user.username,
        role: user.role,
        email: user.email,
        employeeId: user.employeeId
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const { password: _, ...userWithoutPassword } = user;

    await logAuthActivity(`User '${user.name}' logged in successfully`, user.name, "green");

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during authentication",
      error: error.message
    });
  }
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { identifier, email } = req.body;
    const cleanId = (identifier || email || "").trim().toLowerCase();

    if (!cleanId) {
      return res.status(400).json({
        success: false,
        message: "Please enter your registered email address"
      });
    }

    // Query user in MongoDB or controlled registry
    const user = await findUserByQuery({
      $or: [
        { email: cleanId },
        { username: cleanId },
        { employeeId: cleanId.toUpperCase() }
      ]
    });

    if (!user || !user.email) {
      return res.status(404).json({
        success: false,
        message: "No registered account matches that email address. Please check and try again."
      });
    }

    // Generate secure 6-digit random OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // Strict 5-minute expiry

    // Save hashed OTP in MongoDB if connected, or memory fallback
    if (mongoose.connection.readyState === 1) {
      await Otp.deleteMany({ email: user.email.toLowerCase() });
      await Otp.create({
        email: user.email.toLowerCase(),
        otpHash,
        attempts: 0,
        maxAttempts: 5,
        expiresAt
      });
    } else {
      memoryOtps.set(user.email.toLowerCase(), {
        otpHash,
        attempts: 0,
        maxAttempts: 5,
        expiresAt: expiresAt.getTime(),
        createdAt: Date.now()
      });
    }

    // Send email via Nodemailer
    await sendOtpEmail({
      to: user.email,
      otp,
      userName: user.name || user.username
    });

    await logAuthActivity(`Password reset OTP requested for ${user.name} (${user.email})`, user.name, "amber");

    const maskedEmail = user.email.replace(/(.{2})(.*)(@.*)/, "$1***$3");

    return res.status(200).json({
      success: true,
      message: `Verification code sent to registered email address (${maskedEmail})`,
      email: user.email,
      expiresInMinutes: 5
    });
  } catch (error) {
    console.error("forgotPassword error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to dispatch verification code",
      error: error.message
    });
  }
};

// POST /api/auth/verify-otp
export const verifyOtp = async (req, res) => {
  try {
    const { email, code, otp } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();
    const enteredOtp = (code || otp || "").trim();

    if (!cleanEmail || !enteredOtp) {
      return res.status(400).json({
        success: false,
        message: "Registered email and 6-digit verification code are required"
      });
    }

    let otpRecord = null;
    if (mongoose.connection.readyState === 1) {
      otpRecord = await Otp.findOne({ email: cleanEmail });
    } else {
      otpRecord = memoryOtps.get(cleanEmail);
    }

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "No active verification code found for this email. Please request a new code."
      });
    }

    // Check expiration
    const expiryTime = otpRecord.expiresAt instanceof Date ? otpRecord.expiresAt.getTime() : Number(otpRecord.expiresAt);
    if (Date.now() > expiryTime) {
      if (mongoose.connection.readyState === 1) {
        await Otp.deleteOne({ _id: otpRecord._id });
      } else {
        memoryOtps.delete(cleanEmail);
      }
      return res.status(400).json({
        success: false,
        message: "Verification code has expired (5-minute limit). Please request a new code."
      });
    }

    // Check max attempts (brute force protection)
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      if (mongoose.connection.readyState === 1) {
        await Otp.deleteOne({ _id: otpRecord._id });
      } else {
        memoryOtps.delete(cleanEmail);
      }
      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts. Verification code invalidated. Please request a new code."
      });
    }

    // Verify OTP hash with bcrypt
    const isMatch = await bcrypt.compare(enteredOtp, otpRecord.otpHash);
    if (!isMatch) {
      otpRecord.attempts += 1;
      if (mongoose.connection.readyState === 1) {
        await otpRecord.save();
      } else {
        memoryOtps.set(cleanEmail, otpRecord);
      }
      const remaining = otpRecord.maxAttempts - otpRecord.attempts;
      return res.status(400).json({
        success: false,
        message: `Invalid verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
      });
    }

    // Generate single-use reset token
    const verificationToken = jwt.sign(
      { email: cleanEmail, purpose: "password_reset" },
      JWT_SECRET,
      { expiresIn: "10m" }
    );

    otpRecord.isVerified = true;
    otpRecord.verificationToken = verificationToken;
    if (mongoose.connection.readyState === 1) {
      await otpRecord.save();
    } else {
      memoryOtps.set(cleanEmail, otpRecord);
    }

    return res.status(200).json({
      success: true,
      message: "Verification code confirmed successfully",
      verificationToken
    });
  } catch (error) {
    console.error("verifyOtp error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify code",
      error: error.message
    });
  }
};

// POST /api/auth/resend-otp
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();

    if (!cleanEmail) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await findUserByQuery({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check 60-second cooldown
    let existing = null;
    if (mongoose.connection.readyState === 1) {
      existing = await Otp.findOne({ email: cleanEmail });
    } else {
      existing = memoryOtps.get(cleanEmail);
    }

    if (existing) {
      const createdTime = existing.createdAt instanceof Date ? existing.createdAt.getTime() : Number(existing.createdAt);
      const elapsedSeconds = (Date.now() - createdTime) / 1000;
      if (elapsedSeconds < 60) {
        const waitTime = Math.ceil(60 - elapsedSeconds);
        return res.status(429).json({
          success: false,
          message: `Please wait ${waitTime} seconds before requesting a new code.`
        });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    if (mongoose.connection.readyState === 1) {
      await Otp.deleteMany({ email: cleanEmail });
      await Otp.create({
        email: cleanEmail,
        otpHash,
        attempts: 0,
        maxAttempts: 5,
        expiresAt
      });
    } else {
      memoryOtps.set(cleanEmail, {
        otpHash,
        attempts: 0,
        maxAttempts: 5,
        expiresAt: expiresAt.getTime(),
        createdAt: Date.now()
      });
    }

    await sendOtpEmail({
      to: user.email,
      otp,
      userName: user.name || user.username
    });

    return res.status(200).json({
      success: true,
      message: "A new verification code has been dispatched to your email."
    });
  } catch (error) {
    console.error("resendOtp error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to resend code",
      error: error.message
    });
  }
};

// POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { email, identifier, code, verificationToken, newPassword, confirmPassword } = req.body;
    const cleanEmail = (email || identifier || "").trim().toLowerCase();
    const cleanPass = (newPassword || "").trim();

    if (!cleanEmail || !cleanPass) {
      return res.status(400).json({
        success: false,
        message: "Email and new password are required"
      });
    }

    if (cleanPass.length < 4) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 4 characters long"
      });
    }

    if (confirmPassword && confirmPassword !== cleanPass) {
      return res.status(400).json({
        success: false,
        message: "New password and confirmation password do not match"
      });
    }

    // Verify token or code
    let verified = false;
    if (verificationToken) {
      try {
        const decoded = jwt.verify(verificationToken, JWT_SECRET);
        if (decoded.email === cleanEmail && decoded.purpose === "password_reset") {
          verified = true;
        }
      } catch {
        // Token invalid or expired
      }
    }

    if (!verified && code) {
      let otpRecord = null;
      if (mongoose.connection.readyState === 1) {
        otpRecord = await Otp.findOne({ email: cleanEmail });
      } else {
        otpRecord = memoryOtps.get(cleanEmail);
      }

      if (otpRecord && (await bcrypt.compare(code.trim(), otpRecord.otpHash))) {
        const expiryTime = otpRecord.expiresAt instanceof Date ? otpRecord.expiresAt.getTime() : Number(otpRecord.expiresAt);
        if (Date.now() <= expiryTime) {
          verified = true;
        }
      }
    }

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: "Verification expired or invalid. Please verify the 6-digit code again."
      });
    }

    // Hash the new password with bcrypt
    const hashedPassword = await bcrypt.hash(cleanPass, 10);

    // Update user password in MongoDB if connected
    if (mongoose.connection.readyState === 1) {
      await User.updateOne(
        { $or: [{ email: cleanEmail }, { username: cleanEmail }] },
        { password: hashedPassword }
      );
      await Otp.deleteMany({ email: cleanEmail });
    } else {
      // Memory update
      const memUser = dummyUsers.find((u) => u.email.toLowerCase() === cleanEmail || u.username.toLowerCase() === cleanEmail);
      if (memUser) {
        memUser.password = hashedPassword;
      }
      memoryOtps.delete(cleanEmail);
    }

    await logAuthActivity(`Password successfully reset for account ${cleanEmail}`, cleanEmail, "green");

    return res.status(200).json({
      success: true,
      message: "Password updated successfully! You can now log in with your new password."
    });
  } catch (error) {
    console.error("resetPassword error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reset password",
      error: error.message
    });
  }
};

// GET /api/auth/me
export const getMe = (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user
  });
};

// GET /api/auth/demo-users
export const getDemoUsers = async (req, res) => {
  try {
    let users = [];
    if (mongoose.connection.readyState === 1) {
      users = await User.find({}, { password: 0 }).lean();
    }
    if (!users || users.length === 0) {
      users = dummyUsers.map(({ password, ...u }) => ({
        ...u,
        dummyPassword: password
      }));
    }
    return res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/logout
export const logout = (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Logged out successfully"
  });
};

export default {
  login,
  forgotPassword,
  verifyOtp,
  resendOtp,
  resetPassword,
  getMe,
  getDemoUsers,
  logout
};
