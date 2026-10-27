import React, { useState, useMemo } from "react";
import {
  ClipboardCheck,
  Plus,
  Share2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  FileText,
  UserCheck,
  Award,
  Eye,
  Send,
  Download,
  Calendar,
  MapPin,
  Check,
  Users,
  Mail,
  UploadCloud,
  FileDown,
  FileCheck2,
  Paperclip,
  CheckCheck,
  ExternalLink,
  X,
  ChevronRight,
  Sparkles,
  Info,
  Layers,
  ArrowRight
} from "lucide-react";
import { useApp } from "../context/AppContext";
import PageIntro from "../components/common/PageIntro";
import StatCard from "../components/common/StatCard";
import StatusBadge from "../components/common/StatusBadge";
import Modal from "../components/tasks/Modal";

// Helper to determine stage color & label
function getStageInfo(audit) {
  switch (audit.stage) {
    case 6:
      return {
        step: 6,
        statusLabel: "Completed / Closed",
        badgeText: "Audit Completed",
        color: "#166534",
        bg: "#dcfce7",
        border: "#bbf7d0"
      };
    case 5:
      return {
        step: 5,
        statusLabel: "Closed by Auditee",
        badgeText: "Awaiting QMS Final Close",
        color: "#92400e",
        bg: "#fef3c7",
        border: "#fde68a"
      };
    case 4:
      return {
        step: 4,
        statusLabel: "NC Docs Shared",
        badgeText: "Action Required by Auditee",
        color: "#b45309",
        bg: "#fffbeb",
        border: "#fcd34d"
      };
    case 3:
      return {
        step: 3,
        statusLabel: "Noticing Sheet Submitted",
        badgeText: "Awaiting QMS NC Review",
        color: "#6d28d9",
        bg: "#f5f3ff",
        border: "#ddd6fe"
      };
    case 2.5:
      return {
        step: 2.5,
        statusLabel: "Schedule Confirmed",
        badgeText: "Audit In Progress",
        color: "#0369a1",
        bg: "#f0f9ff",
        border: "#bae6fd"
      };
    case 2:
      return {
        step: 2,
        statusLabel: "Schedule Shared",
        badgeText: "Awaiting Trust Head Confirmation",
        color: "#1d4ed8",
        bg: "#eff6ff",
        border: "#bfdbfe"
      };
    case 1:
    default:
      return {
        step: 1,
        statusLabel: "Draft Scheduled",
        badgeText: "Ready to Share Schedule",
        color: "#475569",
        bg: "#f1f5f9",
        border: "#cbd5e1"
      };
  }
}

export default function InternalAudit() {
  const {
    currentUser,
    auditList = [],
    scheduleAudit,
    shareAuditSchedule,
    confirmAuditSchedule,
    submitNoticingSheet,
    shareNCDocs,
    submitAuditeeClosure,
    finalCloseAudit
  } = useApp();

  // Active role testing override (defaults to current user role)
  const [effectiveRole, setEffectiveRole] = useState(() => {
    return currentUser?.role || "qm";
  });

  const isQMS = effectiveRole === "qm";
  const isTrustHead = effectiveRole === "Head";
  const isAuditor = effectiveRole === "auditor";
  const isAuditee = effectiveRole === "owner";

  // Tab & search states
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Modals state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(null);
  const [showNoticingSheetModal, setShowNoticingSheetModal] = useState(null);
  const [showNCDocsModal, setShowNCDocsModal] = useState(null);
  const [showAuditeeCloseModal, setShowAuditeeCloseModal] = useState(null);
  const [showFinalCloseModal, setShowFinalCloseModal] = useState(null);
  const [viewingAudit, setViewingAudit] = useState(null);

  // Form states
  const [scheduleForm, setScheduleForm] = useState({
    title: "",
    process: "Course Management",
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    auditorName: "Vikas Deshmukh",
    auditorRole: "Internal Auditor",
    auditorDept: "Internal Quality Audit Cell",
    auditeeName: "Priya Sharma",
    auditeeRole: "Course Coordinator",
    auditeeDept: "Academic Division",
    venue: "Academic Block - Room 204 & QMS Portal",
    scope: "Verification of course delivery milestones, syllabus progress tracking, laboratory sessions, and compliance with ISO 9001:2015 Clause 8.5.",
    notes: ""
  });

  const [confirmRemarks, setConfirmRemarks] = useState(
    "Audit plan and dates verified. Approved for execution across Academic Division."
  );

  const [noticingSheetForm, setNoticingSheetForm] = useState({
    sheetNo: `NS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    summary: "Audit completed successfully. Identified minor non-conformance regarding logbook maintenance.",
    findingsCount: "1",
    ncDescription: "Weekly practical lab attendance and syllabus delivery logbook was not signed by the Course Coordinator for weeks 4 and 5.",
    clause: "ISO 9001:2015 Clause 8.5.1",
    targetDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    fileName: "Noticing_Sheet_Signed.pdf"
  });

  const [ncDocsForm, setNcDocsForm] = useState({
    fileName: "NC_Formal_Notice_IQA.pdf",
    remarks: "Noticing Sheet reviewed and validated. Formal Non-Conformance Notice issued. Auditee requested to submit Root Cause Analysis and Corrective Action Plan."
  });

  const [auditeeCloseForm, setAuditeeCloseForm] = useState({
    rootCause: "Manual paper sign-off workflow was delayed due to mid-semester exams and faculty travel schedule.",
    correctiveAction: "All pending logbook entries for weeks 4 and 5 have been verified and signed off. Implemented weekly digital attendance sign-off reminder on ERP portal.",
    evidenceFileName: "Signed_Lab_Logbooks_Evidence.pdf",
    remarks: "Corrective actions completed. Evidence verified and submitted for QMS final sign-off."
  });

  const [finalCloseRemarks, setFinalCloseRemarks] = useState(
    "All corrective action evidences thoroughly reviewed, verified with process logs, and found fully conforming with ISO 9001:2015. Audit officially closed."
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Show transient feedback toast
  const triggerToast = (msg, type = "success") => {
    setFeedbackMsg({ text: msg, type });
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  // Pre-calculated stats
  const stats = useMemo(() => {
    const total = auditList.length;
    const completed = auditList.filter((a) => a.stage === 6).length;
    const inProgress = auditList.filter((a) => a.stage > 1 && a.stage < 6).length;
    const scheduled = auditList.filter((a) => a.stage === 1).length;
    return { total, completed, inProgress, scheduled };
  }, [auditList]);

  // Filtered audits
  const filteredAudits = useMemo(() => {
    return auditList.filter((audit) => {
      // Tab filter
      if (activeTab === "pending_action") {
        if (isQMS && (audit.stage === 1 || audit.stage === 3 || audit.stage === 5)) return true;
        if (isTrustHead && audit.stage === 2) return true;
        if (isAuditor && audit.stage === 2.5) return true;
        if (isAuditee && audit.stage === 4) return true;
        return false;
      }
      if (activeTab === "in_progress" && (audit.stage < 2 || audit.stage >= 6)) return false;
      if (activeTab === "completed" && audit.stage !== 6) return false;

      // Search term filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchTitle = audit.title?.toLowerCase().includes(query);
        const matchId = audit.id?.toLowerCase().includes(query);
        const matchProcess = audit.process?.toLowerCase().includes(query);
        const matchAuditor = audit.internalAuditor?.name?.toLowerCase().includes(query);
        const matchAuditee = audit.internalAuditee?.name?.toLowerCase().includes(query);
        return matchTitle || matchId || matchProcess || matchAuditor || matchAuditee;
      }
      return true;
    });
  }, [auditList, activeTab, searchTerm, isQMS, isTrustHead, isAuditor, isAuditee]);

  // Handlers
  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        title: scheduleForm.title || `${scheduleForm.process} Internal Quality Audit`,
        process: scheduleForm.process,
        startDate: scheduleForm.startDate,
        endDate: scheduleForm.endDate,
        internalAuditor: {
          id: "IA001",
          name: scheduleForm.auditorName,
          role: scheduleForm.auditorRole,
          department: scheduleForm.auditorDept,
          email: `${scheduleForm.auditorName.toLowerCase().replace(/\s+/g, ".")}@cdac.in`
        },
        internalAuditee: {
          id: "CC001",
          name: scheduleForm.auditeeName,
          role: scheduleForm.auditeeRole,
          department: scheduleForm.auditeeDept,
          email: `${scheduleForm.auditeeName.toLowerCase().replace(/\s+/g, ".")}@cdac.in`
        },
        venue: scheduleForm.venue,
        scope: scheduleForm.scope,
        notes: scheduleForm.notes,
        scheduledBy: {
          name: currentUser?.name || "Rahul Kumar",
          role: currentUser?.roleTitle || "QMS Coordinator"
        }
      };

      const created = await scheduleAudit(payload);
      setShowScheduleModal(false);
      triggerToast(`Internal Audit ${created?.id || ""} scheduled! You can now share the schedule docs.`);
    } catch (err) {
      triggerToast(err.message || "Failed to schedule audit", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShareSchedule = async (audit) => {
    setIsSubmitting(true);
    try {
      await shareAuditSchedule(audit.id);
      setShowShareModal(null);
      triggerToast(
        `Schedule for ${audit.id} successfully shared to Course Coordinator (${audit.internalAuditee.name}), Trust Head, and Internal Auditor (${audit.internalAuditor.name})!`
      );
    } catch (err) {
      triggerToast(err.message || "Failed to share schedule", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSchedule = async (audit) => {
    setIsSubmitting(true);
    try {
      await confirmAuditSchedule(audit.id, confirmRemarks);
      setShowConfirmModal(null);
      triggerToast(`Schedule for ${audit.id} confirmed by Trust Head! Internal Auditor can now proceed.`);
    } catch (err) {
      triggerToast(err.message || "Failed to confirm schedule", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitNoticingSheet = async (audit) => {
    setIsSubmitting(true);
    try {
      const payload = {
        sheetNo: noticingSheetForm.sheetNo,
        summary: noticingSheetForm.summary,
        fileName: noticingSheetForm.fileName,
        submittedBy: `${currentUser?.name || audit.internalAuditor.name} (Internal Auditor)`,
        findings: [
          {
            id: "NC-01",
            type: "Minor NC",
            clause: noticingSheetForm.clause,
            description: noticingSheetForm.ncDescription,
            targetDate: noticingSheetForm.targetDate
          }
        ]
      };
      await submitNoticingSheet(audit.id, payload);
      setShowNoticingSheetModal(null);
      triggerToast(`Noticing Sheet (${payload.sheetNo}) shared with QMS Coordinator for review!`);
    } catch (err) {
      triggerToast(err.message || "Failed to submit noticing sheet", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShareNCDocs = async (audit) => {
    setIsSubmitting(true);
    try {
      await shareNCDocs(audit.id, ncDocsForm);
      setShowNCDocsModal(null);
      triggerToast(`NC Docs for ${audit.id} reviewed and shared to Internal Auditor & Auditee!`);
    } catch (err) {
      triggerToast(err.message || "Failed to share NC docs", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAuditeeClose = async (audit) => {
    setIsSubmitting(true);
    try {
      const payload = {
        rootCause: auditeeCloseForm.rootCause,
        correctiveAction: auditeeCloseForm.correctiveAction,
        evidenceFileName: auditeeCloseForm.evidenceFileName,
        remarks: auditeeCloseForm.remarks,
        closedBy: `${currentUser?.name || audit.internalAuditee.name} (Course Coordinator)`
      };
      await submitAuditeeClosure(audit.id, payload);
      setShowAuditeeCloseModal(null);
      triggerToast(`Auditee closure & evidence submitted for ${audit.id}! Awaiting QMS Coordinator final closure.`);
    } catch (err) {
      triggerToast(err.message || "Failed to submit auditee closure", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalClose = async (audit) => {
    setIsSubmitting(true);
    try {
      await finalCloseAudit(audit.id, finalCloseRemarks);
      setShowFinalCloseModal(null);
      triggerToast(`Internal Audit ${audit.id} officially closed! Entire audit process is completed.`);
    } catch (err) {
      triggerToast(err.message || "Failed to close audit", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container internal-audit-page">
      {/* Toast Notification */}
      {feedbackMsg && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "24px",
            zIndex: 9999,
            padding: "12px 18px",
            borderRadius: "8px",
            background: feedbackMsg.type === "error" ? "#ef4444" : "#166534",
            color: "#ffffff",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "14px",
            fontWeight: "600",
            animation: "slideDown 0.3s ease"
          }}
        >
          {feedbackMsg.type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{feedbackMsg.text}</span>
          <button
            onClick={() => setFeedbackMsg(null)}
            style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer" }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Header & Page Intro */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "16px" }}>
        <PageIntro
          title="Internal Quality Audit (IQA)"
          description="ISO 9001:2015 Clause 9.2 compliant audit lifecycle management: schedule, trust head confirmation, noticing sheet audit findings, NC document distribution, auditee CAPA closure, and final QMS sign-off."
        />

        {/* Schedule Auditing Button (for QMS Coordinator) */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            className="primary-button btn-blue"
            onClick={() => setShowScheduleModal(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 18px" }}
          >
            <Plus size={18} />
            <span>Schedule Auditing</span>
          </button>
        </div>
      </div>

      {/* Role Testing Bar */}
      <div
        style={{
          background: "linear-gradient(135deg, #0b3457 0%, #041c30 100%)",
          borderRadius: "10px",
          padding: "14px 18px",
          color: "#ffffff",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          boxShadow: "0 4px 14px rgba(4, 28, 48, 0.15)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <ShieldCheck size={20} color="#79b4e4" />
          <div>
            <div style={{ fontSize: "14px", fontWeight: "700", letterSpacing: "0.2px" }}>
              Active Audit Role View: <span style={{ color: "#79b4e4" }}>
                {effectiveRole === "qm" && "QMS Coordinator (Plan, Review & Final Close)"}
                {effectiveRole === "Head" && "Trust Head (Schedule Confirmation)"}
                {effectiveRole === "auditor" && "Internal Auditor (Conduct Audit & Noticing Sheet)"}
                {effectiveRole === "owner" && "Course Coordinator / Auditee (CAPA & Auditee Close)"}
              </span>
            </div>
            <div style={{ fontSize: "12px", color: "#cbd5e1" }}>
              Switch perspectives below to test each action in the 6-stage audit lifecycle:
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {[
            { role: "qm", label: "QMS Coordinator" },
            { role: "Head", label: "Trust Head" },
            { role: "auditor", label: "Internal Auditor" },
            { role: "owner", label: "Course Coordinator (Auditee)" }
          ].map((r) => (
            <button
              key={r.role}
              onClick={() => setEffectiveRole(r.role)}
              style={{
                fontSize: "12px",
                fontWeight: "600",
                padding: "6px 12px",
                borderRadius: "6px",
                border: effectiveRole === r.role ? "1px solid #79b4e4" : "1px solid rgba(255,255,255,0.2)",
                background: effectiveRole === r.role ? "rgba(121, 180, 228, 0.2)" : "rgba(255,255,255,0.05)",
                color: effectiveRole === r.role ? "#79b4e4" : "#e2e8f0",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              {effectiveRole === r.role && <Check size={12} style={{ display: "inline", marginRight: "4px" }} />}
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* 6-Step Workflow Guide Banner */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          padding: "16px 20px",
          marginBottom: "22px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <strong style={{ fontSize: "13px", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
            <Layers size={16} color="var(--navy)" />
            Standard 6-Stage Internal Quality Audit Lifecycle
          </strong>
          <span style={{ fontSize: "11px", color: "#64748b", background: "#f8fafc", padding: "3px 8px", borderRadius: "4px" }}>
            ISO 9001:2015 Clause 9.2
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "10px" }}>
          {[
            { step: "1", title: "Schedule Auditing", role: "QMS Coordinator", desc: "Select dates, process, auditor & auditee" },
            { step: "2", title: "Share Schedule", role: "QMS Coordinator", desc: "Dispatched to Auditee, Head & Auditor" },
            { step: "3", title: "Confirm Schedule", role: "Trust Head", desc: "Authorizes and ratifies audit schedule" },
            { step: "4", title: "Noticing Sheet", role: "Internal Auditor", desc: "Uploads audit findings & NC observations" },
            { step: "5", title: "NC Docs Shared", role: "QMS Coordinator", desc: "Communicates official NCs to Auditee" },
            { step: "6", title: "Auditee & Final Close", role: "Auditee & QMS", desc: "Auditee closes CAPA -> QMS final close completes process" }
          ].map((st, i) => (
            <div
              key={st.step}
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                position: "relative"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--navy)", background: "#e0f2fe", width: "20px", height: "20px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {st.step}
                </span>
                <span style={{ fontSize: "10px", color: "#64748b", fontWeight: "600" }}>{st.role}</span>
              </div>
              <strong style={{ fontSize: "12px", color: "#0f172a", marginTop: "2px" }}>{st.title}</strong>
              <span style={{ fontSize: "11px", color: "#64748b", lineHeight: "1.3" }}>{st.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "16px", marginBottom: "22px" }}>
        <StatCard title="Total Audits" value={stats.total} icon={ClipboardCheck} variant="default" subtitle="Logged in registry" />
        <StatCard title="Audit In Progress" value={stats.inProgress} icon={Clock} variant="amber" subtitle="Active field reviews" />
        <StatCard title="Scheduled / Pending" value={stats.scheduled} icon={Calendar} variant="blue" subtitle="Awaiting sharing" />
        <StatCard title="Closed & Completed" value={stats.completed} icon={CheckCircle2} variant="green" subtitle="100% rectified & closed" />
      </div>

      {/* Tab Filter & Search */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {[
            { key: "all", label: `All Audits (${stats.total})` },
            { key: "pending_action", label: "Action Required by Me" },
            { key: "in_progress", label: `In Progress (${stats.inProgress})` },
            { key: "completed", label: `Closed (${stats.completed})` }
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                padding: "8px 14px",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                border: activeTab === t.key ? "1px solid var(--navy)" : "1px solid #cbd5e1",
                background: activeTab === t.key ? "var(--navy)" : "#ffffff",
                color: activeTab === t.key ? "#ffffff" : "#475569",
                transition: "all 0.15s ease"
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ position: "relative", minWidth: "260px" }}>
          <input
            type="text"
            placeholder="Search by ID, process, auditor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              paddingLeft: "32px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              fontSize: "13px"
            }}
          />
          <span style={{ position: "absolute", left: "10px", top: "9px", color: "#94a3b8" }}>🔍</span>
        </div>
      </div>

      {/* Audit List Table / Cards */}
      <div style={{ background: "#ffffff", borderRadius: "10px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: "600" }}>
                <th style={{ padding: "12px 16px" }}>Audit Ref & Title</th>
                <th style={{ padding: "12px 16px" }}>Process</th>
                <th style={{ padding: "12px 16px" }}>Audit Dates</th>
                <th style={{ padding: "12px 16px" }}>Auditor & Auditee</th>
                <th style={{ padding: "12px 16px" }}>Lifecycle Stage</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAudits.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "36px", textAlign: "center", color: "#64748b" }}>
                    No audits found matching the selected filter or search term.
                  </td>
                </tr>
              ) : (
                filteredAudits.map((audit) => {
                  const stageInfo = getStageInfo(audit);

                  // Determine available primary action for the active role
                  let primaryAction = null;

                  if (audit.stage === 1 && isQMS) {
                    primaryAction = {
                      label: "Share Schedule",
                      icon: Share2,
                      btnClass: "primary-button btn-blue",
                      onClick: () => setShowShareModal(audit)
                    };
                  } else if (audit.stage === 2 && (isTrustHead || isQMS)) {
                    primaryAction = {
                      label: "Confirm Schedule",
                      icon: Award,
                      btnClass: "primary-button btn-green",
                      onClick: () => setShowConfirmModal(audit)
                    };
                  } else if (audit.stage === 2.5 && (isAuditor || isQMS)) {
                    primaryAction = {
                      label: "Submit Noticing Sheet",
                      icon: FileCheck2,
                      btnClass: "primary-button btn-blue",
                      onClick: () => setShowNoticingSheetModal(audit)
                    };
                  } else if (audit.stage === 3 && isQMS) {
                    primaryAction = {
                      label: "Review & Share NC Docs",
                      icon: Send,
                      btnClass: "primary-button btn-blue",
                      onClick: () => setShowNCDocsModal(audit)
                    };
                  } else if (audit.stage === 4 && (isAuditee || isQMS)) {
                    primaryAction = {
                      label: "Submit Auditee Closure",
                      icon: UploadCloud,
                      btnClass: "primary-button btn-green",
                      onClick: () => setShowAuditeeCloseModal(audit)
                    };
                  } else if (audit.stage === 5 && isQMS) {
                    primaryAction = {
                      label: "Final Close Audit",
                      icon: CheckCheck,
                      btnClass: "primary-button btn-green",
                      onClick: () => setShowFinalCloseModal(audit)
                    };
                  }

                  return (
                    <tr
                      key={audit.id}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background 0.15s ease"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* 1. Audit Ref & Title */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontWeight: "700",
                              fontSize: "12px",
                              color: "var(--navy)",
                              background: "#edf4fa",
                              padding: "2px 7px",
                              borderRadius: "4px"
                            }}
                          >
                            {audit.id}
                          </span>
                        </div>
                        <strong style={{ display: "block", color: "#0f172a", marginTop: "4px", fontSize: "13px" }}>
                          {audit.title}
                        </strong>
                        <span style={{ fontSize: "11px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                          <MapPin size={11} /> {audit.venue || "Academic Campus"}
                        </span>
                      </td>

                      {/* 2. Process */}
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            fontWeight: "600",
                            color: "#1e293b",
                            background: "#f1f5f9",
                            padding: "4px 9px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            display: "inline-block"
                          }}
                        >
                          {audit.process}
                        </span>
                      </td>

                      {/* 3. Dates */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#334155", fontWeight: "500" }}>
                          <Calendar size={13} color="#64748b" />
                          <span>{audit.scheduledDate}</span>
                        </div>
                      </td>

                      {/* 4. Auditor & Auditee */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontSize: "12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#0f172a" }}>
                            <span style={{ color: "#64748b", fontWeight: "600" }}>Auditor:</span>
                            <span style={{ fontWeight: "600" }}>{audit.internalAuditor?.name}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#0f172a", marginTop: "3px" }}>
                            <span style={{ color: "#64748b", fontWeight: "600" }}>Auditee:</span>
                            <span style={{ fontWeight: "600" }}>{audit.internalAuditee?.name}</span>
                          </div>
                        </div>
                      </td>

                      {/* 5. Stage Badge */}
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "4px 9px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            color: stageInfo.color,
                            background: stageInfo.bg,
                            border: `1px solid ${stageInfo.border}`
                          }}
                        >
                          {audit.stage === 6 ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                          Stage {audit.stage}/6: {stageInfo.badgeText}
                        </span>
                      </td>

                      {/* 6. Actions */}
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                          {primaryAction && (
                            <button
                              type="button"
                              className={primaryAction.btnClass}
                              onClick={primaryAction.onClick}
                              style={{
                                padding: "6px 12px",
                                fontSize: "12px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px"
                              }}
                            >
                              <primaryAction.icon size={13} />
                              <span>{primaryAction.label}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => setViewingAudit(audit)}
                            style={{ padding: "6px 10px", fontSize: "12px" }}
                            title="View Full Audit Details & History"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          MODAL 1: SCHEDULE AUDITING MODAL (QMS Coordinator)
          Contains: Dates, Process, Internal Auditor, Internal Auditee, Submit Button
          ========================================================================= */}
      {showScheduleModal && (
        <Modal
          title="Schedule Internal Quality Audit (IQA)"
          onClose={() => setShowScheduleModal(false)}
        >
          <form onSubmit={handleCreateSchedule}>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ padding: "10px", background: "#f0f9ff", borderRadius: "6px", border: "1px solid #bae6fd", fontSize: "12px", color: "#0369a1", display: "flex", alignItems: "center", gap: "6px" }}>
                <Info size={16} />
                <span>
                  As QMS Coordinator, define the audit dates, process scope, and assign the Internal Auditor and Auditee. Once scheduled, you can share the schedule documents.
                </span>
              </div>

              {/* 1. Dates (Start & End) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label>
                  <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                    Audit Start Date <span style={{ color: "#ef4444" }}>*</span>
                  </span>
                  <input
                    type="date"
                    required
                    value={scheduleForm.startDate}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, startDate: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </label>

                <label>
                  <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                    Audit End Date <span style={{ color: "#ef4444" }}>*</span>
                  </span>
                  <input
                    type="date"
                    required
                    value={scheduleForm.endDate}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, endDate: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </label>
              </div>

              {/* 2. Process */}
              <label>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  Process to be Audited <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <select
                  value={scheduleForm.process}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, process: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#fff" }}
                >
                  <option value="Course Management">Course Management (Academic Delivery & Syllabus)</option>
                  <option value="Admissions & Enrollment">Admissions & Enrollment (Eligibility & Registration)</option>
                  <option value="Examination & Evaluation">Examination & Evaluation (Moderation & Marks Tabulation)</option>
                  <option value="Curriculum Design & Review">Curriculum Design & Review (Industry Advisory Board)</option>
                  <option value="Student Feedback & Continual Improvement">Student Feedback & Continual Improvement</option>
                  <option value="Faculty Development">Faculty Development & Competency</option>
                  <option value="Infrastructure & IT Services">Infrastructure & IT Services</option>
                </select>
              </label>

              {/* 3. Internal Auditor */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label>
                  <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                    Internal Auditor Name <span style={{ color: "#ef4444" }}>*</span>
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikas Deshmukh"
                    value={scheduleForm.auditorName}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, auditorName: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </label>

                <label>
                  <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                    Auditor Department
                  </span>
                  <input
                    type="text"
                    value={scheduleForm.auditorDept}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, auditorDept: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </label>
              </div>

              {/* 4. Internal Auditee */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label>
                  <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                    Internal Auditee (Course Coordinator) <span style={{ color: "#ef4444" }}>*</span>
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={scheduleForm.auditeeName}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, auditeeName: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </label>

                <label>
                  <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                    Auditee Department
                  </span>
                  <input
                    type="text"
                    value={scheduleForm.auditeeDept}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, auditeeDept: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </label>
              </div>

              {/* Scope & Venue */}
              <label>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  Audit Scope & ISO Clause Criteria
                </span>
                <textarea
                  rows={2}
                  value={scheduleForm.scope}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, scope: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowScheduleModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button btn-blue"
                  disabled={
                    isSubmitting ||
                    !scheduleForm.startDate ||
                    !scheduleForm.endDate ||
                    !scheduleForm.process ||
                    !scheduleForm.auditorName.trim() ||
                    !scheduleForm.auditeeName.trim()
                  }
                >
                  <Calendar size={15} />
                  <span>{isSubmitting ? "Scheduling..." : "Submit Audit Schedule"}</span>
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* =========================================================================
          MODAL 2: SHARE SCHEDULE TO AUDITEE, TRUST HEAD & AUDITOR
          ========================================================================= */}
      {showShareModal && (
        <Modal
          title={`Share Schedule Documents: ${showShareModal.id}`}
          onClose={() => setShowShareModal(null)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ padding: "12px", background: "#f0fdf4", borderRadius: "6px", border: "1px solid #bbf7d0", fontSize: "13px", color: "#166534" }}>
              <strong>Official Dispatch Preview:</strong>
              <div style={{ marginTop: "4px" }}>
                This will share the scheduled audit notification and timetable to:
                <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>
                  <li><strong>Course Coordinator (Auditee):</strong> {showShareModal.internalAuditee?.name} (<code>{showShareModal.internalAuditee?.email}</code>)</li>
                  <li><strong>Trust Head:</strong> Anita Rao (<code>trusthead@cdac.in</code>)</li>
                  <li><strong>Internal Auditor:</strong> {showShareModal.internalAuditor?.name} (<code>{showShareModal.internalAuditor?.email}</code>)</li>
                </ul>
              </div>
            </div>

            <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "12px" }}>
              <div><strong>Audit Title:</strong> {showShareModal.title}</div>
              <div><strong>Process:</strong> {showShareModal.process}</div>
              <div><strong>Scheduled Dates:</strong> {showShareModal.scheduledDate}</div>
              <div><strong>Venue:</strong> {showShareModal.venue}</div>
              <div><strong>Attached File:</strong> <code>Internal_Audit_Schedule_{showShareModal.id}.pdf</code></div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowShareModal(null)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button btn-blue"
                onClick={() => handleShareSchedule(showShareModal)}
                disabled={isSubmitting}
              >
                <Share2 size={15} />
                <span>{isSubmitting ? "Sharing..." : "Confirm & Share Schedule"}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* =========================================================================
          MODAL 3: TRUST HEAD CONFIRM SCHEDULE
          ========================================================================= */}
      {showConfirmModal && (
        <Modal
          title={`Trust Head - Confirm Audit Schedule: ${showConfirmModal.id}`}
          onClose={() => setShowConfirmModal(null)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ padding: "12px", background: "#f0f9ff", borderRadius: "6px", border: "1px solid #bae6fd", fontSize: "13px", color: "#0369a1" }}>
              <strong>Executive Ratification:</strong>
              <div style={{ marginTop: "4px" }}>
                As Trust Head, confirm the scheduled dates and scope for <strong>{showConfirmModal.process}</strong>. Once confirmed, the Internal Auditor is authorized to initiate field review.
              </div>
            </div>

            <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "12px" }}>
              <div><strong>Scheduled Dates:</strong> {showConfirmModal.scheduledDate}</div>
              <div><strong>Auditor:</strong> {showConfirmModal.internalAuditor?.name}</div>
              <div><strong>Auditee:</strong> {showConfirmModal.internalAuditee?.name}</div>
            </div>

            <label>
              <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                Trust Head Remarks / Authorization Notes
              </span>
              <textarea
                rows={3}
                value={confirmRemarks}
                onChange={(e) => setConfirmRemarks(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
              />
            </label>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowConfirmModal(null)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button btn-green"
                onClick={() => handleConfirmSchedule(showConfirmModal)}
                disabled={isSubmitting}
              >
                <Award size={15} />
                <span>{isSubmitting ? "Confirming..." : "Confirm & Authorize Schedule"}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* =========================================================================
          MODAL 4: INTERNAL AUDITOR SUBMIT NOTICING SHEET TO QMS COORDINATOR
          ========================================================================= */}
      {showNoticingSheetModal && (
        <Modal
          title={`Internal Auditor: Submit Noticing Sheet for ${showNoticingSheetModal.id}`}
          onClose={() => setShowNoticingSheetModal(null)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ padding: "10px", background: "#f5f3ff", borderRadius: "6px", border: "1px solid #ddd6fe", fontSize: "12px", color: "#6d28d9" }}>
              Auditing has concluded for <strong>{showNoticingSheetModal.process}</strong>. Fill the audit findings and upload the signed Noticing Sheet to dispatch to the QMS Coordinator.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  Noticing Sheet Ref No. <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <input
                  type="text"
                  required
                  value={noticingSheetForm.sheetNo}
                  onChange={(e) => setNoticingSheetForm({ ...noticingSheetForm, sheetNo: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </label>

              <label>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  ISO 9001 Clause Reference
                </span>
                <input
                  type="text"
                  value={noticingSheetForm.clause}
                  onChange={(e) => setNoticingSheetForm({ ...noticingSheetForm, clause: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </label>
            </div>

            <label>
              <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                Audit Observations Summary
              </span>
              <textarea
                rows={2}
                value={noticingSheetForm.summary}
                onChange={(e) => setNoticingSheetForm({ ...noticingSheetForm, summary: e.target.value })}
                style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
            </label>

            <label>
              <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                Non-Conformance (NC) Finding Description <span style={{ color: "#ef4444" }}>*</span>
              </span>
              <textarea
                rows={2}
                required
                value={noticingSheetForm.ncDescription}
                onChange={(e) => setNoticingSheetForm({ ...noticingSheetForm, ncDescription: e.target.value })}
                style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  Target Resolution Date
                </span>
                <input
                  type="date"
                  value={noticingSheetForm.targetDate}
                  onChange={(e) => setNoticingSheetForm({ ...noticingSheetForm, targetDate: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </label>

              <label>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  Noticing Sheet Document File
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="text"
                    readOnly
                    value={noticingSheetForm.fileName}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#f8fafc" }}
                  />
                </div>
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowNoticingSheetModal(null)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button btn-blue"
                onClick={() => handleSubmitNoticingSheet(showNoticingSheetModal)}
                disabled={isSubmitting || !noticingSheetForm.ncDescription.trim()}
              >
                <FileCheck2 size={15} />
                <span>{isSubmitting ? "Submitting..." : "Share Noticing Sheet to QMS"}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* =========================================================================
          MODAL 5: QMS COORDINATOR REVIEW & SHARE NC DOCS TO AUDITOR & AUDITEE
          ========================================================================= */}
      {showNCDocsModal && (
        <Modal
          title={`QMS Coordinator: Review & Share NC Docs for ${showNCDocsModal.id}`}
          onClose={() => setShowNCDocsModal(null)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ padding: "12px", background: "#fffbeb", borderRadius: "6px", border: "1px solid #fcd34d", fontSize: "12px", color: "#92400e" }}>
              <strong>Noticing Sheet Observations Received from Auditor:</strong>
              <div style={{ marginTop: "4px", color: "#78350f" }}>
                {showNCDocsModal.noticingSheet?.summary}
              </div>
              <div style={{ marginTop: "6px", fontWeight: "600" }}>
                Finding: {showNCDocsModal.noticingSheet?.findings?.[0]?.description}
              </div>
            </div>

            <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "12px" }}>
              <div><strong>Auditor:</strong> {showNCDocsModal.internalAuditor?.name}</div>
              <div><strong>Auditee to Rectify:</strong> {showNCDocsModal.internalAuditee?.name} (Course Coordinator)</div>
              <div><strong>Document:</strong> <code>{ncDocsForm.fileName}</code></div>
            </div>

            <label>
              <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                QMS Formal NC Directive & CAPA Timeline Remarks
              </span>
              <textarea
                rows={3}
                value={ncDocsForm.remarks}
                onChange={(e) => setNcDocsForm({ ...ncDocsForm, remarks: e.target.value })}
                style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
              />
            </label>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowNCDocsModal(null)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button btn-blue"
                onClick={() => handleShareNCDocs(showNCDocsModal)}
                disabled={isSubmitting}
              >
                <Send size={15} />
                <span>{isSubmitting ? "Sharing..." : "Share NC Docs to Auditor & Auditee"}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* =========================================================================
          MODAL 6: AUDITEE CLOSE (COURSE COORDINATOR)
          ========================================================================= */}
      {showAuditeeCloseModal && (
        <Modal
          title={`Auditee: Submit Corrective Action & Close NC for ${showAuditeeCloseModal.id}`}
          onClose={() => setShowAuditeeCloseModal(null)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ padding: "10px", background: "#fef3c7", borderRadius: "6px", border: "1px solid #fde68a", fontSize: "12px", color: "#92400e" }}>
              <strong>Non-Conformance to Resolve:</strong>
              <div style={{ marginTop: "4px" }}>
                {showAuditeeCloseModal.noticingSheet?.findings?.[0]?.description || "Documentation record signature gap."}
              </div>
            </div>

            <label>
              <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                Root Cause Analysis (Why did this occur?) <span style={{ color: "#ef4444" }}>*</span>
              </span>
              <textarea
                rows={2}
                required
                value={auditeeCloseForm.rootCause}
                onChange={(e) => setAuditeeCloseForm({ ...auditeeCloseForm, rootCause: e.target.value })}
                style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
            </label>

            <label>
              <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                Corrective Action Taken & Prevention Plan <span style={{ color: "#ef4444" }}>*</span>
              </span>
              <textarea
                rows={3}
                required
                value={auditeeCloseForm.correctiveAction}
                onChange={(e) => setAuditeeCloseForm({ ...auditeeCloseForm, correctiveAction: e.target.value })}
                style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
            </label>

            <label>
              <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                Evidence File Attached
              </span>
              <input
                type="text"
                readOnly
                value={auditeeCloseForm.evidenceFileName}
                style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#f8fafc", fontSize: "12px" }}
              />
            </label>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowAuditeeCloseModal(null)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button btn-green"
                onClick={() => handleSubmitAuditeeClose(showAuditeeCloseModal)}
                disabled={isSubmitting || !auditeeCloseForm.correctiveAction.trim()}
              >
                <CheckCircle2 size={15} />
                <span>{isSubmitting ? "Submitting..." : "Submit Auditee Closure"}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* =========================================================================
          MODAL 7: QMS COORDINATOR FINAL CLOSE (Entire Process Completed)
          ========================================================================= */}
      {showFinalCloseModal && (
        <Modal
          title={`QMS Coordinator: Final Close for ${showFinalCloseModal.id}`}
          onClose={() => setShowFinalCloseModal(null)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ padding: "12px", background: "#ecfdf5", borderRadius: "6px", border: "1px solid #a7f3d0", fontSize: "13px", color: "#065f46" }}>
              <strong>Final Process Completion:</strong>
              <div style={{ marginTop: "4px" }}>
                The Auditee has submitted the corrective action and evidence. Closing this audit will complete the entire ISO 9001:2015 audit lifecycle and mark the record as <strong>Closed & Certified</strong>.
              </div>
            </div>

            <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "12px" }}>
              <div><strong>Auditee Corrective Action:</strong> {showFinalCloseModal.auditeeClosure?.correctiveAction}</div>
              <div style={{ marginTop: "4px" }}><strong>Evidence:</strong> <code>{showFinalCloseModal.auditeeClosure?.evidenceFileName}</code></div>
              <div style={{ marginTop: "4px" }}><strong>Submitted By:</strong> {showFinalCloseModal.auditeeClosure?.closedBy} on {showFinalCloseModal.auditeeClosure?.closedAt}</div>
            </div>

            <label>
              <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                Final QMS Verification & Closure Sign-off Remarks
              </span>
              <textarea
                rows={3}
                value={finalCloseRemarks}
                onChange={(e) => setFinalCloseRemarks(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
              />
            </label>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowFinalCloseModal(null)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button btn-green"
                onClick={() => handleFinalClose(showFinalCloseModal)}
                disabled={isSubmitting}
              >
                <CheckCheck size={16} />
                <span>{isSubmitting ? "Closing..." : "Close Entire Audit Process"}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* =========================================================================
          VIEW AUDIT DETAILS & AUDIT TRAIL MODAL
          ========================================================================= */}
      {viewingAudit && (
        <Modal
          title={`Audit Record: ${viewingAudit.id} - ${viewingAudit.process}`}
          onClose={() => setViewingAudit(null)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "75vh", overflowY: "auto", paddingRight: "4px" }}>
            {/* Header info */}
            <div style={{ padding: "14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                <div>
                  <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", color: "var(--navy)" }}>{viewingAudit.title}</h3>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    Audit Reference: <strong>{viewingAudit.id}</strong> | Process: <strong>{viewingAudit.process}</strong>
                  </div>
                </div>
                <a
                  href={`/api/audit/${viewingAudit.id}/download/full`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    background: "var(--navy)",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: "600",
                    textDecoration: "none"
                  }}
                >
                  <Download size={13} />
                  <span>Download Report</span>
                </a>
              </div>
            </div>

            {/* Stepper Status */}
            <div>
              <strong style={{ fontSize: "13px", color: "#0f172a", display: "block", marginBottom: "8px" }}>
                Audit Stage Progression (Stage {viewingAudit.stage}/6)
              </strong>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "6px" }}>
                {[
                  { n: 1, label: "Scheduled" },
                  { n: 2, label: "Shared" },
                  { n: 2.5, label: "Confirmed" },
                  { n: 3, label: "Noticing Sheet" },
                  { n: 4, label: "NC Docs" },
                  { n: 6, label: "Closed" }
                ].map((s, idx) => {
                  const isDone = viewingAudit.stage >= (s.n === 2.5 ? 2.5 : s.n);
                  return (
                    <div
                      key={idx}
                      style={{
                        padding: "6px",
                        textAlign: "center",
                        borderRadius: "6px",
                        background: isDone ? "#dcfce7" : "#f1f5f9",
                        border: isDone ? "1px solid #86efac" : "1px solid #cbd5e1",
                        fontSize: "11px",
                        fontWeight: "600",
                        color: isDone ? "#166534" : "#64748b"
                      }}
                    >
                      <div>Step {idx + 1}</div>
                      <div style={{ fontSize: "10px" }}>{s.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stakeholders */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "12px" }}>
                <strong>Assigned Auditor:</strong>
                <div>{viewingAudit.internalAuditor?.name} ({viewingAudit.internalAuditor?.role})</div>
                <div style={{ color: "#64748b" }}>{viewingAudit.internalAuditor?.department}</div>
              </div>
              <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "12px" }}>
                <strong>Assigned Auditee:</strong>
                <div>{viewingAudit.internalAuditee?.name} ({viewingAudit.internalAuditee?.role})</div>
                <div style={{ color: "#64748b" }}>{viewingAudit.internalAuditee?.department}</div>
              </div>
            </div>

            {/* Noticing Sheet findings if available */}
            {viewingAudit.noticingSheet && (
              <div style={{ padding: "12px", background: "#f5f3ff", borderRadius: "8px", border: "1px solid #ddd6fe" }}>
                <strong style={{ fontSize: "13px", color: "#5b21b6", display: "block", marginBottom: "6px" }}>
                  Noticing Sheet Findings ({viewingAudit.noticingSheet.sheetNo})
                </strong>
                <p style={{ margin: "0 0 6px 0", fontSize: "12px", color: "#4c1d95" }}>
                  {viewingAudit.noticingSheet.summary}
                </p>
                {(viewingAudit.noticingSheet.findings || []).map((f) => (
                  <div key={f.id} style={{ background: "#ffffff", padding: "8px", borderRadius: "6px", border: "1px solid #c4b5fd", fontSize: "12px", marginTop: "4px" }}>
                    <div style={{ fontWeight: "700", color: "#6d28d9" }}>{f.id} ({f.type}) - {f.clause}</div>
                    <div style={{ color: "#1e293b", marginTop: "2px" }}>{f.description}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Auditee CAPA Closure if available */}
            {viewingAudit.auditeeClosure && (
              <div style={{ padding: "12px", background: "#ecfdf5", borderRadius: "8px", border: "1px solid #a7f3d0" }}>
                <strong style={{ fontSize: "13px", color: "#065f46", display: "block", marginBottom: "6px" }}>
                  Auditee Corrective Action (CAPA) Submission
                </strong>
                <div style={{ fontSize: "12px", color: "#064e3b" }}>
                  <div><strong>Root Cause:</strong> {viewingAudit.auditeeClosure.rootCause}</div>
                  <div style={{ marginTop: "4px" }}><strong>Action Taken:</strong> {viewingAudit.auditeeClosure.correctiveAction}</div>
                  <div style={{ marginTop: "4px" }}><strong>Evidence:</strong> <code>{viewingAudit.auditeeClosure.evidenceFileName}</code></div>
                  <div style={{ marginTop: "4px" }}><strong>Closed By:</strong> {viewingAudit.auditeeClosure.closedBy} on {viewingAudit.auditeeClosure.closedAt}</div>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div>
              <strong style={{ fontSize: "13px", color: "#0f172a", display: "block", marginBottom: "8px" }}>
                Complete Audit Trail ({viewingAudit.timeline?.length || 0} Events)
              </strong>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {(viewingAudit.timeline || []).map((t, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px"
                    }}
                  >
                    <CheckCircle2 size={15} color="#16a34a" style={{ marginTop: "2px", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong style={{ color: "#0f172a" }}>{t.action}</strong>
                        <span style={{ fontSize: "11px", color: "#64748b" }}>{t.timestamp}</span>
                      </div>
                      <div style={{ color: "#475569", marginTop: "2px" }}>{t.actor}</div>
                      <div style={{ color: "#64748b", marginTop: "2px", fontSize: "11px" }}>{t.details}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setViewingAudit(null)}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
