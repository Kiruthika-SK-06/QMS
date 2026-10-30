import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CalendarCheck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  FileText,
  UserCheck,
  Award,
  Eye,
  Edit,
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
  Sparkles
} from "lucide-react";
import { useApp } from "../context/AppContext";
import PageIntro from "../components/common/PageIntro";
import StatCard from "../components/common/StatCard";
import StatusBadge from "../components/common/StatusBadge";
import Modal from "../components/tasks/Modal";

// 4-Step MRM Workflow Progress Helper
// Step 1: Plan & Schedule Meeting (QMS Coordinator)
// Step 2: Team Head Approval (Team Head)
// Step 3: Share Notification via Email (QMS Coordinator -> Course Coordinators, Team Head & Auditors)
// Step 4: MoM File Publication (QMS Coordinator uploads, Everyone accesses)
const getWorkflowDetails = (mrm) => {
  if (mrm.momFile || mrm.status === "MoM Uploaded" || mrm.status === "Completed" || (mrm.stage && mrm.stage >= 4)) {
    return {
      step: 4,
      statusLabel: "Completed (MoM Published)",
      badgeText: "Completed (MoM Published)",
      color: "#166534",
      bg: "#dcfce7",
      border: "#86efac"
    };
  }

  if (
    mrm.emailNotification?.sent ||
    mrm.status === "Notification Sent" ||
    mrm.status === "Shared" ||
    mrm.sharedWithAll ||
    mrm.stage === 3
  ) {
    return {
      step: 3,
      statusLabel: "Notification Sent",
      badgeText: "Notification Sent",
      color: "#4f46e5",
      bg: "#e0e7ff",
      border: "#c7d2fe"
    };
  }

  const isApproved =
    mrm.approvals?.teamHead?.status === "Approved" ||
    mrm.status === "Approved" ||
    mrm.status === "Approved by Trust Head" ||
    mrm.trustHeadApproval?.approved ||
    mrm.stage === 2.5;

  if (isApproved) {
    return {
      step: 2.5,
      statusLabel: "Approved by Trust Head",
      badgeText: "Approved by Trust Head",
      color: "#0f766e",
      bg: "#f0fdfa",
      border: "#99f6e4"
    };
  }

  if (
    mrm.status === "Pending Approval" ||
    mrm.status === "Submitted for Approval" ||
    mrm.status === "Pending Trust Head Approval" ||
    mrm.stage === 2
  ) {
    return {
      step: 2,
      statusLabel: "Pending Approval",
      badgeText: "Pending Trust Head Approval",
      color: "#b45309",
      bg: "#fffbeb",
      border: "#fde68a"
    };
  }

  if (mrm.status === "Changes Requested" || mrm.stage === 1.5) {
    return {
      step: 1.5,
      statusLabel: "Revisions Requested",
      badgeText: "Revisions Requested",
      color: "#dc2626",
      bg: "#fee2e2",
      border: "#fca5a5"
    };
  }

  return {
    step: 1,
    statusLabel: "Planned",
    badgeText: "Planned",
    color: "#1d4ed8",
    bg: "#eff6ff",
    border: "#bfdbfe"
  };
};

export default function ManagementReviewMeeting() {
  const {
    mrmList,
    processes = [],
    addMRM,
    updateMRM,
    requestMRMApproval,
    approveMRM,
    requestChangesMRM,
    shareMeetingEmail,
    uploadMoMFile,
    currentUser,
    usersList
  } = useApp();

  // Role permissions
  const isQMSCoordinator = currentUser?.role === "qm";
  const isTrustHead = currentUser?.role === "Head";
  const isInternalAuditor = currentUser?.role === "auditor";
  const isCourseCoordinator = currentUser?.role === "owner";

  const [searchParams, setSearchParams] = useSearchParams();
  const urlFilter = searchParams.get("filter");
  const [query, setQuery] = useState("");
  const [filterStep, setFilterStep] = useState(urlFilter === "Approved" ? "Approved" : "All");
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    const f = searchParams.get("filter");
    if (f === "Approved") {
      setFilterStep("Approved");
    } else if (!f && filterStep === "Approved") {
      setFilterStep("All");
    }
  }, [searchParams]);

  // Modals state
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showUploadMoMModal, setShowUploadMoMModal] = useState(false);
  const [showMoMPreviewModal, setShowMoMPreviewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMRM, setSelectedMRM] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  // Stage 1: Plan Meeting Form State
  const [planForm, setPlanForm] = useState({
    title: "",
    description: "",
    targetMonth: "November 2026",
    scheduledDate: "",
    scheduledTime: "10:30 AM",
    venue: "Main Boardroom / Webex Video Conference (Room 402)",
    department: "Academic Quality & Compliance",
    process: "All Processes (Comprehensive Academic Quality Review)",
    requestApprovalImmediately: true,
    agenda: [
      "Review of previous MRM action items & closure status",
      "Analysis of student semester feedback & satisfaction index",
      "Course delivery milestones and practical lab examination results",
      "Resource allocation, software licenses & computing server capacity",
      "Recommendations for continual curriculum modernization"
    ],
    attendees: [
      "Rahul Kumar (QMS Coordinator)",
      "Anita Rao (Team Head)",
      "Suresh Menon (Internal Auditor)",
      "Priya Sharma (Course Coordinator)",
      "Dr. Rajesh Verma (Course Coordinator - AI)",
      "Sunita Patil (Course Coordinator - Cyber Security)"
    ]
  });
  const [newAgendaItem, setNewAgendaItem] = useState("");

  // Stage 2: Team Head Approval Form State
  const [approvalDecision, setApprovalDecision] = useState("approve"); // 'approve' | 'changes'
  const [approvalRemarks, setApprovalRemarks] = useState("");

  // Stage 4: Upload MoM Form State
  const [momUploadForm, setMomUploadForm] = useState({
    fileName: "",
    fileSize: "",
    fileType: "application/pdf",
    fileData: null,
    summary: "",
    discussionPoints: [
      "Course delivery completion reviewed across all departments.",
      "Internal audit gaps in course lab manuals addressed.",
      "Student satisfaction indices evaluated."
    ],
    actionItems: [
      {
        id: "ACT-01",
        task: "Incorporate updated course delivery modules into syllabus",
        assignee: "Priya Sharma (Course Coordinator)",
        deadline: "2026-11-30",
        status: "In Progress"
      }
    ],
    decisions: [
      "Approved student industrial mentorship workshops for Q4.",
      "Sanctioned compute server infrastructure expansion."
    ]
  });
  const [selectedFileObj, setSelectedFileObj] = useState(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(""), 4500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (msg) => setToastMessage(msg);

  // Helper actions
  const openPlanModal = () => {
    setPlanForm({
      title: "",
      description: "",
      targetMonth: "November 2026",
      scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      scheduledTime: "10:30 AM",
      venue: "Main Boardroom / Webex Video Conference (Room 402)",
      department: "Academic Quality & Compliance",
      process: "All Processes (Comprehensive Academic Quality Review)",
      requestApprovalImmediately: true,
      agenda: [
        "Review of previous MRM action items & closure status",
        "Analysis of student semester feedback & satisfaction index",
        "Course delivery milestones and practical lab examination results",
        "Resource allocation, software licenses & computing server capacity",
        "Recommendations for continual curriculum modernization"
      ],
      attendees: [
        "Rahul Kumar (QMS Coordinator)",
        "Anita Rao (Team Head)",
        "Suresh Menon (Internal Auditor)",
        "Priya Sharma (Course Coordinator)",
        "Dr. Rajesh Verma (Course Coordinator - AI)",
        "Sunita Patil (Course Coordinator - Cyber Security)"
      ]
    });
    setShowPlanModal(true);
  };

  const openApprovalModal = (mrm) => {
    setSelectedMRM(mrm);
    setApprovalDecision("approve");
    setApprovalRemarks("Meeting objectives, scheduled date, and participant list fully ratified.");
    setShowApprovalModal(true);
  };

  const openEmailModal = (mrm) => {
    setSelectedMRM(mrm);
    setShowEmailModal(true);
  };

  const openUploadMoMModal = (mrm) => {
    setSelectedMRM(mrm);
    setMomUploadForm({
      fileName: `MRM_${mrm.id}_MoM.pdf`,
      fileSize: "2.4 MB",
      fileType: "application/pdf",
      fileData: null,
      summary: `Minutes of Meeting recorded for "${mrm.title}". Meeting objectives accomplished, curriculum milestones ratified, and action items assigned.`,
      discussionPoints: [
        "Course delivery milestones and practical examination completion evaluated.",
        "Student semester feedback reviewed with 94.2% satisfaction index.",
        "Internal audit observations addressed and closed."
      ],
      actionItems: [
        {
          id: "ACT-01",
          task: "Integrate revised practical lab assignments into semester schedule",
          assignee: "Priya Sharma (Course Coordinator)",
          deadline: "2026-11-25",
          status: "In Progress"
        },
        {
          id: "ACT-02",
          task: "Upgrade cloud server compute infrastructure for AI laboratory",
          assignee: "IT Infrastructure Support",
          deadline: "2026-11-15",
          status: "Completed"
        }
      ],
      decisions: [
        "Ratified curriculum enhancements for current academic semester.",
        "Approved student industrial mentorship workshops for Q4."
      ]
    });
    setSelectedFileObj({ name: `MRM_${mrm.id}_MoM.pdf`, size: 2450000 });
    setShowUploadMoMModal(true);
  };

  const openMoMPreviewModal = (mrm) => {
    setSelectedMRM(mrm);
    setShowMoMPreviewModal(true);
  };

  // Submit Stage 1: Plan Meeting
  const handlePlanSubmit = async (e) => {
    e.preventDefault();
    if (!planForm.title.trim() || !planForm.scheduledDate) {
      alert("Please enter a meeting title and scheduled date.");
      return;
    }

    setSubmitting(true);
    setShowPlanModal(false);
    setFilterStep("All");
    setSearchParams({});
    try {
      await addMRM(planForm);
      showToast(
        planForm.requestApprovalImmediately
          ? "MRM planned and shared to Trust Head (Anita Rao) for approval!"
          : "MRM meeting planned and scheduled successfully!"
      );
    } catch (err) {
      alert(err.message || "Failed to plan meeting");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Stage 1 -> Stage 2: Share to Team Head for approval
  const handleShareToTeamHead = async (mrm) => {
    if (!window.confirm(`Share "${mrm.title}" to Trust Head (Anita Rao) for formal approval?`)) {
      return;
    }
    setSubmitting(true);
    try {
      await requestMRMApproval(mrm.id);
      showToast("Meeting proposal shared to Trust Head (Anita Rao) for approval!");
    } catch (err) {
      alert(err.message || "Failed to share for approval");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Stage 2: Team Head Approval / Changes
  const handleApprovalSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMRM) return;

    setSubmitting(true);
    try {
      if (approvalDecision === "approve") {
        await approveMRM(selectedMRM.id, { remarks: approvalRemarks });
        showToast("MRM approved! QMS Coordinator can now dispatch notifications via email.");
      } else {
        if (!approvalRemarks.trim()) {
          alert("Please provide comments explaining the requested changes.");
          setSubmitting(false);
          return;
        }
        await requestChangesMRM(selectedMRM.id, approvalRemarks);
        showToast("Revisions requested. Returned to QMS Coordinator for update.");
      }
      setShowApprovalModal(false);
    } catch (err) {
      alert(err.message || "Failed to record approval");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Stage 3: Share Meeting Notification via Email
  const handleSendEmailNotification = async () => {
    if (!selectedMRM) return;
    setSubmitting(true);
    try {
      await shareMeetingEmail(selectedMRM.id);
      setShowEmailModal(false);
      showToast("Meeting notification successfully emailed to all Course Coordinators, Team Head & Internal Auditor!");
    } catch (err) {
      alert(err.message || "Failed to send email notifications");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Stage 4: Upload MoM File
  const handleUploadMoMSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMRM) return;

    setSubmitting(true);
    try {
      const payload = {
        fileName: selectedFileObj ? selectedFileObj.name : momUploadForm.fileName,
        fileSize: selectedFileObj ? `${(selectedFileObj.size / (1024 * 1024)).toFixed(1)} MB` : momUploadForm.fileSize,
        fileType: "application/pdf",
        summary: momUploadForm.summary,
        discussionPoints: momUploadForm.discussionPoints,
        actionItems: momUploadForm.actionItems,
        decisions: momUploadForm.decisions
      };
      await uploadMoMFile(selectedMRM.id, payload);
      setShowUploadMoMModal(false);
      showToast("MoM file published successfully! It is now visible and downloadable by everyone.");
    } catch (err) {
      alert(err.message || "Failed to upload MoM file");
    } finally {
      setSubmitting(false);
    }
  };

  // Download MoM File helper
  const handleDownloadMoM = (mrm) => {
    const fileName = mrm.momFile?.fileName || `MRM_${mrm.id}_MoM.pdf`;
    const textContent = `
CENTRE FOR DEVELOPMENT OF ADVANCED COMPUTING (C-DAC)
QUALITY MANAGEMENT SYSTEM (ISO 9001:2015)
MINUTES OF MANAGEMENT REVIEW MEETING (MoM)
======================================================================
Meeting Title   : ${mrm.title}
Meeting ID      : ${mrm.id}
Date & Time     : ${mrm.scheduledDate || "N/A"} at ${mrm.scheduledTime || "10:30 AM"}
Venue           : ${mrm.venue || "Main Boardroom"}
Planned By      : ${mrm.plannedBy || "Rahul Kumar (QMS Coordinator)"}
Approved By     : ${mrm.approvals?.teamHead?.approverName || "Anita Rao (Team Head)"}
MoM Uploaded By : ${mrm.momFile?.uploadedBy || "Rahul Kumar (QMS Coordinator)"}
Upload Date     : ${mrm.momFile?.uploadedAt || new Date().toLocaleDateString()}
======================================================================

EXECUTIVE SUMMARY:
${mrm.momFile?.summary || "Meeting completed with all agenda items discussed and approved."}

KEY DISCUSSION POINTS:
${(mrm.momFile?.discussionPoints || []).map((pt, i) => `${i + 1}. ${pt}`).join("\n")}

RATIFIED DECISIONS:
${(mrm.momFile?.decisions || []).map((dec, i) => `[x] ${dec}`).join("\n")}

ACTION ITEMS & ASSIGNMENTS:
${(mrm.momFile?.actionItems || [])
  .map(
    (act, i) =>
      `Item #${i + 1}: ${act.task}\n   Assignee: ${act.assignee} | Deadline: ${act.deadline} | Status: ${act.status}`
  )
  .join("\n\n")}

======================================================================
Controlled Document - Published for all Course Staff and Auditors
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
    showToast(`Downloading official MoM file: ${fileName}`);
  };

  // Role-based visibility filter
  const visibleMRMs = (mrmList || []).filter((mrm) => {
    const wf = getWorkflowDetails(mrm);
    // Course Coordinator rule:
    // Only show MRMs that have reached "Notification Sent" (step 3) or "MoM Published" (step 4)
    if (isCourseCoordinator) {
      return wf.step >= 3;
    }
    // Internal Auditor rule:
    // Show approved meetings, dates, agendas, and MoM files (skip draft & revision stages: steps 1 and 1.5)
    if (isInternalAuditor) {
      return wf.step >= 2.5 || mrm.status === "Approved" || mrm.status === "Approved by Trust Head" || !!mrm.momFile;
    }
    // QMS Coordinator and Trust Head: Full visibility of all MRMs
    return true;
  });

  // Filter meetings by search query and active tab
  const filteredMRMs = visibleMRMs.filter((mrm) => {
    const wf = getWorkflowDetails(mrm);
    const matchesFilter =
      filterStep === "All" ||
      (filterStep === "Step 1" && wf.step === 1) ||
      (filterStep === "Step 2" && (wf.step === 2 || wf.step === 1.5)) ||
      (filterStep === "Step 3" && (wf.step === 2.5 || wf.step === 3)) ||
      (filterStep === "Scheduled" && (wf.step === 3 || (isInternalAuditor && wf.step === 2.5))) ||
      (filterStep === "Step 4" && wf.step === 4) ||
      (filterStep === "MoM" && wf.step === 4) ||
      (filterStep === "Approved" && (wf.step >= 2.5 || mrm.status === "Approved" || mrm.status === "Approved by Trust Head" || mrm.momFile));

    const q = query.toLowerCase();
    const matchesQuery =
      (mrm.title && mrm.title.toLowerCase().includes(q)) ||
      (mrm.id && mrm.id.toLowerCase().includes(q)) ||
      (mrm.targetMonth && mrm.targetMonth.toLowerCase().includes(q)) ||
      (mrm.venue && mrm.venue.toLowerCase().includes(q)) ||
      (Array.isArray(mrm.agenda) && mrm.agenda.some((ag) => ag.toLowerCase().includes(q)));

    return matchesFilter && matchesQuery;
  });

  // Metric counts tailored by role
  const totalMeetings = visibleMRMs.length;
  const pendingApprovalCount = (mrmList || []).filter((m) => getWorkflowDetails(m).step === 2).length;
  const readyToEmailCount = (mrmList || []).filter((m) => getWorkflowDetails(m).step === 2.5).length;
  const momPublishedCount = visibleMRMs.filter((m) => getWorkflowDetails(m).step === 4).length;
  const scheduledCount = visibleMRMs.filter((m) => getWorkflowDetails(m).step === 3).length;
  const auditorApprovedCount = visibleMRMs.filter((m) => getWorkflowDetails(m).step >= 2.5).length;

  // Course Coordinator action items count from published MoMs
  const myAssignedActionsCount = visibleMRMs.reduce((acc, mrm) => {
    const items = mrm.momFile?.actionItems || [];
    const myItems = items.filter(
      (act) =>
        act.assignee?.toLowerCase().includes("priya") ||
        act.assignee?.toLowerCase().includes("course coordinator") ||
        act.assignee?.toLowerCase().includes(currentUser?.name?.toLowerCase() || "")
    );
    return acc + myItems.length;
  }, 0);

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
        eyebrow="Review Meetings"
        title={
          isCourseCoordinator
            ? "Scheduled Review Meetings (MRM)"
            : isInternalAuditor
            ? "Management Review Meetings (MRM Oversight)"
            : "Management Review Meeting (MRM)"
        }
        description={
          isCourseCoordinator
            ? "View scheduled review meetings, official meeting agendas, and published Minutes of Meeting (MoM)."
            : isInternalAuditor
            ? "Review approved Management Review Meetings, attendance records, ratified decisions, and official published MoMs."
            : "Plan, approve, distribute, and record Management Review Meetings in compliance with ISO 9001:2015."
        }
        action={
          isQMSCoordinator && (
            <button
              className="primary-button btn-blue"
              onClick={openPlanModal}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontWeight: "600" }}
            >
              <Plus size={18} />
              <span>Plan & Schedule Meeting</span>
            </button>
          )
        }
      />

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
            <StatCard label="Scheduled Meetings" value={scheduledCount} icon={CalendarCheck} tone="blue" hint="Notified meetings to attend" />
            <StatCard label="MoM Published" value={momPublishedCount} icon={CheckCircle2} tone="green" hint="Official minutes available" />
            <StatCard label="My Assigned Actions" value={myAssignedActionsCount} icon={FileText} tone="teal" hint="Action items assigned to you" />
          </>
        ) : isInternalAuditor ? (
          <>
            <StatCard label="Approved Meetings" value={auditorApprovedCount} icon={ShieldCheck} tone="blue" hint="Ratified by Trust Head" />
            <StatCard label="Upcoming Scheduled" value={scheduledCount} icon={Mail} tone="teal" hint="Dispatched to coordinators" />
            <StatCard label="MoM Published" value={momPublishedCount} icon={CheckCircle2} tone="green" hint="Official minutes recorded" />
          </>
        ) : isTrustHead ? (
          <>
            <StatCard label="Total Meetings" value={totalMeetings} icon={CalendarCheck} tone="blue" />
            <StatCard label="Pending My Approval" value={pendingApprovalCount} icon={Clock} tone="amber" hint="Action required to review & approve" />
            <StatCard label="Approved Meetings" value={auditorApprovedCount} icon={ShieldCheck} tone="teal" hint="Ratified meeting schedules" />
            <StatCard label="Completed / MoM Published" value={momPublishedCount} icon={CheckCircle2} tone="green" hint="Official meeting minutes published" />
          </>
        ) : (
          <>
            <StatCard label="Total Meetings" value={totalMeetings} icon={CalendarCheck} tone="blue" />
            <StatCard label="Pending Trust Head Approval" value={pendingApprovalCount} icon={Clock} tone="amber" />
            <StatCard label="Ready for Email Notification" value={readyToEmailCount} icon={Mail} tone="teal" />
            <StatCard label="Completed / MoM Published" value={momPublishedCount} icon={CheckCircle2} tone="green" />
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
            placeholder={
              isCourseCoordinator
                ? "Search scheduled meetings by title, ID, venue, or agenda..."
                : "Search meetings by title, ID, target month, venue, or agenda..."
            }
          />
        </label>

        <div className="tabs" style={{ overflowX: "auto" }}>
          {(isCourseCoordinator
            ? [
                { id: "All", label: `All Meetings (${visibleMRMs.length})` },
                { id: "Scheduled", label: `Scheduled (${scheduledCount})` },
                { id: "MoM", label: `MoM Published (${momPublishedCount})` }
              ]
            : isInternalAuditor
            ? [
                { id: "All", label: `Review Meetings (${visibleMRMs.length})` },
                { id: "MoM", label: `MoM Available (${momPublishedCount})` }
              ]
            : isTrustHead
            ? [
                { id: "All", label: `All Meetings (${visibleMRMs.length})` },
                { id: "Step 2", label: `Pending My Approval (${pendingApprovalCount})` },
                { id: "Step 3", label: "Approved Meetings" },
                { id: "Step 4", label: `Completed / MoM (${momPublishedCount})` }
              ]
            : [
                { id: "All", label: "All Meetings" },
                { id: "Step 1", label: "1. Planned" },
                { id: "Step 2", label: "2. Pending Approval" },
                { id: "Step 3", label: "3. Notification Sent" },
                { id: "Step 4", label: "4. Completed / MoM Published" }
              ]
          ).map((tab) => (
            <button
              key={tab.id}
              className={filterStep === tab.id ? "tab active" : "tab"}
              onClick={() => {
                setFilterStep(tab.id);
                setSearchParams({});
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Meetings List / Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        {filteredMRMs.length === 0 ? (
          <div
            style={{
              padding: "48px 24px",
              textAlign: "center",
              background: "#ffffff",
              borderRadius: "12px",
              border: "1px dashed #cbd5e1"
            }}
          >
            <CalendarCheck size={42} style={{ color: "#94a3b8", margin: "0 auto 12px auto" }} />
            <h3 style={{ margin: "0 0 6px 0", color: "#1e293b" }}>No Management Review Meetings Found</h3>
            <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
              {query ? "Try adjusting your search keywords." : "No meetings currently match the selected workflow step."}
            </p>
          </div>
        ) : (
          filteredMRMs.map((mrm) => {
            const wf = getWorkflowDetails(mrm);

            return (
              <div
                key={mrm.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                {/* Meeting Top Bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                  <div style={{ flex: 1, minWidth: "260px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontFamily: "'Roboto Mono', monospace",
                          fontSize: "12px",
                          fontWeight: "700",
                          color: "#2563eb",
                          background: "#eff6ff",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          border: "1px solid #bfdbfe",
                          display: "inline-flex",
                          alignItems: "center"
                        }}
                      >
                        {mrm.id}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "600",
                          color: "#475569",
                          background: "#f1f5f9",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          border: "1px solid #e2e8f0"
                        }}
                      >
                        Process: {mrm.process || "All Processes (Comprehensive Academic Quality Review)"}
                      </span>
                    </div>
                    <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#0f172a" }}>
                      {mrm.title}
                    </h3>
                  </div>

                  {/* Stage Badge (Role-tailored) */}
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "600",
                      background: isCourseCoordinator
                        ? wf.step === 4 ? "#dcfce7" : "#e0e7ff"
                        : wf.bg,
                      color: isCourseCoordinator
                        ? wf.step === 4 ? "#16a34a" : "#4338ca"
                        : wf.color,
                      border: `1px solid ${isCourseCoordinator ? (wf.step === 4 ? "#86efac" : "#c7d2fe") : wf.border}`
                    }}
                  >
                    {wf.step === 4 ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <Calendar size={14} />
                    )}
                    {isCourseCoordinator
                      ? wf.step === 4 ? "MoM Published" : "Meeting Scheduled"
                      : isInternalAuditor
                      ? wf.step === 4 ? "MoM Published" : wf.step === 3 ? "Notification Sent" : "Approved by Team Head"
                      : wf.badgeText}
                  </span>
                </div>

                {/* Meeting Schedule Details Pill Box */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
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
                    <span><strong>Date:</strong> {mrm.scheduledDate || "Date to be scheduled"}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#334155" }}>
                    <Clock size={15} color="#2563eb" />
                    <span><strong>Time:</strong> {mrm.scheduledTime || "10:30 AM"}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#334155" }}>
                    <MapPin size={15} color="#2563eb" />
                    <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                      <strong>Venue:</strong> {mrm.venue || "Main Boardroom"}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#334155" }}>
                    <UserCheck size={15} color="#2563eb" />
                    <span><strong>Planner:</strong> {mrm.plannedBy || "Rahul Kumar (QMS)"}</span>
                  </div>
                </div>

                {/* Meeting Content: QMS Coordinator sees 4-step stepper; Trust Head, Course Coordinator, and Auditor see clean Meeting Details */}
                {isQMSCoordinator ? (
                  <div style={{ margin: "16px 0", padding: "12px 16px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
                      {[
                        { num: 1, title: "1. Plan & Schedule", role: "QMS Coordinator" },
                        { num: 2, title: "2. Trust Head Approval", role: "Trust Head" },
                        { num: 3, title: "3. Email Notification", role: "QMS Coordinator" },
                        { num: 4, title: "4. MoM Document & Completion", role: "Public to All" }
                      ].map((stepItem, idx) => {
                        const isComplete =
                          wf.step > stepItem.num ||
                          (stepItem.num === 2 && wf.step >= 2.5);
                        const isCurrent =
                          wf.step === stepItem.num ||
                          (stepItem.num === 2 && wf.step === 2.5);

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
                              <span style={{ fontSize: "10px", color: "#94a3b8" }}>{stepItem.role}</span>
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
                ) : (
                  <div style={{ margin: "14px 0", padding: "14px 16px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <div style={{ marginBottom: "8px" }}>
                      <strong style={{ fontSize: "11.5px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "4px" }}>
                        Meeting Purpose & Review Context
                      </strong>
                      <p style={{ margin: 0, fontSize: "13.5px", color: "#1e293b", lineHeight: 1.5 }}>
                        {mrm.description || "Comprehensive academic review of course delivery milestones, student satisfaction indices, practical curriculum modernization, and quality standard adherence."}
                      </p>
                    </div>
                    {Array.isArray(mrm.agenda) && mrm.agenda.length > 0 && (
                      <div style={{ marginTop: "10px" }}>
                        <strong style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                          Discussion Agendas:
                        </strong>
                        <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12.5px", color: "#334155", display: "flex", flexDirection: "column", gap: "3px" }}>
                          {mrm.agenda.slice(0, 3).map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
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
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setSelectedMRM(mrm);
                      setShowDetailModal(true);
                    }}
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
                  >
                    <Eye size={14} />
                    <span>View Meeting Details</span>
                  </button>

                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    {/* STEP 1: QMS Coordinator shares planned meeting to Team Head */}
                    {wf.step === 1 && isQMSCoordinator && (
                      <button
                        type="button"
                        className="primary-button btn-blue"
                        onClick={() => handleShareToTeamHead(mrm)}
                        disabled={submitting}
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
                      >
                        <Send size={14} />
                        <span>Share to Trust Head for Approval</span>
                      </button>
                    )}

                    {/* STEP 2: Team Head reviews & approves meeting */}
                    {wf.step === 2 && isTrustHead && (
                      <button
                        type="button"
                        className="primary-button btn-green"
                        onClick={() => openApprovalModal(mrm)}
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
                      >
                        <ShieldCheck size={15} />
                        <span>Review & Approve Meeting</span>
                      </button>
                    )}

                    {/* STEP 3: Meeting Approved -> QMS Coordinator dispatches notification to all via email */}
                    {wf.step === 2.5 && isQMSCoordinator && (
                      <button
                        type="button"
                        className="primary-button btn-blue"
                        onClick={() => openEmailModal(mrm)}
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", background: "#4f46e5" }}
                      >
                        <Mail size={15} />
                        <span>Share Meeting Notification via Email</span>
                      </button>
                    )}

                    {/* STEP 4: Notification Sent -> QMS Coordinator uploads MoM file */}
                    {wf.step === 3 && isQMSCoordinator && (
                      <button
                        type="button"
                        className="primary-button btn-blue"
                        onClick={() => openUploadMoMModal(mrm)}
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", background: "#0891b2" }}
                      >
                        <UploadCloud size={15} />
                        <span>Build & Upload MoM as Document</span>
                      </button>
                    )}

                    {/* Internal Auditor MoM status when pending */}
                    {isInternalAuditor && wf.step < 4 && (
                      <span style={{ fontSize: "12px", color: "var(--muted)", fontStyle: "italic", padding: "6px 8px" }}>
                        MoM file in preparation by QMS Coordinator
                      </span>
                    )}

                    {/* STEP 4: MoM File Uploaded -> Downloadable & Viewable by EVERYONE */}
                    {wf.step === 4 && (
                      <>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => openMoMPreviewModal(mrm)}
                          style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
                        >
                          <FileText size={14} />
                          <span>View MoM Summary</span>
                        </button>

                        <button
                          type="button"
                          className="primary-button btn-green"
                          onClick={() => handleDownloadMoM(mrm)}
                          style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
                        >
                          <FileDown size={15} />
                          <span>Download MoM File</span>
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
      {/* MODAL 1: Plan & Schedule Meeting (QMS Coordinator Only)                   */}
      {/* ========================================================================= */}
      {showPlanModal && isQMSCoordinator && (
        <Modal
          title="Plan & Schedule Management Review Meeting"
          onClose={() => setShowPlanModal(false)}
        >
          <form onSubmit={handlePlanSubmit}>
            <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <label style={{ gridColumn: "span 2" }}>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  Meeting Title <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Academic Review & Curriculum Delivery Alignment"
                  value={planForm.title}
                  onChange={(e) => setPlanForm({ ...planForm, title: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </label>

              <label style={{ gridColumn: "span 2" }}>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  Associated Quality Process <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <select
                  value={planForm.process || "All Processes (Comprehensive Academic Quality Review)"}
                  onChange={(e) => setPlanForm({ ...planForm, process: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff", fontSize: "13px" }}
                >
                  <option value="All Processes (Comprehensive Academic Quality Review)">
                    All Processes (Comprehensive Academic Quality Review)
                  </option>
                  <option value="Quality Review & MRM">Quality Review & MRM</option>
                  {(processes || []).map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} ({p.id})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  Scheduled Date <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <input
                  type="date"
                  required
                  value={planForm.scheduledDate}
                  onChange={(e) => setPlanForm({ ...planForm, scheduledDate: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </label>

              <label>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  Scheduled Time <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10:30 AM"
                  value={planForm.scheduledTime}
                  onChange={(e) => setPlanForm({ ...planForm, scheduledTime: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </label>

              <label>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  Target Month / Period
                </span>
                <input
                  type="text"
                  placeholder="e.g. November 2026"
                  value={planForm.targetMonth}
                  onChange={(e) => setPlanForm({ ...planForm, targetMonth: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </label>

              <label>
                <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                  Venue / Virtual Link
                </span>
                <input
                  type="text"
                  placeholder="e.g. Main Boardroom / Webex Video Conference"
                  value={planForm.venue}
                  onChange={(e) => setPlanForm({ ...planForm, venue: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </label>
            </div>

            {/* Agenda Items */}
            <div style={{ marginTop: "16px" }}>
              <span style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "13px" }}>
                Meeting Agenda Items ({planForm.agenda.length})
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "8px" }}>
                {planForm.agenda.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "6px 10px",
                      background: "#f8fafc",
                      borderRadius: "6px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px"
                    }}
                  >
                    <span>
                      <strong>{idx + 1}.</strong> {item}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setPlanForm({
                          ...planForm,
                          agenda: planForm.agenda.filter((_, i) => i !== idx)
                        })
                      }
                      style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="Add new agenda discussion item..."
                  value={newAgendaItem}
                  onChange={(e) => setNewAgendaItem(e.target.value)}
                  style={{ flex: 1, padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                />
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    if (newAgendaItem.trim()) {
                      setPlanForm({ ...planForm, agenda: [...planForm.agenda, newAgendaItem.trim()] });
                      setNewAgendaItem("");
                    }
                  }}
                  style={{ fontSize: "12px", padding: "6px 12px" }}
                >
                  Add Item
                </button>
              </div>
            </div>

            {/* Immediate approval checkbox */}
            <div style={{ marginTop: "16px", padding: "12px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: "#166534" }}>
                <input
                  type="checkbox"
                  checked={planForm.requestApprovalImmediately}
                  onChange={(e) => setPlanForm({ ...planForm, requestApprovalImmediately: e.target.checked })}
                />
                <span>Share to Team Head for approval immediately</span>
              </label>
            </div>

            <div className="modal-actions" style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowPlanModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary-button btn-blue"
                disabled={submitting}
              >
                <span>{submitting ? "Scheduling..." : "Save & Schedule Meeting"}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Team Head Approval (Team Head Only)                              */}
      {/* ========================================================================= */}
      {showApprovalModal && isTrustHead && selectedMRM && (
        <Modal
          title={`Review & Ratify Meeting Schedule: ${selectedMRM.title}`}
          onClose={() => setShowApprovalModal(false)}
        >
          <form onSubmit={handleApprovalSubmit}>
            <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "16px", fontSize: "13px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div><strong>Scheduled Date:</strong> {selectedMRM.scheduledDate} at {selectedMRM.scheduledTime || "10:30 AM"}</div>
                <div><strong>Venue:</strong> {selectedMRM.venue}</div>
                <div><strong>Planner:</strong> {selectedMRM.plannedBy || "Rahul Kumar (QMS Coordinator)"}</div>
                <div><strong>Target Period:</strong> {selectedMRM.targetMonth || "Q4"}</div>
              </div>

              <div style={{ marginTop: "10px" }}>
                <strong style={{ fontSize: "12px", color: "#475569" }}>Agenda Overview:</strong>
                <ol style={{ margin: "4px 0 0 16px", padding: 0, fontSize: "12px" }}>
                  {(selectedMRM.agenda || []).map((ag, i) => (
                    <li key={i}>{ag}</li>
                  ))}
                </ol>
              </div>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "13px" }}>
                Approval Decision
              </label>
              <div style={{ display: "flex", gap: "12px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px" }}>
                  <input
                    type="radio"
                    name="decision"
                    value="approve"
                    checked={approvalDecision === "approve"}
                    onChange={() => setApprovalDecision("approve")}
                  />
                  <span style={{ color: "#16a34a", fontWeight: "600" }}>Approve Meeting Schedule</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px" }}>
                  <input
                    type="radio"
                    name="decision"
                    value="changes"
                    checked={approvalDecision === "changes"}
                    onChange={() => setApprovalDecision("changes")}
                  />
                  <span style={{ color: "#dc2626", fontWeight: "600" }}>Request Revisions</span>
                </label>
              </div>
            </div>

            <label style={{ display: "block", marginBottom: "16px" }}>
              <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                Remarks / Review Comments
              </span>
              <textarea
                rows={3}
                value={approvalRemarks}
                onChange={(e) => setApprovalRemarks(e.target.value)}
                placeholder="Enter remarks for the record..."
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
              />
            </label>

            <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowApprovalModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`primary-button ${approvalDecision === "approve" ? "btn-green" : "btn-red"}`}
                disabled={submitting}
              >
                <span>{submitting ? "Recording..." : approvalDecision === "approve" ? "Confirm Approval" : "Request Changes"}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Share Meeting Notification via Email (QMS Coordinator Only)       */}
      {/* ========================================================================= */}
      {showEmailModal && isQMSCoordinator && selectedMRM && (
        <Modal
          title="Share Meeting Notification via Email"
          onClose={() => setShowEmailModal(false)}
        >
          <div>
            {/* Recipients Partitioned Display */}
            <div style={{ padding: "14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
              <strong style={{ fontSize: "13px", color: "#0f172a", display: "block", marginBottom: "8px" }}>
                Email Recipients (Auto-Targeted via User Registry):
              </strong>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
                <div>
                  <span style={{ fontWeight: "600", color: "#1e40af" }}>All Course Coordinators:</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                    <span style={{ padding: "2px 8px", background: "#eff6ff", borderRadius: "4px", border: "1px solid #bfdbfe", color: "#1e40af" }}>
                      Priya Sharma (coordinator@cdac.in)
                    </span>
                    <span style={{ padding: "2px 8px", background: "#eff6ff", borderRadius: "4px", border: "1px solid #bfdbfe", color: "#1e40af" }}>
                      Dr. Rajesh Verma (rajesh.verma@cdac.in)
                    </span>
                    <span style={{ padding: "2px 8px", background: "#eff6ff", borderRadius: "4px", border: "1px solid #bfdbfe", color: "#1e40af" }}>
                      Sunita Patil (sunita.patil@cdac.in)
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: "4px" }}>
                  <span style={{ fontWeight: "600", color: "#166534" }}>Team Head:</span>
                  <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                    <span style={{ padding: "2px 8px", background: "#f0fdf4", borderRadius: "4px", border: "1px solid #bbf7d0", color: "#166534" }}>
                      Anita Rao (head@cdac.in)
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: "4px" }}>
                  <span style={{ fontWeight: "600", color: "#6b21a8" }}>Internal Auditor:</span>
                  <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                    <span style={{ padding: "2px 8px", background: "#faf5ff", borderRadius: "4px", border: "1px solid #e9d5ff", color: "#6b21a8" }}>
                      Suresh Menon (auditor@cdac.in)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Email Preview */}
            <div style={{ border: "1px solid #cbd5e1", borderRadius: "8px", overflow: "hidden", marginBottom: "18px" }}>
              <div style={{ padding: "10px 14px", background: "#f1f5f9", borderBottom: "1px solid #cbd5e1", fontSize: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
                <div><strong>Subject:</strong> Official Notice: {selectedMRM.title} Scheduled for {selectedMRM.scheduledDate} at {selectedMRM.scheduledTime || "10:30 AM"}</div>
                <div><strong>From:</strong> Rahul Kumar &lt;qms@cdac.in&gt; (QMS Coordinator)</div>
              </div>
              <div style={{ padding: "16px", fontSize: "13px", lineHeight: "1.6", color: "#334155", background: "#ffffff" }}>
                <p style={{ marginTop: 0 }}>Dear Course Coordinators, Team Head, and Internal Auditor,</p>
                <p>
                  You are hereby notified that the <strong>{selectedMRM.title}</strong> has been officially approved by the Team Head and is scheduled as follows:
                </p>
                <ul style={{ paddingLeft: "20px", margin: "10px 0" }}>
                  <li><strong>Date & Time:</strong> {selectedMRM.scheduledDate} at {selectedMRM.scheduledTime || "10:30 AM"}</li>
                  <li><strong>Venue:</strong> {selectedMRM.venue}</li>
                  <li><strong>Agenda Scope:</strong> {(selectedMRM.agenda || []).slice(0, 3).join(", ")}</li>
                </ul>
                <p style={{ marginBottom: 0, fontSize: "12px", color: "#64748b" }}>
                  Please attend with your course milestone documents and semester completion records.
                </p>
              </div>
            </div>

            <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowEmailModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button btn-blue"
                onClick={handleSendEmailNotification}
                disabled={submitting}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Mail size={15} />
                <span>{submitting ? "Sending..." : "Send Email Notification to All"}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: Upload MoM as File (QMS Coordinator Only)                        */}
      {/* ========================================================================= */}
      {showUploadMoMModal && isQMSCoordinator && selectedMRM && (
        <Modal
          title={`Build & Upload Minutes of Meeting (MoM) as Document: ${selectedMRM.title}`}
          onClose={() => setShowUploadMoMModal(false)}
        >
          <form onSubmit={handleUploadMoMSubmit}>
            {/* File Upload Box */}
            <div
              style={{
                border: "2px dashed #93c5fd",
                borderRadius: "10px",
                padding: "20px",
                textAlign: "center",
                background: "#f0f9ff",
                marginBottom: "16px",
                cursor: "pointer"
              }}
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".pdf,.doc,.docx";
                input.onchange = (e) => {
                  if (e.target.files && e.target.files[0]) {
                    const f = e.target.files[0];
                    setSelectedFileObj(f);
                    setMomUploadForm((prev) => ({
                      ...prev,
                      fileName: f.name,
                      fileSize: `${(f.size / (1024 * 1024)).toFixed(1)} MB`
                    }));
                  }
                };
                input.click();
              }}
            >
              <UploadCloud size={36} color="#2563eb" style={{ margin: "0 auto 8px auto" }} />
              <strong style={{ fontSize: "14px", color: "#1e3a8a", display: "block" }}>
                {selectedFileObj ? selectedFileObj.name : "Click to select MoM Document File (PDF / DOCX)"}
              </strong>
              <small style={{ color: "#64748b", display: "block", marginTop: "4px" }}>
                {selectedFileObj
                  ? `${(selectedFileObj.size / (1024 * 1024)).toFixed(2)} MB`
                  : "PDF or DOCX (max 25 MB)"}
              </small>
            </div>

            <label style={{ display: "block", marginBottom: "14px" }}>
              <span style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "13px" }}>
                Meeting Summary / Key Findings
              </span>
              <textarea
                rows={3}
                required
                value={momUploadForm.summary}
                onChange={(e) => setMomUploadForm({ ...momUploadForm, summary: e.target.value })}
                placeholder="Summarize the core outcomes and ratified items..."
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
              />
            </label>

            {/* Action Items */}
            <div style={{ marginBottom: "16px" }}>
              <span style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "13px" }}>
                Action Items Assigned ({momUploadForm.actionItems.length})
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {momUploadForm.actionItems.map((act, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "8px 12px",
                      background: "#f8fafc",
                      borderRadius: "6px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                      display: "flex",
                      justifyContent: "space-between"
                    }}
                  >
                    <div>
                      <strong>{act.task}</strong>
                      <div style={{ color: "#64748b", marginTop: "2px" }}>
                        Assignee: <strong>{act.assignee}</strong> • Deadline: {act.deadline}
                      </div>
                    </div>
                    <span style={{ color: "#d97706", fontWeight: "600" }}>{act.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowUploadMoMModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary-button btn-green"
                disabled={submitting}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Check size={15} />
                <span>{submitting ? "Publishing..." : "Publish MoM Document for Everyone"}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: View / Download MoM File (Open to Everyone)                      */}
      {/* ========================================================================= */}
      {showMoMPreviewModal && selectedMRM && (
        <Modal
          title={`Minutes of Meeting (MoM): ${selectedMRM.title}`}
          onClose={() => setShowMoMPreviewModal(false)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Published File Card */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px",
                background: "#f0fdf4",
                borderRadius: "10px",
                border: "1px solid #bbf7d0"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "8px",
                    background: "#22c55e",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  <FileText size={24} />
                </div>
                <div>
                  <h4 style={{ margin: "0 0 2px 0", fontSize: "14px", color: "#14532d" }}>
                    {selectedMRM.momFile?.fileName || `MRM_${selectedMRM.id}_MoM.pdf`}
                  </h4>
                  <span style={{ fontSize: "12px", color: "#166534" }}>
                    File Size: {selectedMRM.momFile?.fileSize || "2.4 MB"} • Uploaded by {selectedMRM.momFile?.uploadedBy || "Rahul Kumar (QMS Coordinator)"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="primary-button btn-green"
                onClick={() => handleDownloadMoM(selectedMRM)}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
              >
                <Download size={14} />
                <span>Download MoM</span>
              </button>
            </div>

            {/* MoM Summary */}
            <div>
              <strong style={{ fontSize: "13px", color: "#0f172a", display: "block", marginBottom: "4px" }}>
                Executive Meeting Summary
              </strong>
              <p style={{ margin: 0, fontSize: "13px", color: "#334155", lineHeight: "1.5" }}>
                {selectedMRM.momFile?.summary || "Comprehensive review completed. Quality goals and syllabi progress ratified."}
              </p>
            </div>

            {/* Key Discussion Points */}
            <div>
              <strong style={{ fontSize: "13px", color: "#0f172a", display: "block", marginBottom: "6px" }}>
                Key Discussion Points & Outcomes
              </strong>
              <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "#334155" }}>
                {(selectedMRM.momFile?.discussionPoints || [
                  "Course delivery milestones and practical examination completion evaluated.",
                  "Student semester feedback reviewed with 94.2% satisfaction index."
                ]).map((pt, i) => (
                  <li key={i} style={{ marginBottom: "4px" }}>{pt}</li>
                ))}
              </ul>
            </div>

            {/* Action Items Table */}
            <div>
              <strong style={{ fontSize: "13px", color: "#0f172a", display: "block", marginBottom: "6px" }}>
                Action Items & Assignments
              </strong>
              <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
                <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                  <thead style={{ background: "#f8fafc" }}>
                    <tr>
                      <th style={{ padding: "8px 12px", textAlign: "left" }}>Action Item</th>
                      <th style={{ padding: "8px 12px", textAlign: "left" }}>Assignee</th>
                      <th style={{ padding: "8px 12px", textAlign: "left" }}>Deadline</th>
                      <th style={{ padding: "8px 12px", textAlign: "left" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedMRM.momFile?.actionItems || []).map((item, i) => (
                      <tr key={i} style={{ borderTop: "1px solid #e2e8f0" }}>
                        <td style={{ padding: "8px 12px" }}><strong>{item.task}</strong></td>
                        <td style={{ padding: "8px 12px", color: "#475569" }}>{item.assignee}</td>
                        <td style={{ padding: "8px 12px", color: "#475569" }}>{item.deadline}</td>
                        <td style={{ padding: "8px 12px" }}>
                          <span style={{ padding: "2px 6px", borderRadius: "4px", background: "#fef3c7", color: "#b45309", fontWeight: "600" }}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowMoMPreviewModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: Meeting Details & Audit History                                  */}
      {/* ========================================================================= */}
      {showDetailModal && selectedMRM && (
        <Modal
          title={`Meeting Details: ${selectedMRM.title}`}
          onClose={() => setShowDetailModal(false)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "13px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", padding: "12px", background: "#f8fafc", borderRadius: "8px" }}>
              <div><strong>Meeting ID:</strong> {selectedMRM.id}</div>
              <div><strong>Scheduled Date:</strong> {selectedMRM.scheduledDate} at {selectedMRM.scheduledTime || "10:30 AM"}</div>
              <div><strong>Target Period:</strong> {selectedMRM.targetMonth}</div>
              <div><strong>Venue:</strong> {selectedMRM.venue}</div>
              <div><strong>Planner:</strong> {selectedMRM.plannedBy}</div>
              {!isCourseCoordinator && (
                <div><strong>Team Head Approver:</strong> {selectedMRM.approvals?.teamHead?.approverName || "Pending"}</div>
              )}
            </div>

            <div>
              <strong style={{ fontSize: "13px", display: "block", marginBottom: "4px" }}>Agenda Items:</strong>
              <ol style={{ margin: 0, paddingLeft: "20px" }}>
                {(selectedMRM.agenda || []).map((ag, i) => (
                  <li key={i}>{ag}</li>
                ))}
              </ol>
            </div>

            {/* Workflow Audit History: Only visible to QMS Coordinator, Trust Head, and Auditor */}
            {!isCourseCoordinator && (
              <div>
                <strong style={{ fontSize: "13px", display: "block", marginBottom: "6px" }}>Workflow Audit History:</strong>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {(selectedMRM.timeline || []).map((tl, i) => (
                    <div key={i} style={{ padding: "6px 10px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <strong style={{ color: "#1e40af" }}>{tl.action}</strong>
                        <span style={{ color: "#94a3b8" }}>{tl.timestamp}</span>
                      </div>
                      <div style={{ color: "#475569" }}>{tl.actor}: {tl.details}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowDetailModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
