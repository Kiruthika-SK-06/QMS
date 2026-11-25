import mongoose from "mongoose";
import { Notification } from "../models/Notification.js";

// GET /api/notifications
export const getAllNotifications = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ success: true, unreadCount: 0, notifications: [] });
    }

    const role = (req.user?.role || "").toLowerCase();
    const query = {};

    if (role && role !== "head" && role !== "admin") {
      query.$or = [
        { targetRole: "all" },
        { targetRole: role },
        { role: role },
        { targetRole: { $exists: false } }
      ];
    }

    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(50).lean();
    const unreadCount = notifications.filter((n) => !n.read).length;

    res.json({
      success: true,
      unreadCount,
      notifications
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/notifications/:id/read
export const markNotificationRead = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: "Database not connected" });
    }

    const notif = await Notification.findOneAndUpdate(
      { $or: [{ id: req.params.id }, { _id: mongoose.isValidObjectId(req.params.id) ? req.params.id : null }] },
      { read: true },
      { new: true }
    );

    res.json({ success: true, notification: notif });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/notifications/mark-all-read
export const markAllNotificationsRead = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: "Database not connected" });
    }

    await Notification.updateMany({ read: false }, { read: true });

    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getAllNotifications,
  markNotificationRead,
  markAllNotificationsRead
};
