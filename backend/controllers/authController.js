import jwt from "jsonwebtoken";
import { dummyUsers, normalizeRole } from "../data/users.js";
import { employeesData } from "../data/employees.js";
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
    const cleanPassword = (password || "").trim();

    if (!loginIdentifier || !cleanPassword) {
      return res.status(400).json({
        success: false,
        message: "Email/username and password are required"
      });
    }

    // 1. Find user by username, email, or alias in dummyUsers
    let user = dummyUsers.find(
      (u) =>
        u.username.toLowerCase() === loginIdentifier ||
        u.email.toLowerCase() === loginIdentifier ||
        (Array.isArray(u.aliases) && u.aliases.some((a) => a.toLowerCase() === loginIdentifier))
    );

    // 2. If not found in dummyUsers, check employees database
    if (!user && employeesData) {
      const emp = employeesData.find(
        (e) =>
          e.email.toLowerCase() === loginIdentifier ||
          (e.id && e.id.toLowerCase() === loginIdentifier) ||
          e.name.toLowerCase() === loginIdentifier
      );
      if (emp) {
        user = {
          id: emp.id,
          username: emp.email.split("@")[0],
          email: emp.email,
          password: "1234",
          name: emp.name,
          role: emp.role,
          roleTitle:
            emp.role === "owner"
              ? "Course Coordinator"
              : emp.role === "Head"
                ? "Trust Head"
                : "QMS Coordinator",
          initials: emp.name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
          department: emp.department || "Academic Division",
          process: emp.process || "Course Management"
        };
        dummyUsers.push(user);
      }
    }

    // 3. If user entered their own custom email ID, auto-provision profile matching the selected role
    if (!user) {
      const targetRole = role ? normalizeRole(role) : "owner";
      const namePart = loginIdentifier.includes("@")
        ? loginIdentifier.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : loginIdentifier.replace(/\b\w/g, (c) => c.toUpperCase());

      const roleTitleMap = {
        owner: "Course Coordinator",
        qm: "QMS Coordinator",
        Head: "Trust Head",
        auditor: "Internal Auditor"
      };

      user = {
        id: `USR-${Date.now().toString().slice(-4)}`,
        username: loginIdentifier.includes("@") ? loginIdentifier.split("@")[0] : loginIdentifier,
        email: loginIdentifier.includes("@") ? loginIdentifier : `${loginIdentifier}@cdac.in`,
        password: cleanPassword,
        name: namePart || "Authorized User",
        role: targetRole,
        roleTitle: roleTitleMap[targetRole] || "Course Coordinator",
        initials: (namePart || "AU")
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        department:
          targetRole === "qm" || targetRole === "Head"
            ? "Quality Management Group"
            : "Academic Division",
        process: targetRole === "owner" ? "Course Management" : "All Processes"
      };

      dummyUsers.push(user);
    }

    // Adapt user role to match the selected role if explicitly chosen
    if (role) {
      const normalizedReqRole = normalizeRole(role);
      const roleTitleMap = {
        owner: "Course Coordinator",
        qm: "QMS Coordinator",
        Head: "Trust Head",
        auditor: "Internal Auditor"
      };
      user.role = normalizedReqRole;
      user.roleTitle = roleTitleMap[normalizedReqRole] || user.roleTitle;
    }

    // Update password if new password was provided
    if (cleanPassword && cleanPassword !== user.password) {
      user.password = cleanPassword;
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
        u.email.toLowerCase() === cleanId ||
        (Array.isArray(u.aliases) && u.aliases.some((a) => a.toLowerCase() === cleanId))
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `No QMS user account found matching "${cleanId}". Available demo accounts: coursecoordinator, qmcoordinator, trusthead.`
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
        u.email.toLowerCase() === cleanId ||
        (Array.isArray(u.aliases) && u.aliases.some((a) => a.toLowerCase() === cleanId))
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
