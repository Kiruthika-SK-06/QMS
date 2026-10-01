import { notificationsData } from "../data/notifications.js";

// GET /api/notifications
export const getAllNotifications = (req, res) => {
  try {
    const role = req.user?.role?.toLowerCase();
    let list = [...notificationsData];

    if (role && role !== "head" && role !== "admin") {
      list = list.filter((n) => !n.targetRole || n.targetRole === "all" || n.targetRole.toLowerCase() === role);
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
export const markNotificationRead = (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const item = notificationsData.find((n) => n.id === id);
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
export const markAllNotificationsRead = (req, res) => {
  try {
    notificationsData.forEach((n) => {
      n.read = true;
    });
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
