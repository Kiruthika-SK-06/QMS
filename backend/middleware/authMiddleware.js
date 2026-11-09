import jwt from "jsonwebtoken";
import { dummyUsers } from "../data/users.js";

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  const secret = process.env.JWT_SECRET || "qms_jwt_secret_key_super_secure_2026";

  if (token) {
    if (token.startsWith("session-token-")) {
      const parts = token.split("-");
      const rolePart = parts[2]; // e.g. "qm", "Head", "owner", "auditor"
      const matched = dummyUsers.find(
        (u) =>
          u.role.toLowerCase() === rolePart?.toLowerCase() ||
          u.aliases?.some((a) => a.toLowerCase() === rolePart?.toLowerCase())
      );
      if (matched) {
        const { password, ...userWithoutPassword } = matched;
        req.user = userWithoutPassword;
        return next();
      }
    }
    try {
      const decoded = jwt.verify(token, secret);
      const user = dummyUsers.find((u) => u.id === decoded.id || u.username === decoded.username);
      if (user) {
        const { password, ...userWithoutPassword } = user;
        req.user = userWithoutPassword;
        return next();
      }
    } catch {
      // If token expired, fall through to demo user resolution
    }
  }

  // Fallback for demo mode: check headers or default to demo user
  const roleHeader = req.headers["x-user-role"] || req.headers["x-demo-role"];
  const userIdHeader = req.headers["x-user-id"];

  let matchedUser = null;
  if (userIdHeader) {
    matchedUser = dummyUsers.find((u) => u.id === userIdHeader || u.employeeId === userIdHeader);
  }
  if (!matchedUser && roleHeader) {
    matchedUser = dummyUsers.find((u) => u.role.toLowerCase() === roleHeader.toLowerCase());
  }

  // Default demo fallback user (Course Coordinator - Course Coordinator)
  const activeUser = matchedUser || dummyUsers[0];
  const { password, ...userWithoutPassword } = activeUser;
  req.user = userWithoutPassword;
  return next();
};
