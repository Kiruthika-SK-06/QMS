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

export default function QMGroupDashboard() {
  const {
    documents = [],
    processes = [],
    employees = [],
    usersList = [],
    mrmList = [],
    auditList = []
  } = useApp();

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

  const readyToShareAudits = (auditList || []).filter((a) => a.stage === 2.5);
  const readyToCloseAudits = (auditList || []).filter((a) => a.stage === 6);

  return (
    <>
      <PageIntro
        eyebrow="QMS COORDINATOR WORKSPACE"
        title="QMS Coordinator Workspace"
        description="Oversee quality governance, process monitoring, Management Review Meetings, and compliance oversight."
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
              <span className="detail-label">Ready to Share:</span>
              <span className="detail-val" style={{ color: readyToShareMRMs.length > 0 ? "var(--status-amber)" : "var(--ink)" }}>
                {readyToShareMRMs.length} Pending Distribution
              </span>
            </li>
            <li>
              <span className="detail-label">MoM Released:</span>
              <span className="detail-val">{mrmList.filter((m) => !!m.momFile || m.status === "MoM Uploaded").length} Published</span>
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
            {processes.length} <small>Monitored Processes</small>
          </div>
          <ul className="overview-card-details">
            <li>
              <span className="detail-label">Course Coordinators:</span>
              <span className="detail-val">{courseCoordinatorsCount} Assigned</span>
            </li>
            <li>
              <span className="detail-label">Active Status:</span>
              <span className="detail-val" style={{ color: "var(--status-green)" }}>100% Operational</span>
            </li>
            <li>
              <span className="detail-label">Adherence Rate:</span>
              <span className="detail-val">98% Target Met</span>
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
            {documents.length} <small>Controlled Docs</small>
          </div>
          <ul className="overview-card-details">
            <li>
              <span className="detail-label">Live & Approved:</span>
              <span className="detail-val">{documents.length - pendingReviews} Active</span>
            </li>
            <li>
              <span className="detail-label">Under Review:</span>
              <span className="detail-val" style={{ color: pendingReviews > 0 ? "var(--status-amber)" : "var(--muted)" }}>
                {pendingReviews} in queue
              </span>
            </li>
            <li>
              <span className="detail-label">Compliance:</span>
              <span className="detail-val">ISO 9001:2015 Compliant</span>
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
              <span>IQA Cycle Governance</span>
            </div>
          </div>
          <div className="overview-card-metric">
            {auditList.length} <small>Total Audits</small>
          </div>
          <ul className="overview-card-details">
            <li>
              <span className="detail-label">Active Stages:</span>
              <span className="detail-val">{auditList.filter((a) => a.stage < 7).length} In Progress</span>
            </li>
            <li>
              <span className="detail-label">Pending Action:</span>
              <span className="detail-val" style={{ color: readyToShareAudits.length + readyToCloseAudits.length > 0 ? "var(--status-amber)" : "var(--ink)" }}>
                {readyToShareAudits.length + readyToCloseAudits.length} Awaiting QMS
              </span>
            </li>
            <li>
              <span className="detail-label">Completed:</span>
              <span className="detail-val">{auditList.filter((a) => a.stage === 7).length} Closed</span>
            </li>
          </ul>
          <div className="overview-card-footer">
            <span>Open Internal Audit</span>
            <ArrowRight size={14} />
          </div>
        </NavLink>
      </div>

      {/* Row: My Process and Scheduled MRM */}
      <div className="dashboard-two-col">
        {/* Left: Quality Processes */}
        <section className="panel" style={{ margin: 0, display: "flex", flexDirection: "column" }}>
          <SectionHeader
            title="Monitored Processes"
            action={<NavLink className="text-link" to="/processes">View all processes →</NavLink>}
          />
          <div style={{ flex: 1 }}>
            <ProcessTable items={processes.slice(0, 4)} />
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
