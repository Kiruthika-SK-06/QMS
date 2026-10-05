import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import processRoutes from "./routes/processRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
  credentials: true
}));
app.use(express.json());
app.use(morgan("dev"));

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
      employees: "/api/employees"
    },
    note: "To access the QMS Web Application UI, please open http://localhost:5173 in your browser."
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "QMS Backend API is running smoothly",
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/processes", processRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/employees", employeeRoutes);

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

// Start Server
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(`🚀 QMS Backend Server running on port ${PORT}`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`🔒 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`👥 Available Dummy Accounts:`);
    console.log(`   1) Employee:      username: employee      | password: 1234 | role: employee`);
    console.log(`   2) Process Owner: username: processowner  | password: 1234 | role: owner`);
    console.log(`   3) QM Group:      username: qmgroup       | password: 1234 | role: qm`);
    console.log(`   4) QM Head:       username: qmhead        | password: 1234 | role: Head`);
    console.log(`=================================================\n`);
  });
}

export default app;
