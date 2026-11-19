import mongoose from "mongoose";
import { Notification } from "../models/Notification.js";
import { notificationsData } from "../data/notifications.js";

// GET /api/notifications
export const getAllNotifications = async (req, res) => {
  try {
    const role = req.user?.role?.toLowerCase();
    let list = [...notificationsData];

    if (mongoose.connection.readyState === 1) {
      try {
        const dbNotifs = await Notification.find({}).sort({ createdAt: -1 }).lean();
        if (dbNotifs && dbNotifs.length > 0) {
          list = dbNotifs;
          notificationsData.length = 0;
          notificationsData.push(...dbNotifs);
        }
      } catch (err) {
        console.warn("MongoDB read error in getAllNotifications:", err.message);
      }
    }

    if (role && role !== "head" && role !== "admin") {
      list = list.filter((n) => {
        const target = (n.targetRole || n.role || "all").toLowerCase();
        return !target || target === "all" || target === role;
      });
    }

    const unreadCount = list.filter((n) => !n.read).length;

    res.json({
      success: true,
      unreadCount,
      notifications: list
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/notifications/:id/read
export const markNotificationRead = async (req, res) => {
  try {
    const paramId = req.params.id;
    const numId = parseInt(paramId, 10);
    const item = notificationsData.find((n) => String(n.id) === String(paramId) || n.id === numId);

    if (mongoose.connection.readyState === 1) {
      try {
        await Notification.findOneAndUpdate(
          { $or: [{ id: paramId }, { id: isNaN(numId) ? null : numId }] },
          { read: true }
        );
      } catch (err) {
        console.warn("MongoDB update notification error:", err.message);
      }
    }

    if (!item) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    item.read = true;
    res.json({ success: true, notification: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/notifications/read-all
export const markAllNotificationsRead = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      try {
        await Notification.updateMany({}, { read: true });
      } catch (err) {
        console.warn("MongoDB updateMany notifications error:", err.message);
      }
    }

    notificationsData.forEach((n) => {
      n.read = true;
    });
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
