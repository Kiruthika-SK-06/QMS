import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
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
import StatCard from "../common/StatCard";
import ActivityCard from "./ActivityCard";

export default function QMGroupDashboard() {
  const navigate = useNavigate();
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

      {/* Top 3 Stat Cards with Circular Gauge Rings */}
      <div className="stats-grid three-col">
        <StatCard
          label="MRM & Quality Governance"
          value={`${mrmList.length} Sessions`}
          progress={88}
          tone="blue"
          direction="up"
          hint="Active & Scheduled MRMs"
          onClick={() => navigate("/mrm")}
        />

        <StatCard
          label="Process Register"
          value={`${processes.length} Processes`}
          progress={95}
          tone="teal"
          direction="up"
          hint="Institutional Processes"
          onClick={() => navigate("/processes")}
        />

        <StatCard
          label="Controlled Docs & Audits"
          value={`${documents.length} Docs · ${auditList.length} Audits`}
          progress={80}
          tone="dark"
          direction="up"
          hint="Library & Audit Schedules"
          onClick={() => navigate("/documents")}
        />
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
                  <th>Modifier / Author</th>
                  <th>Timestamp</th>
                  <th>Review Status</th>
                </tr>
              </thead>
              <tbody>
                {auditTrailRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", color: "#64748b", padding: "20px" }}>
                      No audit trails recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditTrailRecords.map((rec, idx) => (
                    <tr key={`${rec.docId}-${idx}`}>
                      <td>
                        <strong>{rec.docName}</strong>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>ID: {rec.docId}</div>
                      </td>
                      <td><span className="badge badge-neutral">{rec.version}</span></td>
                      <td>{rec.author || "System"}</td>
                      <td style={{ fontSize: "12px", color: "#475569" }}>{rec.date}</td>
                      <td><StatusBadge status={rec.status || "Approved"} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right: Institutional Personnel & Governance */}
        <section className="panel" style={{ margin: 0, display: "flex", flexDirection: "column" }}>
          <SectionHeader
            title="Institutional Governance"
            action={<NavLink className="text-link" to="/users">Manage Staff Accounts →</NavLink>}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
            <div
              style={{
                padding: "12px 14px",
                borderRadius: "8px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div>
                <strong style={{ display: "block", fontSize: "13px", color: "#0f172a" }}>Course Coordinators</strong>
                <span style={{ fontSize: "11px", color: "#64748b" }}>Process Owners managing documentation</span>
              </div>
              <span className="badge badge-info" style={{ fontWeight: 600 }}>{courseCoordinatorsCount} Registered</span>
            </div>

            <div
              style={{
                padding: "12px 14px",
                borderRadius: "8px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div>
                <strong style={{ display: "block", fontSize: "13px", color: "#0f172a" }}>Pending Quality Reviews</strong>
                <span style={{ fontSize: "11px", color: "#64748b" }}>Documents awaiting review or comments</span>
              </div>
              <span className="badge badge-warning" style={{ fontWeight: 600 }}>{pendingReviews} Documents</span>
            </div>

            <div
              style={{
                padding: "12px 14px",
                borderRadius: "8px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div>
                <strong style={{ display: "block", fontSize: "13px", color: "#166534" }}>Ready to Share with Coordinators</strong>
                <span style={{ fontSize: "11px", color: "#15803d" }}>Audits & MRMs approved by Trust Head</span>
              </div>
              <span className="badge badge-success" style={{ fontWeight: 600 }}>
                {readyToShareMRMs.length + readyToShareAudits.length} Items Ready
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Audit Action Hub Section */}
      <div className="panel" style={{ marginTop: "24px" }}>
        <SectionHeader
          title="Quality Audit Portals"
          description="Internal ISO reviews and external third-party surveillance audits."
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          {/* Card 1: Internal Audit */}
          <div
            style={{
              padding: "16px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <ShieldCheck size={18} color="#0284c7" />
                <strong style={{ fontSize: "14px", color: "#0f172a" }}>Internal Quality Audit (IQA)</strong>
              </div>
              <p style={{ fontSize: "12px", color: "#64748b", margin: 0, lineHeight: 1.4 }}>
                Review, authorize schedules with Trust Head, and track department Non-Conformance (NC) reports.
              </p>
            </div>
            <div style={{ marginTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#0284c7" }}>{auditList.length} Active Audits</span>
              <NavLink to="/internal-audit" className="secondary-button" style={{ padding: "6px 12px", fontSize: "11px" }}>
                Open Internal Portal →
              </NavLink>
            </div>
          </div>

          {/* Card 2: External Audit */}
          <div
            style={{
              padding: "16px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <Check size={18} color="#16a34a" />
                <strong style={{ fontSize: "14px", color: "#0f172a" }}>External ISO Certification Audit</strong>
              </div>
              <p style={{ fontSize: "12px", color: "#64748b", margin: 0, lineHeight: 1.4 }}>
                External certifying agency surveillance audits, registrar observations, and certification validity.
              </p>
            </div>
            <div style={{ marginTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#16a34a" }}>{externalAuditList.length} Cycles</span>
              <NavLink to="/external-audit" className="secondary-button" style={{ padding: "6px 12px", fontSize: "11px" }}>
                Open External Portal →
              </NavLink>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
