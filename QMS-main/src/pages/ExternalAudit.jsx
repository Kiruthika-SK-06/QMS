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
  Briefcase,
  Building2,
  FileSignature
} from "lucide-react";
import { useApp } from "../context/AppContext";
import PageIntro from "../components/common/PageIntro";
import Modal from "../components/tasks/Modal";

// 5-Step External Audit Workflow Progress Helper
// Step 1: External Auditor schedules meeting & sends timetable to QMS Coordinator via email only.
// Step 2: QMS Coordinator shares scheduled meeting to all: Trust Head, Course Coord, and Internal Auditor.
//         External Auditor comes directly to the office to audit system and gives NC doc in paper to QMS Coord.
// Step 3: QMS Coordinator uploads scanned copy of paper NC doc and shares it ONLY to Course Coordinators.
// Step 4: Course Coordinator downloads scanned NC docs and closes the NC resolution.
// Step 5: External Auditor communicates approval result through email or direct office visit.
//         Once QMS Coordinator gets approval, QMS Coordinator closes the entire process (ISO 9001 Certified).
// Constraint: Each step is performed ONLY when the previous step has been completed.
const getExternalWorkflowDetails = (audit) => {
  if (audit.stage >= 5 || audit.status === "Completed & Closed (ISO 9001 Certified)" || audit.qmsClosure?.closed) {
    return {
      step: 5,
      statusLabel: "Completed & Closed (ISO 9001 Certified)",
      badgeText: "ISO 9001 Certified & Closed",
      color: "#166534",
      bg: "#dcfce7",
      border: "#86efac"
    };
  }

  if (audit.stage === 4 || audit.ncClosure?.closed || audit.status?.includes("NC Closed")) {
    return {
      step: 4,
      statusLabel: "NC Closed by Course Coordinator (Awaiting Auditor Approval)",
      badgeText: "NC Closed by Course Coord",
      color: "#0284c7",
      bg: "#e0f2fe",
      border: "#bae6fd"
    };
  }

  if (audit.stage === 3 || audit.status === "Scanned NC Doc Uploaded (Course Coord Only)" || audit.ncDocument) {
    return {
      step: 3,
      statusLabel: "Scanned NC Doc Uploaded (Course Coord Only)",
      badgeText: "Scanned Paper NC Uploaded",
      color: "#b45309",
      bg: "#fffbeb",
      border: "#fde68a"
    };
  }

  if (audit.stage === 2 || audit.shareWithStakeholders?.shared) {
    return {
      step: 2,
      statusLabel: "Schedule Shared (On-Site Audit Scheduled)",
      badgeText: "Schedule Shared to All",
      color: "#4f46e5",
      bg: "#e0e7ff",
      border: "#c7d2fe"
    };
  }

  return {
    step: 1,
    statusLabel: "Audit Schedule Received (via Email)",
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
    closeCourseCoordinatorNC,
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
  const [showCourseCoordCloseModal, setShowCourseCoordCloseModal] = useState(false);
  const [showCloseProcessModal, setShowCloseProcessModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
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
    targetPeriod: "December 2026",
    scheduledDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    scheduledTime: "09:30 AM",
    venue: "Main Boardroom & In-Person Campus Audit",
    emailSubject: "Official Notice: ISO 9001:2015 External Audit Schedule - C-DAC Academic Quality",
    emailBody: "Dear Rahul Kumar (QMS Coordinator),\n\nThis email confirms that the ISO 9001:2015 External Surveillance Audit is scheduled for execution as indicated. I will visit your campus in person to audit the system. Please find attached the formal audit timetable and notify your academic course coordinators, Trust Head, and internal audit cell.\n\nRegards,\nDr. Robert Vance\nLead Auditor, TÜV SÜD South Asia",
    planFileName: "TUV_ISO9001_External_Audit_Plan_2026.pdf"
  });

  // Form State: Modal 2 - Share Schedule to All Stakeholders
  const [shareForm, setShareForm] = useState({
    noticeSubject: "",
    noticeMessage: ""
  });

  // Form State: Modal 3 - Upload Scanned Copy of Paper NC Document (Shared to Course Coordinators ONLY)
  const [ncUploadForm, setNcUploadForm] = useState({
    fileName: "",
    fileSize: "2.3 MB",
    summary: "",
    targetClosureDate: "",
    findingClause: "ISO 9001:2015 Clause 8.5.1",
    findingType: "Minor Non-Conformance",
    findingDesc: "Lab log verification timestamps for experiments require physical instructor counter-signatures and digital archival.",
    findingAssignee: "Priya Sharma (Course Coordinator)"
  });

  // Form State: Modal 4 - Course Coordinator Closes NC Resolution
  const [courseCoordCloseForm, setCourseCoordCloseForm] = useState({
    closedBy: activeUser?.name ? `${activeUser.name} (Course Coordinator)` : "Priya Sharma (Course Coordinator)",
    remarks: "Scanned paper NC document downloaded and reviewed. Root cause analysis conducted. Counter-signature protocols deployed across all course lab registers.",
    actionPlan: "Standard Operating Procedure (SOP-ACA-04) revised. Dual signature verification initiated for all weekly practical experiment records."
  });

  // Form State: Modal 5 - External Auditor Approval & Final Process Closure
  const [closeProcessForm, setCloseProcessForm] = useState({
    approvalMode: "Direct Office Visit (Auditor visited office in person)",
    certificateNumber: "",
    approvalDate: new Date().toISOString().split("T")[0],
    recommendation: "Unconditional recommendation for issuance and continuation of ISO 9001:2015 Quality Management Certificate.",
    remarks: "External Auditor validated all corrective actions and closed all open findings. Quality Management System endorsed.",
    qmsRemarks: "All division corrective actions verified and accepted. Entire ISO 9001:2015 external audit process officially closed."
  });

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(""), 4500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (msg) => setToastMessage(msg);

  // Open Log Modal (Step 1)
  const openLogModal = () => {
    setLogForm({
      title: "ISO 9001:2015 Comprehensive External Surveillance Audit",
      externalAgency: "TÜV SÜD South Asia Certification Body",
      auditorName: "Dr. Robert Vance",
      auditorTitle: "Lead External Auditor (ISO 9001:2015)",
      auditorEmail: "robert.vance@tuvsud.com",
      auditorPhone: "+91 98230 45678",
      scope: "Annual surveillance evaluation of academic syllabus coverage, student feedback mechanisms, laboratory safety protocols, and institutional quality governance under ISO 9001:2015 Clauses 4-10.",
      targetPeriod: "December 2026",
      scheduledDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      scheduledTime: "09:30 AM",
      venue: "Main Boardroom & In-Person Campus Audit",
      emailSubject: "Official Notice: ISO 9001:2015 External Audit Schedule - C-DAC Academic Quality",
      emailBody: "Dear Rahul Kumar (QMS Coordinator),\n\nThis email confirms that the ISO 9001:2015 External Surveillance Audit is scheduled for execution as indicated. I will visit your campus in person to audit the system. Please find attached the formal audit timetable and notify your academic course coordinators, Trust Head, and internal audit cell.\n\nRegards,\nDr. Robert Vance\nLead Auditor, TÜV SÜD South Asia",
      planFileName: "TUV_ISO9001_External_Audit_Plan_2026.pdf"
    });
    setShowLogModal(true);
  };

  // Open Share Schedule Modal (Step 2)
  const openShareModal = (audit) => {
    setSelectedAudit(audit);
    setShareForm({
      noticeSubject: `External Audit Notice: ${audit.title} on ${audit.scheduledDate}`,
      noticeMessage: `All Course Coordinators, Trust Head, and Internal Auditor: Please be informed that ${audit.externalAgency} has scheduled an ISO 9001:2015 External Audit on ${audit.scheduledDate} at ${audit.scheduledTime}. The auditor will visit our office in person to audit the system. Please prepare course folders, student feedback logs, and practical lab manuals.`
    });
    setShowShareModal(true);
  };

  // Open Upload Scanned Paper NC Modal (Step 3)
  const openUploadNCModal = (audit) => {
    setSelectedAudit(audit);
    setNcUploadForm({
      fileName: `${audit.id}_Scanned_Paper_NC_Report.pdf`,
      fileSize: "2.3 MB",
      summary: `Scanned copy of physical paper NC document handed over by External Auditor (${audit.leadAuditor?.name || "Lead Auditor"}) during campus office audit covering practical lab verification logs and curriculum records.`,
      targetClosureDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      findingClause: "ISO 9001:2015 Clause 8.5.1",
      findingType: "Minor Non-Conformance",
      findingDesc: "Course delivery schedules and practical lab exercise counter-signatures require standard digital archiving.",
      findingAssignee: "Priya Sharma (Course Coordinator)"
    });
    setShowUploadNCModal(true);
  };

  // Open Course Coordinator Close NC Modal (Step 4)
  const openCourseCoordCloseModal = (audit) => {
    setSelectedAudit(audit);
    setCourseCoordCloseForm({
      closedBy: activeUser?.name ? `${activeUser.name} (Course Coordinator)` : "Priya Sharma (Course Coordinator)",
      remarks: "Scanned paper NC document downloaded and reviewed. Root cause analysis conducted. Counter-signature protocols deployed across all course lab registers.",
      actionPlan: "Standard Operating Procedure (SOP-ACA-04) revised. Dual signature verification initiated for all weekly practical experiment records."
    });
    setShowCourseCoordCloseModal(true);
  };

  // Open QMS Coordinator Close Process Modal (Step 5)
  const openCloseProcessModal = (audit) => {
    setSelectedAudit(audit);
    const agencyCode = (audit.externalAgency || "CERT").slice(0, 3).toUpperCase();
    const certNum = `ISO9001-${agencyCode}-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    setCloseProcessForm({
      approvalMode: "Direct Office Visit (Auditor visited office in person)",
      certificateNumber: certNum,
      approvalDate: new Date().toISOString().split("T")[0],
      recommendation: "Unconditional recommendation for issuance and continuation of ISO 9001:2015 Quality Management Certificate.",
      remarks: "External Auditor validated all corrective actions and closed all open findings. Quality Management System endorsed.",
      qmsRemarks: "All division corrective actions verified and accepted. Entire ISO 9001:2015 external audit process officially closed."
    });
    setShowCloseProcessModal(true);
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
      showToast("Audit schedule successfully shared to all Course Coordinators, Trust Head, and Internal Auditor!");
    } catch (err) {
      alert(err.message || "Failed to share audit schedule");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Step 3: Upload Scanned Copy of Paper NC Doc (Shared to Course Coordinators ONLY)
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
      showToast("Scanned copy of paper NC document uploaded and shared to Course Coordinators ONLY!");
    } catch (err) {
      alert(err.message || "Failed to upload NC document");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Step 4: Course Coordinator Downloads & Closes NC Resolution
  const handleCourseCoordCloseSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAudit) return;

    setSubmitting(true);
    try {
      await closeCourseCoordinatorNC(selectedAudit.id, {
        closedBy: courseCoordCloseForm.closedBy,
        remarks: courseCoordCloseForm.remarks,
        actionPlan: courseCoordCloseForm.actionPlan
      });
      setShowCourseCoordCloseModal(false);
      showToast("NC Document closed by Course Coordinator! External Auditor can now approve via email or office visit.");
    } catch (err) {
      alert(err.message || "Failed to close NC resolution");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Step 5: External Auditor Approval & Final Process Closure
  const handleCloseProcessSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAudit) return;

    setSubmitting(true);
    try {
      await closeExternalAuditProcess(selectedAudit.id, closeProcessForm);
      setShowCloseProcessModal(false);
      showToast(`External Audit closed successfully! ISO 9001:2015 Certificate (${closeProcessForm.certificateNumber}) ratified.`);
    } catch (err) {
      alert(err.message || "Failed to close external audit");
    } finally {
      setSubmitting(false);
    }
  };

  // Download official Scanned Paper NC Document
  const handleDownloadNCDoc = (audit) => {
    const nc = audit.ncDocument;
    if (!nc) return;

    const fileName = nc.fileName || `Scanned_Paper_NC_Report_${audit.id}.pdf`;
    const textContent = `======================================================================
CENTRE FOR DEVELOPMENT OF ADVANCED COMPUTING (C-DAC)
ISO 9001:2015 EXTERNAL AUDIT NON-CONFORMANCE (NC) REPORT
(SCANNED COPY OF PHYSICAL PAPER DOCUMENT HANDED OVER AT CAMPUS OFFICE)
======================================================================
Audit ID            : ${audit.id}
Audit Title         : ${audit.title}
External Agency     : ${audit.externalAgency}
Lead External Auditor: ${audit.leadAuditor?.name} (${audit.leadAuditor?.agency})
Campus Audit Venue  : ${audit.venue}
Date of Office Audit: ${audit.scheduledDate}
Paper NC Received   : In-Person Physical Handover at Campus Office
Scanned & Uploaded  : ${nc.uploadedBy || "Rahul Kumar (QMS Coordinator)"} on ${nc.uploadedAt || "N/A"}
Distribution Scope  : COURSE COORDINATORS ONLY (Restricted Document)
Target Closure Date : ${nc.targetClosureDate || "2026-12-15"}
======================================================================

EXECUTIVE SUMMARY OF AUDIT FINDINGS:
${nc.summary || "Physical non-conformance paper report handed over by External Auditor during campus office audit requiring root cause analysis and corrective actions."}

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
  Status       : ${f.status}${f.resolutionRemarks ? `\n  Resolution   : ${f.resolutionRemarks}` : ""}`
  )
  .join("\n\n")}

${
  audit.ncClosure?.closed
    ? `======================================================================
COURSE COORDINATOR CLOSURE DETAILS:
Closed By     : ${audit.ncClosure.closedBy}
Closed At     : ${audit.ncClosure.closedAt}
Action Plan   : ${audit.ncClosure.actionPlan || "N/A"}
Resolution Note: ${audit.ncClosure.remarks}
======================================================================`
    : ""
}

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
    showToast(`Downloading scanned NC report: ${fileName}`);
  };

  // Download official ISO 9001 Certificate
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
Approval Mode       : ${cert?.approvalMode || "Direct Office Visit"}
Approval Date       : ${cert?.approvedAt || "N/A"}
Official QMS Closure: ${audit.qmsClosure?.closedAt || "N/A"}
Closure Authority   : ${audit.qmsClosure?.closedBy || "Rahul Kumar (QMS Coordinator)"}
======================================================================

AUDITOR ENDORSEMENT & RECOMMENDATION:
${cert?.recommendation || "Full recommendation for issuance and maintenance of ISO 9001:2015 Certification."}

AUDITOR REMARKS (${cert?.approvalMode || "Office Endorsement"}):
${cert?.remarks || "All corrective actions verified. Quality management framework compliant."}

QMS FINAL CLOSURE REMARKS:
${audit.qmsClosure?.remarks || "All divisions compliant. Process officially closed following full sequential verification."}

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
  // QMS Coordinator: Sees all stages (Stage 1 to 5)
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
      (filterStep === "Step 4" && wf.step === 4) ||
      (filterStep === "Step 5" && wf.step === 5);

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
  const ncUploadedCount = visibleAudits.filter((a) => getExternalWorkflowDetails(a).step === 3).length;
  const ncClosedByCCCount = visibleAudits.filter((a) => getExternalWorkflowDetails(a).step === 4).length;
  const certifiedCount = visibleAudits.filter((a) => getExternalWorkflowDetails(a).step === 5).length;

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

      {/* Page Intro Header: Clean heading without headline or description below */}
      <PageIntro
        title="External Quality Audits"
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
                { id: "Step 3", label: `3. Scanned NC Uploaded (${ncUploadedCount})` },
                { id: "Step 4", label: `4. NC Closed by CC (${ncClosedByCCCount})` },
                { id: "Step 5", label: `5. Certified & Closed (${certifiedCount})` }
              ]
            : [
                { id: "All", label: `All Audits (${visibleAudits.length})` },
                { id: "Step 2", label: `Scheduled (${sharedCount})` },
                ...(isCourseCoordinator
                  ? [
                      { id: "Step 3", label: `Scanned NC (${ncUploadedCount})` },
                      { id: "Step 4", label: `NC Closed (${ncClosedByCCCount})` }
                    ]
                  : []),
                { id: "Step 5", label: `ISO 9001 Certified (${certifiedCount})` }
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
                    {wf.step === 5 ? (
                      <CheckCircle2 size={14} />
                    ) : wf.step === 4 ? (
                      <CheckCheck size={14} />
                    ) : wf.step === 3 ? (
                      <AlertCircle size={14} />
                    ) : (
                      <Calendar size={14} />
                    )}
                    {wf.badgeText}
                  </span>
                </div>

                {/* ISO Heading */}
                <h3 style={{ margin: "12px 0 6px 0", fontSize: "16px", color: "#0f172a", fontWeight: "700" }}>
                  {audit.title}
                </h3>

                {/* Audit Details: Audit Date, Time, External Auditor, and Venue */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "12px",
                    margin: "12px 0",
                    padding: "12px 14px",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    border: "1px solid #f1f5f9",
                    fontSize: "13px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#334155" }}>
                    <Calendar size={15} color="#2563eb" />
                    <span><strong>Audit Date:</strong> {audit.scheduledDate}</span>
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
                    <Building2 size={15} color="#2563eb" />
                    <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                      <strong>Venue:</strong> {audit.venue || "Main Boardroom"}
                    </span>
                  </div>
                </div>

                {/* Workflow Stepper: Only shown to QMS Coordinator and Internal Auditor */}
                {(isQMSCoordinator || isInternalAuditor) && (
                  <div style={{ margin: "16px 0", padding: "14px 16px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
                      {[
                        { num: 1, title: "1. Email Schedule Received", sub: "Ext. Auditor -> QMS" },
                        { num: 2, title: "2. Shared & On-Site Audit", sub: "Auditor Visits Office" },
                        { num: 3, title: "3. Scanned NC Uploaded", sub: "Course Coord Only" },
                        { num: 4, title: "4. NC Closed by CC", sub: "Downloaded & Resolved" },
                        { num: 5, title: "5. Auditor Approved & Closed", sub: "Email / Office Visit" }
                      ].map((stepItem, idx) => {
                        const isComplete = wf.step > stepItem.num;
                        const isCurrent = wf.step === stepItem.num;

                        return (
                          <React.Fragment key={stepItem.num}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 2, flex: 1 }}>
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
                                  fontSize: "10.5px",
                                  fontWeight: isCurrent ? "700" : "500",
                                  color: isCurrent ? "#1e40af" : isComplete ? "#166534" : "#64748b",
                                  marginTop: "4px",
                                  textAlign: "center"
                                }}
                              >
                                {stepItem.title}
                              </span>
                              <span style={{ fontSize: "9.5px", color: "#94a3b8", textAlign: "center" }}>{stepItem.sub}</span>
                            </div>

                            {idx < 4 && (
                              <div
                                style={{
                                  flex: 0.8,
                                  height: "2px",
                                  background: wf.step > stepItem.num ? "#16a34a" : "#e2e8f0",
                                  margin: "0 4px 18px 4px"
                                }}
                              />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Non-Conformance Section if present (Course Coordinator & QMS Coordinator only) */}
                {audit.ncDocument && (isCourseCoordinator || isQMSCoordinator) && (
                  <div style={{ margin: "14px 0", padding: "12px 14px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px", fontSize: "13px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", flexWrap: "wrap", gap: "6px" }}>
                      <strong style={{ fontSize: "12px", color: "#b45309", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <AlertCircle size={14} />
                        Scanned Paper NC Document (Office Handover & Shared to Course Coordinator Only)
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
                          gap: "8px",
                          marginBottom: "6px"
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

                    {/* Course Coordinator Closure Banner if closed */}
                    {audit.ncClosure?.closed && (
                      <div style={{ marginTop: "8px", padding: "8px 10px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6px", fontSize: "12px" }}>
                        <strong style={{ color: "#166534", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <CheckCheck size={14} color="#16a34a" />
                          Resolved & Closed by Course Coordinator ({audit.ncClosure.closedBy}) on {audit.ncClosure.closedAt}
                        </strong>
                        <p style={{ margin: "3px 0 0 0", color: "#15803d" }}>
                          {audit.ncClosure.remarks}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Closure & Certification Details if closed */}
                {audit.externalAuditorApproval && (
                  <div style={{ margin: "14px 0", padding: "12px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", fontSize: "13px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                      <span style={{ color: "#166534", fontWeight: "700", fontSize: "12.5px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <Award size={15} color="#16a34a" />
                        ISO 9001:2015 Certificate Endorsement: {audit.externalAuditorApproval.certificateNumber}
                      </span>
                      <span style={{ fontSize: "11.5px", color: "#166534" }}>
                        Mode: {audit.externalAuditorApproval.approvalMode || "Office Visit"} ({audit.externalAuditorApproval.approvedAt})
                      </span>
                    </div>
                    <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#15803d" }}>
                      {audit.externalAuditorApproval.recommendation}
                    </p>
                  </div>
                )}

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

                  {/* Right: Step-by-Step Workflow Actions (Enforcing previous step completion) */}
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
                        <span>Share Scheduled Meeting to All</span>
                      </button>
                    )}

                    {/* STEP 2 -> STEP 3: After on-site office audit, QMS Coordinator uploads scanned copy of paper NC doc and shares to Course Coordinators ONLY */}
                    {wf.step === 2 && isQMSCoordinator && (
                      <button
                        type="button"
                        className="primary-button btn-blue"
                        onClick={() => openUploadNCModal(audit)}
                        disabled={submitting}
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", background: "#b45309" }}
                      >
                        <UploadCloud size={14} />
                        <span>Upload Scanned Paper NC & Share to Course Coord</span>
                      </button>
                    )}

                    {/* STEP 3 -> STEP 4: Course Coordinator downloads scanned NC doc and closes NC resolution */}
                    {wf.step === 3 && (isCourseCoordinator || isQMSCoordinator) && (
                      <>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => handleDownloadNCDoc(audit)}
                          style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px" }}
                        >
                          <FileDown size={14} />
                          <span>Download Scanned NC Doc</span>
                        </button>

                        {isCourseCoordinator && (
                          <button
                            type="button"
                            className="primary-button btn-blue"
                            onClick={() => openCourseCoordCloseModal(audit)}
                            disabled={submitting}
                            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
                          >
                            <CheckCircle2 size={14} />
                            <span>Review & Close NC Resolution</span>
                          </button>
                        )}
                      </>
                    )}

                    {/* Notice for QMS Coordinator at Step 3: Must wait for Course Coordinator to close NC */}
                    {wf.step === 3 && isQMSCoordinator && (
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#b45309",
                          background: "#fffbeb",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          border: "1px solid #fde68a",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px"
                        }}
                      >
                        <Clock size={14} /> Awaiting Course Coordinator to download & close NC
                      </span>
                    )}

                    {/* STEP 4 -> STEP 5: Course Coordinator already closed NC; External Auditor communicates approval via email or direct office visit, and QMS Coordinator closes entire process */}
                    {wf.step === 4 && (
                      <>
                        {(isCourseCoordinator || isQMSCoordinator) && (
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => handleDownloadNCDoc(audit)}
                            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px" }}
                          >
                            <FileDown size={14} />
                            <span>Download Scanned NC Doc</span>
                          </button>
                        )}

                        {isQMSCoordinator ? (
                          <button
                            type="button"
                            className="primary-button btn-green"
                            onClick={() => openCloseProcessModal(audit)}
                            disabled={submitting}
                            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
                          >
                            <CheckCheck size={14} />
                            <span>Record Auditor Approval & Close Entire Process</span>
                          </button>
                        ) : (
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#0369a1",
                              background: "#f0f9ff",
                              padding: "6px 12px",
                              borderRadius: "6px",
                              border: "1px solid #bae6fd",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px"
                            }}
                          >
                            <Clock size={14} /> NC Closed &mdash; Awaiting Auditor Approval (Email / Office Visit)
                          </span>
                        )}
                      </>
                    )}

                    {/* STEP 5: Entire Process Closed (Everyone can download ISO 9001 Certificate) */}
                    {wf.step === 5 && (
                      <>
                        {(isCourseCoordinator || isQMSCoordinator) && (
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => handleDownloadNCDoc(audit)}
                            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px" }}
                          >
                            <FileDown size={14} />
                            <span>Download Scanned NC Doc</span>
                          </button>
                        )}

                        <button
                          type="button"
                          className="primary-button btn-green"
                          onClick={() => handleDownloadCert(audit)}
                          style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px" }}
                        >
                          <Award size={14} />
                          <span>Download ISO 9001 Certificate</span>
                        </button>
                      </>
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
              <strong>External Auditor Integration:</strong> Record the audit timetable received from the third-party certification body via email. Once recorded, you can share the meeting details and notice with all internal stakeholders.
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
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </label>

              <label>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  Auditor Official Email <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <input
                  type="email"
                  required
                  value={logForm.auditorEmail}
                  onChange={(e) => setLogForm({ ...logForm, auditorEmail: e.target.value })}
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
                  Meeting Venue / Campus Office <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <input
                  type="text"
                  required
                  value={logForm.venue}
                  onChange={(e) => setLogForm({ ...logForm, venue: e.target.value })}
                  placeholder="e.g. Main Boardroom & Campus In-Person Audit"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </label>

              <label style={{ gridColumn: "span 2" }}>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  Email Subject (As Received)
                </span>
                <input
                  type="text"
                  value={logForm.emailSubject}
                  onChange={(e) => setLogForm({ ...logForm, emailSubject: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </label>

              <label style={{ gridColumn: "span 2" }}>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  Email Message Body Received from External Auditor
                </span>
                <textarea
                  rows={3}
                  value={logForm.emailBody}
                  onChange={(e) => setLogForm({ ...logForm, emailBody: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", resize: "vertical" }}
                />
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "18px" }}>
              <button type="button" className="secondary-button" onClick={() => setShowLogModal(false)}>
                Cancel
              </button>
              <button type="submit" className="primary-button btn-blue" disabled={submitting}>
                {submitting ? "Logging..." : "Log & Save Schedule"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Share Schedule to All Stakeholders */}
      {/* ========================================================================= */}
      {showShareModal && selectedAudit && (
        <Modal
          title={`Share External Audit Schedule: ${selectedAudit.id}`}
          onClose={() => setShowShareModal(false)}
        >
          <form onSubmit={handleShareSubmit}>
            <div style={{ marginBottom: "14px", padding: "10px 12px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0", fontSize: "12.5px", color: "#166534" }}>
              <strong>Broadcast Meeting Notice:</strong> This will share the external audit meeting schedule and incoming email notice to <strong>all Course Coordinators, Trust Head, and the Internal Auditor</strong>.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <label>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  Notice Subject
                </span>
                <input
                  type="text"
                  required
                  value={shareForm.noticeSubject}
                  onChange={(e) => setShareForm({ ...shareForm, noticeSubject: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </label>

              <label>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  Instructions / Dispatch Message
                </span>
                <textarea
                  rows={4}
                  required
                  value={shareForm.noticeMessage}
                  onChange={(e) => setShareForm({ ...shareForm, noticeMessage: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", resize: "vertical" }}
                />
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "18px" }}>
              <button type="button" className="secondary-button" onClick={() => setShowShareModal(false)}>
                Cancel
              </button>
              <button type="submit" className="primary-button btn-blue" disabled={submitting}>
                <Send size={14} style={{ marginRight: "6px" }} />
                {submitting ? "Sharing..." : "Share Scheduled Meeting to All"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Upload Scanned Copy of Paper NC Document (Shared to Course Coordinators ONLY) */}
      {/* ========================================================================= */}
      {showUploadNCModal && selectedAudit && (
        <Modal
          title={`Upload Scanned Copy of Paper NC Document: ${selectedAudit.id}`}
          onClose={() => setShowUploadNCModal(false)}
        >
          <form onSubmit={handleUploadNCSubmit}>
            <div style={{ marginBottom: "14px", padding: "10px 12px", background: "#fffbeb", borderRadius: "8px", border: "1px solid #fde68a", fontSize: "12.5px", color: "#92400e" }}>
              <strong>On-Site Campus Audit & Paper Handover:</strong> The External Auditor conducted the audit in person at the office and handed over the physical paper Non-Conformance document. Upload the scanned copy here. <strong>It will be shared exclusively to Course Coordinators for resolution closure.</strong>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label style={{ gridColumn: "span 2" }}>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  Scanned NC Document File Name <span style={{ color: "#ef4444" }}>*</span>
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
                  Auditor NC Executive Summary <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <textarea
                  rows={2}
                  required
                  value={ncUploadForm.summary}
                  onChange={(e) => setNcUploadForm({ ...ncUploadForm, summary: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", resize: "vertical" }}
                />
              </label>

              <label>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  Target Resolution Closure Date <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <input
                  type="date"
                  required
                  value={ncUploadForm.targetClosureDate}
                  onChange={(e) => setNcUploadForm({ ...ncUploadForm, targetClosureDate: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </label>

              <label>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  ISO 9001 Clause Reference
                </span>
                <input
                  type="text"
                  value={ncUploadForm.findingClause}
                  onChange={(e) => setNcUploadForm({ ...ncUploadForm, findingClause: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </label>

              <label style={{ gridColumn: "span 2" }}>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  Specific NC Finding Description (for Course Coordinators) <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <input
                  type="text"
                  required
                  value={ncUploadForm.findingDesc}
                  onChange={(e) => setNcUploadForm({ ...ncUploadForm, findingDesc: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </label>

              <label style={{ gridColumn: "span 2" }}>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  Assignee Course Coordinator
                </span>
                <input
                  type="text"
                  value={ncUploadForm.findingAssignee}
                  onChange={(e) => setNcUploadForm({ ...ncUploadForm, findingAssignee: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "18px" }}>
              <button type="button" className="secondary-button" onClick={() => setShowUploadNCModal(false)}>
                Cancel
              </button>
              <button type="submit" className="primary-button btn-blue" disabled={submitting} style={{ background: "#b45309" }}>
                <UploadCloud size={14} style={{ marginRight: "6px" }} />
                {submitting ? "Uploading..." : "Upload Scanned Copy & Share to Course Coord"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: Course Coordinator Downloads & Closes NC Resolution */}
      {/* ========================================================================= */}
      {showCourseCoordCloseModal && selectedAudit && (
        <Modal
          title={`Review & Close NC Resolution: ${selectedAudit.id}`}
          onClose={() => setShowCourseCoordCloseModal(false)}
        >
          <form onSubmit={handleCourseCoordCloseSubmit}>
            <div style={{ marginBottom: "14px", padding: "10px 12px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0", fontSize: "12.5px", color: "#166534" }}>
              <strong>Course Coordinator Action:</strong> Download the scanned paper NC doc (if not already downloaded), implement the required corrective action plan (CAPA), and submit closure below. Once closed, the External Auditor will review and provide the approval result.
            </div>

            <div style={{ marginBottom: "14px", padding: "10px 12px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "12.5px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <strong style={{ color: "#0f172a" }}>Scanned Document: {selectedAudit.ncDocument?.fileName || "NC Report"}</strong>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => handleDownloadNCDoc(selectedAudit)}
                  style={{ fontSize: "11px", padding: "4px 8px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                >
                  <FileDown size={12} /> Download Scanned Copy
                </button>
              </div>
              <p style={{ margin: 0, color: "#64748b" }}>{selectedAudit.ncDocument?.summary}</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <label>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  Course Coordinator Name / Authority <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <input
                  type="text"
                  required
                  value={courseCoordCloseForm.closedBy}
                  onChange={(e) => setCourseCoordCloseForm({ ...courseCoordCloseForm, closedBy: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </label>

              <label>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  Corrective Action Summary & Root Cause Analysis (RCA) <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <textarea
                  rows={3}
                  required
                  value={courseCoordCloseForm.remarks}
                  onChange={(e) => setCourseCoordCloseForm({ ...courseCoordCloseForm, remarks: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", resize: "vertical" }}
                />
              </label>

              <label>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  Preventive Action Plan & Standard Procedure Implemented
                </span>
                <input
                  type="text"
                  value={courseCoordCloseForm.actionPlan}
                  onChange={(e) => setCourseCoordCloseForm({ ...courseCoordCloseForm, actionPlan: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "18px" }}>
              <button type="button" className="secondary-button" onClick={() => setShowCourseCoordCloseModal(false)}>
                Cancel
              </button>
              <button type="submit" className="primary-button btn-blue" disabled={submitting}>
                <CheckCircle2 size={14} style={{ marginRight: "6px" }} />
                {submitting ? "Submitting..." : "Confirm & Close NC Resolution"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: External Auditor Approval & Final Process Closure */}
      {/* ========================================================================= */}
      {showCloseProcessModal && selectedAudit && (
        <Modal
          title={`Record External Auditor Approval & Close Entire Process: ${selectedAudit.id}`}
          onClose={() => setShowCloseProcessModal(false)}
        >
          <form onSubmit={handleCloseProcessSubmit}>
            <div style={{ marginBottom: "14px", padding: "10px 12px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0", fontSize: "12.5px", color: "#166534" }}>
              <strong>External Auditor Verdict & Process Closure:</strong> Course Coordinator has resolved the NC document. Record the approval result communicated by the External Auditor (via direct office visit or email) and officially close the entire external audit cycle.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label style={{ gridColumn: "span 2" }}>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  Auditor Approval Communication Channel <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <select
                  value={closeProcessForm.approvalMode}
                  onChange={(e) => setCloseProcessForm({ ...closeProcessForm, approvalMode: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff" }}
                >
                  <option value="Direct Office Visit (Auditor visited office in person)">Direct Office Visit (Auditor visited office in person)</option>
                  <option value="Email Communication (Auditor communicated approval via email)">Email Communication (Auditor communicated approval via email)</option>
                </select>
              </label>

              <label>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  ISO 9001:2015 Certificate Number <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <input
                  type="text"
                  required
                  value={closeProcessForm.certificateNumber}
                  onChange={(e) => setCloseProcessForm({ ...closeProcessForm, certificateNumber: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </label>

              <label>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  Approval Endorsement Date <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <input
                  type="date"
                  required
                  value={closeProcessForm.approvalDate}
                  onChange={(e) => setCloseProcessForm({ ...closeProcessForm, approvalDate: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </label>

              <label style={{ gridColumn: "span 2" }}>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  External Auditor Official Recommendation <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <input
                  type="text"
                  required
                  value={closeProcessForm.recommendation}
                  onChange={(e) => setCloseProcessForm({ ...closeProcessForm, recommendation: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </label>

              <label style={{ gridColumn: "span 2" }}>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  Auditor Clearance Remarks
                </span>
                <textarea
                  rows={2}
                  value={closeProcessForm.remarks}
                  onChange={(e) => setCloseProcessForm({ ...closeProcessForm, remarks: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", resize: "vertical" }}
                />
              </label>

              <label style={{ gridColumn: "span 2" }}>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  QMS Coordinator Final Closure Remarks
                </span>
                <input
                  type="text"
                  value={closeProcessForm.qmsRemarks}
                  onChange={(e) => setCloseProcessForm({ ...closeProcessForm, qmsRemarks: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "18px" }}>
              <button type="button" className="secondary-button" onClick={() => setShowCloseProcessModal(false)}>
                Cancel
              </button>
              <button type="submit" className="primary-button btn-green" disabled={submitting}>
                <CheckCheck size={14} style={{ marginRight: "6px" }} />
                {submitting ? "Closing Process..." : "Close Entire Process & Ratify ISO 9001"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: View Incoming Email Communication Details */}
      {/* ========================================================================= */}
      {showEmailModal && selectedAudit && selectedAudit.incomingScheduleEmail && (
        <Modal
          title={`Email Notice: ${selectedAudit.incomingScheduleEmail.subject}`}
          onClose={() => setShowEmailModal(false)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
            <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div><strong>From:</strong> {selectedAudit.incomingScheduleEmail.from}</div>
              <div><strong>To:</strong> {selectedAudit.incomingScheduleEmail.to}</div>
              <div><strong>Date:</strong> {selectedAudit.incomingScheduleEmail.receivedAt}</div>
              <div><strong>Subject:</strong> {selectedAudit.incomingScheduleEmail.subject}</div>
            </div>

            <div
              style={{
                padding: "16px",
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                minHeight: "100px",
                lineHeight: 1.6
              }}
              dangerouslySetInnerHTML={{ __html: selectedAudit.incomingScheduleEmail.bodyHtml }}
            />

            {(selectedAudit.incomingScheduleEmail.attachments || []).length > 0 && (
              <div>
                <strong style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "6px" }}>
                  Attached Audit Timetable:
                </strong>
                {selectedAudit.incomingScheduleEmail.attachments.map((att, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 12px",
                      background: "#f1f5f9",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12px"
                    }}
                  >
                    <FileText size={14} color="#2563eb" />
                    <span>{att.fileName} ({att.fileSize})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: Detailed Audit Overview & Timeline */}
      {/* ========================================================================= */}
      {showDetailModal && selectedAudit && (
        <Modal
          title={`Audit Record & Complete Lifecycle Trail: ${selectedAudit.id}`}
          onClose={() => setShowDetailModal(false)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "13px" }}>
            <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <h4 style={{ margin: "0 0 6px 0", color: "#0f172a" }}>{selectedAudit.title}</h4>
              <p style={{ margin: 0, color: "#475569" }}>{selectedAudit.scope}</p>
            </div>

            <div>
              <strong style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                Sequential Lifecycle Timeline (Stage {selectedAudit.stage}/5):
              </strong>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {(selectedAudit.timeline || []).map((t, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "10px 12px",
                      background: "#ffffff",
                      borderRadius: "6px",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ color: "#1e293b", fontSize: "12.5px" }}>{t.action}</strong>
                      <span style={{ fontSize: "11px", color: "#64748b" }}>{t.timestamp}</span>
                    </div>
                    <span style={{ fontSize: "11.5px", color: "#2563eb", fontWeight: "600" }}>{t.actor}</span>
                    <span style={{ fontSize: "12px", color: "#475569" }}>{t.details}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
