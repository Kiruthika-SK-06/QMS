import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import processRoutes from "./routes/processRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import mrmRoutes from "./routes/mrmRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import externalAuditRoutes from "./routes/externalAuditRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import { connectDB, getDBStatus } from "./config/db.js";
import { seedDatabase } from "./config/seed.js";
import { initPersistentStore, syncAllToMongoDB } from "./config/storageEngine.js";
import { auditActivityLogger } from "./middleware/auditMiddleware.js";
import * as models from "./models/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Load environment variables
dotenv.config();

// Initialize persistent disk storage
initPersistentStore();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
  credentials: true
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(morgan("dev"));

// Static files (Multer document uploads)
app.use("/uploads", express.static(uploadsDir));

// Automated Audit Trail & Activity Logger Middleware for all user functions
app.use(auditActivityLogger);

// Root status route
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "🚀 QMS Backend API Server is running!",
    frontendUrl: "http://localhost:5173",
    healthCheck: "/api/health",
    endpoints: {
      auth: "/api/auth",
      documents: "/api/documents",
      tasks: "/api/tasks",
      processes: "/api/processes",
      notifications: "/api/notifications",
      activities: "/api/activities",
      users: "/api/users",
      mrm: "/api/mrm",
      audit: "/api/audit",
      employees: "/api/employees"
    },
    note: "To access the QMS Web Application UI, please open http://localhost:5173 in your browser."
  });
});

import { handleRealtimeStream } from "./utils/realtime.js";

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "QMS Backend API is running smoothly",
    database: getDBStatus(),
    timestamp: new Date().toISOString()
  });
});

app.get("/api/db-status", (req, res) => {
  res.json(getDBStatus());
});

// Real-Time Event Stream (SSE)
app.get("/api/realtime/stream", handleRealtimeStream);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/processes", processRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/users", userRoutes);
app.use("/api/mrm", mrmRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/internal-audit", auditRoutes);
app.use("/api/external-audit", externalAuditRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/dashboard", dashboardRoutes);

// 404 Fallback
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err);
  res.status(500).json({
    success: false,
    message: err.message || "An internal server error occurred"
  });
});

// Start Server after Database Connection & Seeding completes
const startServer = async () => {
  try {
    const connected = await connectDB();
    if (connected) {
      await seedDatabase();
      await syncAllToMongoDB(models);
    }
  } catch (err) {
    console.error("Database connection/seeding notice:", err.message);
  }

  if (!process.env.VERCEL) {
    const server = app.listen(PORT, () => {
      console.log(`\n=================================================`);
      console.log(`🚀 QMS Backend Server running on port ${PORT}`);
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`🔒 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🛡️  Authentication: MongoDB Single Source of Truth`);
      console.log(`ℹ️  Initial Setup: Run 'npm run bootstrap' to create the first QMS Coordinator if database is uninitialized.`);
      console.log(`=================================================\n`);
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.log(`\n=================================================`);
        console.log(`ℹ️  PORT ${PORT} IS ALREADY ACTIVE`);
        console.log(`-------------------------------------------------`);
        console.log(`The QMS Backend Server is already running and listening on port ${PORT}!`);
        console.log(`📡 Backend API:  http://localhost:${PORT}`);
        console.log(`🌐 Frontend App: http://localhost:5173`);
        console.log(``);
        console.log(`👉 You do not need to start it again. Open your browser:`);
        console.log(`   http://localhost:5173`);
        console.log(`=================================================\n`);
        process.exit(0);
      } else {
        console.error("Unhandled server error:", err);
        process.exit(1);
      }
    });
  }
};

startServer().catch((err) => {
  console.error("Fatal startup error:", err);
});

export default app;
