import React from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown, Menu, Search } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { roles } from "../../data/mockData";

export default function Header({ openMenu }) {
  const { currentUser, notifications } = useApp();
  const navigate = useNavigate();

  return (
    <header className="header">
      <button className="menu-button" onClick={openMenu}><Menu size={22} /></button>
      <div className="header-title">
        <span>QMS DIGITALIZATION</span>
        <strong>Quality workspace</strong>
      </div>
      <div className="header-actions">
        <label className="header-search">
          <Search size={17} />
          <input placeholder="Search documents, tasks..." />
        </label>
        <button className="icon-button" onClick={() => navigate("/notifications")}>
          <Bell size={19} />
          {notifications.some((item) => !item.read) && <i />}
        </button>
        <button className="user-menu" onClick={() => navigate("/profile")}>
          <span className="avatar">{currentUser.initials}</span>
          <span className="user-summary">
            <strong>{currentUser.name}</strong>
            <small>{roles[currentUser.role]}</small>
          </span>
          <ChevronDown size={16} />
        </button>
      </div>
    </header>
  );
}
