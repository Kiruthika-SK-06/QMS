import jwt from "jsonwebtoken";
import { dummyUsers, normalizeRole } from "../data/users.js";

const JWT_SECRET = process.env.JWT_SECRET || "qms_jwt_secret_key_super_secure_2026";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

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
