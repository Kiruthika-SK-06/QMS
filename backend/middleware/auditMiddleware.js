import { recordActivity } from "../config/storageEngine.js";

/**
 * Express middleware that automatically captures user functions and mutations,
 * logging them directly into the database Activity and Audit Trail collection.
 */
export const auditActivityLogger = (req, res, next) => {
  // Only monitor modifying operations
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    return next();
  }

  // Skip silent or read-only/polling endpoints
  if (
    req.path.includes("/login") ||
    req.path.includes("/verify-otp") ||
    req.path.includes("/mark-all-read") ||
    req.path.includes("/sync")
  ) {
    return next();
  }

  const originalJson = res.json;

  res.json = function (data) {
    // Run after response finishes to ensure operation succeeded
    res.on("finish", async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const actor = req.user?.name || req.user?.username || "Authorized User";
          const role = req.user?.role || "User";
          let actionText = "";
          let tone = "blue";
          let title = "System Function";

          if (req.path.startsWith("/api/users")) {
            title = "User Management";
            tone = req.method === "DELETE" ? "red" : req.method === "POST" ? "green" : "blue";
            actionText = `${req.method === "POST" ? "Created new user" : req.method === "DELETE" ? "Deleted user" : "Updated user"} by ${actor}`;
          } else if (req.path.startsWith("/api/documents")) {
            title = "Document Control";
            tone = req.method === "DELETE" ? "red" : "blue";
            actionText = `${req.method === "POST" ? "Created/Uploaded document" : req.method === "DELETE" ? "Deleted document" : "Updated document status"} by ${actor}`;
          } else if (req.path.startsWith("/api/tasks")) {
            title = "Task Management";
            tone = req.method === "DELETE" ? "red" : "blue";
            actionText = `${req.method === "POST" ? "Assigned task" : req.method === "DELETE" ? "Deleted task" : "Updated task status"} by ${actor}`;
          } else if (req.path.startsWith("/api/processes")) {
            title = "Process Governance";
            actionText = `${req.method === "POST" ? "Created process" : "Modified process"} by ${actor}`;
          } else if (req.path.startsWith("/api/mrm")) {
            title = "MRM Meeting";
            actionText = `Executed MRM action (${req.method}) by ${actor}`;
          } else if (req.path.startsWith("/api/audits") || req.path.startsWith("/api/external-audits")) {
            title = "Quality Audit";
            actionText = `Executed audit workflow action by ${actor}`;
          }

          if (actionText) {
            await recordActivity({
              title,
              text: actionText,
              detail: `Method: ${req.method} ${req.originalUrl} | Status: ${res.statusCode}`,
              actor,
              role,
              tone
            });
          }
        } catch (e) {
          // Never block response if audit log fails
        }
      }
    });

    return originalJson.call(this, data);
  };

  next();
};
