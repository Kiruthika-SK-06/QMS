import React from "react";
import { NavLink } from "react-router-dom";
import {
  BookOpen,
  CalendarCheck,
  Check,
  FileText,
  ClipboardList,
  ShieldCheck,
  ArrowRight
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import PageIntro from "../common/PageIntro";
import SectionHeader from "../common/SectionHeader";
import StatusBadge from "../common/StatusBadge";

export default function ProcessOwnerDashboard() {
  const { documents = [], processes = [], mrmList = [], tasks = [], auditList = [], externalAuditList = [] } = useApp();

  const awaitingReview = documents.filter(
    (d) => d.status === "Under Review" || d.status === "Changes Requested"
  ).length;

  // Filter MRMs accessible to Course Coordinator (only notified or MoM published)
  const accessibleMRMs = (mrmList || []).filter(
    (m) =>
      m.emailNotification?.sent ||
      m.status === "Notification Sent" ||
      m.status === "Shared" ||
      m.sharedWithAll ||
      m.momFile ||
      m.status === "MoM Uploaded" ||
      (m.stage && m.stage >= 3)
  );

  const momPublishedCount = accessibleMRMs.filter(
    (m) => !!m.momFile || m.status === "MoM Uploaded"
  ).length;

  return (
    <>
      <PageIntro
        eyebrow="COURSE COORDINATOR WORKSPACE"
        title="Course Coordinator Workspace"
        description="Manage and track course processes, review scheduled Management Review Meetings (MRM), and access controlled documents."
      />

      {/* Main Context Overview Cards: MRM, Process Overview, Docs Management */}
      <div className="overview-cards-grid">
        {/* Card 1: MRM */}
        <NavLink to="/mrm" className="overview-context-card">
          <div className="overview-card-header">
            <div className="overview-card-icon purple">
              <CalendarCheck size={22} />
            </div>
            <div className="overview-card-title-group">
              <h3>MRM</h3>
            </div>
          </div>
          <div className="overview-card-metric">
            {accessibleMRMs.length} <small>Scheduled Sessions</small>
          </div>
          <div className="overview-card-footer">
            <span>View MRM Schedule</span>
            <ArrowRight size={14} />
          </div>
        </NavLink>

        {/* Card 2: Process Overview */}
        <NavLink to="/processes" className="overview-context-card">
          <div className="overview-card-header">
            <div className="overview-card-icon teal">
              <BookOpen size={22} />
            </div>
            <div className="overview-card-title-group">
              <h3>Process Overview</h3>
            </div>
          </div>
          <div className="overview-card-metric">
            {processes.length} <small>Monitored Processes</small>
          </div>
          <div className="overview-card-footer">
            <span>Explore Processes</span>
            <ArrowRight size={14} />
          </div>
        </NavLink>

        {/* Card 3: Docs Management */}
        <NavLink to="/documents" className="overview-context-card">
          <div className="overview-card-header">
            <div className="overview-card-icon blue">
              <FileText size={22} />
            </div>
            <div className="overview-card-title-group">
              <h3>Docs Management</h3>
            </div>
          </div>
          <div className="overview-card-metric">
            {documents.length} <small>Controlled Documents</small>
          </div>
          <div className="overview-card-footer">
            <span>Open Document Library</span>
            <ArrowRight size={14} />
          </div>
        </NavLink>
      </div>

      {/* Row: Tasks and Internal Audit with brief details */}
      <div className="dashboard-two-col">
        {/* Left: Tasks */}
        <section className="panel" style={{ margin: 0, display: "flex", flexDirection: "column" }}>
          <SectionHeader
            title="Assigned Tasks"
            action={<NavLink className="text-link" to="/tasks">View all tasks →</NavLink>}
          />
          <div className="table-wrap" style={{ flex: 1 }}>
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Process / Scope</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: "28px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
                      No tasks currently assigned.
                    </td>
                  </tr>
                ) : (
                  tasks.slice(0, 4).map((task) => (
                    <tr key={task.id}>
                      <td>
                        <NavLink to="/tasks" className="table-link">
                          <strong>{task.title}</strong>
                          <small>{task.id}</small>
                        </NavLink>
                      </td>
                      <td>{task.process || task.document || "General"}</td>
                      <td>{task.due || "Pending"}</td>
                      <td>
                        <StatusBadge status={task.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right: Internal Audit */}
        <section className="panel" style={{ margin: 0, display: "flex", flexDirection: "column" }}>
          <SectionHeader
            title="Internal Audit"
            action={<NavLink className="text-link" to="/internal-audit">Open Internal Audit →</NavLink>}
          />
          <div className="table-wrap" style={{ flex: 1 }}>
            <table>
              <thead>
                <tr>
                  <th>Audit Ref</th>
                  <th>Process</th>
                  <th>Auditor / Dates</th>
                  <th>Stage</th>
                </tr>
              </thead>
              <tbody>
                {auditList.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: "28px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
                      No internal audits currently scheduled.
                    </td>
                  </tr>
                ) : (
                  auditList.slice(0, 4).map((audit) => (
                    <tr key={audit.id}>
                      <td>
                        <NavLink to="/internal-audit" className="table-link">
                          <strong>{audit.id}</strong>
                        </NavLink>
                      </td>
                      <td>
                        <strong>{audit.process}</strong>
                      </td>
                      <td>
                        <span style={{ fontSize: "12px", color: "var(--ink-soft)", display: "block" }}>
                          {audit.internalAuditor?.name || "Auditor Assigned"}
                        </span>
                        <small style={{ color: "var(--muted)" }}>{audit.scheduledDate}</small>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "9999px",
                            fontSize: "11px",
                            fontWeight: "600",
                            background: audit.stage >= 6 ? "var(--status-green-bg)" : "var(--status-blue-bg)",
                            color: audit.stage >= 6 ? "var(--status-green)" : "var(--status-blue)",
                            border: `1px solid ${audit.stage >= 6 ? "var(--status-green-border)" : "var(--status-blue-border)"}`
                          }}
                        >
                          Stage {audit.stage}/7
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
