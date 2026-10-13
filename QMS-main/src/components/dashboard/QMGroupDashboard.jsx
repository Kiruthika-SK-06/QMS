import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  BookOpen,
  Check,
  ClipboardList,
  Clock3,
  FileCheck2,
  FileText,
  Users,
  Edit,
  Download,
  Layers,
  Trash2,
  AlertTriangle,
  UserCheck,
  CalendarCheck,
  Share2,
  ArrowRight
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import PageIntro from "../common/PageIntro";
import SectionHeader from "../common/SectionHeader";
import StatCard from "../common/StatCard";
import StatusBadge from "../common/StatusBadge";
import TemplateEditModal from "../common/TemplateEditModal";
import Modal from "../tasks/Modal";
import ActivityCard from "./ActivityCard";
import DocumentTable from "../tables/DocumentTable";
import ProcessTable from "../tables/ProcessTable";

export default function QMGroupDashboard() {
  const {
    tasks,
    documents,
    processes,
    employees,
    usersList,
    mrmList,
    shareMRM,
    downloadDocument,
    deleteDocument
  } = useApp();

  const [editingTemplate, setEditingTemplate] = useState(null);
  const [tplToDelete, setTplToDelete] = useState(null);
  const [deletingTpl, setDeletingTpl] = useState(false);
  const [sharingMRMId, setSharingMRMId] = useState(null);

  const templates = (documents || []).filter((d) => d.type === "Templates");

  const courseCoordinatorsCount = (usersList || employees || []).filter(
    (e) => e.role === "owner"
  ).length;

  const pendingReviews = documents.filter(
    (d) => d.status === "Under Review" || d.status === "Changes Requested"
  ).length;

  const readyToShareMRMs = (mrmList || []).filter(
    (m) =>
      (m.status === "Approved by Trust Head" || m.status === "Approved" || m.trustHeadApproval?.approved) &&
      !m.sharedWithAll
  );

  const activeTasks = tasks.filter((t) => t.status === "In Progress").length;
  const completedTasks = tasks.filter((t) => t.status === "Completed").length;
  const pendingTasks = tasks.filter((t) => t.status === "Pending").length;

  const totalTasks = tasks.length || 1;
  const completedPct = Math.round((completedTasks / totalTasks) * 100);
  const activePct = Math.round((activeTasks / totalTasks) * 100);
  const pendingPct = Math.round((pendingTasks / totalTasks) * 100);

  const handleQuickShareMRM = async (id) => {
    setSharingMRMId(id);
    try {
      await shareMRM(id);
      alert("Management Review Meeting has been shared with all Course Coordinators!");
    } catch (err) {
      alert(err.message || "Failed to share MRM");
    } finally {
      setSharingMRMId(null);
    }
  };

  return (
    <>
      <PageIntro
        eyebrow="QMS Coordinator Workspace"
        title="QMS Coordinator Command View"
        description="Monitor quality system compliance, review queue, user privileges, and Management Review Meeting distribution."
        action={
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <NavLink
              to="/user-management"
              className="secondary-button"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <UserCheck size={16} /> User Management
            </NavLink>
            <NavLink
              to="/mrm"
              className="primary-button"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <CalendarCheck size={16} /> MRM Workflow
            </NavLink>
          </div>
        }
      />

      {/* Action Banner for Ready-to-Share MRM */}
      {readyToShareMRMs.length > 0 && (
        <div
          style={{
            marginBottom: "20px",
            padding: "16px 20px",
            background: "#f0fdf4",
            border: "1px solid #86efac",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "#dcfce7",
                color: "#16a34a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}
            >
              <Share2 size={20} />
            </div>
            <div>
              <strong style={{ display: "block", color: "#166534", fontSize: "15px" }}>
                {readyToShareMRMs.length} MRM Approved by Trust Head & Ready to Share!
              </strong>
              <span style={{ color: "#15803d", fontSize: "13px" }}>
                Trust Head has approved {readyToShareMRMs[0]?.title}. You can now share it with all Course Coordinators.
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              className="primary-button btn-green"
              disabled={sharingMRMId === readyToShareMRMs[0]?.id}
              onClick={() => handleQuickShareMRM(readyToShareMRMs[0]?.id)}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Share2 size={15} />
              <span>{sharingMRMId === readyToShareMRMs[0]?.id ? "Distributing..." : "Share with All Coordinators"}</span>
            </button>
            <NavLink to="/mrm" className="secondary-button" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <span>View All</span>
              <ArrowRight size={14} />
            </NavLink>
          </div>
        </div>
      )}

      <div className="stats-grid seven">
        <StatCard label="Processes" value={processes.length} icon={BookOpen} />
        <StatCard label="Course coordinators" value={courseCoordinatorsCount || 3} icon={Users} tone="teal" />
        <StatCard label="User accounts" value={usersList?.length || 5} icon={UserCheck} />
        <StatCard label="MRM meetings" value={mrmList?.length || 3} icon={CalendarCheck} tone="teal" />
        <StatCard label="Documents" value={documents.length} icon={FileText} tone="teal" />
        <StatCard label="Pending reviews" value={pendingReviews} icon={FileCheck2} tone="amber" />
        <StatCard label="Completed tasks" value={completedTasks} icon={Check} tone="green" />
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <SectionHeader title="Task completion" />
          <div className="chart">
            <div className="chart-bar">
              <span style={{ height: `${Math.max(completedPct, 8)}%` }} />
              <small>Completed</small>
              <strong>{completedPct}%</strong>
            </div>
            <div className="chart-bar">
              <span style={{ height: `${Math.max(activePct, 8)}%` }} />
              <small>In progress</small>
              <strong>{activePct}%</strong>
            </div>
            <div className="chart-bar">
              <span style={{ height: `${Math.max(pendingPct, 8)}%` }} />
              <small>Pending</small>
              <strong>{pendingPct}%</strong>
            </div>
          </div>
        </section>
        <ActivityCard />
      </div>

      {/* MRM Sequential Workflow Control Center */}
      <section className="panel">
        <SectionHeader
          title="Management Review Meeting (MRM) — Quality Lifecycle Center"
          action={
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <NavLink className="primary-button" to="/mrm" style={{ fontSize: "12px", padding: "5px 12px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <CalendarCheck size={14} /> Open Full MRM Console
              </NavLink>
            </div>
          }
        />

        {/* 6-Stage Workflow Progress Stepper */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: "10px",
            marginBottom: "18px",
            padding: "14px 16px",
            background: "#ffffff",
            borderRadius: "10px",
            border: "1px solid var(--line)",
            boxShadow: "var(--shadow-xs)"
          }}
        >
          <div style={{ textAlign: "center", padding: "6px 8px", background: "var(--navy-subtle)", borderRadius: "8px", border: "1px solid var(--navy-border)" }}>
            <span style={{ fontSize: "11px", color: "var(--navy)", fontWeight: "700", textTransform: "uppercase", display: "block" }}>1. Planned</span>
            <strong style={{ fontSize: "19px", color: "var(--navy)", fontFamily: "Space Grotesk, sans-serif" }}>
              {(mrmList || []).filter((m) => m.status === "Planned").length}
            </strong>
            <small style={{ fontSize: "10px", color: "var(--muted)", display: "block" }}>Needs Scheduling</small>
          </div>
          <div style={{ textAlign: "center", padding: "6px 8px", background: "var(--navy-subtle)", borderRadius: "8px", border: "1px solid var(--navy-border)" }}>
            <span style={{ fontSize: "11px", color: "var(--navy)", fontWeight: "700", textTransform: "uppercase", display: "block" }}>2. Scheduled</span>
            <strong style={{ fontSize: "19px", color: "var(--navy)", fontFamily: "Space Grotesk, sans-serif" }}>
              {(mrmList || []).filter((m) => m.status === "Scheduled" && !m.mom).length}
            </strong>
            <small style={{ fontSize: "10px", color: "var(--muted)", display: "block" }}>Needs MoM</small>
          </div>
          <div style={{ textAlign: "center", padding: "6px 8px", background: "var(--navy-subtle)", borderRadius: "8px", border: "1px solid var(--navy-border)" }}>
            <span style={{ fontSize: "11px", color: "var(--navy)", fontWeight: "700", textTransform: "uppercase", display: "block" }}>3. MoM Done</span>
            <strong style={{ fontSize: "19px", color: "var(--navy)", fontFamily: "Space Grotesk, sans-serif" }}>
              {(mrmList || []).filter((m) => m.status === "MoM Recorded").length}
            </strong>
            <small style={{ fontSize: "10px", color: "var(--muted)", display: "block" }}>Ready for Approval</small>
          </div>
          <div style={{ textAlign: "center", padding: "6px 8px", background: "var(--status-amber-bg)", borderRadius: "8px", border: "1px solid var(--status-amber-border)" }}>
            <span style={{ fontSize: "11px", color: "var(--status-amber)", fontWeight: "700", textTransform: "uppercase", display: "block" }}>4. With Trust</span>
            <strong style={{ fontSize: "19px", color: "var(--status-amber)", fontFamily: "Space Grotesk, sans-serif" }}>
              {(mrmList || []).filter((m) => m.status === "Submitted for Approval" || m.status === "Pending Trust Head Approval").length}
            </strong>
            <small style={{ fontSize: "10px", color: "var(--status-amber)", display: "block" }}>In Review</small>
          </div>
          <div style={{ textAlign: "center", padding: "6px 8px", background: "var(--status-green-bg)", borderRadius: "8px", border: "1px solid var(--status-green-border)" }}>
            <span style={{ fontSize: "11px", color: "var(--status-green)", fontWeight: "700", textTransform: "uppercase", display: "block" }}>5. Approved</span>
            <strong style={{ fontSize: "19px", color: "var(--status-green)", fontFamily: "Space Grotesk, sans-serif" }}>
              {(mrmList || []).filter((m) => (m.status === "Approved" || m.trustHeadApproval?.approved) && !m.sharedWithAll).length}
            </strong>
            <small style={{ fontSize: "10px", color: "var(--status-green)", fontWeight: "600", display: "block" }}>Ready to Share!</small>
          </div>
          <div style={{ textAlign: "center", padding: "6px 8px", background: "var(--navy-subtle)", borderRadius: "8px", border: "1px solid var(--navy-border)" }}>
            <span style={{ fontSize: "11px", color: "var(--navy)", fontWeight: "700", textTransform: "uppercase", display: "block" }}>6. Shared</span>
            <strong style={{ fontSize: "19px", color: "var(--navy)", fontFamily: "Space Grotesk, sans-serif" }}>
              {(mrmList || []).filter((m) => m.sharedWithAll || m.status === "Shared").length}
            </strong>
            <small style={{ fontSize: "10px", color: "var(--muted)", display: "block" }}>Distributed</small>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Meeting Title & Scope</th>
                <th>Stage & Status</th>
                <th>Schedule</th>
                <th>Minutes (MoM)</th>
                <th>Trust Head Decision</th>
                <th style={{ textAlign: "right" }}>Next Workflow Action</th>
              </tr>
            </thead>
            <tbody>
              {(mrmList || []).slice(0, 5).map((mrm) => {
                const isApproved =
                  mrm.status === "Approved" ||
                  mrm.status === "Approved by Trust Head" ||
                  mrm.trustHeadApproval?.approved;
                const isPending =
                  mrm.status === "Submitted for Approval" ||
                  mrm.status === "Pending Trust Head Approval";

                return (
                  <tr key={mrm.id}>
                    <td>
                      <NavLink to="/mrm" className="table-link">
                        <strong style={{ fontSize: "13px" }}>{mrm.title}</strong>
                        <small style={{ display: "block", color: "#64748b", marginTop: "2px" }}>
                          {mrm.id} • {mrm.department || "Academic Quality"}
                        </small>
                      </NavLink>
                    </td>
                    <td>
                      <StatusBadge status={mrm.status} />
                    </td>
                    <td>
                      {mrm.scheduledDate ? (
                        <div style={{ fontSize: "12px" }}>
                          <span style={{ fontWeight: "600", color: "#0f172a" }}>{mrm.scheduledDate}</span>
                          <small style={{ display: "block", color: "#64748b" }}>{mrm.scheduledTime || "11:00 AM"}</small>
                        </div>
                      ) : (
                        <span style={{ fontSize: "11px", color: "var(--navy)", background: "var(--navy-subtle)", padding: "2px 6px", borderRadius: "4px" }}>
                          Needs Scheduling
                        </span>
                      )}
                    </td>
                    <td>
                      {mrm.mom ? (
                        <span style={{ color: "var(--navy)", fontSize: "12px", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                          <Check size={13} /> Recorded ({mrm.mom.actionItems?.length || 0} items)
                        </span>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "11px" }}>Pending MoM</span>
                      )}
                    </td>
                    <td>
                      {isApproved ? (
                        <span style={{ color: "#16a34a", fontWeight: "600", fontSize: "12px" }}>
                          ✓ Approved by Trust Head
                        </span>
                      ) : isPending ? (
                        <span style={{ color: "#d97706", fontWeight: "600", fontSize: "12px" }}>
                          ⏳ In Review
                        </span>
                      ) : mrm.status === "Changes Requested" ? (
                        <span style={{ color: "#dc2626", fontWeight: "600", fontSize: "12px" }}>
                          Revisions Requested
                        </span>
                      ) : (
                        <span style={{ color: "#64748b", fontSize: "11px" }}>Not Submitted</span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {/* Direct Next Action Button based on lifecycle */}
                      {isApproved && !mrm.sharedWithAll ? (
                        <button
                          type="button"
                          className="primary-button btn-green"
                          onClick={() => handleQuickShareMRM(mrm.id)}
                          disabled={sharingMRMId === mrm.id}
                          style={{
                            fontSize: "12px",
                            padding: "4px 10px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px"
                          }}
                        >
                          <Share2 size={13} />
                          <span>{sharingMRMId === mrm.id ? "Sharing..." : "Share with All"}</span>
                        </button>
                      ) : mrm.sharedWithAll ? (
                        <span style={{ color: "#16a34a", fontSize: "12px", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                          ✓ Distributed ({mrm.acknowledgements?.length || 0} Acks)
                        </span>
                      ) : mrm.status === "Planned" ? (
                        <NavLink
                          to={`/mrm?mrmId=${mrm.id}`}
                          className="secondary-button"
                          style={{ fontSize: "12px", padding: "3px 8px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                        >
                          <CalendarCheck size={12} />
                          <span>Continue (Schedule)</span>
                        </NavLink>
                      ) : mrm.status === "Scheduled" ? (
                        <NavLink
                          to={`/mrm?mrmId=${mrm.id}`}
                          className="secondary-button"
                          style={{ fontSize: "12px", padding: "3px 8px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                        >
                          <Edit size={12} />
                          <span>Continue (MoM)</span>
                        </NavLink>
                      ) : mrm.status === "MoM Recorded" ? (
                        <NavLink
                          to={`/mrm?mrmId=${mrm.id}`}
                          className="primary-button btn-amber"
                          style={{ fontSize: "12px", padding: "3px 8px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                        >
                          <Send size={12} />
                          <span>Review & Submit</span>
                        </NavLink>
                      ) : (
                        <NavLink
                          to={`/mrm?mrmId=${mrm.id}`}
                          className="row-action"
                          style={{ color: "var(--navy)", fontSize: "12px", fontWeight: "600" }}
                        >
                          View Details
                        </NavLink>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <SectionHeader
          title="Document review queue"
          action={<NavLink className="text-link" to="/reviews">Open review queue</NavLink>}
        />
        <DocumentTable
          items={documents.filter(
            (document) => document.status === "Under Review" || document.status === "Changes Requested"
          )}
          review
        />
      </section>

      <section className="panel">
        <SectionHeader
          title="Controlled templates & standard formats"
          action={
            <NavLink className="text-link" to="/documents?type=Templates">
              View all in library
            </NavLink>
          }
        />
        {templates.length === 0 ? (
          <div style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>
            <p>No standard templates registered yet.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Template</th>
                  <th>Process</th>
                  <th>Version</th>
                  <th>Last updated</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((tpl) => (
                  <tr key={tpl.id}>
                    <td>
                      <NavLink className="table-link" to={`/documents/${tpl.id}`}>
                        <strong>{tpl.name}</strong>
                        <small>{tpl.id}</small>
                      </NavLink>
                    </td>
                    <td>{tpl.process}</td>
                    <td>
                      <b>v{tpl.version}</b>
                    </td>
                    <td>{tpl.updated}</td>
                    <td>
                      <StatusBadge status={tpl.status} />
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          type="button"
                          className="row-action"
                          onClick={() => setEditingTemplate(tpl)}
                          style={{
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            fontWeight: "600",
                            color: "var(--navy)"
                          }}
                        >
                          <Edit size={14} /> Edit template
                        </button>
                        <button
                          type="button"
                          className="row-action"
                          onClick={() => downloadDocument(tpl.id)}
                          style={{
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          <Download size={14} /> View
                        </button>
                        <button
                          type="button"
                          className="row-action"
                          onClick={() => setTplToDelete(tpl)}
                          style={{
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            color: "#ef4444"
                          }}
                          title={`Delete template ${tpl.name}`}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <SectionHeader
          title="Process overview"
          action={<NavLink className="text-link" to="/processes">View all processes</NavLink>}
        />
        <ProcessTable items={processes} />
      </section>

      {editingTemplate && (
        <TemplateEditModal
          template={editingTemplate}
          onClose={() => setEditingTemplate(null)}
          onSave={() => setEditingTemplate(null)}
        />
      )}

      {tplToDelete && (
        <Modal
          title="Delete Controlled Template"
          onClose={() => setTplToDelete(null)}
        >
          <div style={{ padding: "6px 0" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "16px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "#fee2e2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#dc2626",
                  flexShrink: 0
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <div>
                <h4 style={{ margin: "0 0 6px 0", fontSize: "15px", color: "#0f172a" }}>
                  Confirm Permanent Deletion
                </h4>
                <p style={{ margin: 0, fontSize: "14px", color: "#475569", lineHeight: "1.5" }}>
                  Are you sure you want to delete template <strong>{tplToDelete.name}</strong> ({tplToDelete.id})? This will permanently remove it from the system and log an audit trail entry.
                </p>
              </div>
            </div>

            <div
              className="modal-actions"
              style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end", gap: "10px" }}
            >
              <button
                type="button"
                className="secondary-button"
                onClick={() => setTplToDelete(null)}
                disabled={deletingTpl}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button btn-red"
                disabled={deletingTpl}
                onClick={async () => {
                  setDeletingTpl(true);
                  try {
                    await deleteDocument(tplToDelete.id);
                    setTplToDelete(null);
                  } catch (err) {
                    alert(err.message || "Failed to delete template");
                  } finally {
                    setDeletingTpl(false);
                  }
                }}
              >
                <span>{deletingTpl ? "Deleting..." : "Delete Permanently"}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
