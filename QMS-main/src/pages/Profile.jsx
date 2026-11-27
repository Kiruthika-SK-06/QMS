import React, { useState } from "react";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, KeyRound, LogOut } from "lucide-react";
import { useApp } from "../context/AppContext";
import PageIntro from "../components/common/PageIntro";
import Detail from "../components/common/Detail";
import StatusBadge from "../components/common/StatusBadge";
import { authService } from "../services/authService";

const roles = {
  Head: "Trust Head",
  qm: "QMS Coordinator",
  owner: "Course Coordinator",
  auditor: "Internal Auditor",
  employee: "Employee"
};

export default function Profile() {
  const { currentUser, logout } = useApp();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  if (!currentUser) return null;

  const roleTitle = roles[currentUser.role] || currentUser.roleTitle || "Workspace User";
  const displayName = currentUser.name || currentUser.roleTitle || roleTitle || "User";
  const enteredEmail = currentUser.email || currentUser.loginIdentifier || currentUser.username || "Not specified";
  const avatarInitials = currentUser.initials || (displayName ? displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "QM");

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!currentPassword) {
      setErrorMsg("Please enter your current password.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters in length.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("New password and confirmation password do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setErrorMsg("New password cannot be identical to your current password.");
      return;
    }

    setLoading(true);

    try {
      const res = await authService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword
      });

      setSuccessMsg(res.message || "Password changed successfully! A confirmation notice has been dispatched to your email.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setErrorMsg(err.message || "Failed to change password. Please check your current password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageIntro
        eyebrow="Account Security"
        title="My Profile & Credentials"
        description="Your institutional identity, official role assignments, and security settings."
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
        {/* Profile Card */}
        <section className="panel profile-card" style={{ height: "fit-content" }}>
          <div className="large-avatar">{avatarInitials}</div>
          <div>
            <h2 style={{ margin: "0 0 4px 0", color: "#050B3B", fontSize: "18px" }}>{displayName}</h2>
            <p style={{ margin: "0 0 10px 0", color: "#64748b", fontSize: "13px" }}>{enteredEmail}</p>
            <StatusBadge status={currentUser.status || "Active"} />
          </div>

          <div className="detail-list" style={{ marginTop: "16px" }}>
            <Detail label="Official Email Address" value={enteredEmail} />
            <Detail label="Assigned Role" value={roleTitle} />
            {currentUser.employeeId && <Detail label="Employee ID" value={currentUser.employeeId} />}
            {currentUser.department && <Detail label="Department" value={currentUser.department} />}
            {currentUser.process && <Detail label="Quality Process" value={currentUser.process} />}
            <Detail label="Account Status" value={currentUser.status || "Active"} />
          </div>

          <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #e2e8f0" }}>
            <button
              type="button"
              className="secondary-button"
              onClick={logout}
              style={{
                color: "#ef4444",
                borderColor: "#fca5a5",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                width: "100%",
                justifyContent: "center"
              }}
            >
              <LogOut size={16} />
              <span>Sign out of workspace</span>
            </button>
          </div>
        </section>

        {/* Change Password Card */}
        <section className="panel" style={{ padding: "24px", height: "fit-content" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "#f0f4ff",
                color: "#384FB8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <KeyRound size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#050B3B" }}>
                Change Password
              </h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                Update your account password securely in MongoDB
              </p>
            </div>
          </div>

          {successMsg && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                padding: "10px 14px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "6px",
                color: "#166534",
                fontSize: "13px",
                marginBottom: "16px",
                lineHeight: "1.4"
              }}
            >
              <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                padding: "10px 14px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "6px",
                color: "#991b1b",
                fontSize: "13px",
                marginBottom: "16px",
                lineHeight: "1.4"
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Current Password */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1e293b", marginBottom: "6px" }}>
                Current Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={16}
                  style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}
                />
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                  style={{
                    width: "100%",
                    padding: "10px 38px 10px 38px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#64748b",
                    cursor: "pointer"
                  }}
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1e293b", marginBottom: "6px" }}>
                New Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={16}
                  style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}
                />
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  style={{
                    width: "100%",
                    padding: "10px 38px 10px 38px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#64748b",
                    cursor: "pointer"
                  }}
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1e293b", marginBottom: "6px" }}>
                Confirm New Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={16}
                  style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}
                />
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  style={{
                    width: "100%",
                    padding: "10px 38px 10px 38px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#64748b",
                    cursor: "pointer"
                  }}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !currentPassword || !newPassword || newPassword !== confirmPassword}
              style={{
                marginTop: "10px",
                padding: "11px",
                borderRadius: "6px",
                border: "none",
                background: "#050B3B",
                color: "#ffffff",
                fontWeight: "700",
                fontSize: "14px",
                cursor: loading || !currentPassword || !newPassword || newPassword !== confirmPassword ? "not-allowed" : "pointer",
                opacity: loading || !currentPassword || !newPassword || newPassword !== confirmPassword ? 0.7 : 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px"
              }}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              <span>Update Password</span>
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
