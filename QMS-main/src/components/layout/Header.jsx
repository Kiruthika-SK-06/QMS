import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown, Menu, Search } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { roles } from "../../data/mockData";

export default function Header({ openMenu }) {
  const { currentUser, notifications } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/documents?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

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
          <input
            placeholder="Search documents (press Enter)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
        </label>
        <button
          className="icon-button"
          onClick={() => navigate("/notifications")}
          title="Notifications"
        >
          <Bell size={19} />
          {(notifications || []).some((item) => !item.read) && <i />}
        </button>
        <button
          className="user-menu"
          onClick={() => navigate("/profile")}
          title="Account profile"
        >
          <span className="avatar">{currentUser?.initials || "QM"}</span>
          <span className="user-summary">
            <strong>{currentUser?.name || "User"}</strong>
            <small>{currentUser?.role ? roles[currentUser.role] : "Workspace User"}</small>
          </span>
          <ChevronDown size={16} />
        </button>
      </div>
    </header>
  );
}
