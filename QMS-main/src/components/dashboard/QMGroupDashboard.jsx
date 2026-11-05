import React from "react";
import { NavLink } from "react-router-dom";
import {
  BookOpen,
  CalendarCheck,
  Check,
  FileText,
  ShieldCheck,
  UserCheck,
  History,
  ArrowRight
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { sortMRMs } from "../../services/mrmService";
import PageIntro from "../common/PageIntro";
import SectionHeader from "../common/SectionHeader";
import StatusBadge from "../common/StatusBadge";
import ActivityCard from "./ActivityCard";

export default function QMGroupDashboard() {
  const {
    documents = [],
    processes = [],
    employees = [],
    usersList = [],
    mrmList = [],
    auditList = [],
    externalAuditList = []
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

  // Flatten version audit records
  const auditTrailRecords = (documents || []).flatMap((doc) =>
    (doc.versions || []).map((v) => ({
      docId: doc.id,
      docName: doc.name,
      version: v.version,
      date: v.date,
      author: v.author,
      status: v.status
    }))
  ).slice(0, 4);

  return (
    <>
      <PageIntro
        eyebrow="QMS COORDINATOR WORKSPACE"
        title="QMS Coordinator Workspace"
        description="Oversee quality governance, process monitoring, Management Review Meetings, and compliance oversight."
      />

      {/* Context Overview Cards */}
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
              <span className="detail-val">{sortMRMs(mrmList)[0]?.scheduledDate || "None"}</span>
            </li>
            <li>
              <span className="detail-label">To Share:</span>
              <span className="detail-val" style={{ color: readyToShareMRMs.length > 0 ? "var(--status-amber)" : "var(--ink)" }}>
                {readyToShareMRMs.length} Pending
              </span>
            </li>
            <li>
              <span className="detail-label">MoM Released:</span>
              <span className="detail-val">{mrmList.filter((m) => !!m.momFile || m.status === "MoM Uploaded").length}</span>
            </li>
          </ul>
          <div className="overview-card-footer">
            <span>View MRMs</span>
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
              <span>Quality SOPs</span>
            </div>
          </div>
          <div className="overview-card-metric">
            {processes.length} <small>Processes</small>
          </div>
          <ul className="overview-card-details">
            <li>
              <span className="detail-label">Coordinators:</span>
              <span className="detail-val">{courseCoordinatorsCount} Assigned</span>
            </li>
            <li>
              <span className="detail-label">Status:</span>
              <span className="detail-val" style={{ color: "var(--status-green)" }}>100% Operational</span>
            </li>
            <li>
              <span className="detail-label">Adherence:</span>
              <span className="detail-val">98% On Track</span>
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
              <span>Controlled Docs</span>
            </div>
          </div>
          <div className="overview-card-metric">
            {documents.length} <small>Controlled</small>
          </div>
          <ul className="overview-card-details">
            <li>
              <span className="detail-label">Live Active:</span>
              <span className="detail-val">{documents.length - pendingReviews}</span>
            </li>
            <li>
              <span className="detail-label">Review Queue:</span>
              <span className="detail-val" style={{ color: pendingReviews > 0 ? "var(--status-amber)" : "var(--muted)" }}>
                {pendingReviews} in queue
              </span>
            </li>
            <li>
              <span className="detail-label">Standard:</span>
              <span className="detail-val">ISO 9001:2015</span>
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
              <span>IQA Cycles</span>
            </div>
          </div>
          <div className="overview-card-metric">
            {auditList.length} <small>Audits</small>
          </div>
          <ul className="overview-card-details">
            <li>
              <span className="detail-label">In Progress:</span>
              <span className="detail-val">{auditList.filter((a) => a.stage < 7).length} Active</span>
            </li>
            <li>
              <span className="detail-label">Pending Action:</span>
              <span className="detail-val" style={{ color: readyToShareAudits.length + readyToCloseAudits.length > 0 ? "var(--status-amber)" : "var(--ink)" }}>
                {readyToShareAudits.length + readyToCloseAudits.length} QMS Pending
              </span>
            </li>
            <li>
              <span className="detail-label">Closed:</span>
              <span className="detail-val">{auditList.filter((a) => a.stage === 7).length} Complete</span>
            </li>
          </ul>
          <div className="overview-card-footer">
            <span>Open Audit</span>
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
            {externalAuditList.length} <small>Audits</small>
          </div>
          <ul className="overview-card-details">
            <li>
              <span className="detail-label">Schedule Ready:</span>
              <span className="detail-val" style={{ color: externalAuditList.filter((a) => a.stage === 1).length > 0 ? "var(--status-amber)" : "var(--ink)" }}>
                {externalAuditList.filter((a) => a.stage === 1).length} Incoming Email
              </span>
            </li>
            <li>
              <span className="detail-label">Scanned NC:</span>
              <span className="detail-val">
                {externalAuditList.filter((a) => a.stage === 3).length} For Course Coord
              </span>
            </li>
            <li>
              <span className="detail-label">Certified:</span>
              <span className="detail-val" style={{ color: "var(--status-green)" }}>
                {externalAuditList.filter((a) => a.stage >= 5).length} Ratified & Closed
              </span>
            </li>
          </ul>
          <div className="overview-card-footer">
            <span>External Audits</span>
            <ArrowRight size={13} />
          </div>
        </NavLink>
      </div>

      {/* Row: Audit Trails and User Management */}
      <div className="dashboard-two-col">
        {/* Left: Audit Trails */}
        <section className="panel" style={{ margin: 0, display: "flex", flexDirection: "column" }}>
          <SectionHeader
            title="Audit Trails"
            action={<NavLink className="text-link" to="/version-history">View full audit trail →</NavLink>}
          />
          <div className="table-wrap" style={{ flex: 1 }}>
            <table>
              <thead>
                <tr>
                  <th>Document Record</th>
                  <th>Version</th>
                  <th>Date & Author</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {auditTrailRecords.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: "28px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
                      No audit trail records found.
                    </td>
                  </tr>
                ) : (
                  auditTrailRecords.map((item, idx) => (
                    <tr key={`${item.docId}-${item.version}-${idx}`}>
                      <td>
                        <NavLink to={`/documents/${item.docId}`} className="table-link">
                          <strong>{item.docName}</strong>
                          <small>{item.docId}</small>
                        </NavLink>
                      </td>
                      <td>
                        <b>v{item.version}</b>
                      </td>
                      <td>
                        <span style={{ fontSize: "12px", color: "var(--ink-soft)", display: "block" }}>{item.author}</span>
                        <small style={{ color: "var(--muted)" }}>{item.date}</small>
                      </td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right: User Management */}
        <section className="panel" style={{ margin: 0, display: "flex", flexDirection: "column" }}>
          <SectionHeader
            title="User Management"
            action={<NavLink className="text-link" to="/user-management">Manage all users →</NavLink>}
          />
          <div className="table-wrap" style={{ flex: 1 }}>
            <table>
              <thead>
                <tr>
                  <th>User Name</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(usersList && usersList.length > 0 ? usersList : employees).slice(0, 4).map((user) => (
                  <tr key={user.id || user.email}>
                    <td>
                      <NavLink to="/user-management" className="table-link">
                        <strong>{user.name}</strong>
                        <small>{user.email}</small>
                      </NavLink>
                    </td>
                    <td>
                      <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--navy)" }}>
                        {user.roleTitle || user.role}
                      </span>
                    </td>
                    <td>{user.department || "Academic Division"}</td>
                    <td>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "9999px",
                          fontSize: "11px",
                          fontWeight: "600",
                          background: "var(--status-green-bg)",
                          color: "var(--status-green)",
                          border: "1px solid var(--status-green-border)"
                        }}
                      >
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
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
