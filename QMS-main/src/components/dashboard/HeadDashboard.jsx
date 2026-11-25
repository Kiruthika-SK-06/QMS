import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, ClipboardCheck } from "lucide-react";
import { useApp } from "../../context/AppContext";
import StatCard from "../common/StatCard";
import StatusBadge from "../common/StatusBadge";
import OverviewWaveChart from "./OverviewWaveChart";

export default function TrustHeadDashboard() {
  const navigate = useNavigate();
  const { headOverview, processes = [], auditList = [], dashboardStats } = useApp();

  const pendingAudits = (auditList || []).filter((a) => a.stage === 2);
  const processData = (headOverview?.processData && headOverview.processData.length > 0)
    ? headOverview.processData
    : processes;
  const timelineData = headOverview?.timelineData || [];

  const totalProcesses = processData.length;

  const completedProcesses = processData.filter(
    (process) => process.status === "Completed"
  ).length;

  const inProgressProcesses = processData.filter(
    (process) => process.status === "In Progress" || process.status === "Active"
  ).length;

  const pendingProcesses = processData.filter(
    (process) => process.status === "Pending"
  ).length;

  const overallProgress = totalProcesses > 0
    ? Math.round(
        processData.reduce(
          (total, process) => total + (process.progress || 0),
          0
        ) / totalProcesses
      )
    : 0;

  return (
    <div>
      {/* Page Intro */}
      <div className="page-intro">
        <div>
          <span className="eyebrow">MANAGEMENT OVERVIEW</span>
          <h1>QMS Overview</h1>
          <p>
            Monitor the overall progress of quality management
            processes, audit compliance, and institutional activities.
          </p>
        </div>

        <div>
          <span className="muted-text">Last Updated</span>
          <strong>{new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</strong>
        </div>
      </div>

      {/* Urgent Action Banner for Trust Head */}
      {pendingAudits.length > 0 && (
        <div
          style={{
            padding: "14px 18px",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "10px",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            boxShadow: "0 2px 6px rgba(29, 78, 216, 0.08)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <AlertCircle size={20} color="#1d4ed8" />
            <div>
              <strong style={{ color: "#1e3a8a", display: "block", fontSize: "14px" }}>
                Action Required: {pendingAudits.length} Internal Quality Audit Schedule{pendingAudits.length > 1 ? "s" : ""} Awaiting Your Approval
              </strong>
              <span style={{ fontSize: "13px", color: "#3b82f6" }}>
                Audits are scheduled by QMS Coordinator and require Trust Head confirmation before execution.
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate("/internal-audit")}
            style={{
              padding: "7px 14px",
              background: "#1d4ed8",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <ClipboardCheck size={16} />
            Review & Approve
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Top Wave Chart Section */}
      <div style={{ marginBottom: "24px" }}>
        <OverviewWaveChart
          title="Quality Performance Index"
          metric={dashboardStats?.waveData?.primaryMetric || (totalProcesses > 0 ? `${overallProgress}%` : "0%")}
          data={dashboardStats?.waveData}
        />
      </div>

      {/* Process Overview + Overall Status Grid */}
      <div className="dashboard-grid">
        {/* Process Overview */}
        <div className="panel">
          <div className="section-header">
            <div>
              <h2>Process Overview</h2>
              <p>Current status of all QMS processes.</p>
            </div>
          </div>

          <div className="process-overview-list">
            {processData.length > 0 ? (
              processData.map((process) => (
                <div className="process-overview-item" key={process.name}>
                  <div className="process-overview-top">
                    <div>
                      <strong>{process.name}</strong>
                      <span>{process.owner}</span>
                    </div>
                    <strong>{process.progress || 0}%</strong>
                  </div>

                  <div className="progress-bar small">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${process.progress || 0}%`,
                      }}
                    />
                  </div>

                  <div className="process-overview-bottom">
                    <StatusBadge status={process.status} />
                    <span>Target: {process.target || "Active"}</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "#64748b" }}>
                <p style={{ margin: 0, fontSize: "13px" }}>No registered processes found in database.</p>
              </div>
            )}
          </div>
        </div>

        {/* Overall Status */}
        <div className="panel">
          <div className="section-header">
            <div>
              <h2>Overall Status</h2>
              <p>Current QMS process status breakdown.</p>
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
          <span className="timeline-period">Current Cycle</span>
        </div>

        <div className="head-timeline">
          {timelineData.length > 0 ? (
            timelineData.map((item, index) => (
              <div
                className={`head-timeline-item ${item.status}`}
                key={`${item.title}-${index}`}
              >
                <div className="head-timeline-date">{item.date}</div>

                <div className="head-timeline-line">
                  <span className="head-timeline-dot" />
                  {index !== timelineData.length - 1 && (
                    <span className="head-timeline-connector" />
                  )}
                </div>

                <div className="head-timeline-content">
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "#64748b" }}>
              <p style={{ margin: 0, fontSize: "13px" }}>No recent process timeline activities recorded.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
