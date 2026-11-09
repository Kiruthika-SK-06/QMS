import React from "react";
import { useApp } from "../context/AppContext";
import { roles } from "../data/mockData";
import PageIntro from "../components/common/PageIntro";
import Detail from "../components/common/Detail";
import StatusBadge from "../components/common/StatusBadge";

export default function Profile() {
  const { currentUser, logout } = useApp();

  if (!currentUser) return null;

  // Resolve institutional identity (role name or login ID) — strictly no dummy person names
  const roleTitle = roles[currentUser.role] || currentUser.roleTitle || "Workspace User";
  const displayName = currentUser.roleTitle || roleTitle || currentUser.username || currentUser.id || "User";
  const displayId = currentUser.employeeId || currentUser.id || currentUser.username || "N/A";
  const avatarInitials = currentUser.initials || (displayName ? displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "QM");

  return (
    <>
      <PageIntro
        eyebrow="Account Identity"
        title="Profile"
        description="Your QMS workspace identity, role assignments, and security clearances."
      />
      <section className="panel profile-card">
        <div className="large-avatar">{avatarInitials}</div>
        <div>
          <h2>{displayName}</h2>
          <p>{currentUser.email}</p>
          <StatusBadge status={roleTitle} />
        </div>
        <div className="detail-list">
          <Detail label="Login ID / Username" value={currentUser.username || currentUser.id || displayId} />
          <Detail label="Role Name" value={roleTitle} />
          <Detail label="Staff / Member ID" value={displayId} />
          <Detail label="Department" value={currentUser.department || "Quality Management Group"} />
          <Detail label="Mapped Scope" value={currentUser.process || "All Controlled Processes"} />
          <Detail label="Access Model" value="Role-Based Access Control (RBAC)" />
        </div>
        <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #e2e8f0" }}>
          <button
            type="button"
            className="secondary-button"
            onClick={logout}
            style={{ color: "#ef4444", borderColor: "#fca5a5" }}
          >
            Sign out of workspace
          </button>
        </div>
      </section>
    </>
  );
}

