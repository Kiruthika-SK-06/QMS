import express from "express";
import {
  getAllNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from "../controllers/notificationController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getAllNotifications);
router.patch("/:id/read", markNotificationRead);
router.post("/read-all", markAllNotificationsRead);

export default router;
