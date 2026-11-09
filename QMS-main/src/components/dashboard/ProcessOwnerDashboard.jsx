import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
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
import StatCard from "../common/StatCard";

export default function ProcessOwnerDashboard() {
  const navigate = useNavigate();
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

      {/* Top 3 Stat Cards with Circular Gauge Rings */}
      <div className="stats-grid three-col">
        <StatCard
          label="MRM Sessions"
          value={`${accessibleMRMs.length} Sessions`}
          progress={82}
          tone="blue"
          direction="up"
          hint="Scheduled & MoM Published"
          onClick={() => navigate("/mrm")}
        />

        <StatCard
          label="Monitored Processes"
          value={`${processes.length} Processes`}
          progress={95}
          tone="teal"
          direction="up"
          hint="Active Course Processes"
          onClick={() => navigate("/processes")}
        />

        <StatCard
          label="Controlled Documents"
          value={`${documents.length} Documents`}
          progress={75}
          tone="dark"
          direction="up"
          hint="Open Document Library"
          onClick={() => navigate("/documents")}
        />
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
                  <th>Process</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.slice(0, 4).map((t) => (
                  <tr key={t.id}>
                    <td><strong>{t.title}</strong></td>
                    <td>{t.process}</td>
                    <td>{t.assignedTo}</td>
                    <td><StatusBadge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right: Internal Audit Highlights */}
        <section className="panel" style={{ margin: 0, display: "flex", flexDirection: "column" }}>
          <SectionHeader
            title="Internal Audit Status"
            action={<NavLink className="text-link" to="/internal-audit">Open Audit Portal →</NavLink>}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
            {auditList.slice(0, 3).map((a) => (
              <div
                key={a.id}
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
                  <strong style={{ display: "block", fontSize: "13px", color: "#0f172a" }}>{a.process}</strong>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>Date: {a.scheduledDate} · Auditor: {a.auditor}</span>
                </div>
                <StatusBadge status={a.status || "Planned"} />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Row: External Audit & Process Register */}
      <div className="dashboard-two-col" style={{ marginTop: "24px" }}>
        {/* Left: External Audit Surveillance */}
        <section className="panel" style={{ margin: 0 }}>
          <SectionHeader
            title="External Certification & Surveillance"
            action={<NavLink className="text-link" to="/external-audit">View Surveillance →</NavLink>}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {externalAuditList.slice(0, 2).map((ea) => (
              <div
                key={ea.id}
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
                  <strong style={{ display: "block", fontSize: "13px", color: "#166534" }}>{ea.title}</strong>
                  <span style={{ fontSize: "11px", color: "#15803d" }}>Agency: {ea.certifyingAgency} · Audit Date: {ea.auditDate}</span>
                </div>
                <StatusBadge status={ea.status || "Completed"} />
              </div>
            ))}
          </div>
        </section>

        {/* Right: Quick Process Metrics */}
        <section className="panel" style={{ margin: 0 }}>
          <SectionHeader
            title="Monitored Processes"
            action={<NavLink className="text-link" to="/processes">Explore all →</NavLink>}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {processes.slice(0, 3).map((proc) => (
              <div
                key={proc.id}
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <strong style={{ fontSize: "13px", color: "#0f172a" }}>{proc.name}</strong>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>Owner: {proc.owner}</div>
                </div>
                <StatusBadge status={proc.status || "Active"} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
