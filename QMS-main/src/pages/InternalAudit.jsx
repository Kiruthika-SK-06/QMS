import React, { useState, useMemo, useEffect } from "react";
import {
  ClipboardCheck,
  Plus,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  Eye,
  Send,
  Calendar,
  Check,
  FileCheck2,
  UploadCloud,
  CheckCheck,
  X,
  FileText,
  User,
  Users
} from "lucide-react";
import { useApp } from "../context/AppContext";
import PageIntro from "../components/common/PageIntro";
import StatCard from "../components/common/StatCard";
import Modal from "../components/tasks/Modal";

export default function InternalAudit() {
  const {
    currentUser,
    processes = [],
    auditList = [],
    scheduleAudit,
    confirmAuditSchedule,
    submitNoticingSheet,
    shareNCDocs,
    submitAuditeeClosure,
    finalCloseAudit,
    pushNotification
  } = useApp();

  // Active testing role (defaults to logged-in user role: 'qm', 'Head', 'auditor', or 'owner')
  const [activeRole, setActiveRole] = useState(() => currentUser?.role || "qm");

  // Keep activeRole strictly synced when user changes or logs in as Trust Head in another tab
  useEffect(() => {
    if (currentUser?.role) {
      setActiveRole(currentUser.role);
    }
  }, [currentUser?.role]);

  // Robust normalized role matching (case-insensitive and tolerant of title variants)
  const effectiveRole = (activeRole || currentUser?.role || "qm").toLowerCase();
  const isQMS = effectiveRole === "qm" || effectiveRole === "qms";
  const isTrustHead = effectiveRole === "head" || effectiveRole === "trusthead" || effectiveRole === "trust head";
  const isAuditor = effectiveRole === "auditor" || effectiveRole === "internal auditor";
  const isAuditee = effectiveRole === "owner" || effectiveRole === "course coordinator" || effectiveRole === "auditee";

  // Registered system processes list
  const systemProcesses = useMemo(() => {
    const defaultList = [
      "Course Administration",
      "Course Management",
      "Training & Development",
      "Knowledge Management",
      "IT Support Management",
      "Quality Review & MRM",
      "Curriculum Design & Review",
      "Admissions & Student Enrollment",
      "Examination & Evaluation",
      "Faculty Development & Competency",
      "Library & Knowledge Resources",
      "Student Feedback & Grievance Redressal"
    ];
    const fromContext = (processes || []).map((p) => (typeof p === "string" ? p : p.name || p.processName)).filter(Boolean);
    const combined = Array.from(new Set([...fromContext, ...defaultList]));
    return combined;
  }, [processes]);

  // Filter & Search
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterProcess, setFilterProcess] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState(null);

  // Modals state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [confirmingAudit, setConfirmingAudit] = useState(null);
  const [noticingSheetAudit, setNoticingSheetAudit] = useState(null);
  const [ncDocsAudit, setNcDocsAudit] = useState(null);
  const [auditeeCloseAudit, setAuditeeCloseAudit] = useState(null);
  const [finalCloseAuditItem, setFinalCloseAuditItem] = useState(null);
  const [viewingAudit, setViewingAudit] = useState(null);

  // Form State for Schedule: NOT automatically filled, starts blank!
  const [scheduleForm, setScheduleForm] = useState({
    startDate: "",
    endDate: "",
    process: "",
    customProcess: "",
    auditorName: "",
    customAuditor: "",
    auditeeName: "",
    customAuditee: ""
  });

  // Action remarks/inputs
  const [confirmRemarks, setConfirmRemarks] = useState("Audit schedule approved and authorized for execution.");
  const [noticingSheetData, setNoticingSheetData] = useState({
    summary: "",
    clause: "ISO 9001:2015 Clause 8.5.1",
    ncDescription: "",
    targetDate: ""
  });
  const [ncDocsRemarks, setNcDocsRemarks] = useState(
    "Noticing Sheet reviewed. Formal Non-Conformance notice issued. Auditee requested to submit Root Cause Analysis and Corrective Action Plan."
  );
  const [auditeeClosureData, setAuditeeClosureData] = useState({
    rootCause: "",
    correctiveAction: "",
    evidenceFileName: "CAPA_Evidence_Signed.pdf"
  });
  const [finalCloseRemarks, setFinalCloseRemarks] = useState(
    "Corrective action verified and found fully conforming with ISO 9001:2015. Audit officially closed."
  );

  const [submitting, setSubmitting] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Stats
  const stats = useMemo(() => {
    const total = auditList.length;
    const awaitingConfirmation = auditList.filter((a) => a.stage === 2).length;
    const inProgress = auditList.filter((a) => a.stage >= 2.5 && a.stage < 6).length;
    const completed = auditList.filter((a) => a.stage === 6).length;
    return { total, awaitingConfirmation, inProgress, completed };
  }, [auditList]);

  // Filtered audits
  const filteredAudits = useMemo(() => {
    return auditList.filter((audit) => {
      // Process Filter
      if (filterProcess !== "all") {
        const auditProc = (audit.process || "").toLowerCase();
        const selected = filterProcess.toLowerCase();
        const matches = auditProc.includes(selected) || selected.includes(auditProc) || auditProc.includes("all processes");
        if (!matches) return false;
      }

      // Status / Actions filter
      if (filterStatus === "pending") {
        if (isQMS && (audit.stage === 3 || audit.stage === 5)) return true;
        if (isTrustHead && audit.stage === 2) return true;
        if (isAuditor && audit.stage === 2.5) return true;
        if (isAuditee && audit.stage === 4) return true;
        return false;
      }
      if (filterStatus === "in_progress" && (audit.stage < 2 || audit.stage >= 6)) return false;
      if (filterStatus === "completed" && audit.stage !== 6) return false;

      // Free Search Term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          audit.id?.toLowerCase().includes(q) ||
          audit.process?.toLowerCase().includes(q) ||
          audit.internalAuditor?.name?.toLowerCase().includes(q) ||
          audit.internalAuditee?.name?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [auditList, filterStatus, filterProcess, searchTerm, isQMS, isTrustHead, isAuditor, isAuditee]);

  // =========================================================================
  // HANDLERS
  // =========================================================================

  // 1. QMS Coordinator Schedules & Automatically Shares with Trust Head, Auditor & Auditee
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    const finalProcess = scheduleForm.process === "__custom__" ? scheduleForm.customProcess.trim() : scheduleForm.process.trim();
    const finalAuditor = scheduleForm.auditorName === "__custom__" ? scheduleForm.customAuditor.trim() : scheduleForm.auditorName.trim();
    const finalAuditee = scheduleForm.auditeeName === "__custom__" ? scheduleForm.customAuditee.trim() : scheduleForm.auditeeName.trim();

    if (!scheduleForm.startDate || !scheduleForm.endDate || !finalProcess || !finalAuditor || !finalAuditee) {
      showToast("Please fill all required fields.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: `${finalProcess} Internal Quality Audit`,
        process: finalProcess,
        startDate: scheduleForm.startDate,
        endDate: scheduleForm.endDate,
        internalAuditor: {
          name: finalAuditor,
          role: "Internal Auditor",
          department: "Internal Quality Audit Cell",
          email: `${finalAuditor.toLowerCase().replace(/[^a-z0-9]/g, ".")}@cdac.in`
        },
        internalAuditee: {
          name: finalAuditee,
          role: "Course Coordinator",
          department: "Academic Division",
          email: `${finalAuditee.toLowerCase().replace(/[^a-z0-9]/g, ".")}@cdac.in`
        },
        venue: "Academic Block & QMS Portal",
        scope: `Verification of operational procedures and ISO 9001:2015 compliance for ${finalProcess}.`,
        scheduledBy: {
          name: currentUser?.name || "Rahul Kumar",
          role: currentUser?.roleTitle || "QMS Coordinator"
        }
      };

      const created = await scheduleAudit(payload);

      // Real-time automatic notifications
      if (pushNotification) {
        pushNotification(
          "New Internal Audit Scheduled",
          `Internal Audit (${created.id}) for ${created.process} scheduled (${created.scheduledDate}). Please confirm schedule.`,
          "Head"
        );
        pushNotification(
          "Internal Audit Assignment",
          `You are assigned as Internal Auditor for ${created.process} (${created.id}) on ${created.scheduledDate}.`,
          "auditor"
        );
        pushNotification(
          "Internal Audit Announced",
          `Internal Audit (${created.id}) for ${created.process} scheduled for ${created.scheduledDate}.`,
          "owner"
        );
      }

      setShowScheduleModal(false);
      setScheduleForm({
        startDate: "",
        endDate: "",
        process: "",
        customProcess: "",
        auditorName: "",
        customAuditor: "",
        auditeeName: "",
        customAuditee: ""
      });
      showToast(`Audit ${created.id} scheduled! Details automatically shared with Trust Head, Auditor, and Course Coordinators.`);
    } catch (err) {
      showToast(err.message || "Failed to schedule audit", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Trust Head Confirms Schedule -> Automatically notifies QMS Coordinator
  const handleConfirmSubmit = async () => {
    if (!confirmingAudit) return;
    setSubmitting(true);
    try {
      await confirmAuditSchedule(confirmingAudit.id, confirmRemarks);

      if (pushNotification) {
        pushNotification(
          "Audit Schedule Confirmed by Trust Head",
          `Trust Head Anita Rao confirmed the audit schedule for ${confirmingAudit.process} (${confirmingAudit.id}). Auditing may proceed.`,
          "qm"
        );
        pushNotification(
          "Audit Schedule Confirmed",
          `Schedule for ${confirmingAudit.process} (${confirmingAudit.id}) is confirmed by Trust Head. You can now conduct the audit.`,
          "auditor"
        );
      }

      setConfirmingAudit(null);
      showToast(`Audit ${confirmingAudit.id} confirmed! Automated confirmation notification sent to QMS Coordinator.`);
    } catch (err) {
      showToast(err.message || "Failed to confirm schedule", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Internal Auditor Submits Noticing Sheet -> Shares to QMS Coordinator
  const handleNoticingSheetSubmit = async (e) => {
    e.preventDefault();
    if (!noticingSheetAudit) return;
    setSubmitting(true);
    try {
      const payload = {
        sheetNo: `NS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        summary: noticingSheetData.summary || "Audit concluded. Non-conformance items identified.",
        fileName: "Noticing_Sheet_Signed.pdf",
        submittedBy: `${currentUser?.name || noticingSheetAudit.internalAuditor?.name} (Internal Auditor)`,
        findings: [
          {
            id: "NC-01",
            type: "Minor NC",
            clause: noticingSheetData.clause,
            description: noticingSheetData.ncDescription || "Process documentation record gap identified during sample verification.",
            targetDate: noticingSheetData.targetDate || new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
          }
        ]
      };

      await submitNoticingSheet(noticingSheetAudit.id, payload);

      if (pushNotification) {
        pushNotification(
          "Noticing Sheet Submitted by Auditor",
          `Internal Auditor submitted Noticing Sheet for ${noticingSheetAudit.process} (${noticingSheetAudit.id}). Please review and share NC Docs.`,
          "qm"
        );
      }

      setNoticingSheetAudit(null);
      setNoticingSheetData({
        summary: "",
        clause: "ISO 9001:2015 Clause 8.5.1",
        ncDescription: "",
        targetDate: ""
      });
      showToast(`Noticing Sheet submitted and shared with QMS Coordinator for review!`);
    } catch (err) {
      showToast(err.message || "Failed to submit noticing sheet", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // 4. QMS Coordinator Shares NC Docs to Auditor & Auditee
  const handleShareNCDocsSubmit = async () => {
    if (!ncDocsAudit) return;
    setSubmitting(true);
    try {
      await shareNCDocs(ncDocsAudit.id, { remarks: ncDocsRemarks });

      if (pushNotification) {
        pushNotification(
          "NC Docs Issued - Corrective Action Required",
          `QMS Coordinator has issued NC Docs for ${ncDocsAudit.process} (${ncDocsAudit.id}). Please review findings, take corrective action, and close the NC.`,
          "owner"
        );
        pushNotification(
          "NC Docs Distributed to Auditee",
          `NC Docs for ${ncDocsAudit.process} (${ncDocsAudit.id}) distributed to Auditee.`,
          "auditor"
        );
      }

      setNcDocsAudit(null);
      showToast(`NC Docs shared to Internal Auditor and Auditee (${ncDocsAudit.internalAuditee?.name})!`);
    } catch (err) {
      showToast(err.message || "Failed to share NC docs", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // 5. Auditee Closes Process & Passes to QMS Coordinator
  const handleAuditeeCloseSubmit = async (e) => {
    e.preventDefault();
    if (!auditeeCloseAudit) return;
    setSubmitting(true);
    try {
      const payload = {
        rootCause: auditeeClosureData.rootCause || "Operational procedure delay during peak academic cycle.",
        correctiveAction: auditeeClosureData.correctiveAction,
        evidenceFileName: auditeeClosureData.evidenceFileName || "CAPA_Evidence_Signed.pdf",
        closedBy: `${currentUser?.name || auditeeCloseAudit.internalAuditee?.name} (Course Coordinator)`
      };

      await submitAuditeeClosure(auditeeCloseAudit.id, payload);

      if (pushNotification) {
        pushNotification(
          "Auditee Corrective Action Submitted",
          `Auditee (${payload.closedBy}) submitted corrective action for ${auditeeCloseAudit.process} (${auditeeCloseAudit.id}). Ready for final QMS closure.`,
          "qm"
        );
      }

      setAuditeeCloseAudit(null);
      setAuditeeClosureData({ rootCause: "", correctiveAction: "", evidenceFileName: "CAPA_Evidence_Signed.pdf" });
      showToast(`Auditee closure submitted! Passed to QMS Coordinator for final close.`);
    } catch (err) {
      showToast(err.message || "Failed to submit closure", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // 6. QMS Coordinator Final Close -> Whole Process is Completed!
  const handleFinalCloseSubmit = async () => {
    if (!finalCloseAuditItem) return;
    setSubmitting(true);
    try {
      await finalCloseAudit(finalCloseAuditItem.id, finalCloseRemarks);

      if (pushNotification) {
        pushNotification(
          "Internal Audit Completed & Officially Closed",
          `Internal Audit (${finalCloseAuditItem.id}) for ${finalCloseAuditItem.process} is 100% complete and closed.`,
          "all"
        );
      }

      setFinalCloseAuditItem(null);
      showToast(`Internal Audit ${finalCloseAuditItem.id} officially closed! The whole process is now completed.`);
    } catch (err) {
      showToast(err.message || "Failed to finalize audit closure", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Status Badge styling helper
  const renderStatusBadge = (audit) => {
    switch (audit.stage) {
      case 6:
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 9px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", color: "#166534", background: "#dcfce7", border: "1px solid #bbf7d0" }}>
            <CheckCircle2 size={13} /> Completed
          </span>
        );
      case 5:
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 9px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", color: "#92400e", background: "#fef3c7", border: "1px solid #fde68a" }}>
            <Clock size={13} /> Closed by Auditee
          </span>
        );
      case 4:
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 9px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", color: "#b45309", background: "#fffbeb", border: "1px solid #fcd34d" }}>
            <Clock size={13} /> NC Docs Shared
          </span>
        );
      case 3:
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 9px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", color: "#6d28d9", background: "#f5f3ff", border: "1px solid #ddd6fe" }}>
            <Clock size={13} /> Noticing Sheet Submitted
          </span>
        );
      case 2.5:
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 9px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", color: "#0369a1", background: "#f0f9ff", border: "1px solid #bae6fd" }}>
            <Clock size={13} /> Schedule Confirmed
          </span>
        );
      case 2:
      default:
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 9px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", color: "#1d4ed8", background: "#eff6ff", border: "1px solid #bfdbfe" }}>
            <Clock size={13} /> Awaiting Trust Head
          </span>
        );
    }
  };

  return (
    <div className="page-container internal-audit-page">
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "24px",
            zIndex: 9999,
            padding: "12px 18px",
            borderRadius: "8px",
            background: toast.type === "error" ? "#ef4444" : "#166534",
            color: "#ffffff",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "13px",
            fontWeight: "600"
          }}
        >
          {toast.type === "error" ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", marginLeft: "6px" }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Clean Header Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px", marginBottom: "20px" }}>
        <div>
          <h1 style={{ margin: "0 0 4px 0", fontSize: "22px", fontWeight: "700", color: "#0f2233" }}>
            Internal Quality Audit
          </h1>
          <p style={{ margin: 0, fontSize: "13px", color: "#5d7182" }}>
            Real-time ISO 9001:2015 audit lifecycle: scheduling, confirmation, noticing sheets, NC corrective actions, and completion.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Subtle Role Toggle so user can test all roles effortlessly */}
          <div style={{ display: "inline-flex", alignItems: "center", background: "#f1f5f9", padding: "3px 4px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", padding: "0 6px" }}>Role:</span>
            {[
              { key: "qm", label: "QMS Coord" },
              { key: "Head", label: "Trust Head" },
              { key: "auditor", label: "Auditor" },
              { key: "owner", label: "Auditee" }
            ].map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setActiveRole(r.key)}
                style={{
                  border: "none",
                  padding: "5px 9px",
                  borderRadius: "5px",
                  fontSize: "11px",
                  fontWeight: "600",
                  cursor: "pointer",
                  background: activeRole === r.key ? "var(--navy)" : "transparent",
                  color: activeRole === r.key ? "#ffffff" : "#475569"
                }}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Schedule Auditing Button (visible to QMS Coordinator) */}
          {isQMS && (
            <button
              type="button"
              className="primary-button btn-blue"
              onClick={() => {
                // Ensure form starts clean and blank
                setScheduleForm({ startDate: "", endDate: "", process: "", auditorName: "", auditeeName: "" });
                setShowScheduleModal(true);
              }}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 16px" }}
            >
              <Plus size={16} />
              <span>Schedule Audit</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Compact Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginBottom: "20px" }}>
        <StatCard title="Total Audits" value={stats.total} icon={ClipboardCheck} variant="default" subtitle="Logged in system" />
        <StatCard title="Awaiting Confirmation" value={stats.awaitingConfirmation} icon={Clock} variant="blue" subtitle="Trust Head action" />
        <StatCard title="In Progress" value={stats.inProgress} icon={Clock} variant="amber" subtitle="Auditing & NC resolution" />
        <StatCard title="Completed" value={stats.completed} icon={CheckCircle2} variant="green" subtitle="100% closed & certified" />
      </div>

      {/* Trust Head Action Banner: Immediately alert Trust Head of pending audit schedule confirmation */}
      {isTrustHead && stats.awaitingConfirmation > 0 && (
        <div
          style={{
            padding: "12px 18px",
            background: "#f0fdf4",
            border: "1px solid #86efac",
            borderRadius: "8px",
            marginBottom: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            boxShadow: "0 2px 8px rgba(22, 101, 52, 0.08)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#166534" }}>
            <AlertCircle size={20} color="#16a34a" />
            <div>
              <strong style={{ display: "block", fontSize: "13px" }}>
                Action Required: {stats.awaitingConfirmation} Audit Schedule awaiting Trust Head Confirmation
              </strong>
              <span style={{ fontSize: "12px", color: "#15803d" }}>
                QMS Coordinator has scheduled and shared the audit plan. Click confirm to authorize auditing.
              </span>
            </div>
          </div>
          <button
            type="button"
            className="primary-button btn-green"
            style={{ padding: "7px 15px", fontSize: "12px", fontWeight: "600" }}
            onClick={() => {
              const pending = auditList.find((a) => a.stage === 2);
              if (pending) setConfirmingAudit(pending);
            }}
          >
            <Check size={14} style={{ marginRight: "5px" }} />
            Review & Confirm Schedule
          </button>
        </div>
      )}

      {/* Filter Tabs & Search & Process Selector */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "6px" }}>
          {[
            { key: "all", label: `All (${stats.total})` },
            { key: "pending", label: `My Actions ${isTrustHead && stats.awaitingConfirmation > 0 ? `(${stats.awaitingConfirmation})` : ""}` },
            { key: "in_progress", label: `In Progress (${stats.inProgress})` },
            { key: "completed", label: `Completed (${stats.completed})` }
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setFilterStatus(t.key)}
              style={{
                padding: "7px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                border: filterStatus === t.key ? "1px solid var(--navy)" : "1px solid #cbd5e1",
                background: filterStatus === t.key ? "var(--navy)" : "#ffffff",
                color: filterStatus === t.key ? "#ffffff" : "#475569"
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {/* Process Filter Dropdown showing all registered processes */}
          <select
            value={filterProcess}
            onChange={(e) => setFilterProcess(e.target.value)}
            style={{
              padding: "7px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              fontSize: "12px",
              background: "#ffffff",
              color: "#334155"
            }}
            title="Filter by Process"
          >
            <option value="all">All Processes ({auditList.length})</option>
            {systemProcesses.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Search by ID, process, auditor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "7px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              fontSize: "12px",
              minWidth: "220px"
            }}
          />
        </div>
      </div>

      {/* Clean Table of Audits */}
      <div style={{ background: "#ffffff", borderRadius: "10px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: "600" }}>
                <th style={{ padding: "12px 16px" }}>Audit Ref & Process</th>
                <th style={{ padding: "12px 16px" }}>Audit Dates</th>
                <th style={{ padding: "12px 16px" }}>Internal Auditor</th>
                <th style={{ padding: "12px 16px" }}>Internal Auditee</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAudits.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
                    No audits found.
                  </td>
                </tr>
              ) : (
                filteredAudits.map((audit) => {
                  return (
                    <tr
                      key={audit.id}
                      style={{ borderBottom: "1px solid #f1f5f9" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* 1. Audit Ref & Process */}
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontFamily: "monospace", fontWeight: "700", fontSize: "11px", color: "var(--navy)", background: "#edf4fa", padding: "2px 6px", borderRadius: "4px" }}>
                          {audit.id}
                        </span>
                        <strong style={{ display: "block", color: "#0f172a", marginTop: "3px", fontSize: "13px" }}>
                          {audit.process}
                        </strong>
                      </td>

                      {/* 2. Audit Dates */}
                      <td style={{ padding: "12px 16px", color: "#334155" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <Calendar size={13} color="#64748b" />
                          <span>{audit.scheduledDate}</span>
                        </div>
                      </td>

                      {/* 3. Internal Auditor */}
                      <td style={{ padding: "12px 16px", color: "#0f172a", fontWeight: "500" }}>
                        {audit.internalAuditor?.name}
                      </td>

                      {/* 4. Internal Auditee */}
                      <td style={{ padding: "12px 16px", color: "#0f172a", fontWeight: "500" }}>
                        {audit.internalAuditee?.name}
                      </td>

                      {/* 5. Status Badge */}
                      <td style={{ padding: "12px 16px" }}>
                        {renderStatusBadge(audit)}
                      </td>

                      {/* 6. Contextual Action Button */}
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                          {/* Trust Head Confirm Action */}
                          {audit.stage === 2 && isTrustHead && (
                            <button
                              type="button"
                              className="primary-button btn-green"
                              onClick={() => setConfirmingAudit(audit)}
                              style={{ padding: "6px 12px", fontSize: "12px" }}
                            >
                              <Check size={13} style={{ marginRight: "4px" }} />
                              Confirm Schedule
                            </button>
                          )}

                          {/* Internal Auditor Noticing Sheet Action */}
                          {audit.stage === 2.5 && isAuditor && (
                            <button
                              type="button"
                              className="primary-button btn-blue"
                              onClick={() => setNoticingSheetAudit(audit)}
                              style={{ padding: "6px 12px", fontSize: "12px" }}
                            >
                              <FileCheck2 size={13} style={{ marginRight: "4px" }} />
                              Submit Noticing Sheet
                            </button>
                          )}

                          {/* QMS Coordinator Share NC Docs Action */}
                          {audit.stage === 3 && isQMS && (
                            <button
                              type="button"
                              className="primary-button btn-blue"
                              onClick={() => setNcDocsAudit(audit)}
                              style={{ padding: "6px 12px", fontSize: "12px" }}
                            >
                              <Send size={13} style={{ marginRight: "4px" }} />
                              Share NC Docs
                            </button>
                          )}

                          {/* Auditee Close Action */}
                          {audit.stage === 4 && isAuditee && (
                            <button
                              type="button"
                              className="primary-button btn-green"
                              onClick={() => setAuditeeCloseAudit(audit)}
                              style={{ padding: "6px 12px", fontSize: "12px" }}
                            >
                              <UploadCloud size={13} style={{ marginRight: "4px" }} />
                              Close NC
                            </button>
                          )}

                          {/* QMS Coordinator Final Close Action */}
                          {audit.stage === 5 && isQMS && (
                            <button
                              type="button"
                              className="primary-button btn-green"
                              onClick={() => setFinalCloseAuditItem(audit)}
                              style={{ padding: "6px 12px", fontSize: "12px" }}
                            >
                              <CheckCheck size={14} style={{ marginRight: "4px" }} />
                              Close Audit
                            </button>
                          )}

                          {/* View details */}
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => setViewingAudit(audit)}
                            style={{ padding: "6px 8px", fontSize: "12px" }}
                            title="View Audit Details & Timeline"
                          >
                            <Eye size={13} />
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
          SCHEDULE AUDITING MODAL (Empty inputs filled by QMS Coordinator)
          ========================================================================= */}
      {showScheduleModal && (
        <Modal
          title="Schedule Internal Audit"
          onClose={() => setShowScheduleModal(false)}
        >
          <form onSubmit={handleScheduleSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <p style={{ margin: "0 0 6px 0", fontSize: "12px", color: "#64748b" }}>
                Fill the audit details. Once submitted, the schedule will be automatically distributed to the Trust Head, Internal Auditor, and Course Coordinators.
              </p>

              {/* Dates */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <label>
                  <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "12px" }}>
                    Start Date <span style={{ color: "#ef4444" }}>*</span>
                  </span>
                  <input
                    type="date"
                    required
                    value={scheduleForm.startDate}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, startDate: e.target.value })}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </label>

                <label>
                  <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "12px" }}>
                    End Date <span style={{ color: "#ef4444" }}>*</span>
                  </span>
                  <input
                    type="date"
                    required
                    value={scheduleForm.endDate}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, endDate: e.target.value })}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </label>
              </div>

              {/* Process Selection: Shows all processes with All Processes option and custom option */}
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "12px", color: "#334155" }}>
                  Process to be Audited <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  required
                  value={scheduleForm.process}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, process: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    background: "#ffffff",
                    color: "#0f172a"
                  }}
                >
                  <option value="">-- Select Process to be Audited --</option>
                  <option value="All Processes (Comprehensive QMS Audit)" style={{ fontWeight: "bold", color: "var(--navy)" }}>
                    All Processes (Comprehensive QMS Audit)
                  </option>
                  <optgroup label="Registered Academic & Operations Processes">
                    {systemProcesses.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </optgroup>
                  <option value="__custom__">+ Enter Custom / Other Process...</option>
                </select>

                {scheduleForm.process === "__custom__" && (
                  <input
                    type="text"
                    required
                    placeholder="Type custom process name..."
                    value={scheduleForm.customProcess}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, customProcess: e.target.value })}
                    style={{
                      width: "100%",
                      marginTop: "6px",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #94a3b8",
                      fontSize: "13px"
                    }}
                  />
                )}
              </div>

              {/* Internal Auditor Selection */}
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "12px", color: "#334155" }}>
                  Internal Auditor <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  required
                  value={scheduleForm.auditorName}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, auditorName: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    background: "#ffffff",
                    color: "#0f172a"
                  }}
                >
                  <option value="">-- Select Internal Auditor --</option>
                  <option value="Vikas Deshmukh">Vikas Deshmukh (Lead Internal Auditor - IA001)</option>
                  <option value="Suresh Menon">Suresh Menon (Internal Auditor - IA002)</option>
                  <option value="Dr. Meenakshi Sundaram">Dr. Meenakshi Sundaram (Senior Auditor - IA003)</option>
                  <option value="__custom__">+ Enter Other Auditor...</option>
                </select>

                {scheduleForm.auditorName === "__custom__" && (
                  <input
                    type="text"
                    required
                    placeholder="Type auditor full name..."
                    value={scheduleForm.customAuditor}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, customAuditor: e.target.value })}
                    style={{
                      width: "100%",
                      marginTop: "6px",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #94a3b8",
                      fontSize: "13px"
                    }}
                  />
                )}
              </div>

              {/* Internal Auditee Selection */}
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "12px", color: "#334155" }}>
                  Internal Auditee (Course Coordinator) <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  required
                  value={scheduleForm.auditeeName}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, auditeeName: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    background: "#ffffff",
                    color: "#0f172a"
                  }}
                >
                  <option value="">-- Select Internal Auditee (Course Coordinator) --</option>
                  <option value="Priya Sharma">Priya Sharma (Course Coordinator - Advanced Computing)</option>
                  <option value="Dr. Rajesh Verma">Dr. Rajesh Verma (Course Coordinator - AI Division)</option>
                  <option value="Sunita Patil">Sunita Patil (Course Coordinator - Cyber Security)</option>
                  <option value="Rohan Desai">Rohan Desai (Training Coordinator)</option>
                  <option value="Karthik Verma">Karthik Verma (IT Systems Coordinator)</option>
                  <option value="__custom__">+ Enter Other Auditee...</option>
                </select>

                {scheduleForm.auditeeName === "__custom__" && (
                  <input
                    type="text"
                    required
                    placeholder="Type auditee full name..."
                    value={scheduleForm.customAuditee}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, customAuditee: e.target.value })}
                    style={{
                      width: "100%",
                      marginTop: "6px",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #94a3b8",
                      fontSize: "13px"
                    }}
                  />
                )}
              </div>

              {/* Submit Button (enabled once data is filled) */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowScheduleModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button btn-blue"
                  disabled={
                    submitting ||
                    !scheduleForm.startDate ||
                    !scheduleForm.endDate ||
                    !(scheduleForm.process === "__custom__" ? scheduleForm.customProcess.trim() : scheduleForm.process.trim()) ||
                    !(scheduleForm.auditorName === "__custom__" ? scheduleForm.customAuditor.trim() : scheduleForm.auditorName.trim()) ||
                    !(scheduleForm.auditeeName === "__custom__" ? scheduleForm.customAuditee.trim() : scheduleForm.auditeeName.trim())
                  }
                >
                  <span>{submitting ? "Scheduling & Sharing..." : "Submit & Share Schedule"}</span>
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* =========================================================================
          TRUST HEAD CONFIRM MODAL
          ========================================================================= */}
      {confirmingAudit && (
        <Modal
          title={`Confirm Audit Schedule: ${confirmingAudit.id}`}
          onClose={() => setConfirmingAudit(null)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ padding: "10px", background: "#f0f9ff", borderRadius: "6px", border: "1px solid #bae6fd", fontSize: "12px", color: "#0369a1" }}>
              As Trust Head, confirm the schedule for <strong>{confirmingAudit.process}</strong> ({confirmingAudit.scheduledDate}). An automated confirmation message will be dispatched to the QMS Coordinator.
            </div>

            <label>
              <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "12px" }}>
                Remarks / Authorization Notes
              </span>
              <textarea
                rows={2}
                value={confirmRemarks}
                onChange={(e) => setConfirmRemarks(e.target.value)}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
            </label>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "6px" }}>
              <button type="button" className="secondary-button" onClick={() => setConfirmingAudit(null)} disabled={submitting}>
                Cancel
              </button>
              <button type="button" className="primary-button btn-green" onClick={handleConfirmSubmit} disabled={submitting}>
                <Check size={14} style={{ marginRight: "4px" }} />
                <span>{submitting ? "Confirming..." : "Confirm Schedule"}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* =========================================================================
          INTERNAL AUDITOR SUBMIT NOTICING SHEET MODAL
          ========================================================================= */}
      {noticingSheetAudit && (
        <Modal
          title={`Submit Noticing Sheet: ${noticingSheetAudit.id}`}
          onClose={() => setNoticingSheetAudit(null)}
        >
          <form onSubmit={handleNoticingSheetSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <p style={{ margin: "0", fontSize: "12px", color: "#64748b" }}>
                Auditing completed for <strong>{noticingSheetAudit.process}</strong>. Fill the observations to submit to the QMS Coordinator.
              </p>

              <label>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "12px" }}>
                  Audit Observations Summary <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Audit concluded across lectures and lab tracking. Found 1 minor non-conformance..."
                  value={noticingSheetData.summary}
                  onChange={(e) => setNoticingSheetData({ ...noticingSheetData, summary: e.target.value })}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                />
              </label>

              <label>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "12px" }}>
                  Non-Conformance (NC) Finding Description <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Practical lab attendance logbook lacked weekly coordinator signatures..."
                  value={noticingSheetData.ncDescription}
                  onChange={(e) => setNoticingSheetData({ ...noticingSheetData, ncDescription: e.target.value })}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <label>
                  <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "12px" }}>
                    ISO 9001 Clause
                  </span>
                  <input
                    type="text"
                    value={noticingSheetData.clause}
                    onChange={(e) => setNoticingSheetData({ ...noticingSheetData, clause: e.target.value })}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                  />
                </label>

                <label>
                  <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "12px" }}>
                    Resolution Target Date
                  </span>
                  <input
                    type="date"
                    value={noticingSheetData.targetDate}
                    onChange={(e) => setNoticingSheetData({ ...noticingSheetData, targetDate: e.target.value })}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                  />
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "6px" }}>
                <button type="button" className="secondary-button" onClick={() => setNoticingSheetAudit(null)} disabled={submitting}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button btn-blue"
                  disabled={submitting || !noticingSheetData.summary.trim() || !noticingSheetData.ncDescription.trim()}
                >
                  <FileCheck2 size={14} style={{ marginRight: "4px" }} />
                  <span>{submitting ? "Submitting..." : "Submit to QMS Coordinator"}</span>
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* =========================================================================
          QMS COORDINATOR SHARE NC DOCS MODAL
          ========================================================================= */}
      {ncDocsAudit && (
        <Modal
          title={`Review & Share NC Docs: ${ncDocsAudit.id}`}
          onClose={() => setNcDocsAudit(null)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ padding: "10px", background: "#fffbeb", borderRadius: "6px", border: "1px solid #fcd34d", fontSize: "12px", color: "#92400e" }}>
              <strong>Auditor Findings:</strong>
              <div>{ncDocsAudit.noticingSheet?.findings?.[0]?.description || ncDocsAudit.noticingSheet?.summary}</div>
            </div>

            <label>
              <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "12px" }}>
                QMS Directive & CAPA Remarks for Auditee
              </span>
              <textarea
                rows={3}
                value={ncDocsRemarks}
                onChange={(e) => setNcDocsRemarks(e.target.value)}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
            </label>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "6px" }}>
              <button type="button" className="secondary-button" onClick={() => setNcDocsAudit(null)} disabled={submitting}>
                Cancel
              </button>
              <button type="button" className="primary-button btn-blue" onClick={handleShareNCDocsSubmit} disabled={submitting}>
                <Send size={14} style={{ marginRight: "4px" }} />
                <span>{submitting ? "Sharing..." : "Share NC Docs to Auditor & Auditee"}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* =========================================================================
          AUDITEE CLOSE NC MODAL
          ========================================================================= */}
      {auditeeCloseAudit && (
        <Modal
          title={`Submit Corrective Action & Close NC: ${auditeeCloseAudit.id}`}
          onClose={() => setAuditeeCloseAudit(null)}
        >
          <form onSubmit={handleAuditeeCloseSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ padding: "8px 10px", background: "#fef3c7", borderRadius: "6px", border: "1px solid #fde68a", fontSize: "12px", color: "#92400e" }}>
                <strong>Non-Conformance:</strong> {auditeeCloseAudit.noticingSheet?.findings?.[0]?.description || "Documentation record gap."}
              </div>

              <label>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "12px" }}>
                  Root Cause Analysis <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Manual paper sign-off workflow delayed due to exam schedule..."
                  value={auditeeClosureData.rootCause}
                  onChange={(e) => setAuditeeClosureData({ ...auditeeClosureData, rootCause: e.target.value })}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                />
              </label>

              <label>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "12px" }}>
                  Corrective Action Taken <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. All pending logbooks verified and signed off; instituted weekly digital checklist..."
                  value={auditeeClosureData.correctiveAction}
                  onChange={(e) => setAuditeeClosureData({ ...auditeeClosureData, correctiveAction: e.target.value })}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                />
              </label>

              <label>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "12px" }}>
                  Evidence Document Attached
                </span>
                <input
                  type="text"
                  readOnly
                  value={auditeeClosureData.evidenceFileName}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#f8fafc", fontSize: "12px" }}
                />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "6px" }}>
                <button type="button" className="secondary-button" onClick={() => setAuditeeCloseAudit(null)} disabled={submitting}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button btn-green"
                  disabled={submitting || !auditeeClosureData.rootCause.trim() || !auditeeClosureData.correctiveAction.trim()}
                >
                  <UploadCloud size={14} style={{ marginRight: "4px" }} />
                  <span>{submitting ? "Submitting..." : "Submit Closure to QMS"}</span>
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* =========================================================================
          QMS COORDINATOR FINAL CLOSE MODAL (Completes entire process)
          ========================================================================= */}
      {finalCloseAuditItem && (
        <Modal
          title={`Final Close Audit: ${finalCloseAuditItem.id}`}
          onClose={() => setFinalCloseAuditItem(null)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ padding: "10px", background: "#ecfdf5", borderRadius: "6px", border: "1px solid #a7f3d0", fontSize: "12px", color: "#065f46" }}>
              <strong>Auditee Action Taken:</strong>
              <div>{finalCloseAuditItem.auditeeClosure?.correctiveAction}</div>
              <div style={{ marginTop: "4px", fontSize: "11px", color: "#047857" }}>
                Submitted by {finalCloseAuditItem.auditeeClosure?.closedBy} with evidence <code>{finalCloseAuditItem.auditeeClosure?.evidenceFileName}</code>.
              </div>
            </div>

            <label>
              <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "12px" }}>
                Final QMS Verification & Closure Sign-off Remarks
              </span>
              <textarea
                rows={2}
                value={finalCloseRemarks}
                onChange={(e) => setFinalCloseRemarks(e.target.value)}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
            </label>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "6px" }}>
              <button type="button" className="secondary-button" onClick={() => setFinalCloseAuditItem(null)} disabled={submitting}>
                Cancel
              </button>
              <button type="button" className="primary-button btn-green" onClick={handleFinalCloseSubmit} disabled={submitting}>
                <CheckCheck size={14} style={{ marginRight: "4px" }} />
                <span>{submitting ? "Closing..." : "Close Entire Process"}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* =========================================================================
          VIEW AUDIT DETAILS MODAL
          ========================================================================= */}
      {viewingAudit && (
        <Modal
          title={`Audit Details: ${viewingAudit.id}`}
          onClose={() => setViewingAudit(null)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "70vh", overflowY: "auto" }}>
            <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: "14px", color: "var(--navy)" }}>{viewingAudit.process}</strong>
                {renderStatusBadge(viewingAudit)}
              </div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                Dates: <strong>{viewingAudit.scheduledDate}</strong>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "12px" }}>
              <div style={{ padding: "8px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                <strong>Auditor:</strong> {viewingAudit.internalAuditor?.name}
              </div>
              <div style={{ padding: "8px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                <strong>Auditee:</strong> {viewingAudit.internalAuditee?.name}
              </div>
            </div>

            {viewingAudit.noticingSheet && (
              <div style={{ padding: "10px", background: "#f5f3ff", borderRadius: "6px", border: "1px solid #ddd6fe", fontSize: "12px" }}>
                <strong style={{ color: "#6d28d9" }}>Noticing Sheet Finding:</strong>
                <div style={{ marginTop: "2px" }}>{viewingAudit.noticingSheet.findings?.[0]?.description || viewingAudit.noticingSheet.summary}</div>
              </div>
            )}

            {viewingAudit.auditeeClosure && (
              <div style={{ padding: "10px", background: "#ecfdf5", borderRadius: "6px", border: "1px solid #a7f3d0", fontSize: "12px" }}>
                <strong style={{ color: "#065f46" }}>Auditee Corrective Action:</strong>
                <div style={{ marginTop: "2px" }}>{viewingAudit.auditeeClosure.correctiveAction}</div>
              </div>
            )}

            {/* Timeline */}
            <div>
              <strong style={{ fontSize: "12px", color: "#0f172a", display: "block", marginBottom: "6px" }}>
                Audit Timeline
              </strong>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {(viewingAudit.timeline || []).map((t, idx) => (
                  <div key={idx} style={{ padding: "6px 8px", background: "#f8fafc", borderRadius: "4px", border: "1px solid #e2e8f0", fontSize: "11px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "600", color: "#0f172a" }}>
                      <span>{t.action}</span>
                      <span style={{ color: "#64748b" }}>{t.timestamp}</span>
                    </div>
                    <div style={{ color: "#475569" }}>{t.details}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "6px" }}>
              <button type="button" className="secondary-button" onClick={() => setViewingAudit(null)}>
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
