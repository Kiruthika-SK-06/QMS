import { connectDB } from "../../backend/config/db.js";
import { getMe } from "../../backend/controllers/authController.js";
import { authenticateToken } from "../../backend/middleware/authMiddleware.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    await connectDB();
  } catch (err) {
    console.warn("DB connect error in me handler:", err.message);
  }

  return authenticateToken(req, res, () => getMe(req, res));
}
