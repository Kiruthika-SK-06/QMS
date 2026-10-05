import jwt from "jsonwebtoken";
import { dummyUsers, normalizeRole } from "../data/users.js";
import { activitiesData } from "../data/activities.js";

const JWT_SECRET = process.env.JWT_SECRET || "qms_jwt_secret_key_super_secure_2026";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// In-memory reset codes map: identifier -> { code, expiresAt, userId }
const resetCodes = new Map();

// POST /api/auth/login
export const login = (req, res) => {
  try {
    const { email, username, identifier, password, role } = req.body;

    // Login identifier can come from email, username, or identifier field
    const loginIdentifier = (identifier || email || username || "").trim().toLowerCase();

    if (!loginIdentifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/username and password are required"
      });
    }

    // Find user by username or email
    const user = dummyUsers.find(
      (u) =>
        u.username.toLowerCase() === loginIdentifier ||
        u.email.toLowerCase() === loginIdentifier
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials: User does not exist"
      });
    }

    // Verify password
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials: Password incorrect"
      });
    }

    // Verify role if provided
    if (role) {
      const normalizedReqRole = normalizeRole(role);
      const normalizedUserRole = normalizeRole(user.role);

      if (normalizedReqRole !== normalizedUserRole) {
        return res.status(403).json({
          success: false,
          message: `Role mismatch: Account "${user.name}" is registered as "${user.roleTitle}". Please select "${user.roleTitle}".`
        });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email
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
export const forgotPassword = (req, res) => {
  try {
    const { identifier } = req.body;
    const cleanId = (identifier || "").trim().toLowerCase();

    if (!cleanId) {
      return res.status(400).json({
        success: false,
        message: "Please enter your username or registered email address"
      });
    }

    const user = dummyUsers.find(
      (u) =>
        u.username.toLowerCase() === cleanId ||
        u.email.toLowerCase() === cleanId
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `No QMS user account found matching "${cleanId}". Available demo accounts: employee, processowner, qmgroup, qmhead.`
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
export const resetPassword = (req, res) => {
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

    const user = dummyUsers.find(
      (u) =>
        u.username.toLowerCase() === cleanId ||
        u.email.toLowerCase() === cleanId
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found"
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

    // Update password in dummy database
    user.password = newPassword;

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

// GET /api/auth/demo-users (Public list of available demo accounts for convenience)
export const getDemoUsers = (req, res) => {
  const users = dummyUsers.map(({ password, ...u }) => ({
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
