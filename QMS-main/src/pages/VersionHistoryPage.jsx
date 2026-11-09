import React, { useState, useMemo } from "react";
import { NavLink, Navigate } from "react-router-dom";
import {
  ClipboardCheck,
  ShieldCheck,
  Search,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Calendar,
  User,
  ExternalLink
} from "lucide-react";
import { useApp } from "../context/AppContext";
import PageIntro from "../components/common/PageIntro";

export default function VersionHistoryPage() {
  const { auditList = [], externalAuditList = [], currentUser } = useApp();

  // Trust Head has Audit Trail removed completely
  if (currentUser?.role === "Head") {
    return <Navigate to="/Head/dashboard" replace />;
  }

  const [filterType, setFilterType] = useState("all"); // 'all' | 'internal' | 'external'
  const [searchQuery, setSearchQuery] = useState("");

  // Extract all Internal Audit workflow trail events
  const internalAuditEvents = useMemo(() => {
    const events = [];

    (auditList || []).forEach((audit) => {
      // 1. If explicit timeline array exists, use its entries
      if (Array.isArray(audit.timeline) && audit.timeline.length > 0) {
        audit.timeline.forEach((item, idx) => {
          events.push({
            id: `ia-${audit.id}-${idx}`,
            auditType: "internal",
            auditId: audit.id,
            auditTitle: audit.title || audit.process || "Internal Quality Audit",
            stage: audit.stage || 1,
            stageLabel: `Stage ${audit.stage || 1}: ${audit.stageLabel || audit.status}`,
            action: item.action,
            actor: item.actor || audit.scheduledBy?.name || "QMS Coordinator",
            timestamp: item.timestamp || audit.scheduledDate,
            details: item.details || `Workflow action executed for ${audit.process}`,
            link: "/internal-audit"
          });
        });
      } else {
        // Construct milestone events from internal audit data
        if (audit.scheduledBy) {
          events.push({
            id: `ia-${audit.id}-sched`,
            auditType: "internal",
            auditId: audit.id,
            auditTitle: audit.title || audit.process,
            stage: 1,
            stageLabel: "Stage 1: Schedule Planned",
            action: "Audit Scheduled by QMS Coordinator",
            actor: `${audit.scheduledBy.name} (${audit.scheduledBy.role})`,
            timestamp: audit.scheduledBy.scheduledAt || audit.scheduledDate,
            details: `Internal audit planned for ${audit.process}. Target date: ${audit.scheduledDate}.`,
            link: "/internal-audit"
          });
        }

        if (audit.scheduleShared?.shared) {
          events.push({
            id: `ia-${audit.id}-shared`,
            auditType: "internal",
            auditId: audit.id,
            auditTitle: audit.title || audit.process,
            stage: 2,
            stageLabel: "Stage 2: Schedule Shared",
            action: "Audit Schedule Dispatched",
            actor: audit.scheduleShared.sharedBy || "QMS Coordinator",
            timestamp: audit.scheduleShared.sharedAt || audit.scheduledDate,
            details: `Schedule shared to all Course Coordinators, Trust Head, and Internal Auditor.`,
            link: "/internal-audit"
          });
        }

        if (audit.auditeeConfirmation?.confirmed || audit.trustHeadConfirmation?.confirmed) {
          const conf = audit.auditeeConfirmation || audit.trustHeadConfirmation;
          events.push({
            id: `ia-${audit.id}-conf`,
            auditType: "internal",
            auditId: audit.id,
            auditTitle: audit.title || audit.process,
            stage: 3,
            stageLabel: "Stage 3: Schedule Confirmed",
            action: "Audit Schedule Confirmed by Auditee",
            actor: `${conf.confirmedBy} (${conf.confirmedRole || "Auditee Course Coordinator"})`,
            timestamp: conf.confirmedAt || audit.scheduledDate,
            details: conf.remarks || "Auditee confirmed attendance and prepared departmental records for inspection.",
            link: "/internal-audit"
          });
        }

        if (audit.noticingSheet?.submitted) {
          events.push({
            id: `ia-${audit.id}-ns`,
            auditType: "internal",
            auditId: audit.id,
            auditTitle: audit.title || audit.process,
            stage: 4,
            stageLabel: "Stage 4: Noticing Sheet Submitted",
            action: "On-Site Inspection Executed & Noticing Sheet Recorded",
            actor: audit.noticingSheet.submittedBy || "Internal Auditor",
            timestamp: audit.noticingSheet.submittedAt || audit.scheduledDate,
            details: audit.noticingSheet.summary || `Noticing Sheet recorded with ${audit.noticingSheet.findings?.length || 0} findings.`,
            link: "/internal-audit"
          });
        }

        if (audit.ncDocs?.shared) {
          events.push({
            id: `ia-${audit.id}-ncdoc`,
            auditType: "internal",
            auditId: audit.id,
            auditTitle: audit.title || audit.process,
            stage: 5,
            stageLabel: "Stage 5: NC Documents Shared",
            action: "Non-Conformance Documents Dispatched to Auditee",
            actor: audit.ncDocs.sharedBy || "Internal Auditor",
            timestamp: audit.ncDocs.sharedAt || audit.scheduledDate,
            details: "Detailed non-conformance documents shared with Course Coordinator for root cause analysis.",
            link: "/internal-audit"
          });
        }

        if (audit.auditeeClosure?.submitted) {
          events.push({
            id: `ia-${audit.id}-capa`,
            auditType: "internal",
            auditId: audit.id,
            auditTitle: audit.title || audit.process,
            stage: 6,
            stageLabel: "Stage 6: Auditee Closure Submitted",
            action: "Root Cause Analysis (RCA) & CAPA Submitted",
            actor: audit.auditeeClosure.submittedBy || "Course Coordinator",
            timestamp: audit.auditeeClosure.submittedAt || audit.scheduledDate,
            details: audit.auditeeClosure.correctiveAction || "Corrective and preventive action plan submitted for resolution.",
            link: "/internal-audit"
          });
        }

        if (audit.closure?.closed || audit.stage === 7) {
          events.push({
            id: `ia-${audit.id}-close`,
            auditType: "internal",
            auditId: audit.id,
            auditTitle: audit.title || audit.process,
            stage: 7,
            stageLabel: "Stage 7: Audit Concluded & Closed",
            action: "Final Audit Closure Verified",
            actor: audit.closure?.closedBy || "Rahul Kumar (QMS Coordinator)",
            timestamp: audit.closure?.closedAt || audit.scheduledDate,
            details: audit.closure?.finalRemarks || "Audit concluded with complete verification of all corrective actions.",
            link: "/internal-audit"
          });
        }
      }
    });

    return events;
  }, [auditList]);

  // Extract all External Audit workflow trail events
  const externalAuditEvents = useMemo(() => {
    const events = [];

    (externalAuditList || []).forEach((audit) => {
      // 1. If explicit timeline array exists, use its entries
      if (Array.isArray(audit.timeline) && audit.timeline.length > 0) {
        audit.timeline.forEach((item, idx) => {
          events.push({
            id: `ext-${audit.id}-${idx}`,
            auditType: "external",
            auditId: audit.id,
            auditTitle: audit.title || "ISO 9001:2015 External Surveillance Audit",
            stage: audit.stage || 1,
            stageLabel: `Step ${audit.stage || 1}: ${audit.status}`,
            action: item.action,
            actor: item.actor || audit.leadAuditor?.name || "Lead External Auditor",
            timestamp: item.timestamp || audit.scheduledDate,
            details: item.details || `Official external audit workflow recorded for ${audit.agency || "Certification Body"}.`,
            link: "/external-audit"
          });
        });
      } else {
        // Construct milestone events from external audit data
        if (audit.incomingScheduleEmail) {
          events.push({
            id: `ext-${audit.id}-email`,
            auditType: "external",
            auditId: audit.id,
            auditTitle: audit.title,
            stage: 1,
            stageLabel: "Step 1: Schedule Received (Email)",
            action: "Audit Schedule Received from External Auditor",
            actor: audit.incomingScheduleEmail.from || audit.leadAuditor?.name || "Dr. Robert Vance (Lead External Auditor)",
            timestamp: audit.incomingScheduleEmail.receivedAt || audit.scheduledDate,
            details: `Official email notice logged: ${audit.incomingScheduleEmail.subject}. Scheduled Date: ${audit.scheduledDate} ${audit.scheduledTime}.`,
            link: "/external-audit"
          });
        }

        if (audit.shareWithStakeholders?.shared) {
          events.push({
            id: `ext-${audit.id}-shared`,
            auditType: "external",
            auditId: audit.id,
            auditTitle: audit.title,
            stage: 2,
            stageLabel: "Step 2: Meeting Shared to Stakeholders",
            action: "Audit Notice Dispatched by QMS Coordinator",
            actor: audit.shareWithStakeholders.sharedBy || "Rahul Kumar (QMS Coordinator)",
            timestamp: audit.shareWithStakeholders.sharedAt || audit.scheduledDate,
            details: "External audit schedule and agenda shared to all Course Coordinators, Trust Head, and Internal Auditor.",
            link: "/external-audit"
          });
        }

        if (audit.ncDocument) {
          events.push({
            id: `ext-${audit.id}-nc`,
            auditType: "external",
            auditId: audit.id,
            auditTitle: audit.title,
            stage: 3,
            stageLabel: "Step 3: Scanned Paper NC Uploaded",
            action: "On-Site Paper NC Scanned & Uploaded",
            actor: "Rahul Kumar (QMS Coordinator)",
            timestamp: audit.scheduledDate,
            details: `Physical on-site audit conducted. Scanned paper NC document (${audit.ncDocument.fileName || "Scanned_NC.pdf"}) shared exclusively to Course Coordinators.`,
            link: "/external-audit"
          });
        }

        if (audit.ncClosure?.closed) {
          events.push({
            id: `ext-${audit.id}-ncclose`,
            auditType: "external",
            auditId: audit.id,
            auditTitle: audit.title,
            stage: 4,
            stageLabel: "Step 4: NC Resolution Closed",
            action: "Scanned Paper NC Downloaded & Resolved",
            actor: audit.ncClosure.closedBy || "Priya Sharma (Course Coordinator)",
            timestamp: audit.ncClosure.closedAt || audit.scheduledDate,
            details: audit.ncClosure.remarks || "Root Cause Analysis (RCA) completed and corrective action plan verified by Course Coordinator.",
            link: "/external-audit"
          });
        }

        if (audit.externalAuditorApproval?.approved || audit.stage >= 5) {
          events.push({
            id: `ext-${audit.id}-cert`,
            auditType: "external",
            auditId: audit.id,
            auditTitle: audit.title,
            stage: 5,
            stageLabel: "Step 5: ISO 9001 Certified & Closed",
            action: "External Auditor Approval Endorsed & Process Closed",
            actor: audit.processClosure?.closedBy || "Rahul Kumar (QMS Coordinator)",
            timestamp: audit.processClosure?.closedAt || audit.externalAuditorApproval?.approvedAt || audit.scheduledDate,
            details: `External auditor reviewed resolutions and endorsed ISO 9001:2015 Certification (${audit.externalAuditorApproval?.certificateNumber || "ISO-9001-CERT"}). Entire audit cycle closed.`,
            link: "/external-audit"
          });
        }
      }
    });

    return events;
  }, [externalAuditList]);

  // Combine and sort all events chronologically (newest first)
  const allEvents = useMemo(() => {
    let combined = [];
    if (filterType === "all" || filterType === "internal") {
      combined = combined.concat(internalAuditEvents);
    }
    if (filterType === "all" || filterType === "external") {
      combined = combined.concat(externalAuditEvents);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      combined = combined.filter(
        (e) =>
          e.auditId.toLowerCase().includes(q) ||
          e.auditTitle.toLowerCase().includes(q) ||
          e.action.toLowerCase().includes(q) ||
          e.actor.toLowerCase().includes(q) ||
          e.details.toLowerCase().includes(q) ||
          e.stageLabel.toLowerCase().includes(q)
      );
    }

    // Sort descending by timestamp string
    return combined.sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
  }, [internalAuditEvents, externalAuditEvents, filterType, searchQuery]);

  // Summary counts
  const totalInternal = (auditList || []).length;
  const completedInternal = (auditList || []).filter((a) => a.stage === 7).length;
  const totalExternal = (externalAuditList || []).length;
  const certifiedExternal = (externalAuditList || []).filter((a) => a.stage >= 5).length;

  return (
    <>
      <PageIntro title="Audit Trail" />

      {/* Two Workflow Overview Cards: Internal Quality Audit & External Audit */}
      <div className="overview-cards-grid" style={{ marginBottom: "24px" }}>
        {/* Card 1: Internal Quality Audit (7-Stage Workflow) */}
        <div className="overview-context-card" style={{ borderLeft: "4px solid #16a34a" }}>
          <div className="overview-card-header">
            <div className="overview-card-icon green">
              <ClipboardCheck size={22} />
            </div>
            <div className="overview-card-title-group">
              <h3>Internal Quality Audit Workflow</h3>
            </div>
          </div>
          <div className="overview-card-metric" style={{ fontSize: "13px" }}>
            {totalInternal} <small>IQA Cycles ({completedInternal} Concluded)</small>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", margin: "6px 0 16px 0" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", padding: "3px 8px", borderRadius: "4px", background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }}>
              Stage 1-3: Scheduling & Acceptance
            </span>
            <span style={{ fontSize: "13px", fontWeight: "600", padding: "3px 8px", borderRadius: "4px", background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }}>
              Stage 4-5: Noticing & NCs
            </span>
            <span style={{ fontSize: "13px", fontWeight: "600", padding: "3px 8px", borderRadius: "4px", background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }}>
              Stage 6-7: CAPA & Closure
            </span>
          </div>
          <NavLink
            to="/internal-audit"
            className="secondary-button"
            style={{
              marginTop: "auto",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              fontSize: "13px",
              padding: "7px 12px",
              color: "#166534",
              border: "1px solid #bbf7d0",
              textDecoration: "none"
            }}
          >
            <span>Open Internal Audit Workspace</span>
            <ArrowRight size={13} />
          </NavLink>
        </div>

        {/* Card 2: External Quality Audit (5-Step ISO 9001 Workflow) */}
        <div className="overview-context-card" style={{ borderLeft: "4px solid #0284c7" }}>
          <div className="overview-card-header">
            <div className="overview-card-icon blue">
              <ShieldCheck size={22} />
            </div>
            <div className="overview-card-title-group">
              <h3>External Quality Audit Workflow</h3>
            </div>
          </div>
          <div className="overview-card-metric" style={{ fontSize: "13px" }}>
            {totalExternal} <small>Surveillance Cycles ({certifiedExternal} ISO 9001 Certified)</small>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", margin: "6px 0 16px 0" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", padding: "3px 8px", borderRadius: "4px", background: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe" }}>
              Step 1-2: Email Schedule Dispatched
            </span>
            <span style={{ fontSize: "13px", fontWeight: "600", padding: "3px 8px", borderRadius: "4px", background: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe" }}>
              Step 3-4: Paper NC & CC Closure
            </span>
            <span style={{ fontSize: "13px", fontWeight: "600", padding: "3px 8px", borderRadius: "4px", background: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe" }}>
              Step 5: ISO 9001 Endorsement
            </span>
          </div>
          <NavLink
            to="/external-audit"
            className="secondary-button"
            style={{
              marginTop: "auto",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              fontSize: "13px",
              padding: "7px 12px",
              color: "#1e40af",
              border: "1px solid #bfdbfe",
              textDecoration: "none"
            }}
          >
            <span>Open External Audit Workspace</span>
            <ArrowRight size={13} />
          </NavLink>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="filter-bar" style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", marginBottom: "18px" }}>
        <label className="search-field" style={{ flex: 1, minWidth: "260px" }}>
          <Search size={17} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audit trail by ID, title, action, actor, or details..."
          />
        </label>

        <div className="tabs">
          <button
            className={filterType === "all" ? "tab active" : "tab"}
            onClick={() => setFilterType("all")}
          >
            All Audit Trails ({internalAuditEvents.length + externalAuditEvents.length})
          </button>
          <button
            className={filterType === "internal" ? "tab active" : "tab"}
            onClick={() => setFilterType("internal")}
          >
            Internal Quality Audits ({internalAuditEvents.length})
          </button>
          <button
            className={filterType === "external" ? "tab active" : "tab"}
            onClick={() => setFilterType("external")}
          >
            External Quality Audits ({externalAuditEvents.length})
          </button>
        </div>
      </div>

      {/* Audit Trail Timeline Table */}
      <section className="panel" style={{ margin: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Audit Workflow</th>
                <th>Milestone Stage</th>
                <th>Action & Compliance Details</th>
                <th>Responsible Actor</th>
                <th>Timestamp</th>
                <th>Link</th>
              </tr>
            </thead>
            <tbody>
              {allEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "36px", textAlign: "center", color: "var(--muted)", fontSize: "13.5px" }}>
                    No audit trail workflow records found matching the criteria.
                  </td>
                </tr>
              ) : (
                allEvents.map((event) => {
                  const isInternal = event.auditType === "internal";
                  return (
                    <tr key={event.id}>
                      <td style={{ minWidth: "160px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <span
                            style={{
                              display: "inline-block",
                              width: "fit-content",
                              fontSize: "13px",
                              fontWeight: "700",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              background: isInternal ? "#f0fdf4" : "#eff6ff",
                              color: isInternal ? "#166534" : "#1e40af",
                              border: `1px solid ${isInternal ? "#bbf7d0" : "#bfdbfe"}`
                            }}
                          >
                            {isInternal ? "Internal Audit" : "External Audit"}
                          </span>
                          <strong style={{ fontSize: "13px", color: "var(--ink)" }}>{event.auditId}</strong>
                          <span style={{ fontSize: "11.5px", color: "var(--muted)" }}>{event.auditTitle}</span>
                        </div>
                      </td>

                      <td style={{ minWidth: "160px" }}>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            color: isInternal ? "#15803d" : "#0369a1",
                            background: isInternal ? "#f0fdf4" : "#f0f9ff",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            border: `1px solid ${isInternal ? "#dcfce7" : "#e0f2fe"}`,
                            display: "inline-block"
                          }}
                        >
                          {event.stageLabel}
                        </span>
                      </td>

                      <td style={{ minWidth: "260px" }}>
                        <strong style={{ display: "block", fontSize: "13px", color: "#0f172a", marginBottom: "2px" }}>
                          {event.action}
                        </strong>
                        <p style={{ margin: 0, fontSize: "12px", color: "var(--ink-soft)", lineHeight: 1.45 }}>
                          {event.details}
                        </p>
                      </td>

                      <td style={{ minWidth: "160px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <User size={13} color="var(--muted)" />
                          <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--ink)" }}>
                            {event.actor}
                          </span>
                        </div>
                      </td>

                      <td style={{ minWidth: "140px", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "var(--muted)", fontSize: "12px" }}>
                          <Clock size={12} />
                          <span>{event.timestamp}</span>
                        </div>
                      </td>

                      <td>
                        <NavLink
                          to={event.link}
                          className="row-action"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            textDecoration: "none",
                            fontSize: "12px",
                            fontWeight: "600",
                            color: isInternal ? "#166534" : "#1e40af"
                          }}
                          title="Open full audit record"
                        >
                          <span>Open</span>
                          <ExternalLink size={12} />
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
    </>
  );
}
