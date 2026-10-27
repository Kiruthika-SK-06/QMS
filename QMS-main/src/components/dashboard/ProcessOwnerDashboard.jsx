import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { BookOpen, Check, ClipboardList, Clock3, FileCheck2, FileText, Plus, Users, CalendarCheck, ArrowRight } from "lucide-react";
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
  const { tasks, documents, processes, mrmList, addTask } = useApp();
  const [showModal, setShowModal] = useState(false);

  const activeTasks = tasks.filter((t) => t.status === "In Progress").length;
  const pendingTasks = tasks.filter((t) => t.status === "Pending").length;
  const awaitingReview = documents.filter((d) => d.status === "Under Review" || d.status === "Changes Requested").length;
  const pendingApprovalMRMs = (mrmList || []).filter((m) => m.status === "Pending Trust Head Approval").length;

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
              <span>View MRMs</span>
            </NavLink>
            <button className="primary-button btn-blue" onClick={() => setShowModal(true)}>
              <Plus size={17} />
              <span>Assign task</span>
            </button>
          </div>
        }
      />

      <div className="stats-grid six">
        <StatCard label="My processes" value={processes.length} icon={BookOpen} />
        <StatCard label="MRM meetings" value={mrmList?.length || 3} icon={CalendarCheck} tone="teal" />
        <StatCard label="Active tasks" value={activeTasks} icon={ClipboardList} />
        <StatCard label="Pending tasks" value={pendingTasks} icon={Clock3} tone="amber" />
        <StatCard label="Documents" value={documents.length} icon={FileText} tone="teal" />
        <StatCard label="Awaiting review" value={awaitingReview} icon={FileCheck2} tone="red" />
      </div>

      {/* Quick MRM Overview Card */}
      <section className="panel">
        <SectionHeader
          title="Management Review Meetings (MRM)"
          action={<NavLink className="text-link" to="/mrm">Open MRM workflow <ArrowRight size={14} style={{ display: "inline", verticalAlign: "middle" }} /></NavLink>}
        />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Meeting Title</th>
                <th>Scheduled Date</th>
                <th>Planned By</th>
                <th>MoM Status</th>
                <th>Workflow State</th>
              </tr>
            </thead>
            <tbody>
              {(mrmList || []).slice(0, 3).map((mrm) => (
                <tr key={mrm.id}>
                  <td>
                    <NavLink to="/mrm" className="table-link">
                      <strong>{mrm.title}</strong>
                    </NavLink>
                  </td>
                  <td>{mrm.scheduledDate} {mrm.scheduledTime && `• ${mrm.scheduledTime}`}</td>
                  <td>{mrm.plannedBy}</td>
                  <td>
                    {mrm.mom ? (
                      <span style={{ color: "#16a34a", fontSize: "13px", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Check size={14} /> MoM Recorded
                      </span>
                    ) : (
                      <span style={{ color: "#d97706", fontSize: "13px" }}>Awaiting MoM Draft</span>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={mrm.status} />
                  </td>
                </tr>
              ))}
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
