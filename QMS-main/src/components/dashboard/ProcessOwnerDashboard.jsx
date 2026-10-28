import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { BookOpen, Check, ClipboardList, Clock3, FileCheck2, FileText, Plus, Users, CalendarCheck, ArrowRight, AlertCircle } from "lucide-react";
import { useApp } from "../../context/AppContext";
import PageIntro from "../common/PageIntro";
import SectionHeader from "../common/SectionHeader";
import StatCard from "../common/StatCard";
import StatusBadge from "../common/StatusBadge";
import ActivityCard from "./ActivityCard";
import TaskTable from "../tables/TaskTable";
import DocumentTable from "../tables/DocumentTable";
import ProcessTable from "../tables/ProcessTable";
import TaskModal from "../tasks/TaskModal";

export default function ProcessOwnerDashboard() {
  const { tasks, documents, processes, mrmList, auditList, addTask } = useApp();
  const [showModal, setShowModal] = useState(false);

  const activeTasks = tasks.filter((t) => t.status === "In Progress").length;
  const pendingTasks = tasks.filter((t) => t.status === "Pending").length;
  const awaitingReview = documents.filter((d) => d.status === "Under Review" || d.status === "Changes Requested").length;

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

  // My pending audit action items (CAPA)
  const myPendingCAPAs = (auditList || []).filter(
    (a) =>
      (a.stage === 5 || a.stage === 4) &&
      ((a.process && a.process.toLowerCase().includes("course")) ||
        (a.internalAuditee?.name && a.internalAuditee.name.toLowerCase().includes("priya")))
  );

  return (
    <>
      <PageIntro
        eyebrow="Course coordinator workspace"
        title="Course Coordinator Control Centre"
        description="Plan and review course processes, tasks, controlled documents, and Management Review Meetings (MRM)."
        action={
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <NavLink to="/mrm" className="secondary-button" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <CalendarCheck size={16} />
              <span>View Scheduled MRMs</span>
            </NavLink>
            <button className="primary-button btn-blue" onClick={() => setShowModal(true)}>
              <Plus size={17} />
              <span>Assign task</span>
            </button>
          </div>
        }
      />

      {/* Urgent Action Banner: Non-Conformance Corrective Action Required */}
      {myPendingCAPAs.length > 0 && (
        <div
          style={{
            marginBottom: "20px",
            padding: "14px 18px",
            background: "#fff7ed",
            border: "1px solid #fed7aa",
            borderRadius: "10px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            boxShadow: "0 2px 6px rgba(234, 88, 12, 0.08)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#9a3412" }}>
            <AlertCircle size={22} color="#ea580c" />
            <div>
              <strong style={{ display: "block", fontSize: "14px" }}>
                Action Required: {myPendingCAPAs.length} Non-Conformance Corrective Action Plan (CAPA) awaiting submission
              </strong>
              <span style={{ fontSize: "12px", color: "#c2410c" }}>
                Latest: {myPendingCAPAs[0]?.process} ({myPendingCAPAs[0]?.id}). Internal Auditor and QMS Coordinator are awaiting Root Cause Analysis.
              </span>
            </div>
          </div>
          <NavLink
            to="/internal-audit"
            className="primary-button btn-green"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", fontSize: "12px" }}
          >
            <span>Submit CAPA in Internal Audit</span>
            <ArrowRight size={14} />
          </NavLink>
        </div>
      )}

      <div className="stats-grid six">
        <StatCard label="My processes" value={processes.length} icon={BookOpen} />
        <StatCard label="Scheduled MRMs" value={accessibleMRMs.length} icon={CalendarCheck} tone="teal" hint="Notified & MoM published" />
        <StatCard label="Active tasks" value={activeTasks} icon={ClipboardList} />
        <StatCard label="Pending tasks" value={pendingTasks} icon={Clock3} tone="amber" />
        <StatCard label="Documents" value={documents.length} icon={FileText} tone="teal" />
        <StatCard label="Awaiting review" value={awaitingReview} icon={FileCheck2} tone="red" />
      </div>

      {/* Quick MRM Overview Card (Restricted to Notified & MoM Published only) */}
      <section className="panel">
        <SectionHeader
          title="Management Review Meetings (MRM)"
          action={<NavLink className="text-link" to="/mrm">View all scheduled MRMs <ArrowRight size={14} style={{ display: "inline", verticalAlign: "middle" }} /></NavLink>}
        />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Meeting Title</th>
                <th>Scheduled Date</th>
                <th>Venue</th>
                <th>MoM Document</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {accessibleMRMs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
                    No review meetings currently scheduled for course coordinators. You will receive an official notification email once an MRM is scheduled.
                  </td>
                </tr>
              ) : (
                accessibleMRMs.slice(0, 3).map((mrm) => {
                  const hasMoM = !!mrm.momFile || mrm.status === "MoM Uploaded";
                  return (
                    <tr key={mrm.id}>
                      <td>
                        <NavLink to="/mrm" className="table-link">
                          <strong>{mrm.title}</strong>
                        </NavLink>
                      </td>
                      <td>{mrm.scheduledDate} {mrm.scheduledTime && `• ${mrm.scheduledTime}`}</td>
                      <td>{mrm.venue || "Main Boardroom"}</td>
                      <td>
                        {hasMoM ? (
                          <span style={{ color: "#16a34a", fontSize: "13px", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <Check size={14} /> MoM Published
                          </span>
                        ) : (
                          <span style={{ color: "#64748b", fontSize: "13px" }}>Pending Meeting Execution</span>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: "600",
                            background: hasMoM ? "#dcfce7" : "#e0e7ff",
                            color: hasMoM ? "#16a34a" : "#4338ca",
                            border: `1px solid ${hasMoM ? "#86efac" : "#c7d2fe"}`
                          }}
                        >
                          {hasMoM ? "MoM Published" : "Meeting Scheduled"}
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

      <section className="panel">
        <SectionHeader title="Process overview" action={<NavLink className="text-link" to="/processes">View processes</NavLink>} />
        <ProcessTable items={processes.slice(0, 3)} />
      </section>

      <div className="dashboard-grid">
        <section className="panel panel-wide">
          <SectionHeader title="Document management" action={<NavLink className="text-link" to="/documents">Open library</NavLink>} />
          <DocumentTable items={documents} />
        </section>
        <ActivityCard />
      </div>

      {showModal && <TaskModal onClose={() => setShowModal(false)} onSave={(task) => { addTask(task); setShowModal(false); }} />}
    </>
  );
}
