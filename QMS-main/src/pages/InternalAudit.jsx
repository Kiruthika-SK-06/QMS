import React, { useState, useMemo, useEffect } from "react";
import {
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Send,
  Calendar,
  Check,
  FileCheck2,
  UploadCloud,
  CheckCheck,
  X,
  UserCheck,
  ShieldCheck,
  ClipboardCheck
} from "lucide-react";
import { useApp } from "../context/AppContext";
import Modal from "../components/tasks/Modal";

export default function InternalAudit() {
  const {
    currentUser,
    processes = [],
    auditList = [],
    scheduleAudit,
    shareAuditSchedule,
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
  const [shareScheduleAudit, setShareScheduleAudit] = useState(null);
  const [noticingSheetAudit, setNoticingSheetAudit] = useState(null);
  const [ncDocsAudit, setNcDocsAudit] = useState(null);
  const [auditeeCloseAudit, setAuditeeCloseAudit] = useState(null);
  const [finalCloseAuditItem, setFinalCloseAuditItem] = useState(null);
  const [viewingAudit, setViewingAudit] = useState(null);

  // Form State for Schedule: Single date only
  const [scheduleForm, setScheduleForm] = useState({
    date: "",
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

  // Role-based visibility filter: Auditees (Course Coordinators) and Auditors see all announced audits (stage >= 3)
  const visibleAudits = useMemo(() => {
    return (auditList || []).filter((audit) => {
      if (isAuditee) {
        return audit.stage >= 3;
      }

      if (isAuditor) {
        return audit.stage >= 3;
      }

      return true;
    });
  }, [auditList, isAuditee, isAuditor]);

  // Stats tailored by role
  const stats = useMemo(() => {
    const total = visibleAudits.length;
    const awaitingConfirmation = (auditList || []).filter((a) => a.stage === 2).length;
    const isAuditClosed = (a) =>
      a.stage >= 7 ||
      (a.stage >= 6 && a.qmsFinalClosure?.closed) ||
      a.status === "Closed" ||
      a.status === "Completed";

    const completed = visibleAudits.filter(isAuditClosed).length;
    const inProgress = visibleAudits.filter((a) => a.stage >= 2.5 && !isAuditClosed(a)).length;
    const pendingAction = visibleAudits.filter((a) => {
      if (isAuditee) return a.stage === 5;
      if (isAuditor) return a.stage === 3;
      if (isTrustHead) return a.stage === 2;
      return a.stage === 2.5 || a.stage === 4 || a.stage === 6;
    }).length;

    return { total, awaitingConfirmation, inProgress, completed, pendingAction };
  }, [visibleAudits, auditList, isAuditee, isAuditor, isTrustHead]);

  // Filtered audits
  const filteredAudits = useMemo(() => {
    return visibleAudits.filter((audit) => {
      // Process Filter
      if (filterProcess !== "all") {
        const auditProc = (audit.process || "").toLowerCase();
        const selected = filterProcess.toLowerCase();
        const matches = auditProc.includes(selected) || selected.includes(auditProc) || auditProc.includes("all processes");
        if (!matches) return false;
      }

      const isClosed =
        audit.stage >= 7 ||
        (audit.stage >= 6 && audit.qmsFinalClosure?.closed) ||
        audit.status === "Closed" ||
        audit.status === "Completed";

      // Status / Actions filter
      if (filterStatus === "pending") {
        if (isTrustHead && audit.stage === 2) return true;
        if (isQMS && (audit.stage === 2.5 || audit.stage === 4 || audit.stage === 6)) return true;
        if (isAuditor && audit.stage === 3) return true;
        if (isAuditee && audit.stage === 5) return true;
        return false;
      }
      if (filterStatus === "in_progress" && (audit.stage < 2.5 || isClosed)) return false;
      if (filterStatus === "completed" && !isClosed) return false;

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
  }, [visibleAudits, filterStatus, filterProcess, searchTerm, isQMS, isTrustHead, isAuditor, isAuditee]);

  // =========================================================================
  // HANDLERS
  // =========================================================================

  // 1. QMS Coordinator Schedules Audit (Passes to Trust Head for Approval)
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    const finalProcess = scheduleForm.process === "__custom__" ? scheduleForm.customProcess.trim() : scheduleForm.process.trim();
    const finalAuditor = scheduleForm.auditorName === "__custom__" ? scheduleForm.customAuditor.trim() : scheduleForm.auditorName.trim();
    const finalAuditee = scheduleForm.auditeeName === "__custom__" ? scheduleForm.customAuditee.trim() : scheduleForm.auditeeName.trim();
    const finalDate = scheduleForm.date;

    if (!finalDate || !finalProcess || !finalAuditor || !finalAuditee) {
      showToast("Please fill all required fields.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: `${finalProcess} Internal Quality Audit`,
        process: finalProcess,
        date: finalDate,
        startDate: finalDate,
        endDate: finalDate,
        scheduledDate: finalDate,
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

      setShowScheduleModal(false);
      setScheduleForm({
        date: "",
        process: "",
        customProcess: "",
        auditorName: "",
        customAuditor: "",
        auditeeName: "",
        customAuditee: ""
      });

      const created = await scheduleAudit(payload);

      // Real-time automatic notification to Trust Head only for approval
      if (pushNotification) {
        pushNotification(
          "New Internal Audit Scheduled - Approval Required",
          `Internal Audit (${created.id}) for ${created.process} scheduled for ${created.scheduledDate}. Please review and approve schedule.`,
          "Head"
        );
        pushNotification(
          "Internal Audit Scheduled",
          `Internal Audit (${created.id}) for ${created.process} scheduled and passed to Trust Head for formal approval.`,
          "qm"
        );
      }

      showToast(`Audit ${created.id} scheduled! Submitted automatically to Trust Head for formal approval.`);
    } catch (err) {
      showToast(err.message || "Failed to schedule audit", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Trust Head Confirms Schedule -> Automatically notifies QMS Coordinator
  const handleConfirmSubmit = async () => {
    if (!confirmingAudit) return;
    const audit = confirmingAudit;
    const remarks = confirmRemarks;
    setConfirmingAudit(null);

    try {
      await confirmAuditSchedule(audit.id, remarks);

      if (pushNotification) {
        pushNotification(
          "Audit Schedule Approved by Trust Head",
          `Trust Head Anita Rao approved the audit schedule for ${audit.process} (${audit.id}). You can now share the schedule with Course Coordinators, Trust Head, and Internal Auditors.`,
          "qm"
        );
      }

      showToast(`Audit ${audit.id} approved! Notification dispatched to QMS Coordinator to distribute schedule.`);
    } catch (err) {
      showToast(err.message || "Failed to confirm schedule", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // 3. QMS Coordinator Shares Schedule to All (Course Coordinators, Trust Head & Internal Auditors)
  const handleShareScheduleSubmit = async () => {
    if (!shareScheduleAudit) return;
    const audit = shareScheduleAudit;
    setShareScheduleAudit(null);

    try {
      await shareAuditSchedule(audit.id);

      if (pushNotification) {
        pushNotification(
          "Internal Audit Schedule Announced",
          `Internal Audit (${audit.id}) for ${audit.process} scheduled for ${audit.scheduledDate}. Auditor: ${audit.internalAuditor?.name}.`,
          "owner"
        );
        pushNotification(
          "Internal Audit Assignment - Ready for Execution",
          `Audit schedule for ${audit.process} (${audit.id}) confirmed and dispatched. You can now conduct the audit and submit the Noticing Sheet to QMS Coordinator.`,
          "auditor"
        );
        pushNotification(
          "Audit Schedule Dispatched",
          `Schedule for ${audit.process} (${audit.id}) dispatched to all stakeholders.`,
          "Head"
        );
        pushNotification(
          "Audit Schedule Shared",
          `Schedule for ${audit.process} (${audit.id}) shared with Course Coordinators, Trust Head, and Internal Auditors.`,
          "qm"
        );
      }

      showToast(`Audit ${audit.id} schedule shared with Course Coordinators, Trust Head, and Internal Auditors! Audit is now active.`);
    } catch (err) {
      showToast(err.message || "Failed to share audit schedule", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Internal Auditor Submits Noticing Sheet -> Shares to QMS Coordinator ONLY
  const handleNoticingSheetSubmit = async (e) => {
    e.preventDefault();
    if (!noticingSheetAudit) return;
    const audit = noticingSheetAudit;
    const payload = {
      sheetNo: `NS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      summary: noticingSheetData.summary || "Audit concluded. Non-conformance items identified.",
      fileName: "Noticing_Sheet_Signed.pdf",
      submittedBy: `${currentUser?.name || audit.internalAuditor?.name} (Internal Auditor)`,
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

    setNoticingSheetAudit(null);
    setNoticingSheetData({
      summary: "",
      clause: "ISO 9001:2015 Clause 8.5.1",
      ncDescription: "",
      targetDate: ""
    });

    try {
      await submitNoticingSheet(audit.id, payload);

      if (pushNotification) {
        pushNotification(
          "Noticing Sheet Submitted by Auditor",
          `Internal Auditor (${currentUser?.name || audit.internalAuditor?.name}) submitted Noticing Sheet for ${audit.process} (${audit.id}). Please review findings and issue NC Document.`,
          "qm"
        );
      }

      showToast(`Noticing Sheet submitted and shared with QMS Coordinator only for review!`);
    } catch (err) {
      showToast(err.message || "Failed to submit noticing sheet", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // 5. QMS Coordinator Shares NC Docs to Auditor & Auditee
  const handleShareNCDocsSubmit = async () => {
    if (!ncDocsAudit) return;
    const audit = ncDocsAudit;
    const remarks = ncDocsRemarks;
    setNcDocsAudit(null);

    try {
      await shareNCDocs(audit.id, { remarks });

      if (pushNotification) {
        pushNotification(
          "NC Docs Issued - Corrective Action Required",
          `QMS Coordinator has issued NC Docs for ${audit.process} (${audit.id}). Please review findings, take corrective action, and close the NC.`,
          "owner"
        );
        pushNotification(
          "NC Docs Distributed to Auditee",
          `NC Docs for ${audit.process} (${audit.id}) distributed to Auditee.`,
          "auditor"
        );
      }

      showToast(`NC Docs shared to Internal Auditor and Auditee (${audit.internalAuditee?.name})!`);
    } catch (err) {
      showToast(err.message || "Failed to share NC docs", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // 6. Auditee (Course Coordinator) Closes Process & Passes to QMS Coordinator
  const handleAuditeeCloseSubmit = async (e) => {
    e.preventDefault();
    if (!auditeeCloseAudit) return;
    const audit = auditeeCloseAudit;
    const actorRole = isAuditor ? "Internal Auditor" : "Course Coordinator";
    const actorName = currentUser?.name || (isAuditor ? audit.internalAuditor?.name : audit.internalAuditee?.name) || "Course Coordinator";
    const payload = {
      rootCause: auditeeClosureData.rootCause || "Operational procedure delay addressed and non-conformance closed.",
      correctiveAction: auditeeClosureData.correctiveAction,
      evidenceFileName: auditeeClosureData.evidenceFileName || "CAPA_Evidence_Signed.pdf",
      closedBy: `${actorName} (${actorRole})`
    };

    setAuditeeCloseAudit(null);
    setAuditeeClosureData({ rootCause: "", correctiveAction: "", evidenceFileName: "CAPA_Evidence_Signed.pdf" });

    try {
      await submitAuditeeClosure(audit.id, payload);

      if (pushNotification) {
        pushNotification(
          "Audit Process Closed by Auditee - Final Sign-off Required",
          `Internal audit process for ${audit.process} (${audit.id}) has been closed with CAPA by Course Coordinator (${actorName}). Passed to QMS Coordinator for final sign-off.`,
          "qm"
        );
        pushNotification(
          "Internal Audit Process Closed & Passed to QMS",
          `Internal audit process for ${audit.process} (${audit.id}) closed by Course Coordinator (${actorName}) and passed to QMS Coordinator for sign-off.`,
          "all"
        );
      }

      showToast(`Audit process closed and passed to QMS Coordinator for final sign-off!`);
    } catch (err) {
      showToast(err.message || "Failed to submit closure", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // 7. QMS Coordinator Final Close -> Whole Process is Completed!
  const handleFinalCloseSubmit = async () => {
    if (!finalCloseAuditItem) return;
    const audit = finalCloseAuditItem;
    const remarks = finalCloseRemarks;
    setFinalCloseAuditItem(null);

    try {
      await finalCloseAudit(audit.id, remarks);

      if (pushNotification) {
        pushNotification(
          "Internal Audit Completed & Officially Closed",
          `Internal Audit (${audit.id}) for ${audit.process} is 100% complete and closed.`,
          "all"
        );
      }

      showToast(`Internal Audit ${audit.id} officially closed! Marked as Closed.`);
    } catch (err) {
      showToast(err.message || "Failed to finalize audit closure", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Status Badge styling helper (Tailored per role, with clear green Closed badge)
  const renderStatusBadge = (audit) => {
    const isClosed =
      audit.stage >= 7 ||
      (audit.stage >= 6 && audit.qmsFinalClosure?.closed) ||
      audit.status === "Closed" ||
      audit.status === "Completed";

    const badgeBase = {
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      padding: "3px 8px",
      borderRadius: "5px",
      fontSize: "12px",
      fontWeight: "600",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      maxWidth: "100%",
      boxSizing: "border-box"
    };

    if (isClosed) {
      return (
        <span
          title="Audit Concluded & Closed"
          style={{
            ...badgeBase,
            color: "#166534",
            background: "#dcfce7",
            border: "1px solid #bbf7d0"
          }}
        >
          <CheckCircle2 size={13} style={{ flexShrink: 0 }} /> Closed
        </span>
      );
    }

    if (audit.stage === 6) {
      if (isQMS) {
        return (
          <span
            title="Action Required: Final Sign-off"
            style={{
              ...badgeBase,
              fontWeight: "700",
              color: "#1e40af",
              background: "#dbeafe",
              border: "1px solid #93c5fd"
            }}
          >
            <Clock size={13} style={{ flexShrink: 0 }} /> Action: Final Sign-off
          </span>
        );
      }
      return (
        <span
          title="Process Closed (Pending QMS Sign-off)"
          style={{
            ...badgeBase,
            color: "#0d9488",
            background: "#f0fdfa",
            border: "1px solid #99f6e4"
          }}
        >
          <CheckCircle2 size={13} style={{ flexShrink: 0 }} /> Process Closed
        </span>
      );
    }

    if (isAuditee) {
      switch (audit.stage) {
        case 5:
          return (
            <span
              title="Action Required: Submit CAPA & Close"
              style={{
                ...badgeBase,
                fontWeight: "700",
                color: "#9a3412",
                background: "#ffedd5",
                border: "1px solid #fed7aa"
              }}
            >
              <AlertCircle size={13} style={{ flexShrink: 0 }} /> Action: Submit CAPA
            </span>
          );
        case 4:
          return (
            <span
              title="Noticing Sheet Under Review"
              style={{
                ...badgeBase,
                color: "#6d28d9",
                background: "#f5f3ff",
                border: "1px solid #ddd6fe"
              }}
            >
              <Clock size={13} style={{ flexShrink: 0 }} /> Under Review
            </span>
          );
        default:
          return (
            <span
              title="Audit Scheduled (In Progress)"
              style={{
                ...badgeBase,
                color: "#334155",
                background: "#f8fafc",
                border: "1px solid #cbd5e1"
              }}
            >
              <Calendar size={13} style={{ flexShrink: 0 }} /> Scheduled
            </span>
          );
      }
    }

    if (isAuditor) {
      switch (audit.stage) {
        case 5:
          return (
            <span
              title="NC Docs Issued (Action Required)"
              style={{
                ...badgeBase,
                color: "#b45309",
                background: "#fffbeb",
                border: "1px solid #fcd34d"
              }}
            >
              <Clock size={13} style={{ flexShrink: 0 }} /> NC Docs Issued
            </span>
          );
        case 4:
          return (
            <span
              title="Noticing Sheet Submitted"
              style={{
                ...badgeBase,
                color: "#6d28d9",
                background: "#f5f3ff",
                border: "1px solid #ddd6fe"
              }}
            >
              <CheckCircle2 size={13} style={{ flexShrink: 0 }} /> Sheet Submitted
            </span>
          );
        case 3:
        default:
          return (
            <span
              title="Ready to Conduct Audit (Submit Noticing Sheet)"
              style={{
                ...badgeBase,
                color: "#0369a1",
                background: "#f0f9ff",
                border: "1px solid #bae6fd"
              }}
            >
              <Clock size={13} style={{ flexShrink: 0 }} /> Ready to Audit
            </span>
          );
      }
    }

    // QMS Coordinator and Trust Head status view
    switch (audit.stage) {
      case 5:
        return (
          <span
            title="NC Docs Shared with Stakeholders"
            style={{
              ...badgeBase,
              color: "#b45309",
              background: "#fffbeb",
              border: "1px solid #fcd34d"
            }}
          >
            <Clock size={13} style={{ flexShrink: 0 }} /> NC Docs Shared
          </span>
        );
      case 4:
        return (
          <span
            title="Noticing Sheet Received (Action Required: Share NC Docs)"
            style={{
              ...badgeBase,
              fontWeight: "700",
              color: "#6d28d9",
              background: "#f5f3ff",
              border: "1px solid #ddd6fe"
            }}
          >
            <Clock size={13} style={{ flexShrink: 0 }} /> Action: Share NC Docs
          </span>
        );
      case 3:
        return (
          <span
            title="Schedule Dispatched (Awaiting Auditor Sheet)"
            style={{
              ...badgeBase,
              color: "#0f766e",
              background: "#f0fdfa",
              border: "1px solid #99f6e4"
            }}
          >
            <Clock size={13} style={{ flexShrink: 0 }} /> Schedule Dispatched
          </span>
        );
      case 2.5:
        return (
          <span
            title="Approved by Trust Head (Pending QMS Distribution)"
            style={{
              ...badgeBase,
              color: "#0369a1",
              background: "#f0f9ff",
              border: "1px solid #bae6fd"
            }}
          >
            <Clock size={13} style={{ flexShrink: 0 }} /> Approved by Head
          </span>
        );
      case 2:
      default:
        return (
          <span
            title="Awaiting Trust Head Formal Approval"
            style={{
              ...badgeBase,
              color: "#1d4ed8",
              background: "#eff6ff",
              border: "1px solid #bfdbfe"
            }}
          >
            <Clock size={13} style={{ flexShrink: 0 }} /> Awaiting Approval
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

      {/* Clean Minimal Header Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "#0f2233" }}>
            {isAuditee
              ? "Internal Quality Audits (Course Department)"
              : isAuditor
              ? "Internal Quality Audit Inspections"
              : "Internal Quality Audit"}
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}>
            {isAuditee
              ? "Monitor scheduled audits for your course process, review non-conformance findings, and submit corrective actions (CAPA)."
              : isAuditor
              ? "Conduct audits, record objective evidence, submit Noticing Sheets, and verify closed non-conformances."
              : "Manage ISO 9001:2015 internal quality audits, schedule authorizations, and non-conformance resolutions."}
          </p>
        </div>

        {isQMS && (
          <button
            type="button"
            className="primary-button btn-blue"
            onClick={() => {
              setScheduleForm({ date: "", process: "", customProcess: "", auditorName: "", customAuditor: "", auditeeName: "", customAuditee: "" });
              setShowScheduleModal(true);
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px", fontSize: "13px" }}
          >
            <Plus size={15} />
            <span>Schedule Audit</span>
          </button>
        )}
      </div>

      {/* Filter Tabs & Search & Process Selector */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {(isAuditee
            ? [
                { key: "all", label: `My Process Audits (${stats.total})` },
                { key: "pending", label: `Action Required (${stats.pendingAction})` },
                { key: "in_progress", label: `In Progress (${stats.inProgress})` },
                { key: "completed", label: `Completed (${stats.completed})` }
              ]
            : isAuditor
            ? [
                { key: "all", label: `All Active Audits (${stats.total})` },
                { key: "pending", label: `Awaiting My Sheet (${stats.pendingAction})` },
                { key: "in_progress", label: `In Progress (${stats.inProgress})` },
                { key: "completed", label: `Completed (${stats.completed})` }
              ]
            : [
                { key: "all", label: `All (${stats.total})` },
                { key: "pending", label: "My Actions" },
                { key: "in_progress", label: `In Progress (${stats.inProgress})` },
                { key: "completed", label: `Completed (${stats.completed})` }
              ]
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setFilterStatus(t.key)}
              style={{
                padding: "6px 12px",
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
          <select
            value={filterProcess}
            onChange={(e) => setFilterProcess(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              fontSize: "12px",
              background: "#ffffff",
              color: "#334155"
            }}
            title="Filter by Process"
          >
            <option value="all">{isAuditee ? "All My Processes" : "All Processes"} ({systemProcesses.length})</option>
            {systemProcesses.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Search audit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              fontSize: "12px",
              width: "180px"
            }}
          />
        </div>
      </div>

      {/* Clean Table of Audits */}
      <div className="audit-table-wrapper">
        <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse", textAlign: "left", fontSize: "13px", minWidth: "980px" }}>
          <colgroup>
            <col style={{ width: "20%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "23%" }} />
            <col style={{ width: "19%" }} />
          </colgroup>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: "600", height: "42px" }}>
              <th style={{ padding: "10px 12px", width: "20%", boxSizing: "border-box" }}>Audit Ref & Process</th>
              <th style={{ padding: "10px 12px", width: "10%", boxSizing: "border-box" }}>Date</th>
              <th style={{ padding: "10px 12px", width: "14%", boxSizing: "border-box" }}>Internal Auditor</th>
              <th style={{ padding: "10px 12px", width: "14%", boxSizing: "border-box" }}>Internal Auditee</th>
              <th style={{ padding: "10px 12px", width: "23%", boxSizing: "border-box" }}>Status</th>
              <th style={{ padding: "10px 12px", width: "19%", textAlign: "right", boxSizing: "border-box" }}>Action</th>
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
                    style={{ borderBottom: "1px solid #f1f5f9", height: "56px" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* 1. Audit Ref & Process */}
                    <td style={{ padding: "8px 12px", verticalAlign: "middle", boxSizing: "border-box", overflow: "hidden" }}>
                      <span style={{ fontFamily: "monospace", fontWeight: "700", fontSize: "11px", color: "var(--navy)", background: "#edf4fa", padding: "1px 6px", borderRadius: "4px", display: "inline-block" }}>
                        {audit.id}
                      </span>
                      <strong
                        style={{
                          display: "block",
                          color: "#0f172a",
                          marginTop: "2px",
                          fontSize: "12.5px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}
                        title={audit.process}
                      >
                        {audit.process}
                      </strong>
                    </td>

                    {/* 2. Audit Dates */}
                    <td style={{ padding: "8px 12px", verticalAlign: "middle", boxSizing: "border-box", color: "#334155", whiteSpace: "nowrap", overflow: "hidden" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        <Calendar size={13} color="#64748b" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: "12.5px" }}>{audit.scheduledDate}</span>
                      </div>
                    </td>

                    {/* 3. Internal Auditor */}
                    <td style={{ padding: "8px 12px", verticalAlign: "middle", boxSizing: "border-box", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={audit.internalAuditor?.name}>
                      <span style={{ color: "#0f172a", fontWeight: "500", fontSize: "12.5px", display: "block", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {audit.internalAuditor?.name}
                      </span>
                    </td>

                    {/* 4. Internal Auditee */}
                    <td style={{ padding: "8px 12px", verticalAlign: "middle", boxSizing: "border-box", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={audit.internalAuditee?.name}>
                      <span style={{ color: "#0f172a", fontWeight: "500", fontSize: "12.5px", display: "block", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {audit.internalAuditee?.name}
                      </span>
                    </td>

                    {/* 5. Status Badge */}
                    <td style={{ padding: "8px 12px", verticalAlign: "middle", boxSizing: "border-box", whiteSpace: "nowrap", overflow: "hidden" }}>
                      <div style={{ display: "flex", alignItems: "center", overflow: "hidden", maxWidth: "100%" }}>
                        {renderStatusBadge(audit)}
                      </div>
                    </td>

                    {/* 6. Contextual Action Button */}
                    <td style={{ padding: "8px 12px", verticalAlign: "middle", boxSizing: "border-box", textAlign: "right", whiteSpace: "nowrap", overflow: "hidden" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "flex-end", gap: "6px", width: "100%", height: "30px", whiteSpace: "nowrap" }}>
                        {/* Stage 2: Trust Head Confirm Action */}
                        {audit.stage === 2 && isTrustHead && (
                          <button
                            type="button"
                            className="primary-button btn-green"
                            onClick={() => setConfirmingAudit(audit)}
                            style={{ padding: "5px 10px", fontSize: "12px", whiteSpace: "nowrap", height: "30px", display: "inline-flex", alignItems: "center" }}
                          >
                            <Check size={13} style={{ marginRight: "4px", flexShrink: 0 }} />
                            <span>Confirm</span>
                          </button>
                        )}

                        {/* Stage 2.5: QMS Coordinator Share Schedule to All */}
                        {audit.stage === 2.5 && isQMS && (
                          <button
                            type="button"
                            className="primary-button btn-blue"
                            onClick={() => setShareScheduleAudit(audit)}
                            style={{ padding: "5px 10px", fontSize: "12px", whiteSpace: "nowrap", height: "30px", display: "inline-flex", alignItems: "center" }}
                          >
                            <Send size={13} style={{ marginRight: "4px", flexShrink: 0 }} />
                            <span>Share Schedule</span>
                          </button>
                        )}

                        {/* Stage 3: Internal Auditor Noticing Sheet Action (ONLY Internal Auditor) */}
                        {audit.stage === 3 && isAuditor && (
                          <button
                            type="button"
                            className="primary-button btn-blue"
                            onClick={() => setNoticingSheetAudit(audit)}
                            style={{ padding: "5px 10px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap", height: "30px" }}
                          >
                            <FileCheck2 size={13} style={{ flexShrink: 0 }} />
                            <span>Noticing Sheet</span>
                          </button>
                        )}

                        {/* Stage 4: QMS Coordinator Share NC Docs Action */}
                        {audit.stage === 4 && isQMS && (
                          <button
                            type="button"
                            className="primary-button btn-blue"
                            onClick={() => setNcDocsAudit(audit)}
                            style={{ padding: "5px 10px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap", height: "30px" }}
                          >
                            <Send size={13} style={{ flexShrink: 0 }} />
                            <span>Share NC Docs</span>
                          </button>
                        )}

                        {/* Stage 5: Auditee (Course Coordinator) Close Process Action */}
                        {audit.stage === 5 && (isAuditee || isQMS) && (
                          <button
                            type="button"
                            className="primary-button btn-green"
                            onClick={() => setAuditeeCloseAudit(audit)}
                            style={{ padding: "5px 10px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap", height: "30px" }}
                            title="Close Process & Submit CAPA"
                          >
                            <UploadCloud size={13} style={{ flexShrink: 0 }} />
                            <span>Close Process</span>
                          </button>
                        )}

                        {/* Stage 6: QMS Coordinator Final Sign-off Action */}
                        {audit.stage === 6 && isQMS && (
                          <button
                            type="button"
                            className="primary-button btn-green"
                            onClick={() => setFinalCloseAuditItem(audit)}
                            style={{ padding: "5px 10px", fontSize: "12px", whiteSpace: "nowrap", height: "30px", display: "inline-flex", alignItems: "center" }}
                          >
                            <CheckCheck size={14} style={{ marginRight: "4px", flexShrink: 0 }} />
                            <span>Sign Off</span>
                          </button>
                        )}

                        {/* View details */}
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => setViewingAudit(audit)}
                          style={{ padding: "5px 8px", fontSize: "12px", height: "30px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
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

      {/* =========================================================================
          SCHEDULE AUDITING MODAL (Empty inputs filled by QMS Coordinator)
          ========================================================================= */}
      {/* =========================================================================
          SCHEDULE AUDITING MODAL (Compact 2-Column Layout - Fits Screen with 0 Scrolling)
          ========================================================================= */}
      {showScheduleModal && (
        <Modal
          title="Schedule Internal Audit"
          onClose={() => setShowScheduleModal(false)}
          maxWidth="620px"
        >
          <form onSubmit={handleScheduleSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
              {/* Row 1: Process to be Audited (Full Width) */}
              <div>
                <label style={{ display: "block", marginBottom: "2px", fontWeight: "600", fontSize: "11.5px", color: "#334155" }}>
                  Process to be Audited <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  required
                  value={scheduleForm.process}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, process: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "6px 10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12px",
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
                      marginTop: "4px",
                      padding: "5px 10px",
                      borderRadius: "6px",
                      border: "1px solid #94a3b8",
                      fontSize: "12px"
                    }}
                  />
                )}
              </div>

              {/* Row 2: Audit Date (Single Date Field) */}
              <div>
                <label style={{ display: "block", marginBottom: "2px", fontWeight: "600", fontSize: "11.5px", color: "#334155" }}>
                  Audit Date <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="date"
                  required
                  value={scheduleForm.date}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                  style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#ffffff", color: "#0f172a" }}
                />
              </div>

              {/* Row 3: Internal Auditor & Internal Auditee (Responsive) */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "2px", fontWeight: "600", fontSize: "11.5px", color: "#334155" }}>
                    Internal Auditor <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <select
                    required
                    value={scheduleForm.auditorName}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, auditorName: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                      background: "#ffffff",
                      color: "#0f172a"
                    }}
                  >
                    <option value="">-- Select Internal Auditor --</option>
                    <option value="Vikas Deshmukh">Vikas Deshmukh (Lead Auditor)</option>
                    <option value="Suresh Menon">Suresh Menon (Internal Auditor)</option>
                    <option value="Dr. Meenakshi Sundaram">Dr. Meenakshi Sundaram (Senior Auditor)</option>
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
                        marginTop: "4px",
                        padding: "5px 10px",
                        borderRadius: "6px",
                        border: "1px solid #94a3b8",
                        fontSize: "12px"
                      }}
                    />
                  )}
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "2px", fontWeight: "600", fontSize: "11.5px", color: "#334155" }}>
                    Internal Auditee (Course Coord) <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <select
                    required
                    value={scheduleForm.auditeeName}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, auditeeName: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                      background: "#ffffff",
                      color: "#0f172a"
                    }}
                  >
                    <option value="">-- Select Course Coordinator --</option>
                    <option value="Priya Sharma">Priya Sharma (Adv Computing)</option>
                    <option value="Dr. Rajesh Verma">Dr. Rajesh Verma (AI Division)</option>
                    <option value="Sunita Patil">Sunita Patil (Cyber Security)</option>
                    <option value="Rohan Desai">Rohan Desai (Training Coord)</option>
                    <option value="Karthik Verma">Karthik Verma (IT Systems)</option>
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
                        marginTop: "4px",
                        padding: "5px 10px",
                        borderRadius: "6px",
                        border: "1px solid #94a3b8",
                        fontSize: "12px"
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Row 4: Submit & Cancel Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px", paddingTop: "8px", borderTop: "1px solid #f1f5f9" }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowScheduleModal(false)}
                  disabled={submitting}
                  style={{ padding: "6px 14px", fontSize: "12px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button btn-blue"
                  disabled={
                    submitting ||
                    !scheduleForm.date ||
                    !(scheduleForm.process === "__custom__" ? scheduleForm.customProcess.trim() : scheduleForm.process.trim()) ||
                    !(scheduleForm.auditorName === "__custom__" ? scheduleForm.customAuditor.trim() : scheduleForm.auditorName.trim()) ||
                    !(scheduleForm.auditeeName === "__custom__" ? scheduleForm.customAuditee.trim() : scheduleForm.auditeeName.trim())
                  }
                  style={{ padding: "6px 16px", fontSize: "12px" }}
                >
                  <span>{submitting ? "Submitting..." : "Schedule Audit (Submit to Trust Head)"}</span>
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
          maxWidth="540px"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ fontSize: "12.5px", color: "#334155" }}>
              Process: <strong>{confirmingAudit.process}</strong> ({confirmingAudit.scheduledDate})
            </div>

            <label>
              <span style={{ display: "block", marginBottom: "3px", fontWeight: "600", fontSize: "12px" }}>
                Remarks / Authorization Notes
              </span>
              <textarea
                rows={2}
                value={confirmRemarks}
                onChange={(e) => setConfirmRemarks(e.target.value)}
                style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
            </label>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "4px" }}>
              <button type="button" className="secondary-button" onClick={() => setConfirmingAudit(null)} disabled={submitting} style={{ padding: "7px 14px", fontSize: "12.5px" }}>
                Cancel
              </button>
              <button type="button" className="primary-button btn-green" onClick={handleConfirmSubmit} disabled={submitting} style={{ padding: "7px 16px", fontSize: "12.5px" }}>
                <Check size={14} style={{ marginRight: "4px" }} />
                <span>{submitting ? "Confirming..." : "Confirm Schedule"}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* =========================================================================
          QMS COORDINATOR SHARE SCHEDULE MODAL (Shares to Course Coordinators, Trust Head, Auditors)
          ========================================================================= */}
      {shareScheduleAudit && (
        <Modal
          title={`Share Audit Schedule: ${shareScheduleAudit.id}`}
          onClose={() => setShareScheduleAudit(null)}
          maxWidth="560px"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ padding: "10px 12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6px", fontSize: "12.5px", color: "#166534" }}>
              <strong>Schedule Approved by Trust Head:</strong> Anita Rao has ratified the schedule for <strong>{shareScheduleAudit.process}</strong> ({shareScheduleAudit.scheduledDate}).
            </div>

            <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#334155" }}>
              Click below to officially share the audit schedule document with all required stakeholders. Once shared, the Internal Auditor is authorized to begin the audit.
            </p>

            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "10px 12px" }}>
              <strong style={{ fontSize: "12px", color: "#0f172a", display: "block", marginBottom: "6px" }}>Stakeholder Recipients:</strong>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", color: "#475569" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircle2 size={14} color="#16a34a" />
                  <span><strong>Internal Auditee:</strong> {shareScheduleAudit.internalAuditee?.name} (Course Coordinator)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircle2 size={14} color="#16a34a" />
                  <span><strong>Internal Auditor:</strong> {shareScheduleAudit.internalAuditor?.name} (Audit Cell)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircle2 size={14} color="#16a34a" />
                  <span><strong>Trust Head:</strong> Anita Rao (Executive Office)</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "6px" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShareScheduleAudit(null)}
                disabled={submitting}
                style={{ padding: "7px 14px", fontSize: "12.5px" }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button btn-blue"
                onClick={handleShareScheduleSubmit}
                disabled={submitting}
                style={{ padding: "7px 16px", fontSize: "12.5px" }}
              >
                <Send size={14} style={{ marginRight: "4px" }} />
                <span>{submitting ? "Sharing Schedule..." : "Share Schedule to All"}</span>
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
          maxWidth="620px"
        >
          <form onSubmit={handleNoticingSheetSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <label>
                  <span style={{ display: "block", marginBottom: "2px", fontWeight: "600", fontSize: "11.5px", color: "#334155" }}>
                    ISO 9001 Clause
                  </span>
                  <input
                    type="text"
                    value={noticingSheetData.clause}
                    onChange={(e) => setNoticingSheetData({ ...noticingSheetData, clause: e.target.value })}
                    style={{ width: "100%", padding: "5px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                  />
                </label>

                <label>
                  <span style={{ display: "block", marginBottom: "2px", fontWeight: "600", fontSize: "11.5px", color: "#334155" }}>
                    Resolution Target Date
                  </span>
                  <input
                    type="date"
                    value={noticingSheetData.targetDate}
                    onChange={(e) => setNoticingSheetData({ ...noticingSheetData, targetDate: e.target.value })}
                    style={{ width: "100%", padding: "5px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                  />
                </label>
              </div>

              <label>
                <span style={{ display: "block", marginBottom: "2px", fontWeight: "600", fontSize: "11.5px", color: "#334155" }}>
                  Audit Observations Summary <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Concluded across lectures and lab tracking..."
                  value={noticingSheetData.summary}
                  onChange={(e) => setNoticingSheetData({ ...noticingSheetData, summary: e.target.value })}
                  style={{ width: "100%", padding: "5px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                />
              </label>

              <label>
                <span style={{ display: "block", marginBottom: "2px", fontWeight: "600", fontSize: "11.5px", color: "#334155" }}>
                  Non-Conformance (NC) Finding Description <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Practical lab attendance logbook lacked weekly coordinator signatures..."
                  value={noticingSheetData.ncDescription}
                  onChange={(e) => setNoticingSheetData({ ...noticingSheetData, ncDescription: e.target.value })}
                  style={{ width: "100%", padding: "5px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px", paddingTop: "6px", borderTop: "1px solid #f1f5f9" }}>
                <button type="button" className="secondary-button" onClick={() => setNoticingSheetAudit(null)} disabled={submitting} style={{ padding: "6px 14px", fontSize: "12px" }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button btn-blue"
                  disabled={submitting || !noticingSheetData.summary.trim() || !noticingSheetData.ncDescription.trim()}
                  style={{ padding: "6px 16px", fontSize: "12px" }}
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
          maxWidth="560px"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ padding: "8px 10px", background: "#fffbeb", borderRadius: "6px", border: "1px solid #fcd34d", fontSize: "12px", color: "#92400e" }}>
              <strong>Auditor Findings:</strong> {ncDocsAudit.noticingSheet?.findings?.[0]?.description || ncDocsAudit.noticingSheet?.summary}
            </div>

            <label>
              <span style={{ display: "block", marginBottom: "3px", fontWeight: "600", fontSize: "12px" }}>
                QMS Directive & CAPA Remarks for Auditee
              </span>
              <textarea
                rows={2}
                value={ncDocsRemarks}
                onChange={(e) => setNcDocsRemarks(e.target.value)}
                style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
            </label>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "4px" }}>
              <button type="button" className="secondary-button" onClick={() => setNcDocsAudit(null)} disabled={submitting} style={{ padding: "7px 14px", fontSize: "12.5px" }}>
                Cancel
              </button>
              <button type="button" className="primary-button btn-blue" onClick={handleShareNCDocsSubmit} disabled={submitting} style={{ padding: "7px 16px", fontSize: "12.5px" }}>
                <Send size={14} style={{ marginRight: "4px" }} />
                <span>{submitting ? "Sharing..." : "Share NC Docs"}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* =========================================================================
          AUDITEE CLOSE PROCESS MODAL (Only Auditee can close this)
          ========================================================================= */}
      {auditeeCloseAudit && (
        <Modal
          title={`Close Audit Process: ${auditeeCloseAudit.id}`}
          onClose={() => setAuditeeCloseAudit(null)}
          maxWidth="620px"
        >
          <form onSubmit={handleAuditeeCloseSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ padding: "6px 10px", background: "#f0fdf4", borderRadius: "6px", border: "1px solid #bbf7d0", fontSize: "11.5px", color: "#166534" }}>
                <strong>Close Process & Record CAPA:</strong> Document the Root Cause Analysis, Corrective Action Plan (CAPA), and verification evidence to close this audit process and pass it to QMS Coordinator for final sign-off.
              </div>

              <div style={{ padding: "6px 10px", background: "#fef3c7", borderRadius: "6px", border: "1px solid #fde68a", fontSize: "11.5px", color: "#92400e" }}>
                <strong>NC Finding:</strong> {auditeeCloseAudit.noticingSheet?.findings?.[0]?.description || auditeeCloseAudit.ncDocs?.remarks || "Documentation record gap."}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px" }}>
                <label>
                  <span style={{ display: "block", marginBottom: "2px", fontWeight: "600", fontSize: "11.5px", color: "#334155" }}>
                    Root Cause Analysis <span style={{ color: "#ef4444" }}>*</span>
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Root cause explanation..."
                    value={auditeeClosureData.rootCause}
                    onChange={(e) => setAuditeeClosureData({ ...auditeeClosureData, rootCause: e.target.value })}
                    style={{ width: "100%", padding: "5px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                  />
                </label>

                <label>
                  <span style={{ display: "block", marginBottom: "2px", fontWeight: "600", fontSize: "11.5px", color: "#334155" }}>
                    Evidence Attached
                  </span>
                  <input
                    type="text"
                    readOnly
                    value={auditeeClosureData.evidenceFileName}
                    style={{ width: "100%", padding: "5px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#f8fafc", fontSize: "12px" }}
                  />
                </label>
              </div>

              <label>
                <span style={{ display: "block", marginBottom: "2px", fontWeight: "600", fontSize: "11.5px", color: "#334155" }}>
                  Corrective Action Taken <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <textarea
                  rows={2}
                  required
                  placeholder="Corrective actions completed..."
                  value={auditeeClosureData.correctiveAction}
                  onChange={(e) => setAuditeeClosureData({ ...auditeeClosureData, correctiveAction: e.target.value })}
                  style={{ width: "100%", padding: "5px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px", paddingTop: "6px", borderTop: "1px solid #f1f5f9" }}>
                <button type="button" className="secondary-button" onClick={() => setAuditeeCloseAudit(null)} disabled={submitting} style={{ padding: "6px 14px", fontSize: "12px" }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button btn-green"
                  disabled={submitting || !auditeeClosureData.rootCause.trim() || !auditeeClosureData.correctiveAction.trim()}
                  style={{ padding: "6px 16px", fontSize: "12px" }}
                >
                  <UploadCloud size={14} style={{ marginRight: "4px" }} />
                  <span>{submitting ? "Closing Process..." : "Close Process & Pass to QMS Coordinator"}</span>
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
          maxWidth="560px"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ padding: "8px 10px", background: "#ecfdf5", borderRadius: "6px", border: "1px solid #a7f3d0", fontSize: "12px", color: "#065f46" }}>
              <strong>Auditee Action Taken:</strong> {finalCloseAuditItem.auditeeClosure?.correctiveAction}
            </div>

            <label>
              <span style={{ display: "block", marginBottom: "3px", fontWeight: "600", fontSize: "12px" }}>
                Final QMS Verification & Closure Sign-off Remarks
              </span>
              <textarea
                rows={2}
                value={finalCloseRemarks}
                onChange={(e) => setFinalCloseRemarks(e.target.value)}
                style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
            </label>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "4px" }}>
              <button type="button" className="secondary-button" onClick={() => setFinalCloseAuditItem(null)} disabled={submitting} style={{ padding: "7px 14px", fontSize: "12.5px" }}>
                Cancel
              </button>
              <button type="button" className="primary-button btn-green" onClick={handleFinalCloseSubmit} disabled={submitting} style={{ padding: "7px 16px", fontSize: "12.5px" }}>
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
          maxWidth="600px"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "65vh", overflowY: "auto" }}>
            <div style={{ padding: "8px 10px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: "13px", color: "var(--navy)" }}>{viewingAudit.process}</strong>
                {renderStatusBadge(viewingAudit)}
              </div>
              <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px" }}>
                Dates: <strong>{viewingAudit.scheduledDate}</strong>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12px" }}>
              <div style={{ padding: "6px 8px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                <strong>Auditor:</strong> {viewingAudit.internalAuditor?.name}
              </div>
              <div style={{ padding: "6px 8px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                <strong>Auditee:</strong> {viewingAudit.internalAuditee?.name}
              </div>
            </div>

            {viewingAudit.noticingSheet && (
              <div style={{ padding: "8px 10px", background: "#f5f3ff", borderRadius: "6px", border: "1px solid #ddd6fe", fontSize: "12px" }}>
                <strong style={{ color: "#6d28d9" }}>Noticing Sheet Finding:</strong>
                <div style={{ marginTop: "2px" }}>{viewingAudit.noticingSheet.findings?.[0]?.description || viewingAudit.noticingSheet.summary}</div>
              </div>
            )}

            {viewingAudit.auditeeClosure && (
              <div style={{ padding: "8px 10px", background: "#ecfdf5", borderRadius: "6px", border: "1px solid #a7f3d0", fontSize: "12px" }}>
                <strong style={{ color: "#065f46" }}>Auditee Corrective Action:</strong>
                <div style={{ marginTop: "2px" }}>{viewingAudit.auditeeClosure.correctiveAction}</div>
              </div>
            )}

            {/* Timeline: Visible to All Stakeholders */}
            <div>
              <strong style={{ fontSize: "11.5px", color: "#0f172a", display: "block", marginBottom: "4px" }}>
                Audit Timeline
              </strong>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {(viewingAudit.timeline || []).map((t, idx) => (
                  <div key={idx} style={{ padding: "5px 7px", background: "#f8fafc", borderRadius: "4px", border: "1px solid #e2e8f0", fontSize: "11px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "600", color: "#0f172a" }}>
                      <span>{t.action}</span>
                      <span style={{ color: "#64748b" }}>{t.timestamp}</span>
                    </div>
                    <div style={{ color: "#475569" }}>{t.details}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
              <button type="button" className="secondary-button" onClick={() => setViewingAudit(null)} style={{ padding: "6px 14px", fontSize: "12px" }}>
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
