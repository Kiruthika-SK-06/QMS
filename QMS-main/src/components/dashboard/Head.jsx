import React from "react";
import { NavLink } from "react-router-dom";
import StatCard from "../common/StatCard";
import StatusBadge from "../common/StatusBadge";
import {
  Layers,
  CheckCircle2,
  Clock3,
  AlertCircle,
  CalendarCheck,
  Check,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { useApp } from "../../context/AppContext";

const processData = [
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

const timelineData = [
  {
    date: "01 Sep",
    title: "Course Administration",
    description: "Curriculum review started",
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
    description: "Lab infrastructure upgrade in progress",
    status: "active",
  },
  {
    date: "20 Sep",
    title: "AI Course Management",
    description: "Syllabus revision completed",
    status: "completed",
  },
  {
    date: "25 Sep",
    title: "Quality Review & MRM",
    description: "Management Review Meeting scheduled with Trust Head",
    status: "upcoming",
  },
];

export default function Head() {
  const { headOverview, processes, mrmList, approveMRM } = useApp();
  const list = headOverview?.processData || (processes?.length ? processes : processData);
  const timeline = headOverview?.timelineData || timelineData;

  const totalProcesses = list.length;
  const completedProcesses = list.filter((p) => p.status === "Completed").length;
  const inProgressProcesses = list.filter((p) => p.status === "In Progress" || p.status === "Active").length;
  const pendingProcesses = list.filter((p) => p.status === "Pending").length;

  const pendingApprovalMRMs = (mrmList || []).filter(
    (m) => m.status === "Pending Trust Head Approval" || m.status === "Submitted for Approval"
  );

  const overallProgress = Math.round(
    list.reduce((total, process) => total + (process.progress || 0), 0) / (list.length || 1)
  );

  return (
    <div>
      {/* Page Intro */}
      <div className="page-intro">
        <div>
          <span className="eyebrow">TRUST EXECUTIVE OVERVIEW</span>
          <h1>Trust Head Executive Overview</h1>
          <p>
            Monitor Trust-wide quality objectives, academic process performance, and Management Review Meeting (MRM) approvals.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <NavLink
            to="/mrm"
            className="primary-button btn-blue"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <CalendarCheck size={16} />
            <span>Review MRM Meetings</span>
          </NavLink>
        </div>
      </div>

      {/* Pending MRM Approval Banner */}
      {pendingApprovalMRMs.length > 0 && (
        <div
          style={{
            marginBottom: "20px",
            padding: "16px 20px",
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "#fef3c7",
                color: "#d97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}
            >
              <CalendarCheck size={20} />
            </div>
            <div>
              <strong style={{ display: "block", color: "#92400e", fontSize: "15px" }}>
                {pendingApprovalMRMs.length} MRM Meeting MoM Awaiting Your Formal Approval
              </strong>
              <span style={{ color: "#b45309", fontSize: "13px" }}>
                Course Coordinator submitted "{pendingApprovalMRMs[0]?.title}" Minutes of Meeting for Trust Head sign-off.
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <NavLink
              to="/mrm"
              className="primary-button btn-green"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <ShieldCheck size={16} />
              <span>Review & Approve in MRM</span>
            </NavLink>
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="stats-grid">
        <StatCard label="Total Processes" value={totalProcesses} icon={Layers} tone="blue" />
        <StatCard label="Completed" value={completedProcesses} icon={CheckCircle2} tone="green" />
        <StatCard label="In Progress" value={inProgressProcesses} icon={Clock3} tone="yellow" hint="Currently active" />
        <StatCard label="MRM Reviews" value={mrmList?.length || 3} icon={CalendarCheck} tone="blue" hint="Review meetings" />
      </div>

      {/* Overall Progress */}
      <div className="panel">
        <div className="section-header">
          <div>
            <h2>Overall Trust QMS Progress</h2>
            <p>High-level compliance across all academic and quality management processes.</p>
          </div>
          <strong className="progress-value">{overallProgress}%</strong>
        </div>

        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${overallProgress}%` }} />
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
              <p>Current status of all QMS processes and assigned Course Coordinators.</p>
            </div>
          </div>

          <div className="process-overview-list">
            {list.map((process) => (
              <div className="process-overview-item" key={process.name}>
                <div className="process-overview-top">
                  <div>
                    <strong>{process.name}</strong>
                    <span>{process.owner}</span>
                  </div>
                  <strong>{process.progress}%</strong>
                </div>

                <div className="progress-bar small">
                  <div className="progress-bar-fill" style={{ width: `${process.progress}%` }} />
                </div>

                <div className="process-overview-bottom">
                  <StatusBadge status={process.status} />
                  <span>Target: {process.target}</span>
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
              <p>Current QMS process status distribution.</p>
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
            <p>High-level timeline of major QMS activities.</p>
          </div>
          <span className="timeline-period">September 2026</span>
        </div>

        <div className="head-timeline">
          {timeline.map((item, index) => (
            <div className={`head-timeline-item ${item.status}`} key={`${item.title}-${index}`}>
              <div className="head-timeline-date">{item.date}</div>
              <div className="head-timeline-line">
                <span className="head-timeline-dot" />
                {index !== timeline.length - 1 && <span className="head-timeline-connector" />}
              </div>
              <div className="head-timeline-content">
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}