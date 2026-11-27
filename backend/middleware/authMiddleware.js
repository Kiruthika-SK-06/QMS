import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { User } from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "qms_jwt_secret_key_super_secure_2026";

/**
 * Standardize role strings across QMS
 */
export const normalizeRole = (role) => {
  if (!role) return "owner";
  const r = role.trim().toLowerCase();
  if (r === "head" || r === "trust head") return "Head";
  if (r === "qm" || r === "qms coordinator" || r === "coordinator" || r === "admin") return "qm";
  if (r === "owner" || r === "course coordinator") return "owner";
  if (r === "auditor" || r === "internal auditor") return "auditor";
  return role;
};

/**
 * Express middleware to authenticate JWT tokens strictly against MongoDB.
 * Never trusts client-supplied roles or unverified payloads.
 */
export const authenticateToken = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check Authorization Bearer header
    const authHeader = req.headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.headers["cookie"]) {
      // 2. Parse from HttpOnly cookie if present
      const cookies = Object.fromEntries(
        req.headers["cookie"].split(";").map((c) => {
          const [k, ...v] = c.trim().split("=");
          return [k, decodeURIComponent(v.join("="))];
        })
      );
      if (cookies.qms_token) {
        token = cookies.qms_token;
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token missing. Please sign in to continue."
      });
    }

    // Verify JWT signature
    let decoded = null;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          code: "TOKEN_EXPIRED",
          message: "Session expired. Please sign in again."
        });
      }
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token. Please sign in again."
      });
    }

    // Single source of truth: Verify that user exists and is Active in MongoDB
    if (mongoose.connection.readyState === 1) {
      const dbUser = await User.findOne({
        $or: [
          { id: decoded.id },
          { _id: mongoose.isValidObjectId(decoded.id) ? decoded.id : null },
          { username: decoded.username },
          { email: decoded.email }
        ].filter(Boolean)
      }).lean();

      if (!dbUser) {
        return res.status(401).json({
          success: false,
          message: "Account associated with token no longer exists in database."
        });
      }

      if (dbUser.status === "Pending Verification") {
        return res.status(403).json({
          success: false,
          code: "PENDING_VERIFICATION",
          message: "Your account is pending verification. Please activate your account first."
        });
      }

      if (dbUser.status === "Inactive" || dbUser.status === "Suspended") {
        return res.status(403).json({
          success: false,
          code: "ACCOUNT_SUSPENDED",
          message: "Your account is inactive or suspended. Please contact the QMS Administrator."
        });
      }

      const { password, ...userWithoutPassword } = dbUser;
      // Attach verified MongoDB user to request object
      req.user = userWithoutPassword;
      return next();
    } else {
      // Fail safely if MongoDB is offline - never silently switch to mock authentication
      return res.status(503).json({
        success: false,
        message: "Database service unavailable. Cannot verify authentication state."
      });
    }
  } catch (error) {
    console.error("authenticateToken middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal authentication verification error"
    });
  }
};

/**
 * Role-Based Access Control (RBAC) middleware.
 * Validates that the authenticated user possesses one of the required roles.
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required to access this resource."
      });
    }

    const userRole = normalizeRole(req.user.role);
    const normalizedAllowed = allowedRoles.map((r) => normalizeRole(r));

    const hasRole = normalizedAllowed.includes(userRole);

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to authorized roles. Required: [${allowedRoles.join(", ")}]. Current role: '${req.user.roleTitle || req.user.role}'`
      });
    }

    return next();
  };
};

/**
 * Privilege-based authorization middleware
 */
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const privileges = Array.isArray(req.user.privileges) ? req.user.privileges : [];
    if (!privileges.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Missing required privilege '${permission}'`
      });
    }

    return next();
  };
};

export default {
  authenticateToken,
  requireRole,
  requirePermission,
  normalizeRole
};
