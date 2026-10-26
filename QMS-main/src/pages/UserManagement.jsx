import React, { useState } from "react";
import {
  UserCheck,
  Plus,
  Search,
  Edit2,
  Trash2,
  Shield,
  Users,
  Award,
  Briefcase,
  Power,
  Lock,
  Eye,
  ShieldCheck,
  ShieldAlert
} from "lucide-react";
import { useApp } from "../context/AppContext";
import PageIntro from "../components/common/PageIntro";
import StatCard from "../components/common/StatCard";
import StatusBadge from "../components/common/StatusBadge";
import Modal from "../components/tasks/Modal";

const ROLE_PRESETS = {
  owner: [
    "Manage Documents",
    "Draft Minutes of Meeting (MoM)",
    "Assign & Supervise Tasks"
  ],
  qm: [
    "Manage Documents",
    "Review Documents",
    "Plan & Schedule MRM",
    "Share MRM with Coordinators",
    "User Management",
    "Assign & Supervise Tasks",
    "View Audit Logs & Reports"
  ],
  Head: [
    "Approve MRM",
    "Review Documents",
    "View Audit Logs & Reports"
  ],
  auditor: [
    "View Audit Logs & Reports",
    "User Management",
    "Review Documents"
  ]
};

export default function UserManagement() {
  const {
    usersList,
    addUser,
    updateUser,
    toggleUserStatus,
    deleteUser,
    currentUser
  } = useApp();

  // Role permissions
  const isQMSCoordinator = currentUser?.role === "qm";
  const isTrustTeam = currentUser?.role === "Head";
  const isInternalAuditor = currentUser?.role === "auditor";
  const canViewUserManagement = isQMSCoordinator || isTrustTeam || isInternalAuditor;

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("name-asc");

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewingProfile, setViewingProfile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);

  // Simplified Form state: Only User Name, Email Address, Assigned Role, and Account Status
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "owner",
    status: "Active"
  });

  const openAddModal = () => {
    setEditingUser(null);
    setForm({
      name: "",
      email: "",
      role: "owner",
      status: "Active"
    });
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setForm({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "owner",
      status: user.status || "Active"
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;

    setSubmitting(true);
    try {
      const derivedUsername =
        editingUser?.username ||
        form.email.trim().split("@")[0].toLowerCase().replace(/[^a-z0-9._-]/g, "") ||
        form.name.trim().toLowerCase().replace(/\s+/g, ".");

      const roleTitle =
        form.role === "owner"
          ? "Course Coordinator"
          : form.role === "qm"
          ? "QMS Coordinator"
          : form.role === "auditor"
          ? "Internal Auditor"
          : "Trust Head";

      const defaultDepartment =
        form.role === "auditor"
          ? "Internal Quality Audit Cell"
          : form.role === "Head"
          ? "Trust Governance & Executive Board"
          : form.role === "qm"
          ? "Quality Assurance & Compliance"
          : "Academic Division";

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        username: derivedUsername,
        role: form.role,
        roleTitle,
        status: form.status,
        department: editingUser?.department || defaultDepartment,
        designation: editingUser?.designation || roleTitle,
        process:
          editingUser?.process ||
          (form.role === "owner"
            ? "Course Management"
            : form.role === "auditor"
            ? "Quality Audits & Compliance"
            : "All Quality Processes"),
        privileges: editingUser?.privileges || ROLE_PRESETS[form.role] || ROLE_PRESETS.owner
      };

      if (editingUser) {
        await updateUser(editingUser.id, payload);
      } else {
        await addUser(payload);
      }
      setShowModal(false);
    } catch (err) {
      alert(err.message || "Failed to save user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const action = user.status === "Active" ? "deactivate" : "activate";
    if (!window.confirm(`Are you sure you want to ${action} account for ${user.name}?`)) {
      return;
    }
    try {
      await toggleUserStatus(user.id);
    } catch (err) {
      alert(err.message || `Failed to ${action} user`);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmUser) return;
    setSubmitting(true);
    try {
      await deleteUser(deleteConfirmUser.id);
      setDeleteConfirmUser(null);
    } catch (err) {
      alert(err.message || "Failed to delete user");
    } finally {
      setSubmitting(false);
    }
  };

  // Restrict access if user is not authorized
  if (!canViewUserManagement) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "#fee2e2",
            color: "#dc2626",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "16px"
          }}
        >
          <ShieldAlert size={32} />
        </div>
        <h2 style={{ fontSize: "20px", color: "#0f172a", marginBottom: "8px" }}>Access Restricted</h2>
        <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.5" }}>
          User Management is confidential and only accessible by the <strong>Internal Auditor</strong>, <strong>Trust Team</strong>, and <strong>QMS Coordinator</strong>.
        </p>
      </div>
    );
  }

  // Filter & sort list
  const filtered = (usersList || [])
    .filter((user) => {
      const matchesRole =
        roleFilter === "All" ||
        (roleFilter === "Course Coordinator" && user.role === "owner") ||
        (roleFilter === "QMS Coordinator" && user.role === "qm") ||
        (roleFilter === "Trust Team" && user.role === "Head") ||
        (roleFilter === "Internal Auditor" && user.role === "auditor");

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" && user.status === "Active") ||
        (statusFilter === "Inactive" && user.status === "Inactive");

      const q = query.toLowerCase();
      const matchesQuery =
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        (user.username && user.username.toLowerCase().includes(q)) ||
        (user.roleTitle && user.roleTitle.toLowerCase().includes(q));

      return matchesRole && matchesStatus && matchesQuery;
    })
    .sort((a, b) => {
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      if (sortBy === "name-desc") return b.name.localeCompare(a.name);
      if (sortBy === "role") return (a.roleTitle || "").localeCompare(b.roleTitle || "");
      if (sortBy === "status") return (a.status || "").localeCompare(b.status || "");
      return 0;
    });

  const totalUsers = (usersList || []).length;
  const courseCoordinators = (usersList || []).filter((u) => u.role === "owner").length;
  const qmsCoordinators = (usersList || []).filter((u) => u.role === "qm").length;
  const trustAndAuditors = (usersList || []).filter((u) => u.role === "Head" || u.role === "auditor").length;

  return (
    <>
      <PageIntro
        eyebrow="Access Control & Governance"
        title="User Management"
        description="View and govern user accounts across the institution. Add, update, and manage account statuses and role assignments."
        action={
          isQMSCoordinator && (
            <button
              className="primary-button btn-blue"
              onClick={openAddModal}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Plus size={17} />
              <span>Add User</span>
            </button>
          )
        }
      />

      {/* Role specific visibility banner */}
      {!isQMSCoordinator && (
        <div
          style={{
            marginBottom: "18px",
            padding: "12px 16px",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "8px",
            color: "#166534",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}
        >
          {isInternalAuditor ? <ShieldCheck size={18} color="#15803d" /> : <Award size={18} color="#15803d" />}
          <span>
            <strong>{isInternalAuditor ? "Internal Auditor View" : "Trust Team View"}:</strong> You have authorized read-only visibility into all user accounts and statuses. User account creation and edits are administered by the <strong>QMS Coordinator</strong>.
          </span>
        </div>
      )}

      <div className="stats-grid four">
        <StatCard label="Total User Accounts" value={totalUsers} icon={Users} tone="blue" />
        <StatCard label="Course Coordinators" value={courseCoordinators} icon={Briefcase} tone="teal" />
        <StatCard label="QMS Coordinators" value={qmsCoordinators} icon={UserCheck} tone="blue" />
        <StatCard label="Trust Team & Auditors" value={trustAndAuditors} icon={Award} tone="green" />
      </div>

      <div className="filter-bar" style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
        <label className="search-field" style={{ flex: 1, minWidth: "260px" }}>
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users by name, email, or role..."
          />
        </label>

        <div className="tabs">
          {["All", "Course Coordinator", "QMS Coordinator", "Trust Team", "Internal Auditor"].map((tab) => (
            <button
              key={tab}
              className={roleFilter === tab ? "tab active" : "tab"}
              onClick={() => setRoleFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "7px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              fontSize: "13px",
              background: "#ffffff"
            }}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
          </select>

          {/* Sort selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: "7px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              fontSize: "13px",
              background: "#ffffff"
            }}
          >
            <option value="name-asc">Sort: Name (A-Z)</option>
            <option value="name-desc">Sort: Name (Z-A)</option>
            <option value="role">Sort: Role</option>
            <option value="status">Sort: Status</option>
          </select>
        </div>
      </div>

      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User / Staff</th>
                <th>Assigned Role</th>
                <th>Account Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => {
                const isTrust = user.role === "Head";
                const isQM = user.role === "qm";
                const isAud = user.role === "auditor";

                return (
                  <tr key={user.id || user.username}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background: isTrust ? "#f3e8ff" : isAud ? "#fef3c7" : isQM ? "#dbeafe" : "var(--navy-subtle)",
                            border: `1px solid ${isTrust ? "#d8b4fe" : isAud ? "#fde68a" : isQM ? "#bfdbfe" : "var(--navy-border)"}`,
                            color: isTrust ? "#7e22ce" : isAud ? "#b45309" : isQM ? "#1d4ed8" : "var(--navy)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "700",
                            fontSize: "13px",
                            flexShrink: 0
                          }}
                        >
                          {user.initials || user.name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <strong>{user.name}</strong>
                          <small style={{ color: "#64748b", display: "block" }}>
                            {user.email}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "4px 10px",
                          borderRadius: "14px",
                          fontSize: "12px",
                          fontWeight: "600",
                          background: isTrust ? "#faf5ff" : isAud ? "#fffbeb" : isQM ? "var(--navy-subtle)" : "#f8fafc",
                          border: `1px solid ${isTrust ? "#e9d5ff" : isAud ? "#fef3c7" : isQM ? "var(--navy-border)" : "#e2e8f0"}`,
                          color: isTrust ? "#6b21a8" : isAud ? "#92400e" : isQM ? "var(--navy)" : "#334155"
                        }}
                      >
                        {isTrust ? <Award size={13} /> : isAud ? <ShieldCheck size={13} /> : isQM ? <UserCheck size={13} /> : <Briefcase size={13} />}
                        {user.roleTitle || (isTrust ? "Trust Team" : isAud ? "Internal Auditor" : isQM ? "QMS Coordinator" : "Course Coordinator")}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={user.status || "Active"} />
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                        <button
                          type="button"
                          className="row-action"
                          onClick={() => setViewingProfile(user)}
                          style={{
                            cursor: "pointer",
                            color: "#334155",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          <Eye size={13} /> Profile
                        </button>

                        {isQMSCoordinator && (
                          <>
                            <button
                              type="button"
                              className="row-action"
                              onClick={() => openEditModal(user)}
                              style={{
                                cursor: "pointer",
                                color: "var(--navy)",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                fontWeight: "600"
                              }}
                            >
                              <Edit2 size={13} /> Edit
                            </button>

                            <button
                              type="button"
                              className="row-action"
                              onClick={() => handleToggleStatus(user)}
                              style={{
                                cursor: "pointer",
                                color: user.status === "Active" ? "#d97706" : "#16a34a",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px"
                              }}
                              title={user.status === "Active" ? "Deactivate account" : "Activate account"}
                            >
                              <Power size={13} />
                              {user.status === "Active" ? "Deactivate" : "Activate"}
                            </button>

                            {currentUser?.username !== user.username && (
                              <button
                                type="button"
                                className="row-action"
                                onClick={() => setDeleteConfirmUser(user)}
                                style={{
                                  cursor: "pointer",
                                  color: "#ef4444",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px"
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* User Profile View Modal */}
      {viewingProfile && (
        <Modal
          title={`User Profile: ${viewingProfile.name}`}
          onClose={() => setViewingProfile(null)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", paddingBottom: "14px", borderBottom: "1px solid #e2e8f0" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: viewingProfile.role === "Head" ? "#f3e8ff" : viewingProfile.role === "auditor" ? "#fef3c7" : viewingProfile.role === "qm" ? "#dbeafe" : "#ccfbf1",
                  color: viewingProfile.role === "Head" ? "#6b21a8" : viewingProfile.role === "auditor" ? "#92400e" : viewingProfile.role === "qm" ? "#1d4ed8" : "#0f766e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "700",
                  fontSize: "20px"
                }}
              >
                {viewingProfile.initials || viewingProfile.name?.charAt(0) || "U"}
              </div>
              <div>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "17px", color: "#0f172a" }}>{viewingProfile.name}</h3>
                <span style={{ fontSize: "13px", color: "#64748b" }}>
                  Staff ID: <strong>{viewingProfile.employeeId || viewingProfile.id}</strong>
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "13px" }}>
              <div>
                <span style={{ color: "#64748b", display: "block", marginBottom: "3px" }}>User Name</span>
                <strong style={{ fontSize: "14px", color: "#0f172a" }}>{viewingProfile.name}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block", marginBottom: "3px" }}>Email Address</span>
                <strong style={{ fontSize: "14px", color: "#0f172a" }}>{viewingProfile.email}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block", marginBottom: "3px" }}>Assigned Role</span>
                <span style={{ fontWeight: "700", color: "var(--navy)" }}>
                  {viewingProfile.roleTitle || (viewingProfile.role === "Head" ? "Trust Team" : viewingProfile.role === "auditor" ? "Internal Auditor" : viewingProfile.role === "qm" ? "QMS Coordinator" : "Course Coordinator")}
                </span>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block", marginBottom: "3px" }}>Account Status</span>
                <StatusBadge status={viewingProfile.status || "Active"} />
              </div>
            </div>

            <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              {isQMSCoordinator && (
                <button
                  type="button"
                  className="primary-button btn-blue"
                  onClick={() => {
                    setViewingProfile(null);
                    openEditModal(viewingProfile);
                  }}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <Edit2 size={14} />
                  <span>Edit User</span>
                </button>
              )}
              <button
                type="button"
                className="secondary-button"
                onClick={() => setViewingProfile(null)}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add / Edit User Modal — ONLY User Name, Email Address, Assigned Role, and Account Status */}
      {showModal && (
        <Modal
          title={editingUser ? `Edit User: ${editingUser.name}` : "Add User"}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSubmit}>
            <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "14px" }}>
              {/* 1. User Name */}
              <label>
                User Name (Full Name)
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Verma"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>

              {/* 2. Email Address */}
              <label>
                Email Address
                <input
                  type="email"
                  required
                  placeholder="e.g. rajesh.verma@cdac.in"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </label>

              {/* 3. Assigned Role */}
              <label>
                Assigned Role
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  style={{ padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#fff", width: "100%" }}
                >
                  <option value="owner">Course Coordinator</option>
                  <option value="qm">QMS Coordinator</option>
                  <option value="Head">Trust Team</option>
                  <option value="auditor">Internal Auditor</option>
                </select>
              </label>

              {/* 4. Account Status */}
              <label>
                Account Status
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  style={{ padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#fff", width: "100%" }}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </label>
            </div>

            <div className="modal-actions" style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary-button btn-blue"
                disabled={submitting || !form.name.trim() || !form.email.trim()}
              >
                <span>{submitting ? "Saving..." : editingUser ? "Save Changes" : "Add User"}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete User Confirmation Modal */}
      {deleteConfirmUser && (
        <Modal
          title={`Delete User: ${deleteConfirmUser.name}`}
          onClose={() => setDeleteConfirmUser(null)}
        >
          <div style={{ padding: "6px 0" }}>
            <p style={{ margin: "0 0 16px 0", color: "#334155" }}>
              Are you sure you want to remove <strong>{deleteConfirmUser.name}</strong> (<code>{deleteConfirmUser.email}</code>) from the active user directory?
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setDeleteConfirmUser(null)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button btn-red"
                onClick={handleDelete}
                disabled={submitting}
              >
                <span>{submitting ? "Removing..." : "Confirm Delete"}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
