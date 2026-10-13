import React from "react";
import { NavLink } from "react-router-dom";
import { X, ShieldCheck, LogOut } from "lucide-react";
import { useApp } from "../../context/AppContext";
import Logo from "../common/Logo";
import { navByRole } from "./navigation";

export default function Sidebar({ open, close }) {
  const { currentUser, logout, notifications } = useApp();
  const groups = (currentUser?.role && navByRole[currentUser.role]) || navByRole.owner || [];
  const unreadCount = (notifications || []).filter((item) => !item.read).length;

  return (
    <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
      <div className="sidebar-top">
        <Logo compact />
        <button className="mobile-close" onClick={close}><X size={20} /></button>
      </div>

      <nav className="sidebar-nav">
        {groups.map(([groupLabel, links]) => (
          <div className="nav-group" key={groupLabel}>
            <div className="nav-group-label">{groupLabel}</div>
            {links.map(([label, path, Icon]) => (
              <NavLink
                key={path}
                to={path}
                onClick={close}
                className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              >
                <Icon size={17} />
                <span>{label}</span>
                {label === "Notifications" && unreadCount > 0 && (
                  <em>{unreadCount}</em>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="secure-note">
          <ShieldCheck size={18} />
          <div>
            <strong>Controlled workspace</strong>
            <small>QMS records are versioned</small>
          </div>
        </div>
        <button className="logout-button" onClick={logout}>
          <LogOut size={17} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
