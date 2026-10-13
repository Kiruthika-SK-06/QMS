import React from "react";
import { useApp } from "../context/AppContext";
import { roles } from "../data/mockData";
import PageIntro from "../components/common/PageIntro";
import Detail from "../components/common/Detail";
import StatusBadge from "../components/common/StatusBadge";

export default function Profile() {
  const { currentUser, logout } = useApp();

  if (!currentUser) return null;

  const roleTitle = roles[currentUser.role] || currentUser.roleTitle || "Workspace User";

  return (
    <>
      <PageIntro
        eyebrow="Account"
        title="Profile"
        description="Your QMS workspace identity, role assignments and security clearances."
      />
      <section className="panel profile-card">
        <div className="large-avatar">{currentUser.initials || "QM"}</div>
        <div>
          <h2>{currentUser.name}</h2>
          <p>{currentUser.email}</p>
          <StatusBadge status={roleTitle} />
        </div>
        <div className="detail-list">
          <Detail label="User ID" value={currentUser.id || "N/A"} />
          <Detail label="Staff / Member ID" value={currentUser.employeeId || currentUser.id || "N/A"} />
          <Detail label="Assigned Role" value={roleTitle} />
          <Detail label="Department" value={currentUser.department || "Quality Management Group"} />
          <Detail label="Mapped Process" value={currentUser.process || "All Controlled Processes"} />
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

