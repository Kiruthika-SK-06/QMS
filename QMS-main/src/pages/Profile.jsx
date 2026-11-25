import React from "react";
import { useApp } from "../context/AppContext";
import PageIntro from "../components/common/PageIntro";
import Detail from "../components/common/Detail";
import StatusBadge from "../components/common/StatusBadge";

const roles = {
  Head: "Trust Head",
  qm: "QMS Coordinator",
  owner: "Course Coordinator",
  auditor: "Internal Auditor",
  employee: "Employee"
};

export default function Profile() {
  const { currentUser, logout } = useApp();

  if (!currentUser) return null;

  // Resolve institutional identity and entered details — strictly NO Emp ID
  const roleTitle = roles[currentUser.role] || currentUser.roleTitle || "Workspace User";
  const displayName = currentUser.roleTitle || roleTitle || "User";
  const enteredEmail = currentUser.loginIdentifier || currentUser.email || currentUser.username || "Not specified";
  const avatarInitials = currentUser.initials || (displayName ? displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "QM");

  return (
    <>
      <PageIntro
        eyebrow="Account Identity"
        title="Profile"
        description="Your QMS workspace identity, entered credentials, and role assignments."
      />
      <section className="panel profile-card">
        <div className="large-avatar">{avatarInitials}</div>
        <div>
          <h2>{displayName}</h2>
          <p>{enteredEmail}</p>
          <StatusBadge status="Active" />
        </div>
        <div className="detail-list">
          <Detail label="Work Email / Username" value={enteredEmail} />
          <Detail label="Role" value={roleTitle} />
          <Detail label="Status" value="Active" />
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
