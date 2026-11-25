import mongoose from "mongoose";
import { Notification } from "../models/Notification.js";
import { notificationsData } from "../data/notifications.js";

// GET /api/notifications
export const getAllNotifications = async (req, res) => {
  try {
    const role = (req.user?.role || "").toLowerCase();

    if (mongoose.connection.readyState === 1) {
      try {
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
        if (notifications && notifications.length > 0) {
          const unreadCount = notifications.filter((n) => !n.read).length;
          return res.json({
            success: true,
            unreadCount,
            notifications
          });
        }
      } catch (err) {
        console.warn("getAllNotifications DB error, using synchronized dataset:", err.message);
      }
    }

    let filtered = [...notificationsData];
    if (role && role !== "head" && role !== "admin") {
      filtered = filtered.filter(
        (n) => !n.targetRole || n.targetRole === "all" || n.targetRole === role || n.role === role
      );
    }
    const unreadCount = filtered.filter((n) => !n.read).length;

    res.json({
      success: true,
      unreadCount,
      notifications: filtered
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/notifications/:id/read
export const markNotificationRead = async (req, res) => {
  try {
    let notif = null;
    if (mongoose.connection.readyState === 1) {
      try {
        notif = await Notification.findOneAndUpdate(
          { $or: [{ id: req.params.id }, { _id: mongoose.isValidObjectId(req.params.id) ? req.params.id : null }] },
          { read: true },
          { new: true }
        );
      } catch (err) {}
    }

    const memNotif = notificationsData.find((n) => n.id === req.params.id);
    if (memNotif) {
      memNotif.read = true;
      if (!notif) notif = memNotif;
    }

    res.json({ success: true, notification: notif || { id: req.params.id, read: true } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/notifications/mark-all-read
export const markAllNotificationsRead = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      try {
        await Notification.updateMany({ read: false }, { read: true });
      } catch (err) {}
    }

    notificationsData.forEach((n) => {
      n.read = true;
    });

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
