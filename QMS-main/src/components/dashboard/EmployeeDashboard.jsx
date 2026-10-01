import React from "react";
import { NavLink } from "react-router-dom";
import {
  Check,
  ClipboardList,
  Clock3,
  FileText,
} from "lucide-react";

import { useApp } from "../../context/AppContext";
import PageIntro from "../common/PageIntro";
import SectionHeader from "../common/SectionHeader";
import StatCard from "../common/StatCard";
import ActivityCard from "./ActivityCard";
import TaskTable from "../tables/TaskTable";
import DocumentTable from "../tables/DocumentTable";

function greeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";

  return "Good evening";
}

export default function EmployeeDashboard() {
  const { tasks, documents, currentUser } = useApp();

  const assigned = tasks.filter(
    (task) =>
      task.employee?.toLowerCase() === currentUser?.name?.toLowerCase() ||
      task.employee?.toLowerCase() === currentUser?.username?.toLowerCase()
  );

  const completedCount = assigned.filter((t) => t.status === "Completed").length;

  return (
    <div className="employee-dashboard">

      {/* HERO / GREETING */}
      <div className="employee-hero">
        <div className="employee-hero-glow"></div>

        <PageIntro
          eyebrow="Employee workspace"
          title={`${greeting()}, ${currentUser?.name?.split(" ")[0] || "Employee"}`}
          description="Stay on top of your assigned work and the latest controlled QMS records."
        />
      </div>

      {/* STATS */}
      <div className="stats-grid employee-stats">
        <StatCard
          label="Assigned tasks"
          value={assigned.length}
          icon={ClipboardList}
        />

        <StatCard
          label="Pending tasks"
          value={assigned.filter((t) => t.status !== "Completed").length}
          icon={Clock3}
          tone="amber"
        />

        <StatCard
          label="Completed tasks"
          value={completedCount}
          icon={Check}
          tone="green"
        />

        <StatCard
          label="Available documents"
          value={documents.length}
          icon={FileText}
          tone="teal"
        />
      </div>

      {/* MAIN DASHBOARD */}
      <div className="dashboard-grid employee-main-grid">

        {/* TASK PANEL */}
        <section className="panel panel-wide employee-panel employee-task-panel">
          <SectionHeader
            title="My task queue"
            action={
              <NavLink
                className="text-link"
                to="/tasks"
              >
                View all tasks
              </NavLink>
            }
          />

          <div className="employee-table-reveal">
            <TaskTable items={assigned} />
          </div>
        </section>

        {/* ACTIVITY */}
        <div className="employee-activity-panel">
          <ActivityCard />
        </div>
      </div>

      {/* DOCUMENTS */}
      <section className="panel employee-panel employee-documents-panel">
        <SectionHeader
          title="My documents"
          action={
            <NavLink
              className="text-link"
              to="/documents"
            >
              Browse library
            </NavLink>
          }
        />

        <div className="employee-table-reveal">
          <DocumentTable items={documents.slice(0, 4)} />
        </div>
      </section>

    </div>
  );
}