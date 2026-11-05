import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ShieldCheck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
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
  Shield,
  Briefcase
} from "lucide-react";
import { useApp } from "../context/AppContext";
import PageIntro from "../components/common/PageIntro";
import StatCard from "../components/common/StatCard";
import Modal from "../components/tasks/Modal";

// 4-Step External Audit Workflow Progress Helper
// Step 1: External Auditor schedules meeting & sends to QMS Coordinator via email
// Step 2: QMS Coordinator shares received email & meeting details to all (Course Coordinators, Trust Head, Internal Auditor)
// Step 3: External Auditor sends NC docs to QMS Coordinator only; QMS Coordinator uploads & shares to Course Coordinators ONLY
// Step 4: External Auditor approves & QMS Coordinator closes entire process
const getExternalWorkflowDetails = (audit) => {
  if (audit.stage >= 4 || audit.status === "Completed & Closed (ISO 9001 Certified)" || audit.qmsClosure?.closed) {
    return {
      step: 4,
      statusLabel: "Completed & Closed (ISO 9001 Certified)",
      badgeText: "ISO 9001 Certified",
      color: "#166534",
      bg: "#dcfce7",
      border: "#86efac"
    };
  }

  if (audit.stage === 3 || audit.status === "NC Docs Shared with Course Coordinators" || audit.ncDocument) {
    return {
      step: 3,
      statusLabel: "NC Docs Shared with Course Coordinators",
      badgeText: "NC Documents Issued",
      color: "#b45309",
      bg: "#fffbeb",
      border: "#fde68a"
    };
  }

  if (audit.stage === 2 || audit.status === "Schedule Shared to All Stakeholders" || audit.shareWithStakeholders?.shared) {
    return {
      step: 2,
      statusLabel: "Schedule Shared to All Stakeholders",
      badgeText: "Schedule Shared to All",
      color: "#4f46e5",
      bg: "#e0e7ff",
      border: "#c7d2fe"
    };
  }

  return {
    step: 1,
    statusLabel: "Audit Schedule Received (from External Auditor)",
    badgeText: "Schedule Received via Email",
    color: "#0891b2",
    bg: "#ecfeff",
    border: "#a5f3fc"
  };
};

export default function ExternalAudit() {
  const {
    externalAuditList = [],
    logExternalAuditSchedule,
    shareExternalAuditSchedule,
    uploadExternalAuditNCDocs,
    closeExternalAuditProcess,
    currentUser,
    processes = []
  } = useApp();

  // Role permissions (case-insensitive & alias-safe, with resilient localStorage fallback)
  const activeUser = currentUser || (() => {
    try {
      return JSON.parse(localStorage.getItem("qms_user") || "null");
    } catch {
      return null;
    }
  })();

  const roleLower = (activeUser?.role || "").toLowerCase();
  const titleLower = (activeUser?.roleTitle || "").toLowerCase();
  const userLower = (activeUser?.username || "").toLowerCase();

  const isQMSCoordinator = roleLower === "qm" || roleLower === "qms" || titleLower.includes("qms") || userLower.includes("qm");
  const isTrustHead = roleLower === "head" || roleLower === "trusthead" || roleLower === "qmhead" || titleLower.includes("trust head") || titleLower.includes("team head") || userLower.includes("trusthead") || userLower.includes("head");
  const isInternalAuditor = roleLower === "auditor" || titleLower.includes("auditor") || userLower.includes("auditor");
  const isCourseCoordinator = roleLower === "owner" || titleLower.includes("course coordinator") || titleLower.includes("process owner") || userLower.includes("coordinator");

  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [filterStep, setFilterStep] = useState("All");
  const [toastMessage, setToastMessage] = useState("");

  // Modals state
  const [showLogModal, setShowLogModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showUploadNCModal, setShowUploadNCModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showNCPreviewModal, setShowNCPreviewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  // Form State: Modal 1 - Log Incoming External Audit Schedule (Email from External Auditor)
  const [logForm, setLogForm] = useState({
    title: "",
    externalAgency: "TÜV SÜD South Asia Certification Body",
    auditorName: "Dr. Robert Vance",
    auditorTitle: "Lead External Auditor (ISO 9001:2015)",
    auditorEmail: "robert.vance@tuvsud.com",
    auditorPhone: "+91 98230 45678",
    scope: "Annual surveillance evaluation of academic syllabus coverage, student feedback mechanisms, laboratory safety protocols, and institutional quality governance under ISO 9001:2015 Clauses 4-10.",
    targetPeriod: "November 2026",
    scheduledDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    scheduledTime: "09:30 AM",
    venue: "Main Boardroom (Executive Council) & TÜV SÜD Virtual Video Stream",
    emailSubject: "Official Notice: ISO 9001:2015 External Audit Schedule - C-DAC Academic Quality",
    emailBody: "Dear Rahul Kumar (QMS Coordinator),\n\nThis email confirms that the ISO 9001:2015 External Surveillance Audit is scheduled for execution as indicated. Please find attached the formal audit timetable and notify your academic course coordinators, Trust Head, and internal audit cell.\n\nRegards,\nDr. Robert Vance\nLead Auditor, TÜV SÜD South Asia",
    planFileName: "TUV_ISO9001_External_Audit_Plan_2026.pdf"
  });

  // Form State: Modal 2 - Share Schedule to All Stakeholders
  const [shareForm, setShareForm] = useState({
    noticeSubject: "",
    noticeMessage: ""
  });

  // Form State: Modal 3 - Upload NC Document (Shared with Course Coordinators ONLY)
  const [ncUploadForm, setNcUploadForm] = useState({
    fileName: "",
    fileSize: "2.1 MB",
    summary: "",
    targetClosureDate: "",
    findingClause: "ISO 9001:2015 Clause 8.5.1",
    findingType: "Minor Non-Conformance",
    findingDesc: "Course delivery schedules and practical lab exercise counter-signatures require standard digital archiving.",
    findingAssignee: "Priya Sharma (Course Coordinator)"
  });

  // Form State: Modal 4 - External Auditor Approval & Process Closure
  const [closeForm, setCloseForm] = useState({
    certificateNumber: "",
    approvalDate: new Date().toISOString().split("T")[0],
    recommendation: "Unconditional recommendation for issuance and continuation of ISO 9001:2015 Quality Management Certificate.",
    remarks: "External Auditor validated all corrective actions and closed all open findings. Quality Management System endorsed."
  });

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(""), 4500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (msg) => setToastMessage(msg);

  // Open Log Modal
  const openLogModal = () => {
    setLogForm({
      title: "ISO 9001:2015 Comprehensive External Surveillance Audit",
      externalAgency: "TÜV SÜD South Asia Certification Body",
      auditorName: "Dr. Robert Vance",
      auditorTitle: "Lead External Auditor (ISO 9001:2015)",
      auditorEmail: "robert.vance@tuvsud.com",
      auditorPhone: "+91 98230 45678",
      scope: "Annual surveillance evaluation of academic syllabus coverage, student feedback mechanisms, laboratory safety protocols, and institutional quality governance under ISO 9001:2015 Clauses 4-10.",
      targetPeriod: "November 2026",
      scheduledDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      scheduledTime: "09:30 AM",
      venue: "Main Boardroom (Executive Council) & TÜV SÜD Virtual Video Stream",
      emailSubject: "Official Notice: ISO 9001:2015 External Audit Schedule - C-DAC Academic Quality",
      emailBody: "Dear Rahul Kumar (QMS Coordinator),\n\nThis email confirms that the ISO 9001:2015 External Surveillance Audit is scheduled for execution as indicated. Please find attached the formal audit timetable and notify your academic course coordinators, Trust Head, and internal audit cell.\n\nRegards,\nDr. Robert Vance\nLead Auditor, TÜV SÜD South Asia",
      planFileName: "TUV_ISO9001_External_Audit_Plan_2026.pdf"
    });
    setShowLogModal(true);
  };

  // Open Share Schedule Modal
  const openShareModal = (audit) => {
    setSelectedAudit(audit);
    setShareForm({
      noticeSubject: `External Audit Notice: ${audit.title} on ${audit.scheduledDate}`,
      noticeMessage: `All Course Coordinators, Trust Head, and Internal Auditor: Please be informed that ${audit.externalAgency} has scheduled an ISO 9001:2015 External Audit on ${audit.scheduledDate} at ${audit.scheduledTime}. Please prepare course folders, student feedback logs, and practical lab manuals.`
    });
    setShowShareModal(true);
  };

  // Open Upload NC Modal
  const openUploadNCModal = (audit) => {
    setSelectedAudit(audit);
    setNcUploadForm({
      fileName: `${audit.id}_ISO9001_External_Audit_NC_Report.pdf`,
      fileSize: "2.1 MB",
      summary: `Non-conformance report issued by External Auditor (${audit.leadAuditor?.name || "Lead Auditor"}) covering course delivery record maintenance and practical lab verification logs.`,
      targetClosureDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      findingClause: "ISO 9001:2015 Clause 8.5.1",
      findingType: "Minor Non-Conformance",
      findingDesc: "Course delivery schedules and practical lab exercise counter-signatures require standard digital archiving.",
      findingAssignee: "Priya Sharma (Course Coordinator)"
    });
    setShowUploadNCModal(true);
  };

  // Open Close Modal
  const openCloseModal = (audit) => {
    setSelectedAudit(audit);
    const agencyCode = (audit.externalAgency || "CERT").slice(0, 3).toUpperCase();
    const certNum = `ISO9001-${agencyCode}-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    setCloseForm({
      certificateNumber: certNum,
      approvalDate: new Date().toISOString().split("T")[0],
      recommendation: "Unconditional recommendation for issuance and continuation of ISO 9001:2015 Quality Management Certificate.",
      remarks: "External Auditor validated all corrective actions and closed all open findings. Quality Management System endorsed."
    });
    setShowCloseModal(true);
  };

  // Submit Step 1: Log Incoming Email Schedule
  const handleLogSubmit = async (e) => {
    e.preventDefault();
    if (!logForm.title.trim() || !logForm.scheduledDate) {
      alert("Please provide audit title and scheduled date.");
      return;
    }

    setSubmitting(true);
    setShowLogModal(false);
    try {
      await logExternalAuditSchedule(logForm);
      showToast("Incoming External Audit schedule logged! You can now share it to all stakeholders.");
    } catch (err) {
      alert(err.message || "Failed to log external audit schedule");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Step 2: Share Schedule to All Stakeholders
  const handleShareSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAudit) return;

    setSubmitting(true);
    try {
      await shareExternalAuditSchedule(selectedAudit.id, shareForm);
      setShowShareModal(false);
      showToast("Audit schedule and incoming email successfully shared to all Course Coordinators, Trust Head, and Internal Auditor!");
    } catch (err) {
      alert(err.message || "Failed to share audit schedule");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Step 3: Upload NC Document (Shared to Course Coordinators ONLY)
  const handleUploadNCSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAudit) return;

    setSubmitting(true);
    try {
      const findings = [
        {
          id: `NC-EXT-${Date.now().toString().slice(-2)}`,
          type: ncUploadForm.findingType,
          clause: ncUploadForm.findingClause,
          description: ncUploadForm.findingDesc,
          assignedTo: ncUploadForm.findingAssignee,
          deadline: ncUploadForm.targetClosureDate,
          status: "Pending Action"
        }
      ];

      await uploadExternalAuditNCDocs(selectedAudit.id, {
        fileName: ncUploadForm.fileName,
        fileSize: ncUploadForm.fileSize,
        summary: ncUploadForm.summary,
        targetClosureDate: ncUploadForm.targetClosureDate,
        findings
      });

      setShowUploadNCModal(false);
      showToast("NC Document uploaded and shared to Course Coordinators ONLY!");
    } catch (err) {
      alert(err.message || "Failed to upload NC document");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Step 4: External Auditor Approval & Process Closure
  const handleCloseSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAudit) return;

    setSubmitting(true);
    try {
      await closeExternalAuditProcess(selectedAudit.id, closeForm);
      setShowCloseModal(false);
      showToast(`External Audit closed successfully! ISO 9001:2015 Certificate (${closeForm.certificateNumber}) ratified.`);
    } catch (err) {
      alert(err.message || "Failed to close external audit");
    } finally {
      setSubmitting(false);
    }
  };

  // Download official NC Document as text/file
  const handleDownloadNCDoc = (audit) => {
    const nc = audit.ncDocument;
    if (!nc) return;

    const fileName = nc.fileName || `External_Audit_${audit.id}_NC_Report.pdf`;
    const textContent = `======================================================================
CENTRE FOR DEVELOPMENT OF ADVANCED COMPUTING (C-DAC)
ISO 9001:2015 EXTERNAL AUDIT NON-CONFORMANCE (NC) REPORT
======================================================================
Audit ID            : ${audit.id}
Audit Title         : ${audit.title}
External Agency     : ${audit.externalAgency}
Lead External Auditor: ${audit.leadAuditor?.name} (${audit.leadAuditor?.agency})
Date of Audit       : ${audit.scheduledDate}
Uploaded By         : ${nc.uploadedBy || "Rahul Kumar (QMS Coordinator)"}
Upload Timestamp    : ${nc.uploadedAt || "N/A"}
Distribution Scope  : COURSE COORDINATORS ONLY
Target Closure Date : ${nc.targetClosureDate || "2026-12-15"}
======================================================================

EXECUTIVE SUMMARY:
${nc.summary || "Non-conformances recorded during external audit requiring root cause analysis and corrective actions."}

AUDIT FINDINGS & NON-CONFORMANCE ITEMS:
${(nc.findings || [])
  .map(
    (f, idx) =>
      `Item #${idx + 1} [${f.type}]:
  Finding ID   : ${f.id}
  ISO Clause   : ${f.clause}
  Description  : ${f.description}
  Assigned To  : ${f.assignedTo}
  Target Date  : ${f.deadline}
  Status       : ${f.status}`
  )
  .join("\n\n")}

======================================================================
NOTE: This document is distributed exclusively to Course Coordinators
for immediate Root Cause Analysis (RCA) and Corrective Action Plan (CAPA).
======================================================================
`;
    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName.endsWith(".pdf") ? fileName.replace(".pdf", ".txt") : fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Downloading official NC Report: ${fileName}`);
  };

  // Download official Certificate & Closure report
  const handleDownloadCert = (audit) => {
    const cert = audit.externalAuditorApproval;
    const certNum = cert?.certificateNumber || "ISO-9001:2015-CERT";
    const fileName = `ISO9001_Certificate_${certNum}.txt`;

    const textContent = `======================================================================
CENTRE FOR DEVELOPMENT OF ADVANCED COMPUTING (C-DAC)
CERTIFICATE OF QUALITY MANAGEMENT SYSTEM ENDORSEMENT
ISO 9001:2015 COMPLIANCE RATIFICATION
======================================================================
Certificate No      : ${certNum}
Audit Title         : ${audit.title}
External Agency     : ${audit.externalAgency}
Lead External Auditor: ${audit.leadAuditor?.name}
Approval Date       : ${cert?.approvedAt || "N/A"}
Official QMS Closure: ${audit.qmsClosure?.closedAt || "N/A"}
Closure Authority   : ${audit.qmsClosure?.closedBy || "Rahul Kumar (QMS Coordinator)"}
======================================================================

AUDITOR ENDORSEMENT & RECOMMENDATION:
${cert?.recommendation || "Full recommendation for issuance and maintenance of ISO 9001:2015 Certification."}

AUDITOR REMARKS:
${cert?.remarks || "All corrective actions verified. Quality management framework compliant."}

QMS CLOSURE REMARKS:
${audit.qmsClosure?.remarks || "All divisions compliant. Process officially closed."}

======================================================================
Certified Compliant with International Standards - C-DAC Quality Office
======================================================================
`;
    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Downloading ISO 9001 Certificate: ${fileName}`);
  };

  // Role-based visibility filter
  // QMS Coordinator: Sees all stages (Stage 1 to 4)
  // Course Coordinator, Trust Head, Internal Auditor: Only see audits once shared by QMS Coordinator (stage >= 2)
  const visibleAudits = (externalAuditList || []).filter((audit) => {
    const wf = getExternalWorkflowDetails(audit);
    if (isCourseCoordinator || isTrustHead || isInternalAuditor) {
      return wf.step >= 2;
    }
    return true;
  });

  // Filter by active tab and search query
  const filteredAudits = visibleAudits.filter((audit) => {
    const wf = getExternalWorkflowDetails(audit);
    const matchesFilter =
      filterStep === "All" ||
      (filterStep === "Step 1" && wf.step === 1) ||
      (filterStep === "Step 2" && wf.step === 2) ||
      (filterStep === "Step 3" && wf.step === 3) ||
      (filterStep === "Step 4" && wf.step === 4);

    const q = query.toLowerCase();
    const matchesQuery =
      (audit.title && audit.title.toLowerCase().includes(q)) ||
      (audit.id && audit.id.toLowerCase().includes(q)) ||
      (audit.externalAgency && audit.externalAgency.toLowerCase().includes(q)) ||
      (audit.leadAuditor?.name && audit.leadAuditor.name.toLowerCase().includes(q)) ||
      (audit.venue && audit.venue.toLowerCase().includes(q));

    return matchesFilter && matchesQuery;
  });

  // Metric counts tailored by role
  const totalAudits = visibleAudits.length;
  const receivedCount = (externalAuditList || []).filter((a) => getExternalWorkflowDetails(a).step === 1).length;
  const sharedCount = visibleAudits.filter((a) => getExternalWorkflowDetails(a).step === 2).length;
  const ncIssuedCount = visibleAudits.filter((a) => getExternalWorkflowDetails(a).step === 3).length;
  const certifiedCount = visibleAudits.filter((a) => getExternalWorkflowDetails(a).step === 4).length;

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999,
            background: "#0f172a",
            color: "#ffffff",
            padding: "14px 20px",
            borderRadius: "10px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "13px",
            fontWeight: "500",
            animation: "slideIn 0.25s ease-out"
          }}
        >
          <CheckCircle2 size={18} color="#22c55e" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage("")}
            style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", marginLeft: "8px" }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Page Intro Header */}
      <PageIntro
        eyebrow="ISO 9001:2015 CERTIFICATION"
        title={
          isCourseCoordinator
            ? "External Quality Audits (Course Oversight)"
            : isInternalAuditor
            ? "External Quality Audits (Audit Alignment)"
            : isTrustHead
            ? "External Quality Audits (Executive Certification)"
            : "External Quality Audit (ISO 9001:2015)"
        }
        description={
          isCourseCoordinator
            ? "View scheduled external surveillance audits, review email schedule notices, and access non-conformance (NC) reports for corrective action."
            : isInternalAuditor
            ? "Review third-party certification body audit plans, schedule notices, and ISO 9001:2015 compliance closures."
            : isTrustHead
            ? "Executive oversight of third-party external certification audits, accreditation dates, and ISO 9001:2015 ratification."
            : "Manage external certification body audits, dispatch email schedules, upload non-conformance documents for course coordinators, and close certified audits."
        }
        action={
          isQMSCoordinator && (
            <button
              className="primary-button btn-blue"
              onClick={openLogModal}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontWeight: "600" }}
            >
              <Plus size={18} />
              <span>Log Received Audit Schedule</span>
            </button>
          )
        }
      />

      {/* Informational Architecture Banner - Explaining External Auditor Email Model */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "14px",
          padding: "14px 18px",
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: "10px",
          marginBottom: "20px"
        }}
      >
        <ShieldCheck size={22} color="#16a34a" style={{ flexShrink: 0, marginTop: "2px" }} />
        <div style={{ fontSize: "13px", lineHeight: 1.5, color: "#166534" }}>
          <strong>External Auditor Communication Framework:</strong> External Auditors (third-party ISO certification agencies such as TÜV SÜD, BSI, Bureau Veritas) operate independently and <strong>do not have a dashboard or login access</strong> to the internal QMS. They communicate strictly via email with the <strong>QMS Coordinator</strong>. The QMS Coordinator logs the received schedule, shares it to Course Coordinators, Trust Head & Internal Auditor, uploads NC documents for Course Coordinators only, and closes the entire process once external approval is granted.
        </div>
      </div>

      {/* KPI Stat Cards (Tailored per role) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "14px",
          marginBottom: "20px"
        }}
      >
        {isCourseCoordinator ? (
          <>
            <StatCard label="Total External Audits" value={totalAudits} icon={ShieldCheck} tone="blue" hint="All notified external audits" />
            <StatCard label="NC Reports for Course Staff" value={ncIssuedCount} icon={AlertCircle} tone="amber" hint="Corrective action required" />
            <StatCard label="ISO 9001 Certified" value={certifiedCount} icon={CheckCircle2} tone="green" hint="Ratified & closed audits" />
          </>
        ) : isTrustHead ? (
          <>
            <StatCard label="Total External Audits" value={totalAudits} icon={ShieldCheck} tone="blue" hint="Institutional certification audits" />
            <StatCard label="Scheduled Sessions" value={sharedCount} icon={Calendar} tone="teal" hint="Confirmed audit dates" />
            <StatCard label="ISO 9001 Certified" value={certifiedCount} icon={CheckCircle2} tone="green" hint="Successfully ratified" />
          </>
        ) : isInternalAuditor ? (
          <>
            <StatCard label="Total External Audits" value={totalAudits} icon={ShieldCheck} tone="blue" hint="Third-party certification audits" />
            <StatCard label="Active Audit Cycles" value={sharedCount + ncIssuedCount} icon={Clock} tone="teal" hint="In-progress certification" />
            <StatCard label="ISO 9001 Certified" value={certifiedCount} icon={CheckCircle2} tone="green" hint="Ratified & closed" />
          </>
        ) : (
          <>
            <StatCard label="Total External Audits" value={totalAudits} icon={ShieldCheck} tone="blue" />
            <StatCard label="Incoming Email Schedules" value={receivedCount} icon={Mail} tone="teal" hint="Received & ready to share" />
            <StatCard label="NC Issued to Course Staff" value={ncIssuedCount} icon={AlertCircle} tone="amber" hint="Shared to CCs only" />
            <StatCard label="ISO 9001 Certified" value={certifiedCount} icon={CheckCircle2} tone="green" hint="Closed by QMS Coordinator" />
          </>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar" style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", marginBottom: "20px" }}>
        <label className="search-field" style={{ flex: 1, minWidth: "260px" }}>
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search external audits by agency, auditor, title, or ID..."
          />
        </label>

        <div className="tabs" style={{ overflowX: "auto" }}>
          {(isQMSCoordinator
            ? [
                { id: "All", label: `All External Audits (${visibleAudits.length})` },
                { id: "Step 1", label: `1. Schedule Received (${receivedCount})` },
                { id: "Step 2", label: `2. Shared to All (${sharedCount})` },
                { id: "Step 3", label: `3. NC Documents (${ncIssuedCount})` },
                { id: "Step 4", label: `4. Certified & Closed (${certifiedCount})` }
              ]
            : [
                { id: "All", label: `All Audits (${visibleAudits.length})` },
                { id: "Step 2", label: `Scheduled (${sharedCount})` },
                ...(isCourseCoordinator ? [{ id: "Step 3", label: `NC Documents (${ncIssuedCount})` }] : []),
                { id: "Step 4", label: `ISO 9001 Certified (${certifiedCount})` }
              ]
          ).map((tab) => (
            <button
              key={tab.id}
              className={filterStep === tab.id ? "tab active" : "tab"}
              onClick={() => setFilterStep(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* External Audits List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        {filteredAudits.length === 0 ? (
          <div
            style={{
              padding: "48px 24px",
              textAlign: "center",
              background: "#ffffff",
              borderRadius: "12px",
              border: "1px dashed #cbd5e1"
            }}
          >
            <ShieldCheck size={42} style={{ color: "#94a3b8", margin: "0 auto 12px auto" }} />
            <h3 style={{ margin: "0 0 6px 0", color: "#1e293b" }}>No External Audits Found</h3>
            <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
              {query ? "Try adjusting your search keywords." : "No external audits currently match the selected workflow filter."}
            </p>
          </div>
        ) : (
          filteredAudits.map((audit) => {
            const wf = getExternalWorkflowDetails(audit);

            return (
              <div
                key={audit.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                }}
              >
                {/* Audit Top Header Bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span
                      style={{
                        padding: "3px 8px",
                        background: "#eff6ff",
                        color: "#1d4ed8",
                        border: "1px solid #bfdbfe",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "700"
                      }}
                    >
                      {audit.id}
                    </span>
                    <span
                      style={{
                        padding: "3px 8px",
                        background: "#f1f5f9",
                        color: "#475569",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "500"
                      }}
                    >
                      Agency: {audit.externalAgency}
                    </span>
                    {audit.incomingScheduleEmail && (
                      <span
                        style={{
                          padding: "3px 8px",
                          background: "#f0fdf4",
                          color: "#166534",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "600",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        <Mail size={12} /> Received via Email
                      </span>
                    )}
                  </div>

                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 12px",
                      borderRadius: "9999px",
                      fontSize: "12px",
                      fontWeight: "600",
                      background: wf.bg,
                      color: wf.color,
                      border: `1px solid ${wf.border}`
                    }}
                  >
                    {wf.step === 4 ? (
                      <CheckCircle2 size={14} />
                    ) : wf.step === 3 ? (
                      <AlertCircle size={14} />
                    ) : (
                      <Calendar size={14} />
                    )}
                    {wf.badgeText}
                  </span>
                </div>

                {/* Audit Title */}
                <h3 style={{ margin: "10px 0 6px 0", fontSize: "16px", color: "#0f172a", fontWeight: "700" }}>
                  {audit.title}
                </h3>

                {/* Schedule & Lead Auditor Details Pill Box */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "12px",
                    margin: "14px 0",
                    padding: "12px 14px",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    border: "1px solid #f1f5f9",
                    fontSize: "13px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#334155" }}>
                    <Calendar size={15} color="#2563eb" />
                    <span><strong>Date:</strong> {audit.scheduledDate}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#334155" }}>
                    <Clock size={15} color="#2563eb" />
                    <span><strong>Time:</strong> {audit.scheduledTime || "09:30 AM"}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#334155" }}>
                    <UserCheck size={15} color="#2563eb" />
                    <span><strong>External Auditor:</strong> {audit.leadAuditor?.name || "Lead Auditor"}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#334155" }}>
                    <MapPin size={15} color="#2563eb" />
                    <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                      <strong>Venue:</strong> {audit.venue || "Main Boardroom"}
                    </span>
                  </div>
                </div>

                {/* 4-Step Stepper Component */}
                <div style={{ margin: "16px 0", padding: "14px 16px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
                    {[
                      { num: 1, title: "1. Email Schedule Received", sub: "Ext. Auditor -> QMS Coord" },
                      { num: 2, title: "2. Shared to All", sub: "Course Coord, TH & IA" },
                      { num: 3, title: "3. NC Docs Shared", sub: "Course Coordinators Only" },
                      { num: 4, title: "4. Certified & Closed", sub: "ISO 9001 Endorsed" }
                    ].map((stepItem, idx) => {
                      const isComplete = wf.step > stepItem.num;
                      const isCurrent = wf.step === stepItem.num;

                      return (
                        <React.Fragment key={stepItem.num}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 2 }}>
                            <div
                              style={{
                                width: "26px",
                                height: "26px",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "11px",
                                fontWeight: "700",
                                background: isComplete ? "#16a34a" : isCurrent ? "#2563eb" : "#cbd5e1",
                                color: "#ffffff",
                                boxShadow: isCurrent ? "0 0 0 4px rgba(37, 99, 235, 0.2)" : "none",
                                transition: "all 0.2s ease"
                              }}
                            >
                              {isComplete ? <Check size={13} /> : stepItem.num}
                            </div>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: isCurrent ? "700" : "500",
                                color: isCurrent ? "#1e40af" : isComplete ? "#166534" : "#64748b",
                                marginTop: "4px",
                                textAlign: "center"
                              }}
                            >
                              {stepItem.title}
                            </span>
                            <span style={{ fontSize: "10px", color: "#94a3b8" }}>{stepItem.sub}</span>
                          </div>

                          {idx < 3 && (
                            <div
                              style={{
                                flex: 1,
                                height: "2px",
                                background: wf.step > stepItem.num ? "#16a34a" : "#e2e8f0",
                                margin: "0 8px 18px 8px"
                              }}
                            />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Scope & Audit Details */}
                <div style={{ margin: "14px 0", padding: "12px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px" }}>
                  <strong style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                    Audit Scope & Standard Requirements:
                  </strong>
                  <p style={{ margin: 0, color: "#334155", lineHeight: 1.5 }}>
                    {audit.scope}
                  </p>

                  {/* Non-Conformance Section if present (Course Coordinator & QMS Coordinator only) */}
                  {audit.ncDocument && (isCourseCoordinator || isQMSCoordinator) && (
                    <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px dashed #cbd5e1" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <strong style={{ fontSize: "12px", color: "#b45309", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <AlertCircle size={14} />
                          External Non-Conformance Document (Issued for Course Coordinators)
                        </strong>
                        <span style={{ fontSize: "11px", color: "#64748b" }}>
                          Target Closure: {audit.ncDocument.targetClosureDate}
                        </span>
                      </div>
                      <p style={{ margin: "0 0 8px 0", fontSize: "12.5px", color: "#475569" }}>
                        {audit.ncDocument.summary}
                      </p>
                      {(audit.ncDocument.findings || []).map((f) => (
                        <div
                          key={f.id}
                          style={{
                            background: "#ffffff",
                            padding: "8px 10px",
                            borderRadius: "6px",
                            border: "1px solid #fed7aa",
                            fontSize: "12px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "8px"
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: "700", color: "#9a3412", marginRight: "6px" }}>{f.id}:</span>
                            <span style={{ color: "#1e293b" }}>{f.description}</span>
                            <span style={{ color: "#64748b", marginLeft: "6px" }}>({f.clause})</span>
                          </div>
                          <span
                            style={{
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              background: f.status === "Resolved" ? "#dcfce7" : "#ffedd5",
                              color: f.status === "Resolved" ? "#166534" : "#c2410c",
                              fontWeight: "600",
                              flexShrink: 0
                            }}
                          >
                            {f.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Closure & Certification Details if closed */}
                  {audit.externalAuditorApproval && (
                    <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px dashed #bbf7d0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "#166534", fontWeight: "700", fontSize: "12.5px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <CheckCircle2 size={15} color="#16a34a" />
                          ISO 9001:2015 Certificate Endorsement: {audit.externalAuditorApproval.certificateNumber}
                        </span>
                        <span style={{ fontSize: "11.5px", color: "#166534" }}>
                          Ratified on: {audit.externalAuditorApproval.approvedAt}
                        </span>
                      </div>
                      <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#15803d" }}>
                        {audit.externalAuditorApproval.recommendation}
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom Action Toolbar */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "10px",
                    paddingTop: "14px",
                    borderTop: "1px solid #f1f5f9"
                  }}
                >
                  {/* Left: View incoming email & details */}
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {audit.incomingScheduleEmail && (
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => {
                          setSelectedAudit(audit);
                          setShowEmailModal(true);
                        }}
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px" }}
                      >
                        <Mail size={14} color="#4f46e5" />
                        <span>View Incoming Email</span>
                      </button>
                    )}

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => {
                        setSelectedAudit(audit);
                        setShowDetailModal(true);
                      }}
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px" }}
                    >
                      <Eye size={14} />
                      <span>Audit Overview</span>
                    </button>
                  </div>

                  {/* Right: Step-by-Step Workflow Actions */}
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    {/* STEP 1 -> STEP 2: QMS Coordinator shares received email & schedule to Course Coordinators, Trust Head, and Internal Auditor */}
                    {wf.step === 1 && isQMSCoordinator && (
                      <button
                        type="button"
                        className="primary-button btn-blue"
                        onClick={() => openShareModal(audit)}
                        disabled={submitting}
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
                      >
                        <Send size={14} />
                        <span>Share Schedule & Email to All Stakeholders</span>
                      </button>
                    )}

                    {/* STEP 2 -> STEP 3: After audit completion, QMS Coordinator uploads NC document and shares to Course Coordinators ONLY */}
                    {wf.step === 2 && isQMSCoordinator && (
                      <button
                        type="button"
                        className="primary-button btn-blue"
                        onClick={() => openUploadNCModal(audit)}
                        disabled={submitting}
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", background: "#b45309" }}
                      >
                        <UploadCloud size={14} />
                        <span>Upload NC Document & Share to Course Coordinators</span>
                      </button>
                    )}

                    {/* STEP 3 -> STEP 4: External Auditor approves & QMS Coordinator closes entire process */}
                    {wf.step === 3 && isQMSCoordinator && (
                      <button
                        type="button"
                        className="primary-button btn-green"
                        onClick={() => openCloseModal(audit)}
                        disabled={submitting}
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
                      >
                        <CheckCheck size={14} />
                        <span>Record External Auditor Approval & Close Process</span>
                      </button>
                    )}

                    {/* STEP 3: Course Coordinators & QMS Coordinator can download NC Document */}
                    {wf.step >= 3 && audit.ncDocument && (isCourseCoordinator || isQMSCoordinator) && (
                      <button
                        type="button"
                        className="primary-button btn-blue"
                        onClick={() => handleDownloadNCDoc(audit)}
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px" }}
                      >
                        <FileDown size={14} />
                        <span>Download NC Document</span>
                      </button>
                    )}

                    {/* STEP 4: Official ISO 9001 Certificate & Closure Report (Everyone can download) */}
                    {wf.step === 4 && (
                      <button
                        type="button"
                        className="primary-button btn-green"
                        onClick={() => handleDownloadCert(audit)}
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px" }}
                      >
                        <Award size={14} />
                        <span>Download ISO 9001 Certificate</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: Log Incoming External Audit Schedule (Email from External Auditor) */}
      {/* ========================================================================= */}
      {showLogModal && isQMSCoordinator && (
        <Modal
          title="Log Incoming External Audit Schedule (Received via Email)"
          onClose={() => setShowLogModal(false)}
        >
          <form onSubmit={handleLogSubmit}>
            <div style={{ marginBottom: "14px", padding: "10px 12px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0", fontSize: "12.5px", color: "#166534" }}>
              <strong>External Auditor Integration:</strong> Record the audit meeting schedule received directly from the third-party certification body via email. Once recorded, you can share the meeting details and email notice with all internal stakeholders.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label style={{ gridColumn: "span 2" }}>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  Audit Title <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <input
                  type="text"
                  required
                  value={logForm.title}
                  onChange={(e) => setLogForm({ ...logForm, title: e.target.value })}
                  placeholder="e.g. ISO 9001:2015 Annual Surveillance Audit - Academic Programs"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </label>

              <label>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  External Certification Body / Agency <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <select
                  value={logForm.externalAgency}
                  onChange={(e) => setLogForm({ ...logForm, externalAgency: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff" }}
                >
                  <option value="TÜV SÜD South Asia Certification Body">TÜV SÜD South Asia Certification Body</option>
                  <option value="BSI Quality & Compliance Assurance">BSI Quality & Compliance Assurance</option>
                  <option value="Bureau Veritas Certification Services">Bureau Veritas Certification Services</option>
                  <option value="DNV GL Business Assurance">DNV GL Business Assurance</option>
                  <option value="SGS India Quality Registrar">SGS India Quality Registrar</option>
                </select>
              </label>

              <label>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  Lead External Auditor Name <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <input
                  type="text"
                  required
                  value={logForm.auditorName}
                  onChange={(e) => setLogForm({ ...logForm, auditorName: e.target.value })}
                  placeholder="e.g. Dr. Robert Vance"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </label>

              <label>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  Lead Auditor Official Email <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <input
                  type="email"
                  required
                  value={logForm.auditorEmail}
                  onChange={(e) => setLogForm({ ...logForm, auditorEmail: e.target.value })}
                  placeholder="e.g. robert.vance@tuvsud.com"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </label>

              <label>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  Scheduled Audit Date <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <input
                  type="date"
                  required
                  value={logForm.scheduledDate}
                  onChange={(e) => setLogForm({ ...logForm, scheduledDate: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </label>

              <label>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  Scheduled Time <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <input
                  type="text"
                  required
                  value={logForm.scheduledTime}
                  onChange={(e) => setLogForm({ ...logForm, scheduledTime: e.target.value })}
                  placeholder="e.g. 09:30 AM"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </label>

              <label>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  Venue / Video Conference Link
                </span>
                <input
                  type="text"
                  value={logForm.venue}
                  onChange={(e) => setLogForm({ ...logForm, venue: e.target.value })}
                  placeholder="e.g. Main Boardroom & Virtual Stream Link"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </label>

              <label style={{ gridColumn: "span 2" }}>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  Audit Scope & Focus Standards
                </span>
                <textarea
                  rows={2}
                  value={logForm.scope}
                  onChange={(e) => setLogForm({ ...logForm, scope: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </label>

              {/* Email Content Details */}
              <div style={{ gridColumn: "span 2", marginTop: "6px", padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <strong style={{ fontSize: "12.5px", color: "#334155", display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                  <Mail size={14} color="#2563eb" />
                  Received Email Communication Details (from External Auditor)
                </strong>

                <label style={{ display: "block", marginBottom: "8px" }}>
                  <span style={{ display: "block", marginBottom: "3px", fontSize: "12px", color: "#475569" }}>Email Subject Line:</span>
                  <input
                    type="text"
                    value={logForm.emailSubject}
                    onChange={(e) => setLogForm({ ...logForm, emailSubject: e.target.value })}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12.5px" }}
                  />
                </label>

                <label style={{ display: "block" }}>
                  <span style={{ display: "block", marginBottom: "3px", fontSize: "12px", color: "#475569" }}>Email Message Body:</span>
                  <textarea
                    rows={3}
                    value={logForm.emailBody}
                    onChange={(e) => setLogForm({ ...logForm, emailBody: e.target.value })}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                  />
                </label>
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: "18px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowLogModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary-button btn-blue"
                disabled={submitting}
              >
                <span>{submitting ? "Saving..." : "Record Incoming Audit Schedule"}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Share Schedule to All Stakeholders                               */}
      {/* ========================================================================= */}
      {showShareModal && selectedAudit && (
        <Modal
          title={`Share External Audit Schedule: ${selectedAudit.title}`}
          onClose={() => setShowShareModal(false)}
        >
          <form onSubmit={handleShareSubmit}>
            <div style={{ marginBottom: "14px", padding: "12px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div><strong>Scheduled Date:</strong> {selectedAudit.scheduledDate} at {selectedAudit.scheduledTime || "09:30 AM"}</div>
                <div><strong>External Agency:</strong> {selectedAudit.externalAgency}</div>
                <div><strong>Lead Auditor:</strong> {selectedAudit.leadAuditor?.name}</div>
                <div><strong>Venue:</strong> {selectedAudit.venue}</div>
              </div>
            </div>

            <div style={{ marginBottom: "14px", padding: "10px 12px", background: "#eff6ff", borderRadius: "8px", border: "1px solid #bfdbfe", fontSize: "12.5px", color: "#1e40af" }}>
              <strong>Verified Distribution List:</strong> This action will dispatch official email notifications and grant access to:
              <ul style={{ margin: "6px 0 0 16px", padding: 0 }}>
                <li>All Course Coordinators (Priya Sharma, Dr. Rajesh Verma, Sunita Patil)</li>
                <li>Trust Head (Anita Rao)</li>
                <li>Internal Auditor (Suresh Menon)</li>
              </ul>
            </div>

            <label style={{ display: "block", marginBottom: "12px" }}>
              <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                Notification Email Subject
              </span>
              <input
                type="text"
                required
                value={shareForm.noticeSubject}
                onChange={(e) => setShareForm({ ...shareForm, noticeSubject: e.target.value })}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
              />
            </label>

            <label style={{ display: "block", marginBottom: "16px" }}>
              <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                Official Broadcast Instructions & Scope Details
              </span>
              <textarea
                rows={3}
                required
                value={shareForm.noticeMessage}
                onChange={(e) => setShareForm({ ...shareForm, noticeMessage: e.target.value })}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
              />
            </label>

            <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowShareModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary-button btn-blue"
                disabled={submitting}
              >
                <span>{submitting ? "Dispatching..." : "Dispatch to All Stakeholders via Email"}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Upload NC Document (Shared to Course Coordinators ONLY)          */}
      {/* ========================================================================= */}
      {showUploadNCModal && selectedAudit && (
        <Modal
          title={`Upload NC Document & Share to Course Coordinators: ${selectedAudit.id}`}
          onClose={() => setShowUploadNCModal(false)}
        >
          <form onSubmit={handleUploadNCSubmit}>
            <div style={{ marginBottom: "14px", padding: "10px 12px", background: "#fffbeb", borderRadius: "8px", border: "1px solid #fde68a", fontSize: "12.5px", color: "#92400e" }}>
              <strong>Strict Scope Rule:</strong> The External Auditor shared this Non-Conformance (NC) document directly with you. Uploading this document shares it <strong>exclusively to Course Coordinators</strong> for Root Cause Analysis and corrective action execution. It will not be shown to other roles.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label style={{ gridColumn: "span 2" }}>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  NC Report Document File Name <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <input
                  type="text"
                  required
                  value={ncUploadForm.fileName}
                  onChange={(e) => setNcUploadForm({ ...ncUploadForm, fileName: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </label>

              <label style={{ gridColumn: "span 2" }}>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  Executive Summary of Findings <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <textarea
                  rows={2}
                  required
                  value={ncUploadForm.summary}
                  onChange={(e) => setNcUploadForm({ ...ncUploadForm, summary: e.target.value })}
                  placeholder="Summary of external audit non-conformance findings..."
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </label>

              <label>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  ISO 9001 Clause Reference <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <input
                  type="text"
                  required
                  value={ncUploadForm.findingClause}
                  onChange={(e) => setNcUploadForm({ ...ncUploadForm, findingClause: e.target.value })}
                  placeholder="e.g. ISO 9001:2015 Clause 8.5.1"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </label>

              <label>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  Target Resolution Deadline <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <input
                  type="date"
                  required
                  value={ncUploadForm.targetClosureDate}
                  onChange={(e) => setNcUploadForm({ ...ncUploadForm, targetClosureDate: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </label>

              <label style={{ gridColumn: "span 2" }}>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  Primary Finding Description
                </span>
                <textarea
                  rows={2}
                  value={ncUploadForm.findingDesc}
                  onChange={(e) => setNcUploadForm({ ...ncUploadForm, findingDesc: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </label>

              <label style={{ gridColumn: "span 2" }}>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  Assigned Responsible Course Coordinator
                </span>
                <select
                  value={ncUploadForm.findingAssignee}
                  onChange={(e) => setNcUploadForm({ ...ncUploadForm, findingAssignee: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff" }}
                >
                  <option value="Priya Sharma (Course Coordinator)">Priya Sharma (Course Coordinator - Academic)</option>
                  <option value="Dr. Rajesh Verma (Course Coordinator - AI)">Dr. Rajesh Verma (Course Coordinator - AI)</option>
                  <option value="Sunita Patil (Course Coordinator - Cyber Security)">Sunita Patil (Course Coordinator - Cyber Security)</option>
                </select>
              </label>
            </div>

            <div className="modal-actions" style={{ marginTop: "18px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowUploadNCModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary-button btn-blue"
                disabled={submitting}
              >
                <span>{submitting ? "Uploading..." : "Upload & Share to Course Coordinators"}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: Record External Auditor Approval & Close Audit Process           */}
      {/* ========================================================================= */}
      {showCloseModal && selectedAudit && (
        <Modal
          title={`Record External Auditor Approval & Close Audit: ${selectedAudit.id}`}
          onClose={() => setShowCloseModal(false)}
        >
          <form onSubmit={handleCloseSubmit}>
            <div style={{ marginBottom: "14px", padding: "10px 12px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0", fontSize: "12.5px", color: "#166534" }}>
              <strong>External Auditor Final Signoff:</strong> Record the final approval/endorsement received from the External Auditor via email. Confirming this action marks the entire External Audit process as officially completed and ratifies the ISO 9001:2015 certification.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  ISO 9001 Certificate Number <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <input
                  type="text"
                  required
                  value={closeForm.certificateNumber}
                  onChange={(e) => setCloseForm({ ...closeForm, certificateNumber: e.target.value })}
                  placeholder="e.g. ISO9001-TUV-2026-9842"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </label>

              <label>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  External Auditor Approval Date <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <input
                  type="date"
                  required
                  value={closeForm.approvalDate}
                  onChange={(e) => setCloseForm({ ...closeForm, approvalDate: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </label>

              <label style={{ gridColumn: "span 2" }}>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  Auditor Recommendation Statement
                </span>
                <input
                  type="text"
                  value={closeForm.recommendation}
                  onChange={(e) => setCloseForm({ ...closeForm, recommendation: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </label>

              <label style={{ gridColumn: "span 2" }}>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  Auditor Remarks & Final Conformance Verdict
                </span>
                <textarea
                  rows={3}
                  value={closeForm.remarks}
                  onChange={(e) => setCloseForm({ ...closeForm, remarks: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </label>
            </div>

            <div className="modal-actions" style={{ marginTop: "18px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowCloseModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary-button btn-green"
                disabled={submitting}
              >
                <span>{submitting ? "Closing..." : "Confirm Approval & Close Audit Process"}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: View Incoming Email Communication                                */}
      {/* ========================================================================= */}
      {showEmailModal && selectedAudit && (
        <Modal
          title={`Incoming External Email: ${selectedAudit.incomingScheduleEmail?.subject || "Audit Notice"}`}
          onClose={() => setShowEmailModal(false)}
        >
          <div style={{ background: "#f8fafc", padding: "14px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px", marginBottom: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: "6px", marginBottom: "10px" }}>
              <span style={{ color: "#64748b", fontWeight: "600" }}>From:</span>
              <span style={{ color: "#0f172a", fontWeight: "600" }}>{selectedAudit.incomingScheduleEmail?.from}</span>

              <span style={{ color: "#64748b", fontWeight: "600" }}>To:</span>
              <span style={{ color: "#0f172a" }}>{selectedAudit.incomingScheduleEmail?.to}</span>

              <span style={{ color: "#64748b", fontWeight: "600" }}>Received:</span>
              <span style={{ color: "#0f172a" }}>{selectedAudit.incomingScheduleEmail?.receivedAt}</span>

              <span style={{ color: "#64748b", fontWeight: "600" }}>Subject:</span>
              <span style={{ color: "#0f172a", fontWeight: "700" }}>{selectedAudit.incomingScheduleEmail?.subject}</span>
            </div>

            <div style={{ padding: "14px", background: "#ffffff", borderRadius: "6px", border: "1px solid #cbd5e1", lineHeight: 1.6, color: "#1e293b" }}>
              <div
                dangerouslySetInnerHTML={{
                  __html: selectedAudit.incomingScheduleEmail?.bodyHtml || selectedAudit.incomingScheduleEmail?.body || "<p>Schedule details recorded.</p>"
                }}
              />
            </div>

            {selectedAudit.incomingScheduleEmail?.attachments?.length > 0 && (
              <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Paperclip size={14} color="#64748b" />
                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Attached External Audit Plan:</span>
                <span style={{ fontSize: "12px", color: "#2563eb", textDecoration: "underline" }}>
                  {selectedAudit.incomingScheduleEmail.attachments[0].fileName} ({selectedAudit.incomingScheduleEmail.attachments[0].fileSize})
                </span>
              </div>
            )}
          </div>

          <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="primary-button btn-blue"
              onClick={() => setShowEmailModal(false)}
            >
              Close Email Viewer
            </button>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: View Audit Details & History                                      */}
      {/* ========================================================================= */}
      {showDetailModal && selectedAudit && (
        <Modal
          title={`External Audit Details & Timeline: ${selectedAudit.title}`}
          onClose={() => setShowDetailModal(false)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "13px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div><strong>Audit ID:</strong> {selectedAudit.id}</div>
              <div><strong>External Agency:</strong> {selectedAudit.externalAgency}</div>
              <div><strong>Lead Auditor:</strong> {selectedAudit.leadAuditor?.name}</div>
              <div><strong>Auditor Email:</strong> {selectedAudit.leadAuditor?.email}</div>
              <div><strong>Scheduled Date:</strong> {selectedAudit.scheduledDate} at {selectedAudit.scheduledTime}</div>
              <div><strong>Venue:</strong> {selectedAudit.venue}</div>
              <div style={{ gridColumn: "span 2" }}><strong>Scope:</strong> {selectedAudit.scope}</div>
            </div>

            <div>
              <strong style={{ fontSize: "13px", color: "#334155", display: "block", marginBottom: "8px" }}>
                Audit Workflow History & Event Trail:
              </strong>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {(selectedAudit.timeline || []).map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "8px 12px",
                      background: "#ffffff",
                      borderRadius: "6px",
                      border: "1px solid #e2e8f0",
                      borderLeft: "3px solid #2563eb"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                      <strong style={{ color: "#0f172a" }}>{item.action}</strong>
                      <span style={{ fontSize: "11px", color: "#64748b" }}>{item.timestamp}</span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#475569" }}>By: {item.actor}</div>
                    <div style={{ fontSize: "12px", color: "#334155", marginTop: "2px" }}>{item.details}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-actions" style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setShowDetailModal(false)}
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
