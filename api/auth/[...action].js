import { connectDB } from "../../backend/config/db.js";
import {
  login,
  getMe,
  forgotPassword,
  verifyOtp,
  resetPassword,
  verifyActivationOtp,
  activateAccount
} from "../../backend/controllers/authController.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Ensure DB connected
  try {
    await connectDB();
  } catch (err) {
    console.warn("DB connect error in auth handler:", err.message);
  }

  // Parse action from path or query
  const action = Array.isArray(req.query?.action)
    ? req.query.action[0]
    : (req.query?.action || (req.url ? req.url.split("/").pop().split("?")[0] : "login"));

  // Ensure body is parsed object if JSON
  if (typeof req.body === "string" && req.body.trim().startsWith("{")) {
    try {
      req.body = JSON.parse(req.body);
    } catch { }
  }

  if (action === "login") {
    return login(req, res);
  } else if (action === "me") {
    return getMe(req, res);
  } else if (action === "forgot-password") {
    return forgotPassword(req, res);
  } else if (action === "verify-otp") {
    return verifyOtp(req, res);
  } else if (action === "reset-password") {
    return resetPassword(req, res);
  } else if (action === "verify-activation-otp") {
    return verifyActivationOtp(req, res);
  } else if (action === "activate-account") {
    return activateAccount(req, res);
  }

  return res.status(404).json({ success: false, message: `Auth action '${action}' not found` });
}
