import React, { useState } from "react";
import {
  UserCheck,
  Plus,
  Search,
  Edit2,
  Trash2,
  Shield,
  CheckCircle,
  Users,
  Award,
  Briefcase,
  KeyRound,
  Check,
  X,
  Eye,
  Power,
  ArrowUpDown,
  Lock
} from "lucide-react";
import { useApp } from "../context/AppContext";
import PageIntro from "../components/common/PageIntro";
import StatCard from "../components/common/StatCard";
import StatusBadge from "../components/common/StatusBadge";
import Modal from "../components/tasks/Modal";

const AVAILABLE_PRIVILEGES = [
  {
    id: "Manage Documents",
    name: "Manage Documents",
    desc: "Create, edit, and archive controlled QMS course documents"
  },
  {
    id: "Review Documents",
    name: "Review Documents",
    desc: "Review drafts in queue and recommend revisions or approval"
  },
  {
    id: "Plan & Schedule MRM",
    name: "Plan & Schedule MRM",
    desc: "Initiate and schedule Management Review Meetings"
  },
  {
    id: "Draft Minutes of Meeting (MoM)",
    name: "Draft Minutes of Meeting (MoM)",
    desc: "Record meeting discussion points, decisions, and action items"
  },
  {
    id: "Approve MRM",
    name: "Approve MRM",
    desc: "Trust Head executive sign-off and ratification for MRM MoM"
  },
  {
    id: "Share MRM with Coordinators",
    name: "Share MRM with Coordinators",
    desc: "Distribute approved MRMs to all Course Coordinators"
  },
  {
    id: "User Management",
    name: "User Management",
    desc: "Add, edit, view user accounts and assign security privileges"
  },
  {
    id: "Assign & Supervise Tasks",
    name: "Assign & Supervise Tasks",
    desc: "Create, delegate, and supervise tasks across departments"
  },
  {
    id: "View Audit Logs & Reports",
    name: "View Audit Logs & Reports",
    desc: "Access compliance audit trails and system activity logs"
  }
];

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

  const isQMSCoordinator = currentUser?.role === "qm";

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("name-asc");

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewingProfile, setViewingProfile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);

  // Form state
  const [form, setForm] = useState({
    name: "",
    email: "",
    username: "",
    password: "1234",
    role: "owner",
    designation: "Course Coordinator",
    department: "Advanced Computing Division",
    process: "Course Management",
    status: "Active",
    privileges: [...ROLE_PRESETS.owner]
  });

  const openAddModal = () => {
    setEditingUser(null);
    setForm({
      name: "",
      email: "",
      username: "",
      password: "1234",
      role: "owner",
      designation: "Course Coordinator",
      department: "Academic Division",
      process: "Course Management",
      status: "Active",
      privileges: [...ROLE_PRESETS.owner]
    });
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      username: user.username,
      password: "",
      role: user.role,
      designation: user.designation || "",
      department: user.department || "",
      process: user.process || "",
      status: user.status || "Active",
      privileges: Array.isArray(user.privileges) ? [...user.privileges] : [...(ROLE_PRESETS[user.role] || [])]
    });
    setShowModal(true);
  };

  const handleRoleChange = (newRole) => {
    setForm((prev) => ({
      ...prev,
      role: newRole,
      privileges: [...(ROLE_PRESETS[newRole] || ROLE_PRESETS.owner)],
      designation:
        newRole === "owner"
          ? "Course Coordinator"
          : newRole === "qm"
          ? "QMS Coordinator"
          : "Trust Head"
    }));
  };

  const handleTogglePrivilege = (privId) => {
    setForm((prev) => {
      const exists = prev.privileges.includes(privId);
      const nextPrivs = exists
        ? prev.privileges.filter((p) => p !== privId)
        : [...prev.privileges, privId];
      return { ...prev, privileges: nextPrivs };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;

    setSubmitting(true);
    try {
      if (editingUser) {
        await updateUser(editingUser.id, form);
      } else {
        await addUser(form);
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

  // Filter & sort list
  const filtered = (usersList || [])
    .filter((user) => {
      const matchesRole =
        roleFilter === "All" ||
        (roleFilter === "Course Coordinator" && user.role === "owner") ||
        (roleFilter === "QMS Coordinator" && user.role === "qm") ||
        (roleFilter === "Trust Head" && user.role === "Head");

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" && user.status === "Active") ||
        (statusFilter === "Inactive" && user.status === "Inactive");

      const q = query.toLowerCase();
      const matchesQuery =
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.username.toLowerCase().includes(q) ||
        (user.department && user.department.toLowerCase().includes(q)) ||
        (user.roleTitle && user.roleTitle.toLowerCase().includes(q)) ||
        (Array.isArray(user.privileges) &&
          user.privileges.some((p) => p.toLowerCase().includes(q)));

      return matchesRole && matchesStatus && matchesQuery;
    })
    .sort((a, b) => {
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      if (sortBy === "name-desc") return b.name.localeCompare(a.name);
      if (sortBy === "role") return (a.roleTitle || "").localeCompare(b.roleTitle || "");
      if (sortBy === "department") return (a.department || "").localeCompare(b.department || "");
      if (sortBy === "status") return (a.status || "").localeCompare(b.status || "");
      return 0;
    });

  const totalUsers = (usersList || []).length;
  const courseCoordinators = (usersList || []).filter((u) => u.role === "owner").length;
  const qmsCoordinators = (usersList || []).filter((u) => u.role === "qm").length;
  const trustHeads = (usersList || []).filter((u) => u.role === "Head").length;

  return (
    <>
      <PageIntro
        eyebrow="Access Control & Governance"
        title="User Management"
        description="Add, edit, view, and supervise Course Coordinators and staff. Manage their role assignments, account statuses, and system privileges."
        action={
          isQMSCoordinator && (
            <button
              className="primary-button btn-blue"
              onClick={openAddModal}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Plus size={17} />
              <span>Add New User</span>
            </button>
          )
        }
      />

      {!isQMSCoordinator && (
        <div
          style={{
            marginBottom: "18px",
            padding: "12px 16px",
            background: "var(--navy-subtle)",
            border: "1px solid var(--navy-border)",
            borderRadius: "8px",
            color: "var(--navy)",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <Lock size={16} />
          <span>
            <strong>Read-Only Mode:</strong> Only the <strong>QMS Coordinator</strong> has authorization to add, edit, or modify user accounts and security privileges.
          </span>
        </div>
      )}

      <div className="stats-grid four">
        <StatCard label="Total User Accounts" value={totalUsers} icon={Users} tone="blue" />
        <StatCard label="Course Coordinators" value={courseCoordinators} icon={Briefcase} tone="teal" />
        <StatCard label="QMS Coordinators" value={qmsCoordinators} icon={UserCheck} tone="blue" />
        <StatCard label="Trust Executives" value={trustHeads} icon={Award} tone="green" />
      </div>

      <div className="filter-bar" style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
        <label className="search-field" style={{ flex: 1, minWidth: "260px" }}>
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users by name, email, department, or assigned privileges..."
          />
        </label>

        <div className="tabs">
          {["All", "Course Coordinator", "QMS Coordinator", "Trust Head"].map((tab) => (
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
            <option value="department">Sort: Department</option>
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
                <th>Role</th>
                <th>Department & Process</th>
                <th>Assigned Privileges</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => {
                const userPrivs = Array.isArray(user.privileges) ? user.privileges : [];

                return (
                  <tr key={user.id || user.username}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background: "var(--navy-subtle)",
                            border: "1px solid var(--navy-border)",
                            color: "var(--navy)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "700",
                            fontSize: "13px",
                            flexShrink: 0
                          }}
                        >
                          {user.initials || "U"}
                        </div>
                        <div>
                          <strong>{user.name}</strong>
                          <small style={{ color: "#64748b", display: "block" }}>
                            {user.email} • <code>@{user.username}</code>
                          </small>
                          {user.designation && (
                            <small style={{ color: "var(--navy)", fontWeight: "500" }}>{user.designation}</small>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "3px 8px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "600",
                          background: "var(--navy-subtle)",
                          border: "1px solid var(--navy-border)",
                          color: "var(--navy)"
                        }}
                      >
                        {user.role === "Head" ? <Award size={13} /> : user.role === "qm" ? <UserCheck size={13} /> : <Briefcase size={13} />}
                        {user.roleTitle || (user.role === "Head" ? "Trust Head" : user.role === "qm" ? "QMS Coordinator" : "Course Coordinator")}
                      </span>
                    </td>
                    <td>
                      <strong>{user.department || "Academic Division"}</strong>
                      <small style={{ color: "#64748b", display: "block" }}>
                        {user.process || "Course Management"}
                      </small>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", maxWidth: "320px" }}>
                        {userPrivs.slice(0, 3).map((priv) => (
                          <span
                            key={priv}
                            style={{
                              fontSize: "11px",
                              padding: "2px 7px",
                              background: "#f1f5f9",
                              color: "#334155",
                              borderRadius: "4px",
                              border: "1px solid #e2e8f0"
                            }}
                          >
                            {priv}
                          </span>
                        ))}
                        {userPrivs.length > 3 && (
                          <span
                            style={{
                              fontSize: "11px",
                              padding: "2px 6px",
                              background: "var(--navy-subtle)",
                              color: "var(--navy)",
                              borderRadius: "4px",
                              fontWeight: "600",
                              cursor: "pointer",
                              border: "1px solid var(--navy-border)"
                            }}
                            onClick={() => setViewingProfile(user)}
                            title={userPrivs.slice(3).join(", ")}
                          >
                            +{userPrivs.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={user.status || "Active"} />
                    </td>
                    <td>
                      <div style={{ display: "inline-flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
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
                  background: viewingProfile.role === "Head" ? "#f3e8ff" : viewingProfile.role === "qm" ? "#dbeafe" : "#ccfbf1",
                  color: viewingProfile.role === "Head" ? "#6b21a8" : viewingProfile.role === "qm" ? "#1d4ed8" : "#0f766e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "700",
                  fontSize: "20px"
                }}
              >
                {viewingProfile.initials || "U"}
              </div>
              <div>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "17px", color: "#0f172a" }}>{viewingProfile.name}</h3>
                <span style={{ fontSize: "13px", color: "#64748b" }}>
                  Staff ID: <strong>{viewingProfile.employeeId || viewingProfile.id}</strong> • Joined: {viewingProfile.joinDate || "N/A"}
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px" }}>
              <div>
                <span style={{ color: "#64748b", display: "block" }}>Email Address</span>
                <strong>{viewingProfile.email}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block" }}>Username</span>
                <code>@{viewingProfile.username}</code>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block" }}>Assigned Role</span>
                <span style={{ fontWeight: "700", color: "var(--navy)" }}>
                  {viewingProfile.roleTitle || (viewingProfile.role === "Head" ? "Trust Head" : viewingProfile.role === "qm" ? "QMS Coordinator" : "Course Coordinator")}
                </span>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block" }}>Account Status</span>
                <StatusBadge status={viewingProfile.status || "Active"} />
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block" }}>Department / Division</span>
                <strong>{viewingProfile.department || "Academic Division"}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block" }}>Designation</span>
                <strong>{viewingProfile.designation || "Course Coordinator"}</strong>
              </div>
            </div>

            <div style={{ marginTop: "10px", padding: "14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <strong style={{ fontSize: "13px", color: "#0f172a", display: "block", marginBottom: "8px" }}>
                Assigned Security Privileges ({viewingProfile.privileges?.length || 0})
              </strong>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {(viewingProfile.privileges || []).map((p) => (
                  <span
                    key={p}
                    style={{
                      fontSize: "12px",
                      padding: "4px 9px",
                      background: "#ffffff",
                      color: "#1e293b",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px"
                    }}
                  >
                    <CheckCircle size={12} color="#16a34a" /> {p}
                  </span>
                ))}
              </div>
            </div>

            <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
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

      {/* Add / Edit User Modal */}
      {showModal && (
        <Modal
          title={editingUser ? `Edit User & Privileges: ${editingUser.name}` : "Add New User & Assign Privileges"}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                Full Name
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Verma"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>

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

              <label>
                Username
                <input
                  type="text"
                  placeholder="e.g. rajesh.verma (leave blank to auto-generate)"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
              </label>

              <label>
                Assigned Role
                <select
                  value={form.role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                >
                  <option value="owner">Course Coordinator</option>
                  <option value="qm">QMS Coordinator</option>
                  <option value="Head">Trust Head</option>
                </select>
              </label>

              <label>
                Department / Division
                <input
                  type="text"
                  placeholder="e.g. Artificial Intelligence Division"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                />
              </label>

              <label>
                Course / Process Responsibilities
                <input
                  type="text"
                  placeholder="e.g. AI & Machine Learning PG Diploma"
                  value={form.process}
                  onChange={(e) => setForm({ ...form, process: e.target.value })}
                />
              </label>

              <label>
                Official Designation
                <input
                  type="text"
                  placeholder="e.g. Senior Course Coordinator"
                  value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })}
                />
              </label>

              <label>
                Account Status
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </label>
            </div>

            {/* PRIVILEGES CHECKLIST SECTION */}
            <div style={{ marginTop: "20px", borderTop: "1px solid #e2e8f0", paddingTop: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div>
                  <strong style={{ fontSize: "14px", color: "#0f172a" }}>
                    Security & Workflow Privileges
                  </strong>
                  <small style={{ display: "block", color: "#64748b" }}>
                    Select granular capabilities for this user account or apply role default presets.
                  </small>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  style={{ fontSize: "12px", padding: "4px 8px" }}
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      privileges: [...(ROLE_PRESETS[prev.role] || ROLE_PRESETS.owner)]
                    }))
                  }
                >
                  Reset to Role Defaults
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "10px"
                }}
              >
                {AVAILABLE_PRIVILEGES.map((priv) => {
                  const checked = form.privileges.includes(priv.id);
                  return (
                    <label
                      key={priv.id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        padding: "10px",
                        borderRadius: "6px",
                        border: `1px solid ${checked ? "#93c5fd" : "#e2e8f0"}`,
                        background: checked ? "#eff6ff" : "#f8fafc",
                        cursor: "pointer",
                        transition: "all 0.15s"
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleTogglePrivilege(priv.id)}
                        style={{ marginTop: "2px" }}
                      />
                      <div>
                        <strong style={{ fontSize: "12px", color: "#1e293b", display: "block" }}>
                          {priv.name}
                        </strong>
                        <small style={{ fontSize: "11px", color: "#64748b", lineHeight: "1.3", display: "block" }}>
                          {priv.desc}
                        </small>
                      </div>
                    </label>
                  );
                })}
              </div>
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
                className="primary-button btn-green"
                disabled={submitting}
              >
                <span>{submitting ? "Saving..." : editingUser ? "Save Changes" : "Create User"}</span>
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
