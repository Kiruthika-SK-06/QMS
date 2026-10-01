import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { BookOpen, Check, ClipboardList, Clock3, FileCheck2, FileText, Plus, Users } from "lucide-react";
import { useApp } from "../../context/AppContext";
import PageIntro from "../common/PageIntro";
import SectionHeader from "../common/SectionHeader";
import StatCard from "../common/StatCard";
import ActivityCard from "./ActivityCard";
import TaskTable from "../tables/TaskTable";
import DocumentTable from "../tables/DocumentTable";
import ProcessTable from "../tables/ProcessTable";
import TaskModal from "../tasks/TaskModal";

export default function ProcessOwnerDashboard() {
  const { tasks, documents, processes, employees, addTask } = useApp();
  const [showModal, setShowModal] = useState(false);

  const activeTasks = tasks.filter((t) => t.status === "In Progress").length;
  const pendingTasks = tasks.filter((t) => t.status === "Pending").length;
  const awaitingReview = documents.filter((d) => d.status === "Under Review" || d.status === "Changes Requested").length;

  return (
    <>
      <PageIntro
        eyebrow="Process owner workspace"
        title="Process control centre"
        description="Manage assigned employees, tasks and controlled documents across your processes."
        action={<button className="primary-button" onClick={() => setShowModal(true)}><Plus size={17} /> Assign task</button>}
      />
      <div className="stats-grid six">
        <StatCard label="My processes" value={processes.length} icon={BookOpen} />
        <StatCard label="Employees" value={employees.length} icon={Users} tone="teal" />
        <StatCard label="Active tasks" value={activeTasks} icon={ClipboardList} />
        <StatCard label="Pending tasks" value={pendingTasks} icon={Clock3} tone="amber" />
        <StatCard label="Documents" value={documents.length} icon={FileText} tone="teal" />
        <StatCard label="Awaiting review" value={awaitingReview} icon={FileCheck2} tone="red" />
      </div>

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
