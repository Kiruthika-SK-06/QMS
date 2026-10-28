import React from "react";
import { NavLink } from "react-router-dom";
import {
  BookOpen,
  CalendarCheck,
  Check,
  FileText,
  ShieldCheck,
  ArrowRight
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import PageIntro from "../common/PageIntro";
import SectionHeader from "../common/SectionHeader";
import ActivityCard from "./ActivityCard";
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
  const { headOverview, processes = [], documents = [], mrmList = [], auditList = [], currentUser } = useApp();
  const isAuditor = currentUser?.role === "auditor";
  const isTrustHead = currentUser?.role === "Head";

  const list = headOverview?.processData || (processes?.length ? processes : defaultProcessData);

  const totalProcesses = list.length;
  const completedProcesses = list.filter((p) => p.status === "Completed").length;
  const inProgressProcesses = list.filter((p) => p.status === "In Progress" || p.status === "Active").length;

  const pendingApprovalMRMs = (mrmList || []).filter(
    (m) => m.status === "Pending Trust Head Approval" || m.status === "Submitted for Approval"
  );

  const pendingAuditApprovals = (auditList || []).filter((a) => a.stage === 2);
  const auditsAwaitingNoticing = (auditList || []).filter((a) => a.stage === 3);
  const publishedMRMs = (mrmList || []).filter((m) => !!m.momFile || m.status === "MoM Uploaded" || m.status === "Notification Sent");

  const overallProgress = Math.round(
    list.reduce((total, process) => total + (process.progress || 0), 0) / (list.length || 1)
  );

  return (
    <>
      <PageIntro
        eyebrow={isAuditor ? "INTERNAL AUDITOR WORKSPACE" : "TRUST EXECUTIVE WORKSPACE"}
        title={isAuditor ? "Internal Auditor Workspace" : "Trust Head Workspace"}
        description={
          isAuditor
            ? "Quality assurance oversight, internal audit inspections, and compliance verification."
            : "Executive governance, institutional quality performance, and review meeting ratification."
        }
      />

      {/* Main Context Overview Cards: MRM, Process Overview, Docs Management, Internal Audit */}
      <div className="overview-cards-grid">
        {/* Card 1: MRM */}
        <NavLink to="/mrm" className="overview-context-card">
          <div className="overview-card-header">
            <div className="overview-card-icon purple">
              <CalendarCheck size={22} />
            </div>
            <div className="overview-card-title-group">
              <h3>MRM</h3>
              <span>Management Review Meetings</span>
            </div>
          </div>
          <div className="overview-card-metric">
            {mrmList.length} <small>Total Meetings</small>
          </div>
          <ul className="overview-card-details">
            <li>
              <span className="detail-label">Next Session:</span>
              <span className="detail-val">{mrmList[0]?.scheduledDate || "None upcoming"}</span>
            </li>
            <li>
              <span className="detail-label">Status:</span>
              <span className="detail-val" style={{ color: isTrustHead && pendingApprovalMRMs.length > 0 ? "var(--status-amber)" : "var(--ink)" }}>
                {isTrustHead ? (pendingApprovalMRMs.length > 0 ? `${pendingApprovalMRMs.length} Pending Approval` : "All Ratified") : `${publishedMRMs.length} MoMs Released`}
              </span>
            </li>
            <li>
              <span className="detail-label">Governance:</span>
              <span className="detail-val">Executive Oversight</span>
            </li>
          </ul>
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
              <span>Institutional Quality SOPs</span>
            </div>
          </div>
          <div className="overview-card-metric">
            {totalProcesses} <small>Monitored Processes</small>
          </div>
          <ul className="overview-card-details">
            <li>
              <span className="detail-label">Adherence Rate:</span>
              <span className="detail-val" style={{ color: "var(--status-green)" }}>{overallProgress}% Overall Progress</span>
            </li>
            <li>
              <span className="detail-label">Active / In Progress:</span>
              <span className="detail-val">{inProgressProcesses} Processes</span>
            </li>
            <li>
              <span className="detail-label">Completed:</span>
              <span className="detail-val">{completedProcesses} Processes</span>
            </li>
          </ul>
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
              <span>Controlled Library</span>
            </div>
          </div>
          <div className="overview-card-metric">
            {documents.length || 12} <small>Controlled Docs</small>
          </div>
          <ul className="overview-card-details">
            <li>
              <span className="detail-label">Quality Policy:</span>
              <span className="detail-val">ISO 9001:2015 Approved</span>
            </li>
            <li>
              <span className="detail-label">Authority:</span>
              <span className="detail-val">Trust & QMS Cell</span>
            </li>
            <li>
              <span className="detail-label">Status:</span>
              <span className="detail-val" style={{ color: "var(--status-green)" }}>Active & Released</span>
            </li>
          </ul>
          <div className="overview-card-footer">
            <span>Open Document Library</span>
            <ArrowRight size={14} />
          </div>
        </NavLink>

        {/* Card 4: Internal Quality Audit */}
        <NavLink to="/internal-audit" className="overview-context-card">
          <div className="overview-card-header">
            <div className="overview-card-icon green">
              <ShieldCheck size={22} />
            </div>
            <div className="overview-card-title-group">
              <h3>Internal Audit</h3>
              <span>{isAuditor ? "Inspections & Noticing" : "Schedule Ratification"}</span>
            </div>
          </div>
          <div className="overview-card-metric">
            {auditList.length} <small>Total Audits</small>
          </div>
          <ul className="overview-card-details">
            <li>
              <span className="detail-label">Action Required:</span>
              <span className="detail-val" style={{ color: (isTrustHead ? pendingAuditApprovals.length : auditsAwaitingNoticing.length) > 0 ? "var(--status-amber)" : "var(--ink)" }}>
                {isTrustHead ? `${pendingAuditApprovals.length} Awaiting Approval` : `${auditsAwaitingNoticing.length} Awaiting Inspection`}
              </span>
            </li>
            <li>
              <span className="detail-label">In Progress:</span>
              <span className="detail-val">{auditList.filter((a) => a.stage < 7).length} Active Stages</span>
            </li>
            <li>
              <span className="detail-label">Concluded:</span>
              <span className="detail-val">{auditList.filter((a) => a.stage === 7).length} Completed</span>
            </li>
          </ul>
          <div className="overview-card-footer">
            <span>Open Internal Audit</span>
            <ArrowRight size={14} />
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
                {mrmList.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: "28px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
                      No review meetings currently scheduled.
                    </td>
                  </tr>
                ) : (
                  mrmList.slice(0, 4).map((mrm) => {
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

      {/* Recent Activity Timeline */}
      <ActivityCard />
    </>
  );
}