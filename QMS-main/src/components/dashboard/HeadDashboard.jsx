import React from "react";
import StatCard from "../common/StatCard";
import StatusBadge from "../common/StatusBadge";

const processData = [
  {
    name: "Human Resource Management",
    owner: "HR Process Owner",
    progress: 82,
    status: "In Progress",
    target: "30 Sep 2026",
  },
  {
    name: "Training Management",
    owner: "Training Process Owner",
    progress: 91,
    status: "In Progress",
    target: "28 Sep 2026",
  },
  {
    name: "Course Management",
    owner: "Course Process Owner",
    progress: 100,
    status: "Completed",
    target: "20 Sep 2026",
  },
  {
    name: "IT Support Management",
    owner: "IT Process Owner",
    progress: 64,
    status: "In Progress",
    target: "05 Oct 2026",
  },
  {
    name: "Finance Management",
    owner: "Finance Process Owner",
    progress: 42,
    status: "Pending",
    target: "15 Oct 2026",
  },
];

const timelineData = [
  {
    date: "01 Sep",
    title: "HR Management",
    description: "Process review started",
    status: "completed",
  },
  {
    date: "05 Sep",
    title: "Training Management",
    description: "Process documentation under review",
    status: "completed",
  },
  {
    date: "15 Sep",
    title: "IT Support Management",
    description: "Process activities in progress",
    status: "active",
  },
  {
    date: "20 Sep",
    title: "Course Management",
    description: "Process completed",
    status: "completed",
  },
  {
    date: "25 Sep",
    title: "Finance Management",
    description: "Process review scheduled",
    status: "upcoming",
  },
];

export default function QMHeadDashboard() {
  const totalProcesses = processData.length;

  const completedProcesses = processData.filter(
    (process) => process.status === "Completed"
  ).length;

  const inProgressProcesses = processData.filter(
    (process) => process.status === "In Progress"
  ).length;

  const pendingProcesses = processData.filter(
    (process) => process.status === "Pending"
  ).length;

  const overallProgress = Math.round(
    processData.reduce(
      (total, process) => total + process.progress,
      0
    ) / processData.length
  );

  return (
    <div>

      {/* Page Intro */}
      <div className="page-intro">
        <div>
          <span className="eyebrow">MANAGEMENT OVERVIEW</span>

          <h1>QMS Overview</h1>

          <p>
            Monitor the overall progress of quality management
            processes and activities.
          </p>
        </div>

        <div>
          <span className="muted-text">Last Updated</span>
          <strong>21 Sep 2026</strong>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="stats-grid">

        <StatCard
          label="Total Processes"
          value={totalProcesses}
          hint="All QMS processes"
        />

        <StatCard
          label="Completed"
          value={completedProcesses}
          hint="Processes completed"
        />

        <StatCard
          label="In Progress"
          value={inProgressProcesses}
          hint="Currently active"
        />

        <StatCard
          label="Pending"
          value={pendingProcesses}
          hint="Needs attention"
        />

      </div>

      {/* Overall Progress */}
      <div className="panel">
        <div className="section-header">

          <div>
            <h2>Overall QMS Progress</h2>

            <p>
              High-level progress across all quality management
              processes.
            </p>
          </div>

          <strong className="progress-value">
            {overallProgress}%
          </strong>

        </div>

        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{
              width: `${overallProgress}%`,
            }}
          />
        </div>

        <div className="progress-info">
          <span>Overall process completion</span>
          <span>{overallProgress}% completed</span>
        </div>
      </div>

      {/* Process Overview + Overall Status */}
      <div className="dashboard-grid">

        {/* Process Overview */}
        <div className="panel">

          <div className="section-header">
            <div>
              <h2>Process Overview</h2>

              <p>
                Current status of all QMS processes.
              </p>
            </div>
          </div>

          <div className="process-overview-list">

            {processData.map((process) => (
              <div
                className="process-overview-item"
                key={process.name}
              >

                <div className="process-overview-top">

                  <div>
                    <strong>{process.name}</strong>

                    <span>
                      {process.owner}
                    </span>
                  </div>

                  <strong>
                    {process.progress}%
                  </strong>

                </div>

                <div className="progress-bar small">

                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${process.progress}%`,
                    }}
                  />

                </div>

                <div className="process-overview-bottom">

                  <StatusBadge status={process.status} />

                  <span>
                    Target: {process.target}
                  </span>

                </div>

              </div>
            ))}

          </div>

        </div>

        {/* Overall Status */}
        <div className="panel">

          <div className="section-header">
            <div>
              <h2>Overall Status</h2>

              <p>
                Current QMS process status.
              </p>
            </div>
          </div>

          <div className="overall-progress">

            <div className="progress-circle">
              <div className="progress-circle-content">
                <strong>{overallProgress}%</strong>
                <span>Overall Progress</span>
              </div>
            </div>

          </div>

          <div className="status-summary">

            <div>
              <span className="status-dot completed" />
              <span>Completed</span>
              <strong>{completedProcesses}</strong>
            </div>

            <div>
              <span className="status-dot in-progress" />
              <span>In Progress</span>
              <strong>{inProgressProcesses}</strong>
            </div>

            <div>
              <span className="status-dot pending" />
              <span>Pending</span>
              <strong>{pendingProcesses}</strong>
            </div>

          </div>

        </div>

      </div>

      {/* Process Timeline */}
      <div className="panel timeline-panel">

        <div className="section-header">

          <div>
            <h2>Process Timeline</h2>

            <p>
              High-level timeline of major QMS activities.
            </p>
          </div>

          <span className="timeline-period">
            September 2026
          </span>

        </div>

        <div className="head-timeline">

          {timelineData.map((item, index) => (
            <div
              className={`head-timeline-item ${item.status}`}
              key={`${item.title}-${index}`}
            >

              <div className="head-timeline-date">
                {item.date}
              </div>

              <div className="head-timeline-line">

                <span className="head-timeline-dot" />

                {index !== timelineData.length - 1 && (
                  <span className="head-timeline-connector" />
                )}

              </div>

              <div className="head-timeline-content">

                <strong>{item.title}</strong>

                <p>
                  {item.description}
                </p>

              </div>

            </div>
          ))}

        </div>

      </div>

    </div>
  );
}