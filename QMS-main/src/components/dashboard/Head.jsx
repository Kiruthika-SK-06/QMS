import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
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
import StatCard from "../common/StatCard";
import OverviewWaveChart from "./OverviewWaveChart";

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
  const navigate = useNavigate();
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

        {/* Core 3 Cards for Auditor with Circular Gauge Rings */}
        <div className="stats-grid three-col">
          <StatCard
            label="Internal Quality Audits"
            value={`${auditList.length} Audits`}
            progress={85}
            tone="blue"
            direction="up"
            hint="Scheduled & Active Audits"
            onClick={() => navigate("/internal-audit")}
          />

          <StatCard
            label="Awaiting Noticing Sheets"
            value={`${auditsAwaitingNoticing.length} Pending`}
            progress={60}
            tone="amber"
            direction="down"
            hint="Action Required: Inspection"
            onClick={() => navigate("/internal-audit")}
          />

          <StatCard
            label="MRM & MoM Downloads"
            value={`${publishedMRMs.length} Available`}
            progress={95}
            tone="teal"
            direction="up"
            hint="Official Minutes of Meeting"
            onClick={() => navigate("/mrm")}
          />
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
  // TRUST HEAD EXECUTIVE VIEW
  // =========================================================================
  return (
    <>
      <PageIntro
        eyebrow="TRUST EXECUTIVE WORKSPACE"
        title="Trust Head Workspace"
        description="Executive governance, institutional quality performance, and review meeting ratification."
      />

      {/* Top 3 Stat Cards with Circular Gauge Rings & Directional Arrows */}
      <div className="stats-grid three-col">
        <StatCard
          label="Total Processes"
          value={`${totalProcesses} Monitored`}
          progress={88}
          tone="blue"
          direction="up"
          hint="All registered institutional processes"
          onClick={() => navigate("/processes")}
        />

        <StatCard
          label="Completed Processes"
          value={`${completedProcesses} Completed`}
          progress={100}
          tone="teal"
          direction="up"
          hint="Processes signed off & verified"
          onClick={() => navigate("/processes")}
        />

        <StatCard
          label="Pending Audits & MRMs"
          value={`${pendingAuditApprovals.length + pendingApprovalMRMs.length} Pending`}
          progress={55}
          tone="dark"
          direction="down"
          hint="Requires executive ratification"
          onClick={() => navigate("/internal-audit")}
        />
      </div>

      {/* Flagship Overview Wave Chart */}
      <div style={{ marginBottom: "24px" }}>
        <OverviewWaveChart
          metric={`${overallProgress}%`}
          title="Executive Process & Quality Performance Index"
        />
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
    </>
  );
}
