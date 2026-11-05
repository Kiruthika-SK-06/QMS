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
  const { headOverview, processes = [], documents = [], mrmList = [], auditList = [], externalAuditList = [], currentUser } = useApp();
  const isAuditor = currentUser?.role === "auditor";
  const isTrustHead = currentUser?.role === "Head";

  const list = headOverview?.processData || (processes?.length ? processes : defaultProcessData);

  const totalProcesses = list.length;
  const completedProcesses = list.filter((p) => p.status === "Completed").length;
  const inProgressProcesses = list.filter((p) => p.status === "In Progress" || p.status === "Active").length;

  const sortedMRMs = sortMRMs(mrmList);

  const accessibleExternalAudits = (externalAuditList || []).filter(
    (a) => a.stage >= 2 || a.shareWithStakeholders?.shared || a.status !== "Audit Schedule Received (from External Auditor)"
  );
  const certifiedExternalAudits = accessibleExternalAudits.filter(
    (a) => a.stage >= 5 || a.status === "Completed & Closed (ISO 9001 Certified)"
  );

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

        {/* Core Cards for Auditor: Internal Audit, MRM, and External Audit */}
        <div className="overview-cards-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          {/* Card 1: Internal Quality Audit */}
          <NavLink to="/internal-audit" className="overview-context-card">
            <div className="overview-card-header">
              <div className="overview-card-icon green">
                <ShieldCheck size={22} />
              </div>
              <div className="overview-card-title-group">
                <h3>Internal Audit</h3>
                <span>IQA Inspections & Noticing Sheets</span>
              </div>
            </div>
            <div className="overview-card-metric">
              {auditList.length} <small>Total Audits</small>
            </div>
            <ul className="overview-card-details">
              <li>
                <span className="detail-label">Awaiting Inspection:</span>
                <span className="detail-val" style={{ color: auditsAwaitingNoticing.length > 0 ? "var(--status-amber)" : "var(--ink)" }}>
                  {auditsAwaitingNoticing.length} Ready for Noticing
                </span>
              </li>
              <li>
                <span className="detail-label">In Progress:</span>
                <span className="detail-val">{auditList.filter((a) => a.stage < 7).length} Active Stages</span>
              </li>
              <li>
                <span className="detail-label">Standard:</span>
                <span className="detail-val">ISO 9001:2015 Clause 9.2</span>
              </li>
            </ul>
            <div className="overview-card-footer">
              <span>Open Internal Audit</span>
              <ArrowRight size={14} />
            </div>
          </NavLink>

          {/* Card 2: External Quality Audit (ISO 9001:2015) */}
          <NavLink to="/external-audit" className="overview-context-card">
            <div className="overview-card-header">
              <div className="overview-card-icon blue">
                <ShieldCheck size={22} />
              </div>
              <div className="overview-card-title-group">
                <h3>External Quality Audits</h3>
                <span>ISO 9001:2015 Third-Party</span>
              </div>
            </div>
            <div className="overview-card-metric">
              {accessibleExternalAudits.length} <small>Cert Cycles</small>
            </div>
            <ul className="overview-card-details">
              <li>
                <span className="detail-label">Schedule Status:</span>
                <span className="detail-val">Shared by QMS</span>
              </li>
              <li>
                <span className="detail-label">Latest Date:</span>
                <span className="detail-val">{accessibleExternalAudits[0]?.scheduledDate || "None"}</span>
              </li>
              <li>
                <span className="detail-label">Certification:</span>
                <span className="detail-val" style={{ color: "var(--status-green)" }}>
                  {certifiedExternalAudits.length} Ratified
                </span>
              </li>
            </ul>
            <div className="overview-card-footer">
              <span>View External Audits</span>
              <ArrowRight size={14} />
            </div>
          </NavLink>

          {/* Card 3: MRM & MoM Downloads */}
          <NavLink to="/mrm" className="overview-context-card">
            <div className="overview-card-header">
              <div className="overview-card-icon purple">
                <CalendarCheck size={22} />
              </div>
              <div className="overview-card-title-group">
                <h3>MRM & MoM Downloads</h3>
                <span>Review Meetings Evidence</span>
              </div>
            </div>
            <div className="overview-card-metric">
              {publishedMRMs.length} <small>MoMs Available</small>
            </div>
            <ul className="overview-card-details">
              <li>
                <span className="detail-label">Latest Meeting:</span>
                <span className="detail-val">{sortedMRMs[0]?.scheduledDate || "None"}</span>
              </li>
              <li>
                <span className="detail-label">MoM Status:</span>
                <span className="detail-val" style={{ color: "var(--status-green)" }}>
                  {publishedMRMs.length} Published for Download
                </span>
              </li>
              <li>
                <span className="detail-label">Compliance Evidence:</span>
                <span className="detail-val">Audit Ready</span>
              </li>
            </ul>
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

      {/* Main Context Overview Cards: MRM, External Audit, Process Overview, Docs Management, Internal Audit */}
      <div className="overview-cards-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {/* Card 1: MRM */}
        <NavLink to="/mrm" className="overview-context-card">
          <div className="overview-card-header">
            <div className="overview-card-icon purple">
              <CalendarCheck size={20} />
            </div>
            <div className="overview-card-title-group">
              <h3>MRM</h3>
              <span>Review Meetings</span>
            </div>
          </div>
          <div className="overview-card-metric">
            {mrmList.length} <small>Sessions</small>
          </div>
          <ul className="overview-card-details">
            <li>
              <span className="detail-label">Next Session:</span>
              <span className="detail-val">{sortedMRMs[0]?.scheduledDate || "None"}</span>
            </li>
            <li>
              <span className="detail-label">Status:</span>
              <span className="detail-val" style={{ color: pendingApprovalMRMs.length > 0 ? "var(--status-amber)" : "var(--ink)" }}>
                {pendingApprovalMRMs.length > 0 ? `${pendingApprovalMRMs.length} Awaiting Approval` : "All Ratified"}
              </span>
            </li>
            <li>
              <span className="detail-label">Governance:</span>
              <span className="detail-val">Executive Sign-off</span>
            </li>
          </ul>
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
              <span>Institutional Quality</span>
            </div>
          </div>
          <div className="overview-card-metric">
            {totalProcesses} <small>Processes</small>
          </div>
          <ul className="overview-card-details">
            <li>
              <span className="detail-label">Adherence Rate:</span>
              <span className="detail-val" style={{ color: "var(--status-green)" }}>{overallProgress}% On Track</span>
            </li>
            <li>
              <span className="detail-label">In Progress:</span>
              <span className="detail-val">{inProgressProcesses} Active</span>
            </li>
            <li>
              <span className="detail-label">Completed:</span>
              <span className="detail-val">{completedProcesses} Concluded</span>
            </li>
          </ul>
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
              <span>Controlled Library</span>
            </div>
          </div>
          <div className="overview-card-metric">
            {documents.length || 12} <small>Controlled</small>
          </div>
          <ul className="overview-card-details">
            <li>
              <span className="detail-label">Quality Policy:</span>
              <span className="detail-val">ISO 9001:2015</span>
            </li>
            <li>
              <span className="detail-label">Authority:</span>
              <span className="detail-val">Executive Cell</span>
            </li>
            <li>
              <span className="detail-label">Status:</span>
              <span className="detail-val" style={{ color: "var(--status-green)" }}>Active & Released</span>
            </li>
          </ul>
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
              <span>Schedule Ratification</span>
            </div>
          </div>
          <div className="overview-card-metric">
            {auditList.length} <small>Audits</small>
          </div>
          <ul className="overview-card-details">
            <li>
              <span className="detail-label">Awaiting Approval:</span>
              <span className="detail-val" style={{ color: pendingAuditApprovals.length > 0 ? "var(--status-amber)" : "var(--ink)" }}>
                {pendingAuditApprovals.length} Schedule(s)
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
            <ArrowRight size={13} />
          </div>
        </NavLink>

        {/* Card 5: External Quality Audit (ISO 9001:2015) */}
        <NavLink to="/external-audit" className="overview-context-card">
          <div className="overview-card-header">
            <div className="overview-card-icon blue">
              <ShieldCheck size={20} />
            </div>
            <div className="overview-card-title-group">
              <h3>External Quality Audits</h3>
              <span>ISO 9001:2015</span>
            </div>
          </div>
          <div className="overview-card-metric">
            {accessibleExternalAudits.length} <small>Audits</small>
          </div>
          <ul className="overview-card-details">
            <li>
              <span className="detail-label">Audit Agency:</span>
              <span className="detail-val">
                {accessibleExternalAudits[0]?.externalAgency ? accessibleExternalAudits[0].externalAgency.split(" ")[0] : "TÜV SÜD"}
              </span>
            </li>
            <li>
              <span className="detail-label">Confirmed Date:</span>
              <span className="detail-val">{accessibleExternalAudits[0]?.scheduledDate || "None"}</span>
            </li>
            <li>
              <span className="detail-label">Ratification:</span>
              <span className="detail-val" style={{ color: "var(--status-green)" }}>
                {certifiedExternalAudits.length} Endorsed
              </span>
            </li>
          </ul>
          <div className="overview-card-footer">
            <span>View External Audits</span>
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

      {/* Recent Activity Timeline */}
      <ActivityCard />
    </>
  );
}