import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { dummyUsers, normalizeRole } from "../data/users.js";
import { activitiesData } from "../data/activities.js";

const JWT_SECRET = process.env.JWT_SECRET || "qms_jwt_secret_key_super_secure_2026";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// In-memory reset codes map: identifier -> { code, expiresAt, userId }
const resetCodes = new Map();

// Helper to find user in MongoDB or synchronized data
const findUserInDatabase = async (identifier) => {
  const cleanId = (identifier || "").trim().toLowerCase();
  if (!cleanId) return null;

  // 1. Try querying MongoDB User collection if connected
  if (mongoose.connection.readyState === 1) {
    try {
      const user = await User.findOne({
        $or: [
          { username: cleanId },
          { email: cleanId },
          { employeeId: cleanId.toUpperCase() },
          { aliases: cleanId }
        ]
      }).lean();

      if (user) return user;
    } catch (err) {
      console.warn("MongoDB query error in authController:", err.message);
    }
  }

  // 2. Query synchronized controlled users database
  const fallbackUser = dummyUsers.find(
    (u) =>
      u.username.toLowerCase() === cleanId ||
      u.email.toLowerCase() === cleanId ||
      (u.employeeId && u.employeeId.toUpperCase() === cleanId.toUpperCase()) ||
      (Array.isArray(u.aliases) && u.aliases.some((a) => a.toLowerCase() === cleanId))
  );

  return fallbackUser || null;
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
        message: "Email/username and password are required"
      });
    }

    // STRICT DATABASE QUERY: User must exist in the database
    const user = await findUserInDatabase(loginIdentifier);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: `User '${loginIdentifier}' is not registered in the system database. Please enter a valid username or Employee ID.`
      });
    }

    // Check account status
    if (user.status && user.status.toLowerCase() === "inactive") {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact the QMS Administrator."
      });
    }

    // Check password
    if (user.password && user.password !== cleanPassword) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password. Please verify your credentials."
      });
    }

    // Check role match if requested role is specified
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
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
        employeeId: user.employeeId
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const { password: _, ...userWithoutPassword } = user;

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
      message: "Internal server error during login",
      error: error.message
    });
  }
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { identifier } = req.body;
    const cleanId = (identifier || "").trim().toLowerCase();

    if (!cleanId) {
      return res.status(400).json({
        success: false,
        message: "Please enter your username or registered email address"
      });
    }

    const user = await findUserInDatabase(cleanId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No registered account found matching this identifier. Please verify and try again."
      });
    }

    // Generate a 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

    resetCodes.set(user.username.toLowerCase(), { code, expiresAt, userId: user.id });
    resetCodes.set(user.email.toLowerCase(), { code, expiresAt, userId: user.id });

    // Add to activities audit log
    activitiesData.unshift({
      id: `ACT-${Date.now()}`,
      text: `Password reset code requested for ${user.name} (${user.username})`,
      actor: user.name,
      time: "Just now",
      tone: "amber",
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      message: `Verification code generated for ${user.name}`,
      email: user.email,
      username: user.username,
      role: user.role,
      name: user.name,
      demoCode: code
    });
  } catch (error) {
    console.error("forgotPassword error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process forgot password request",
      error: error.message
    });
  }
};

// POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { identifier, code, newPassword } = req.body;
    const cleanId = (identifier || "").trim().toLowerCase();

    if (!cleanId || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Username/email, verification code, and new password are required"
      });
    }

    if (newPassword.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 3 characters long"
      });
    }

    const user = await findUserInDatabase(cleanId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found in database"
      });
    }

    const stored = resetCodes.get(user.username.toLowerCase()) || resetCodes.get(user.email.toLowerCase());

    // Validate code (allow stored code or demo code 123456)
    if (!stored || stored.code !== code.trim()) {
      if (code.trim() !== "123456") {
        return res.status(400).json({
          success: false,
          message: "Invalid verification code. Please check the code and try again."
        });
      }
    }

    if (stored && Date.now() > stored.expiresAt) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please request a new one."
      });
    }

    // Update password in MongoDB if connected
    if (mongoose.connection.readyState === 1) {
      await User.updateOne({ id: user.id }, { password: newPassword });
    }

    // Also update in memory
    const memUser = dummyUsers.find((u) => u.id === user.id);
    if (memUser) {
      memUser.password = newPassword;
    }

    // Clean up used code
    resetCodes.delete(user.username.toLowerCase());
    resetCodes.delete(user.email.toLowerCase());

    // Add to activities audit log
    activitiesData.unshift({
      id: `ACT-${Date.now()}`,
      text: `Password successfully updated for ${user.name} (${user.username})`,
      actor: user.name,
      time: "Just now",
      tone: "green",
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      message: "Password reset successful! You can now log in with your new password.",
      username: user.username,
      role: user.role
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

// GET /api/auth/me (Protected)
export const getMe = (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user
  });
};

// GET /api/auth/demo-users (Public list of available database accounts for convenience)
export const getDemoUsers = async (req, res) => {
  let userList = dummyUsers;
  if (mongoose.connection.readyState === 1) {
    try {
      const dbUsers = await User.find({}).lean();
      if (dbUsers.length > 0) {
        userList = dbUsers;
      }
    } catch {
      // use dummyUsers fallback
    }
  }

  const users = userList.map(({ password, ...u }) => ({
    ...u,
    dummyPassword: password
  }));

  return res.status(200).json({
    success: true,
    users
  });
};

// POST /api/auth/logout
export const logout = (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Logged out successfully"
  });
};
