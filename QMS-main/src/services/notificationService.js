// Notification service for QMS Backend API
const API_BASE = "/api/notifications";

export const notificationService = {
  /**
   * Fetch notifications
   */
  async fetchNotifications(token) {
    const res = await fetch(API_BASE, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) throw new Error("Failed to load notifications");
    const data = await res.json();
    return {
      notifications: data.notifications || [],
      unreadCount: data.unreadCount || 0
    };
  },

  /**
   * Mark single notification as read
   */
  async markRead(id) {
    const res = await fetch(`${API_BASE}/${id}/read`, {
      method: "PATCH"
    });
    if (!res.ok) throw new Error("Failed to mark notification as read");
    const data = await res.json();
    return data.notification;
  },

  /**
   * Mark all notifications as read
   */
  async markAllRead() {
    const res = await fetch(`${API_BASE}/read-all`, {
      method: "POST"
    });
    if (!res.ok) throw new Error("Failed to mark all as read");
    return await res.json();
  }
};
