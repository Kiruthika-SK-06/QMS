import { connectDB } from "../../backend/config/db.js";
import { login } from "../../backend/controllers/authController.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    await connectDB();
  } catch (err) {
    console.warn("DB connect error in login handler:", err.message);
  }

  if (typeof req.body === "string" && req.body.trim().startsWith("{")) {
    try {
      req.body = JSON.parse(req.body);
    } catch { }
  }

  return login(req, res);
}
