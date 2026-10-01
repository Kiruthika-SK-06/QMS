import jwt from "jsonwebtoken";
import { dummyUsers } from "../data/users.js";

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token is missing or invalid"
    });
  }

  const secret = process.env.JWT_SECRET || "qms_jwt_secret_key_super_secure_2026";

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: "Invalid or expired token"
      });
    }

    const user = dummyUsers.find((u) => u.id === decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Attach user to request (excluding password)
    const { password, ...userWithoutPassword } = user;
    req.user = userWithoutPassword;
    next();
  });
};
