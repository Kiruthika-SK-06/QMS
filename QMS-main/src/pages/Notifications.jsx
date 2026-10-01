import React from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useApp } from "../context/AppContext";
import PageIntro from "../components/common/PageIntro";

export default function Notifications() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useApp();

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <PageIntro
        eyebrow="Inbox"
        title="Notifications"
        description="Workflow updates and document control events."
        action={
          unreadCount > 0 && (
            <button className="secondary-button" onClick={markAllNotificationsRead}>
              <CheckCheck size={16} /> Mark all as read
            </button>
          )
        }
      />
      <div className="notification-list">
        {notifications.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
            <p>No notifications.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <button
              className={`notification ${notification.read ? "" : "unread"}`}
              key={notification.id}
              onClick={() => markNotificationRead(notification.id)}
            >
              <span className="notification-icon">
                <Bell size={17} />
              </span>
              <span>
                <strong>{notification.title}</strong>
                <small>{notification.text}</small>
                <em>{notification.time}</em>
              </span>
              {!notification.read && <i />}
            </button>
          ))
        )}
      </div>
    </>
  );
}
