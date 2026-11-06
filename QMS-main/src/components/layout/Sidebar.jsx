import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { X, ShieldCheck, LogOut } from "lucide-react";
import { useApp } from "../../context/AppContext";
import Logo from "../common/Logo";
import { navByRole } from "./navigation";

export default function Sidebar({ open, close }) {
  const { currentUser, logout, notifications } = useApp();
  const location = useLocation();
  const groups = (currentUser?.role && navByRole[currentUser.role]) || navByRole.owner || [];
  const unreadCount = (notifications || []).filter((item) => !item.read).length;

  const currentFull = `${location.pathname}${location.search}`;

  const isLinkActive = (path) => {
    const [targetPath, targetQuery] = path.split("?");

    if (targetQuery) {
      return currentFull === path;
    }

    if (location.pathname !== targetPath) {
      return false;
    }

    if (location.search) {
      const hasSpecificQueryLink = groups.some(([, links]) =>
        links.some(([, p]) => p === currentFull)
      );
      if (hasSpecificQueryLink) {
        return false;
      }
    }

    return true;
  };

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
            {links.map(([label, path, Icon]) => {
              const active = isLinkActive(path);
              return (
                <NavLink
                  key={path}
                  to={path}
                  onClick={close}
                  className={active ? "nav-link active" : "nav-link"}
                >
                  <Icon size={17} />
                  <span>{label}</span>
                  {label === "Notifications" && unreadCount > 0 && (
                    <em>{unreadCount}</em>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button className="logout-button" onClick={logout}>
          <LogOut size={17} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
