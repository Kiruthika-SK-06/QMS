import React from "react";
import { NavLink } from "react-router-dom";
import {
  BookOpen,
  CalendarCheck,
  Check,
  FileText,
  ShieldCheck,
  FileDown,
  ArrowRight
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { sortMRMs } from "../../services/mrmService";
import PageIntro from "../common/PageIntro";
import SectionHeader from "../common/SectionHeader";
import ProcessTable from "../tables/ProcessTable";

const defaultProcessData = [
  {
    name: "Course Administration",
    owner: "Course Coordinator (Priya Sharma)",
    progress: 82,
    status: "In Progress",
    target: "30 Sep 2026",
  },
  {
    name: "Training Management",
    owner: "Course Coordinator (Rohan Desai)",
    progress: 91,
    status: "In Progress",
    target: "28 Sep 2026",
  },
  {
    name: "AI & Emerging Tech Course",
    owner: "Course Coordinator (Dr. Rajesh Verma)",
    progress: 100,
    status: "Completed",
    target: "20 Sep 2026",
  },
  {
    name: "IT Support Management",
    owner: "IT Systems Coordinator",
    progress: 64,
    status: "In Progress",
    target: "05 Oct 2026",
  },
  {
    name: "Quality Governance & MRM",
    owner: "QMS Coordinator (Rahul Kumar)",
    progress: 95,
    status: "Completed",
    target: "15 Oct 2026",
  },
];

export default function Head() {
  const { headOverview, processes = [], documents = [], mrmList = [], auditList = [], externalAuditList = [], currentUser } = useApp();
  const isAuditor = currentUser?.role === "auditor";
  const isTrustHead = currentUser?.role === "Head";

  const list = headOverview?.processData || (processes?.length ? processes : defaultProcessData);

  const totalProcesses = list.length;
  const completedProcesses = list.filter((p) => p.status === "Completed").length;
  const inProgressProcesses = list.filter((p) => p.status === "In Progress" || p.status === "Active").length;

  const sortedMRMs = sortMRMs(mrmList);

  const pendingApprovalMRMs = (mrmList || []).filter(
    (m) =>
      m.status === "Pending Trust Head Approval" ||
      m.status === "Submitted for Approval" ||
      m.status === "Pending Approval" ||
      m.stage === 2
  );

  const pendingAuditApprovals = (auditList || []).filter((a) => a.stage === 2);
  const auditsAwaitingNoticing = (auditList || []).filter((a) => a.stage === 3);
  const publishedMRMs = (mrmList || []).filter((m) => !!m.momFile || m.status === "MoM Uploaded" || m.status === "Notification Sent");

  const overallProgress = Math.round(
    list.reduce((total, process) => total + (process.progress || 0), 0) / (list.length || 1)
  );

  // =========================================================================
  // INTERNAL AUDITOR SPECIALIZED STREAMLINED VIEW
  // (Only Internal Audit & MRM with MoM download access)
  // =========================================================================
  if (isAuditor) {
    return (
      <>
        <PageIntro
          eyebrow="INTERNAL AUDITOR WORKSPACE"
          title="Internal Auditor Workspace"
          description="Quality assurance inspection, noticing sheet verification, and review meeting Minutes of Meeting (MoM) access."
        />

        {/* Core Cards for Auditor: Internal Audit and MRM */}
        <div className="overview-cards-grid">
          {/* Card 1: Internal Quality Audit */}
          <NavLink to="/internal-audit" className="overview-context-card">
            <div className="overview-card-header">
              <div className="overview-card-icon green">
                <ShieldCheck size={22} />
              </div>
              <div className="overview-card-title-group">
                <h3>Internal Audit</h3>
              </div>
            </div>
            <div className="overview-card-metric">
              {auditList.length} <small>Total Audits</small>
            </div>
            <div className="overview-card-footer">
              <span>Open Internal Audit</span>
              <ArrowRight size={14} />
            </div>
          </NavLink>

          {/* Card 2: MRM & MoM Downloads */}
          <NavLink to="/mrm" className="overview-context-card">
            <div className="overview-card-header">
              <div className="overview-card-icon purple">
                <CalendarCheck size={22} />
              </div>
              <div className="overview-card-title-group">
                <h3>MRM & MoM Downloads</h3>
              </div>
            </div>
            <div className="overview-card-metric">
              {publishedMRMs.length} <small>MoMs Available</small>
            </div>
            <div className="overview-card-footer">
              <span>View MRMs & Download MoM</span>
              <ArrowRight size={14} />
            </div>
          </NavLink>
        </div>

        {/* Row: Internal Quality Audits & Scheduled MRM (with MoM Download) */}
        <div className="dashboard-two-col">
          {/* Left: Internal Audits */}
          <section className="panel" style={{ margin: 0, display: "flex", flexDirection: "column" }}>
            <SectionHeader
              title="Internal Quality Audits"
              action={<NavLink className="text-link" to="/internal-audit">Open Internal Audit →</NavLink>}
            />
            <div className="table-wrap" style={{ flex: 1 }}>
              <table>
                <thead>
                  <tr>
                    <th>Audit ID</th>
                    <th>Process</th>
                    <th>Auditee / Date</th>
                    <th>Stage</th>
                  </tr>
                </thead>
                <tbody>
                  {auditList.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: "28px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
                        No internal audits scheduled.
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
                            {audit.internalAuditee?.name || "Auditee"}
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

          {/* Right: Scheduled MRMs & MoM Downloads */}
          <section className="panel" style={{ margin: 0, display: "flex", flexDirection: "column" }}>
            <SectionHeader
              title="MRM & Minutes of Meeting"
              action={<NavLink className="text-link" to="/mrm">View all MRMs →</NavLink>}
            />
            <div className="table-wrap" style={{ flex: 1 }}>
              <table>
                <thead>
                  <tr>
                    <th>Meeting Title</th>
                    <th>Date</th>
                    <th>MoM File</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMRMs.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: "28px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
                        No review meetings currently scheduled.
                      </td>
                    </tr>
                  ) : (
                    sortedMRMs.slice(0, 4).map((mrm) => {
                      const hasMoM = !!mrm.momFile || mrm.status === "MoM Uploaded";
                      return (
                        <tr key={mrm.id}>
                          <td>
                            <NavLink to="/mrm" className="table-link">
                              <strong>{mrm.title}</strong>
                            </NavLink>
                          </td>
                          <td>{mrm.scheduledDate}</td>
                          <td>
                            {hasMoM ? (
                              <span style={{ color: "var(--status-green)", fontSize: "12px", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                <Check size={14} /> MoM Ready
                              </span>
                            ) : (
                              <span style={{ color: "var(--muted)", fontSize: "12px" }}>In Preparation</span>
                            )}
                          </td>
                          <td>
                            <NavLink
                              to="/mrm"
                              className="row-action"
                              style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                            >
                              <FileDown size={14} /> Download
                            </NavLink>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </>
    );
  }

  // =========================================================================
  // TRUST HEAD EXECUTIVE VIEW (No Approval History)
  // =========================================================================
  return (
    <>
      <PageIntro
        eyebrow="TRUST EXECUTIVE WORKSPACE"
        title="Trust Head Workspace"
        description="Executive governance, institutional quality performance, and review meeting ratification."
      />

      {/* Main Context Overview Cards: MRM, Process Overview, Docs Management, Internal Audit */}
      <div className="overview-cards-grid four-col">
        {/* Card 1: MRM */}
        <NavLink to="/mrm" className="overview-context-card">
          <div className="overview-card-header">
            <div className="overview-card-icon purple">
              <CalendarCheck size={20} />
            </div>
            <div className="overview-card-title-group">
              <h3>MRM</h3>
            </div>
          </div>
          <div className="overview-card-metric">
            {mrmList.length} <small>Sessions</small>
          </div>
          <div className="overview-card-footer">
            <span>View MRM Schedule</span>
            <ArrowRight size={13} />
          </div>
        </NavLink>

        {/* Card 2: Process Overview */}
        <NavLink to="/processes" className="overview-context-card">
          <div className="overview-card-header">
            <div className="overview-card-icon teal">
              <BookOpen size={20} />
            </div>
            <div className="overview-card-title-group">
              <h3>Process Overview</h3>
            </div>
          </div>
          <div className="overview-card-metric">
            {totalProcesses} <small>Processes</small>
          </div>
          <div className="overview-card-footer">
            <span>Explore Processes</span>
            <ArrowRight size={13} />
          </div>
        </NavLink>

        {/* Card 3: Docs Management */}
        <NavLink to="/documents" className="overview-context-card">
          <div className="overview-card-header">
            <div className="overview-card-icon blue">
              <FileText size={20} />
            </div>
            <div className="overview-card-title-group">
              <h3>Docs Management</h3>
            </div>
          </div>
          <div className="overview-card-metric">
            {documents.length || 12} <small>Controlled</small>
          </div>
          <div className="overview-card-footer">
            <span>Open Library</span>
            <ArrowRight size={13} />
          </div>
        </NavLink>

        {/* Card 4: Internal Quality Audit */}
        <NavLink to="/internal-audit" className="overview-context-card">
          <div className="overview-card-header">
            <div className="overview-card-icon green">
              <ShieldCheck size={20} />
            </div>
            <div className="overview-card-title-group">
              <h3>Internal Audit</h3>
            </div>
          </div>
          <div className="overview-card-metric">
            {auditList.length} <small>Audits</small>
          </div>
          <div className="overview-card-footer">
            <span>Open Internal Audit</span>
            <ArrowRight size={13} />
          </div>
        </NavLink>
      </div>

      {/* Row: Institutional Process and Scheduled MRM */}
      <div className="dashboard-two-col">
        {/* Left: Processes */}
        <section className="panel" style={{ margin: 0, display: "flex", flexDirection: "column" }}>
          <SectionHeader
            title="Institutional Processes"
            action={<NavLink className="text-link" to="/processes">View all processes →</NavLink>}
          />
          <div style={{ flex: 1 }}>
            <ProcessTable items={list.slice(0, 4)} />
          </div>
        </section>

        {/* Right: Scheduled MRMs */}
        <section className="panel" style={{ margin: 0, display: "flex", flexDirection: "column" }}>
          <SectionHeader
            title="Scheduled MRM"
            action={<NavLink className="text-link" to="/mrm">View all MRMs →</NavLink>}
          />
          <div className="table-wrap" style={{ flex: 1 }}>
            <table>
              <thead>
                <tr>
                  <th>Meeting Title</th>
                  <th>Scheduled Date</th>
                  <th>MoM Document</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedMRMs.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: "28px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
                      No review meetings currently scheduled.
                    </td>
                  </tr>
                ) : (
                  sortedMRMs.slice(0, 4).map((mrm) => {
                    const hasMoM = !!mrm.momFile || mrm.status === "MoM Uploaded";
                    return (
                      <tr key={mrm.id}>
                        <td>
                          <NavLink to="/mrm" className="table-link">
                            <strong>{mrm.title}</strong>
                          </NavLink>
                        </td>
                        <td>{mrm.scheduledDate}</td>
                        <td>
                          {hasMoM ? (
                            <span style={{ color: "var(--status-green)", fontSize: "12px", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <Check size={14} /> MoM Published
                            </span>
                          ) : (
                            <span style={{ color: "var(--muted)", fontSize: "12px" }}>Pending Meeting</span>
                          )}
                        </td>
                        <td>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "9999px",
                              fontSize: "11px",
                              fontWeight: "600",
                              background: hasMoM ? "var(--status-green-bg)" : "var(--status-blue-bg)",
                              color: hasMoM ? "var(--status-green)" : "var(--status-blue)",
                              border: `1px solid ${hasMoM ? "var(--status-green-border)" : "var(--status-blue-border)"}`
                            }}
                          >
                            {mrm.status || "Planned"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Institutional Process Progress Animated Pie Chart */}
      <ProcessProgressPieChart processes={list} overallProgress={overallProgress} />
    </>
  );
}

// Process Progress Animated Donut / Pie Chart Component
function ProcessProgressPieChart({ processes = [], overallProgress = 0 }) {
  const total = processes.length || 1;
  const completed = processes.filter((p) => p.status === "Completed").length;
  const inProgress = processes.filter((p) => p.status === "In Progress" || p.status === "Active").length;
  const pending = Math.max(0, total - completed - inProgress);

  const pCompleted = completed / total;
  const pInProgress = inProgress / total;
  const pPending = pending / total;

  const radius = 68;
  const circ = 2 * Math.PI * radius; // ~427.26

  const strokeCompleted = pCompleted * circ;
  const strokeInProgress = pInProgress * circ;
  const strokePending = pPending * circ;

  const offsetCompleted = 0;
  const offsetInProgress = -strokeCompleted;
  const offsetPending = -(strokeCompleted + strokeInProgress);

  return (
    <section className="panel" style={{ marginTop: "24px" }}>
      <SectionHeader
        title="Institutional Process Progress Breakdown"
        action={<NavLink className="text-link" to="/processes">Explore all processes →</NavLink>}
      />

      <style>{`
        @keyframes pieStrokeAnim {
          from {
            stroke-dasharray: 0 428;
            opacity: 0.3;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes chartFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .pie-chart-container {
          animation: chartFadeIn 0.5s ease-out;
        }
        .pie-slice {
          transition: stroke-width 0.25s ease, opacity 0.2s ease;
        }
        .pie-slice:hover {
          stroke-width: 26;
          opacity: 0.9;
          cursor: pointer;
        }
      `}</style>

      <div
        className="pie-chart-container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          flexWrap: "wrap",
          gap: "28px",
          padding: "16px 8px"
        }}
      >
        {/* Animated Donut / Pie Chart */}
        <div style={{ position: "relative", width: "190px", height: "190px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="190" height="190" viewBox="0 0 190 190" style={{ transform: "rotate(-90deg)" }}>
            {/* Background Track */}
            <circle
              cx="95"
              cy="95"
              r={radius}
              fill="none"
              stroke="#f1f5f9"
              strokeWidth="20"
            />

            {/* Completed Slice (Green) */}
            {completed > 0 && (
              <circle
                className="pie-slice"
                cx="95"
                cy="95"
                r={radius}
                fill="none"
                stroke="#16a34a"
                strokeWidth="20"
                strokeDasharray={`${strokeCompleted} ${circ}`}
                strokeDashoffset={offsetCompleted}
                strokeLinecap="round"
                style={{ animation: "pieStrokeAnim 0.7s ease-out" }}
              />
            )}

            {/* In Progress Slice (Blue) */}
            {inProgress > 0 && (
              <circle
                className="pie-slice"
                cx="95"
                cy="95"
                r={radius}
                fill="none"
                stroke="#0284c7"
                strokeWidth="20"
                strokeDasharray={`${strokeInProgress} ${circ}`}
                strokeDashoffset={offsetInProgress}
                strokeLinecap="round"
                style={{ animation: "pieStrokeAnim 0.85s ease-out" }}
              />
            )}

            {/* Pending Slice (Amber) */}
            {pending > 0 && (
              <circle
                className="pie-slice"
                cx="95"
                cy="95"
                r={radius}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="20"
                strokeDasharray={`${strokePending} ${circ}`}
                strokeDashoffset={offsetPending}
                strokeLinecap="round"
                style={{ animation: "pieStrokeAnim 1s ease-out" }}
              />
            )}
          </svg>

          {/* Center Indicator */}
          <div
            style={{
              position: "absolute",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none"
            }}
          >
            <span style={{ fontSize: "28px", fontWeight: "800", color: "var(--ink)", lineHeight: 1 }}>
              {overallProgress}%
            </span>
            <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--muted)", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Progress
            </span>
          </div>
        </div>

        {/* Legend and Metrics Breakdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", minWidth: "240px", flex: 1, maxWidth: "420px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "8px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#16a34a" }} />
              <div>
                <strong style={{ fontSize: "13px", color: "#166534", display: "block" }}>Completed Processes</strong>
                <span style={{ fontSize: "11.5px", color: "#15803d" }}>100% Target Met</span>
              </div>
            </div>
            <strong style={{ fontSize: "15px", color: "#166534" }}>
              {completed} <small style={{ fontSize: "11px", fontWeight: "500" }}>({Math.round(pCompleted * 100)}%)</small>
            </strong>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              background: "#f0f9ff",
              border: "1px solid #bae6fd",
              borderRadius: "8px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#0284c7" }} />
              <div>
                <strong style={{ fontSize: "13px", color: "#0369a1", display: "block" }}>In Progress</strong>
                <span style={{ fontSize: "11.5px", color: "#0284c7" }}>Under Active Execution</span>
              </div>
            </div>
            <strong style={{ fontSize: "15px", color: "#0369a1" }}>
              {inProgress} <small style={{ fontSize: "11px", fontWeight: "500" }}>({Math.round(pInProgress * 100)}%)</small>
            </strong>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: "8px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#f59e0b" }} />
              <div>
                <strong style={{ fontSize: "13px", color: "#92400e", display: "block" }}>Pending / Scheduled</strong>
                <span style={{ fontSize: "11.5px", color: "#b45309" }}>Awaiting Next Phase</span>
              </div>
            </div>
            <strong style={{ fontSize: "15px", color: "#92400e" }}>
              {pending} <small style={{ fontSize: "11px", fontWeight: "500" }}>({Math.round(pPending * 100)}%)</small>
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}