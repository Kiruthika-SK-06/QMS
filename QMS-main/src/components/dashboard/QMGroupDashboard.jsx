import React from "react";
import { NavLink } from "react-router-dom";
import { BookOpen, Check, ClipboardList, Clock3, FileCheck2, FileText, Users } from "lucide-react";
import { useApp } from "../../context/AppContext";
import PageIntro from "../common/PageIntro";
import SectionHeader from "../common/SectionHeader";
import StatCard from "../common/StatCard";
import ActivityCard from "./ActivityCard";
import DocumentTable from "../tables/DocumentTable";
import ProcessTable from "../tables/ProcessTable";

export default function QMGroupDashboard() {
  const { tasks, documents, processes, employees } = useApp();

  const processOwnersCount = employees.filter((e) => e.role === "owner").length;
  const pendingReviews = documents.filter(
    (d) => d.status === "Under Review" || d.status === "Changes Requested"
  ).length;
  const activeTasks = tasks.filter((t) => t.status === "In Progress").length;
  const completedTasks = tasks.filter((t) => t.status === "Completed").length;
  const pendingTasks = tasks.filter((t) => t.status === "Pending").length;

  const totalTasks = tasks.length || 1;
  const completedPct = Math.round((completedTasks / totalTasks) * 100);
  const activePct = Math.round((activeTasks / totalTasks) * 100);
  const pendingPct = Math.round((pendingTasks / totalTasks) * 100);

  return (
    <>
      <PageIntro
        eyebrow="Quality management group"
        title="QMS command view"
        description="Monitor document control, task completion and review activity across the organization."
      />
      <div className="stats-grid seven">
        <StatCard label="Processes" value={processes.length} icon={BookOpen} />
        <StatCard label="Process owners" value={processOwnersCount || 3} icon={Users} tone="teal" />
        <StatCard label="Employees" value={employees.length} icon={Users} />
        <StatCard label="Documents" value={documents.length} icon={FileText} tone="teal" />
        <StatCard label="Pending reviews" value={pendingReviews} icon={FileCheck2} tone="amber" />
        <StatCard label="Active tasks" value={activeTasks} icon={ClipboardList} />
        <StatCard label="Completed tasks" value={completedTasks} icon={Check} tone="green" />
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <SectionHeader title="Task completion" />
          <div className="chart">
            <div className="chart-bar">
              <span style={{ height: `${Math.max(completedPct, 8)}%` }} />
              <small>Completed</small>
              <strong>{completedPct}%</strong>
            </div>
            <div className="chart-bar">
              <span style={{ height: `${Math.max(activePct, 8)}%` }} />
              <small>In progress</small>
              <strong>{activePct}%</strong>
            </div>
            <div className="chart-bar">
              <span style={{ height: `${Math.max(pendingPct, 8)}%` }} />
              <small>Pending</small>
              <strong>{pendingPct}%</strong>
            </div>
          </div>
        </section>
        <ActivityCard />
      </div>

      <section className="panel">
        <SectionHeader
          title="Document review queue"
          action={<NavLink className="text-link" to="/reviews">Open review queue</NavLink>}
        />
        <DocumentTable
          items={documents.filter(
            (document) => document.status === "Under Review" || document.status === "Changes Requested"
          )}
          review
        />
      </section>

      <section className="panel">
        <SectionHeader
          title="Process overview"
          action={<NavLink className="text-link" to="/processes">View all processes</NavLink>}
        />
        <ProcessTable items={processes} />
      </section>
    </>
  );
}
