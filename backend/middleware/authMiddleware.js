import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { User } from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "qms_jwt_secret_key_super_secure_2026";

/**
 * Express middleware to authenticate JWT tokens against MongoDB.
 */
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);

      // Query user strictly from MongoDB if database is connected
      if (mongoose.connection.readyState === 1) {
        const dbUser = await User.findOne({
          $or: [
            { id: decoded.id },
            { _id: mongoose.isValidObjectId(decoded.id) ? decoded.id : null },
            { username: decoded.username },
            { email: decoded.email }
          ].filter(Boolean)
        }).lean();

        if (dbUser) {
          const { password, ...userWithoutPassword } = dbUser;
          req.user = userWithoutPassword;
          return next();
        }
      }

      // If decoded token is structurally valid, attach user payload
      req.user = {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role,
        email: decoded.email,
        employeeId: decoded.employeeId
      };
      return next();
    } catch (err) {
      // Token verification failed or expired
    }
  }

  // Check role and user headers for internal service requests
  const roleHeader = req.headers["x-user-role"];
  const userIdHeader = req.headers["x-user-id"];

  if (mongoose.connection.readyState === 1) {
    try {
      const query = {};
      if (userIdHeader) query.$or = [{ id: userIdHeader }, { employeeId: userIdHeader }];
      else if (roleHeader) query.role = roleHeader;

      if (Object.keys(query).length > 0) {
        const foundUser = await User.findOne(query).lean();
        if (foundUser) {
          const { password, ...userWithoutPassword } = foundUser;
          req.user = userWithoutPassword;
          return next();
        }
      }
    } catch (err) {
      console.warn("Auth middleware DB query error:", err.message);
    }
  }

  // If no valid credentials found, reject unauthorized request on protected endpoints
  if (req.path.startsWith("/api/auth/me") || req.method === "DELETE") {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Please log in to continue."
    });
  }

  return next();
};

/**
 * Role-based authorization middleware
 * @param  {...string} allowedRoles
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const userRole = (req.user.role || "").toLowerCase();
    const isAllowed = allowedRoles.some((r) => r.toLowerCase() === userRole);

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${allowedRoles.join(", ")}]. Current role: '${req.user.role}'`
      });
    }

    next();
  };
};

export default { authenticateToken, requireRole };
