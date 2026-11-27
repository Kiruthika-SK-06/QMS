import { connectDB, getDBStatus } from "../backend/config/db.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  let dbOk = false;
  try {
    dbOk = await connectDB();
  } catch (err) {
    console.warn("Health check DB connect:", err.message);
  }

  return res.status(200).json({
    status: "ok",
    message: "QMS Backend API is running smoothly",
    database: getDBStatus(),
    connected: dbOk,
    timestamp: new Date().toISOString()
  });
}
