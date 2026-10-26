import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  CalendarCheck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Share2,
  AlertCircle,
  FileText,
  UserCheck,
  Award,
  ChevronRight,
  Eye,
  Edit,
  Send,
  Lock,
  Download,
  Calendar,
  MapPin,
  Check,
  ArrowRight,
  RotateCcw,
  XCircle,
  History,
  ListOrdered,
  Users,
  Sparkles,
  Filter,
  Mail,
  Upload,
  FileUp,
  ExternalLink,
  ShieldAlert
} from "lucide-react";
import { useApp } from "../context/AppContext";
import PageIntro from "../components/common/PageIntro";
import StatCard from "../components/common/StatCard";
import StatusBadge from "../components/common/StatusBadge";
import Modal from "../components/tasks/Modal";

// Helper to determine stage details according to the 4-step workflow:
// 1. Plan & Schedule
// 2. Trust Team Approval
// 3. Email Notice to All Coordinators & Trust Head
// 4. Meeting Done -> Upload MoM in Document
const getStageDetails = (mrm) => {
  // Step 4: Meeting Done & MoM Document Uploaded
  if (mrm.momDocument || mrm.status === "MoM Document Uploaded" || mrm.status === "MoM Recorded" || mrm.meetingDone) {
    return {
      step: 4,
      name: "MoM Document Uploaded",
      badgeText: "MoM Uploaded",
      color: "#16a34a",
      bg: "#dcfce7",
      border: "#86efac",
      nextAction: "Meeting conducted & MoM document published in Document Library."
    };
  }

  // Step 3: Approved & Notice Emailed
  if (mrm.emailNoticeSent || mrm.status === "Notice Emailed" || mrm.status === "Shared" || mrm.sharedWithAll) {
    return {
      step: 3,
      name: "Notice Emailed to Coordinators & Trust Head",
      badgeText: "Notice Emailed",
      color: "#0284c7",
      bg: "#e0f2fe",
      border: "#bae6fd",
      nextAction: "When meeting is conducted, QMS Coordinator uploads the MoM document."
    };
  }

  // Step 2b: Approved by Trust Team
  if (
    mrm.status === "Approved" ||
    mrm.status === "Approved by Trust Team" ||
    mrm.status === "Approved by Trust Head" ||
    mrm.trustHeadApproval?.approved
  ) {
    return {
      step: 2.5,
      name: "Approved by Trust Team",
      badgeText: "Schedule Approved",
      color: "#15803d",
      bg: "#ecfdf5",
      border: "#a7f3d0",
      nextAction: "QMS Coordinator can now dispatch meeting notice via email."
    };
  }

  // Step 2a: Submitted for Trust Team Approval
  if (
    mrm.status === "Submitted for Approval" ||
    mrm.status === "Pending Trust Team Approval" ||
    mrm.status === "Pending Trust Head Approval"
  ) {
    return {
      step: 2,
      name: "Pending Trust Team Approval",
      badgeText: "Under Trust Team Review",
      color: "#d97706",
      bg: "#fef3c7",
      border: "#fde68a",
      nextAction: "Awaiting formal review & approval from Trust Team."
    };
  }

  if (mrm.status === "Changes Requested") {
    return {
      step: 1.5,
      name: "Corrections Requested",
      badgeText: "Changes Requested",
      color: "#dc2626",
      bg: "#fee2e2",
      border: "#fca5a5",
      nextAction: "QMS Coordinator needs to revise meeting schedule and resubmit."
    };
  }

  if (mrm.status === "Rejected") {
    return {
      step: 1.5,
      name: "Schedule Rejected",
      badgeText: "Rejected by Trust Team",
      color: "#ef4444",
      bg: "#fee2e2",
      border: "#fca5a5",
      nextAction: "Review mandatory rejection reason from Trust Team."
    };
  }

  // Step 1: Planned & Scheduled
  if (mrm.scheduledDate) {
    return {
      step: 1,
      name: "Meeting Planned & Scheduled",
      badgeText: "Scheduled (Draft)",
      color: "var(--navy)",
      bg: "var(--navy-subtle)",
      border: "var(--navy-border)",
      nextAction: "Submit meeting schedule to Trust Team for approval."
    };
  }

  return {
    step: 0.5,
    name: "Meeting Planned",
    badgeText: "Planned (Pending Schedule)",
    color: "var(--navy)",
    bg: "var(--navy-subtle)",
    border: "var(--navy-border)",
    nextAction: "Specify Date, Time & Venue to complete schedule."
  };
};

export default function ManagementReviewMeeting() {
  const {
    mrmList,
    addMRM,
    scheduleMRM,
    updateMRM,
    submitMRMForApproval,
    approveMRM,
    requestChangesMRM,
    rejectMRM,
    shareMRM,
    uploadMoMDocument,
    currentUser
  } = useApp();

  // Role flags
  const isCourseCoordinator = currentUser?.role === "owner";
  const isQMSCoordinator = currentUser?.role === "qm";
  const isTrustHead = currentUser?.role === "Head";
  const isInternalAuditor = currentUser?.role === "auditor";

  const [query, setQuery] = useState("");
  const [filterStep, setFilterStep] = useState("All");

  // Modal dialog states
  const [showPlanScheduleModal, setShowPlanScheduleModal] = useState(false);
  const [showTrustApprovalModal, setShowTrustApprovalModal] = useState(false);
  const [showEmailDispatchModal, setShowEmailDispatchModal] = useState(false);
  const [showUploadMoMModal, setShowUploadMoMModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [selectedMRM, setSelectedMRM] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [detailTab, setDetailTab] = useState("schedule"); // 'schedule' | 'approval' | 'email' | 'mom' | 'timeline'

  // Toast auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Form: Plan & Schedule
  const [planScheduleForm, setPlanScheduleForm] = useState({
    title: "",
    description: "",
    targetMonth: "November 2026",
    department: "Academic Quality & Compliance",
    scheduledDate: "",
    scheduledTime: "11:00 AM",
    venue: "Main Boardroom / Webex Virtual Room",
    agenda: [
      "Review of previous action items & closure status",
      "Analysis of student semester feedback & satisfaction index",
      "Course delivery milestones and practical lab examination results",
      "Resource allocation, software licenses & computing server capacity",
      "Recommendations for continual curriculum modernization"
    ],
    attendees: [
      "All Course Coordinators",
      "Rahul Kumar (QMS Coordinator)",
      "Anita Rao (Trust Head)"
    ]
  });
  const [newAgendaItem, setNewAgendaItem] = useState("");
  const [newAttendee, setNewAttendee] = useState("");

  // Form: Trust Team Decision
  const [reviewAction, setReviewAction] = useState("approve"); // 'approve' | 'changes' | 'reject'
  const [reviewRemarks, setReviewRemarks] = useState("");

  // Form: Upload MoM Document
  const [momUploadForm, setMomUploadForm] = useState({
    summary: "",
    documentName: "",
    documentType: "Forms",
    fileName: "",
    fileSize: "1.4 MB",
    documentDescription: "",
    registerInLibrary: true,
    discussionPoints: [
      "Review of course delivery progress against target milestones.",
      "Student satisfaction evaluated with overall positive rating.",
      "Lab compute server and GPU cloud licenses renewal evaluated."
    ],
    decisions: [
      "Approved syllabus revisions for upcoming academic session.",
      "Sanctioned procurement of dedicated lab compute resources."
    ],
    actionItems: [
      {
        id: "ACT-01",
        task: "Update laboratory manuals and distribute rubrics to coordinators",
        assignee: "Priya Sharma (Course Coordinator)",
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        status: "In Progress"
      }
    ]
  });
  const [newDiscussionPoint, setNewDiscussionPoint] = useState("");
  const [newDecision, setNewDecision] = useState("");

  // ==================== OPEN MODAL HANDLERS ====================

  const openPlanScheduleModal = (mrm = null) => {
    setSelectedMRM(mrm);
    const defaultDate =
      mrm?.scheduledDate ||
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    if (mrm) {
      setPlanScheduleForm({
        title: mrm.title || "",
        description: mrm.description || "",
        targetMonth: mrm.targetMonth || "November 2026",
        department: mrm.department || "Academic Quality & Compliance",
        scheduledDate: mrm.scheduledDate || defaultDate,
        scheduledTime: mrm.scheduledTime || "11:00 AM",
        venue: mrm.venue || "Main Boardroom / Webex Virtual Room",
        agenda: mrm.agenda?.length
          ? [...mrm.agenda]
          : [
              "Review of previous action items & closure status",
              "Analysis of student semester feedback & satisfaction index",
              "Course delivery milestones and practical lab examination results"
            ],
        attendees: mrm.attendees?.length
          ? [...mrm.attendees]
          : [
              "All Course Coordinators",
              "Rahul Kumar (QMS Coordinator)",
              "Anita Rao (Trust Head)"
            ]
      });
    } else {
      setPlanScheduleForm({
        title: "",
        description: "",
        targetMonth: "November 2026",
        department: currentUser?.department || "Academic Quality & Compliance",
        scheduledDate: defaultDate,
        scheduledTime: "11:00 AM",
        venue: "Main Boardroom / Webex Virtual Room",
        agenda: [
          "Review of previous action items & closure status",
          "Analysis of student semester feedback & satisfaction index",
          "Course delivery milestones and practical lab examination results",
          "Resource allocation, software licenses & computing server capacity",
          "Recommendations for continual curriculum modernization"
        ],
        attendees: [
          "All Course Coordinators",
          "Rahul Kumar (QMS Coordinator)",
          "Anita Rao (Trust Head)"
        ]
      });
    }
    setNewAgendaItem("");
    setNewAttendee("");
    setShowPlanScheduleModal(true);
  };

  const openTrustApprovalModal = (mrm) => {
    setSelectedMRM(mrm);
    setReviewAction("approve");
    setReviewRemarks("");
    setShowTrustApprovalModal(true);
  };

  const openEmailDispatchModal = (mrm) => {
    setSelectedMRM(mrm);
    setShowEmailDispatchModal(true);
  };

  const openUploadMoMModal = (mrm) => {
    setSelectedMRM(mrm);
    setMomUploadForm({
      summary:
        mrm.mom?.summary ||
        `Comprehensive Management Review Meeting conducted on ${mrm.scheduledDate || "schedule"}. Reviewed academic syllabus completion, audit checklists, and laboratory resources.`,
      documentName: `Minutes of Meeting - ${mrm.title}`,
      documentType: "Forms",
      fileName: `${mrm.id}_MoM_Approved_Document.pdf`,
      fileSize: "1.4 MB",
      documentDescription: `Official Minutes of Management Review Meeting held on ${mrm.scheduledDate} covering course deliverables, quality metrics, and ratified action items.`,
      registerInLibrary: true,
      discussionPoints: mrm.mom?.discussionPoints?.length
        ? [...mrm.mom.discussionPoints]
        : [
            "Review of course delivery progress against target milestones.",
            "Student satisfaction evaluated with overall positive rating.",
            "Lab compute server and GPU cloud licenses renewal evaluated."
          ],
      decisions: mrm.mom?.decisions?.length
        ? [...mrm.mom.decisions]
        : [
            "Approved syllabus revisions for upcoming academic session.",
            "Sanctioned procurement of dedicated lab compute resources."
          ],
      actionItems: mrm.mom?.actionItems?.length
        ? mrm.mom.actionItems.map((a) => ({ ...a }))
        : [
            {
              id: "ACT-01",
              task: "Update laboratory manuals and distribute rubrics to coordinators",
              assignee: "Priya Sharma (Course Coordinator)",
              deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
              status: "In Progress"
            }
          ]
    });
    setNewDiscussionPoint("");
    setNewDecision("");
    setShowUploadMoMModal(true);
  };

  const openDetailModal = (mrm, defaultTab = "schedule") => {
    setSelectedMRM(mrm);
    setDetailTab(defaultTab);
    setShowDetailModal(true);
  };

  // ==================== SUBMISSION HANDLERS ====================

  // Step 1: Save & Submit Plan and Schedule
  const handlePlanScheduleSubmit = async (andSubmitForApproval = false) => {
    if (!planScheduleForm.title.trim() || !planScheduleForm.scheduledDate) {
      alert("Please enter a Meeting Title and select a Scheduled Date.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: planScheduleForm.title.trim(),
        description: planScheduleForm.description.trim(),
        targetMonth: planScheduleForm.targetMonth,
        department: planScheduleForm.department,
        scheduledDate: planScheduleForm.scheduledDate,
        scheduledTime: planScheduleForm.scheduledTime,
        venue: planScheduleForm.venue,
        agenda: planScheduleForm.agenda.filter((i) => i.trim()),
        attendees: planScheduleForm.attendees.filter((i) => i.trim()),
        plannedBy: currentUser?.name || "Rahul Kumar",
        plannedByRole: "QMS Coordinator"
      };

      let savedRecord;
      if (selectedMRM?.id) {
        savedRecord = await updateMRM(selectedMRM.id, payload);
      } else {
        savedRecord = await addMRM(payload);
      }

      if (andSubmitForApproval && savedRecord?.id) {
        await submitMRMForApproval(savedRecord.id);
        setToastMessage(`Step 1 & 2: "${savedRecord.title}" planned, scheduled, and submitted for Trust Team approval!`);
      } else {
        setToastMessage(`Meeting "${savedRecord.title}" planned and scheduled.`);
      }

      setShowPlanScheduleModal(false);
    } catch (err) {
      alert(err.message || "Failed to save meeting schedule");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit existing planned meeting to Trust Team
  const handleSubmitToTrustTeam = async (mrmId) => {
    setSubmitting(true);
    try {
      await submitMRMForApproval(mrmId);
      setToastMessage("Meeting plan & schedule submitted to Trust Team for approval!");
    } catch (err) {
      alert(err.message || "Failed to submit for approval");
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Trust Team Decision (Approve / Request Changes / Reject)
  const handleTrustTeamDecision = async () => {
    if (!isTrustHead) {
      alert("Unauthorized: Only Trust Team is authorized to sign off on MRM schedules.");
      return;
    }
    setSubmitting(true);
    try {
      if (reviewAction === "approve") {
        await approveMRM(selectedMRM.id, reviewRemarks.trim());
        setToastMessage("Stage 2 Complete: Meeting schedule APPROVED by Trust Team! QMS Coordinator can now dispatch email notice.");
      } else if (reviewAction === "changes") {
        if (!reviewRemarks.trim()) {
          alert("Please enter comments detailing the required corrections.");
          setSubmitting(false);
          return;
        }
        await requestChangesMRM(selectedMRM.id, reviewRemarks.trim());
        setToastMessage("Corrections requested. Returned to QMS Coordinator for rescheduling.");
      } else if (reviewAction === "reject") {
        if (!reviewRemarks.trim()) {
          alert("A mandatory rejection reason is required.");
          setSubmitting(false);
          return;
        }
        await rejectMRM(selectedMRM.id, reviewRemarks.trim());
        setToastMessage("Meeting schedule rejected with reason recorded.");
      }
      setShowTrustApprovalModal(false);
    } catch (err) {
      alert(err.message || "Failed to record Trust Team decision");
    } finally {
      setSubmitting(false);
    }
  };

  // Step 3: Dispatch Meeting Notice via Email
  const handleSendEmailNotice = async () => {
    setSubmitting(true);
    try {
      await shareMRM(selectedMRM.id);
      setToastMessage("Stage 3 Complete: Meeting invitation successfully sent via email to all Course Coordinators, QMS Coordinator, and Trust Head!");
      setShowEmailDispatchModal(false);
    } catch (err) {
      alert(err.message || "Failed to send email notice");
    } finally {
      setSubmitting(false);
    }
  };

  // Step 4: Upload MoM Document (Once meeting is done)
  const handleUploadMoMSubmit = async (e) => {
    e.preventDefault();
    if (!momUploadForm.summary.trim() || !momUploadForm.documentName.trim()) {
      alert("Please provide a meeting summary and document title.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        summary: momUploadForm.summary.trim(),
        discussionPoints: momUploadForm.discussionPoints.filter((p) => p.trim()),
        decisions: momUploadForm.decisions.filter((d) => d.trim()),
        actionItems: momUploadForm.actionItems.filter((a) => a.task?.trim()),
        documentName: momUploadForm.documentName.trim(),
        documentType: momUploadForm.documentType,
        fileName: momUploadForm.fileName || `${selectedMRM.id}_MoM_Approved_Document.pdf`,
        fileSize: momUploadForm.fileSize || "1.4 MB",
        documentDescription: momUploadForm.documentDescription.trim(),
        registerInLibrary: momUploadForm.registerInLibrary
      };

      await uploadMoMDocument(selectedMRM.id, payload);
      setToastMessage("Stage 4 Complete: Minutes of Meeting document uploaded and published in QMS Document Library!");
      setShowUploadMoMModal(false);
    } catch (err) {
      alert(err.message || "Failed to upload MoM document");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtering
  const filtered = (mrmList || []).filter((m) => {
    const stageInfo = getStageDetails(m);

    const matchesFilter =
      filterStep === "All" ||
      (filterStep === "Step 1: Planned & Scheduled" && stageInfo.step === 1) ||
      (filterStep === "Step 2: Under Trust Review" && stageInfo.step === 2) ||
      (filterStep === "Step 2: Approved Schedule" && stageInfo.step === 2.5) ||
      (filterStep === "Step 3: Notice Emailed" && stageInfo.step === 3) ||
      (filterStep === "Step 4: MoM Uploaded" && stageInfo.step === 4);

    const q = query.toLowerCase();
    const matchesQuery =
      m.title.toLowerCase().includes(q) ||
      (m.description && m.description.toLowerCase().includes(q)) ||
      m.id.toLowerCase().includes(q) ||
      (m.scheduledDate && m.scheduledDate.toLowerCase().includes(q)) ||
      (m.venue && m.venue.toLowerCase().includes(q));

    return matchesFilter && matchesQuery;
  });

  const totalMRMs = (mrmList || []).length;
  const approvedSchedules = (mrmList || []).filter((m) => getStageDetails(m).step >= 2.5).length;
  const emailedNotices = (mrmList || []).filter((m) => getStageDetails(m).step >= 3).length;
  const momUploadedCount = (mrmList || []).filter((m) => getStageDetails(m).step === 4).length;

  return (
    <>
      <PageIntro
        eyebrow="Executive Governance & Quality Review"
        title="Management Review Meeting (MRM)"
        description="Standardized 4-step workflow: Plan & Schedule the meeting, obtain Trust Team approval, dispatch notice via email to all Course Coordinators, QMS Coordinator & Trust Head, and upload the Minutes of Meeting (MoM) document once conducted."
        action={
          isQMSCoordinator && (
            <button
              className="primary-button btn-blue"
              onClick={() => openPlanScheduleModal(null)}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Plus size={17} />
              <span>Plan & Schedule Meeting</span>
            </button>
          )
        }
      />

      {toastMessage && (
        <div
          style={{
            marginBottom: "16px",
            padding: "12px 18px",
            background: "#ecfdf5",
            border: "1px solid #6ee7b7",
            borderRadius: "8px",
            color: "#065f46",
            fontSize: "14px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
          }}
        >
          <CheckCircle2 size={18} color="#059669" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 4-Step Process Guide Card */}
      <div
        style={{
          marginBottom: "20px",
          padding: "16px 20px",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <strong style={{ fontSize: "14px", color: "var(--navy)", display: "flex", alignItems: "center", gap: "6px" }}>
            <CalendarCheck size={17} /> MRM Standardized Quality Workflow
          </strong>
          <span style={{ fontSize: "12px", color: "#64748b" }}>ISO 9001:2015 Clause 9.3 Compliant</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
          {/* Step 1 */}
          <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#e2e8f0", color: "#0f172a", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" }}>1</span>
              <strong style={{ fontSize: "13px", color: "#1e293b" }}>Plan & Schedule</strong>
            </div>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b", lineHeight: "1.4" }}>
              QMS Coordinator defines title, date, time, boardroom/virtual venue, agenda & attendees.
            </p>
          </div>

          {/* Step 2 */}
          <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#fef3c7", color: "#92400e", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" }}>2</span>
              <strong style={{ fontSize: "13px", color: "#1e293b" }}>Trust Team Approval</strong>
            </div>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b", lineHeight: "1.4" }}>
              Trust Team reviews the proposed meeting schedule & quality agenda, then signs off.
            </p>
          </div>

          {/* Step 3 */}
          <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#e0f2fe", color: "#0369a1", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" }}>3</span>
              <strong style={{ fontSize: "13px", color: "#1e293b" }}>Email Notice</strong>
            </div>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b", lineHeight: "1.4" }}>
              Once approved, meeting invitation is dispatched via email to all Course Coordinators, QMS Coordinator & Trust Head.
            </p>
          </div>

          {/* Step 4 */}
          <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#dcfce7", color: "#15803d", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" }}>4</span>
              <strong style={{ fontSize: "13px", color: "#1e293b" }}>Upload MoM Document</strong>
            </div>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b", lineHeight: "1.4" }}>
              Once conducted, QMS Coordinator uploads the formal MoM document & registers it into Document Library.
            </p>
          </div>
        </div>
      </div>

      <div className="stats-grid four">
        <StatCard label="Total MRM Meetings" value={totalMRMs} icon={CalendarCheck} tone="blue" />
        <StatCard label="Trust Team Approved" value={approvedSchedules} icon={ShieldCheck} tone="teal" />
        <StatCard label="Notices Emailed" value={emailedNotices} icon={Mail} tone="blue" />
        <StatCard label="MoM Documents Uploaded" value={momUploadedCount} icon={FileText} tone="green" />
      </div>

      <div className="filter-bar" style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
        <label className="search-field" style={{ flex: 1, minWidth: "260px" }}>
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search meetings by title, ID, date, or venue..."
          />
        </label>

        <div className="tabs">
          {[
            "All",
            "Step 1: Planned & Scheduled",
            "Step 2: Under Trust Review",
            "Step 2: Approved Schedule",
            "Step 3: Notice Emailed",
            "Step 4: MoM Uploaded"
          ].map((tab) => (
            <button
              key={tab}
              className={filterStep === tab ? "tab active" : "tab"}
              onClick={() => setFilterStep(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Meeting Title & Reference</th>
                <th>Scheduled Date & Venue</th>
                <th>Current Workflow Stage</th>
                <th>MoM Document</th>
                <th style={{ textAlign: "right" }}>Workflow Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((mrm) => {
                const stage = getStageDetails(mrm);
                const isApproved = stage.step >= 2.5;
                const isNoticeEmailed = stage.step >= 3;
                const isMoMUploaded = stage.step === 4;

                return (
                  <tr key={mrm.id}>
                    <td>
                      <div>
                        <strong>{mrm.title}</strong>
                        <small style={{ color: "#64748b", display: "block" }}>
                          <code>{mrm.id}</code> &bull; Period: {mrm.targetMonth || "Quarterly"}
                        </small>
                      </div>
                    </td>
                    <td>
                      {mrm.scheduledDate ? (
                        <div>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: "600", fontSize: "13px", color: "#1e293b" }}>
                            <Calendar size={13} color="var(--navy)" /> {mrm.scheduledDate} {mrm.scheduledTime && `@ ${mrm.scheduledTime}`}
                          </span>
                          <small style={{ display: "block", color: "#64748b" }}>
                            <MapPin size={11} style={{ display: "inline", verticalAlign: "middle" }} /> {mrm.venue || "Main Boardroom"}
                          </small>
                        </div>
                      ) : (
                        <span style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic" }}>
                          Pending Date Specification
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "3px 9px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "600",
                          background: stage.bg,
                          color: stage.color,
                          border: `1px solid ${stage.border}`
                        }}
                      >
                        {stage.step === 4 ? (
                          <FileText size={13} />
                        ) : stage.step === 3 ? (
                          <Mail size={13} />
                        ) : stage.step >= 2.5 ? (
                          <CheckCircle2 size={13} />
                        ) : stage.step === 2 ? (
                          <Clock size={13} />
                        ) : (
                          <Calendar size={13} />
                        )}
                        {stage.badgeText}
                      </span>
                    </td>
                    <td>
                      {mrm.momDocument ? (
                        <div>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "12px",
                              color: "#166534",
                              fontWeight: "600"
                            }}
                          >
                            <FileText size={13} /> {mrm.momDocument.fileName || "MoM_Document.pdf"}
                          </span>
                          <small style={{ display: "block", color: "#64748b" }}>
                            ID: <code>{mrm.momDocument.documentId}</code>
                          </small>
                        </div>
                      ) : (
                        <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                          {isNoticeEmailed ? "Awaiting meeting completion" : "Not yet uploaded"}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                        {/* View Details Modal button */}
                        <button
                          type="button"
                          className="row-action"
                          onClick={() => openDetailModal(mrm, "schedule")}
                          style={{
                            cursor: "pointer",
                            color: "#334155",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          <Eye size={13} /> Details
                        </button>

                        {/* STEP 1: QMS Coordinator submits schedule for Trust Team approval */}
                        {isQMSCoordinator && stage.step === 1 && (
                          <button
                            type="button"
                            className="primary-button btn-blue"
                            onClick={() => handleSubmitToTrustTeam(mrm.id)}
                            disabled={submitting}
                            style={{ fontSize: "12px", padding: "4px 8px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                            title="Submit meeting schedule to Trust Team for approval"
                          >
                            <Send size={12} />
                            <span>Submit to Trust Team</span>
                          </button>
                        )}

                        {/* STEP 2: Trust Team Review & Approval button */}
                        {isTrustHead && stage.step === 2 && (
                          <button
                            type="button"
                            className="primary-button btn-green"
                            onClick={() => openTrustApprovalModal(mrm)}
                            style={{ fontSize: "12px", padding: "4px 8px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            <ShieldCheck size={13} />
                            <span>Review & Approve</span>
                          </button>
                        )}

                        {/* STEP 3: Once approved, QMS Coordinator shares via Email to Course Coordinators, QMS Coordinator & Trust Head */}
                        {isQMSCoordinator && stage.step === 2.5 && (
                          <button
                            type="button"
                            className="primary-button btn-blue"
                            onClick={() => openEmailDispatchModal(mrm)}
                            style={{ fontSize: "12px", padding: "4px 8px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                            title="Share meeting notice via email to all Course Coordinators, QMS Coordinator, and Trust Head"
                          >
                            <Mail size={13} />
                            <span>Share via Email</span>
                          </button>
                        )}

                        {/* STEP 4: Once meeting is done, QMS Coordinator uploads the MoM Document */}
                        {isQMSCoordinator && (stage.step === 3 || (stage.step >= 2.5 && !mrm.momDocument)) && (
                          <button
                            type="button"
                            className="primary-button btn-green"
                            onClick={() => openUploadMoMModal(mrm)}
                            style={{ fontSize: "12px", padding: "4px 8px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                            title="Once the meeting is done, upload and share the Minutes of Meeting document"
                          >
                            <FileUp size={13} />
                            <span>Upload MoM</span>
                          </button>
                        )}

                        {/* If MoM is uploaded, link to view/download */}
                        {mrm.momDocument && (
                          <Link
                            to={`/documents/${mrm.momDocument.documentId}`}
                            className="row-action"
                            style={{
                              color: "var(--navy)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                              fontSize: "12px",
                              fontWeight: "600"
                            }}
                          >
                            <ExternalLink size={12} /> Library
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ==================== STEP 1: PLAN & SCHEDULE MODAL ==================== */}
      {showPlanScheduleModal && (
        <Modal
          title={selectedMRM ? `Edit Meeting Schedule: ${selectedMRM.title}` : "Plan & Schedule Management Review Meeting"}
          onClose={() => setShowPlanScheduleModal(false)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ padding: "10px 14px", background: "var(--navy-subtle)", borderRadius: "6px", border: "1px solid var(--navy-border)", fontSize: "13px", color: "var(--navy)" }}>
              <strong>Step 1:</strong> Define the meeting title, date, time, venue, agenda, and invitees. You can then submit it directly for <strong>Trust Team Approval</strong>.
            </div>

            <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <label style={{ gridColumn: "1 / -1" }}>
                Meeting Title
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Institutional Quality & Course Delivery Review Meeting"
                  value={planScheduleForm.title}
                  onChange={(e) => setPlanScheduleForm({ ...planScheduleForm, title: e.target.value })}
                />
              </label>

              <label>
                Scheduled Date
                <input
                  type="date"
                  required
                  value={planScheduleForm.scheduledDate}
                  onChange={(e) => setPlanScheduleForm({ ...planScheduleForm, scheduledDate: e.target.value })}
                />
              </label>

              <label>
                Scheduled Time
                <input
                  type="text"
                  placeholder="e.g. 11:00 AM"
                  value={planScheduleForm.scheduledTime}
                  onChange={(e) => setPlanScheduleForm({ ...planScheduleForm, scheduledTime: e.target.value })}
                />
              </label>

              <label style={{ gridColumn: "1 / -1" }}>
                Meeting Venue / Video Link
                <input
                  type="text"
                  placeholder="e.g. Main Boardroom / Webex Virtual Conference Room"
                  value={planScheduleForm.venue}
                  onChange={(e) => setPlanScheduleForm({ ...planScheduleForm, venue: e.target.value })}
                />
              </label>

              <label>
                Target Period / Month
                <input
                  type="text"
                  value={planScheduleForm.targetMonth}
                  onChange={(e) => setPlanScheduleForm({ ...planScheduleForm, targetMonth: e.target.value })}
                />
              </label>

              <label>
                Department / Division
                <input
                  type="text"
                  value={planScheduleForm.department}
                  onChange={(e) => setPlanScheduleForm({ ...planScheduleForm, department: e.target.value })}
                />
              </label>
            </div>

            {/* Agenda items list */}
            <div>
              <strong style={{ fontSize: "13px", color: "#0f172a", display: "block", marginBottom: "6px" }}>
                Quality Agenda Items ({planScheduleForm.agenda.length})
              </strong>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "8px" }}>
                {planScheduleForm.agenda.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                    <span style={{ color: "var(--navy)", fontWeight: "600" }}>{idx + 1}.</span>
                    <span style={{ flex: 1, padding: "6px 10px", background: "#f8fafc", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                      {item}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPlanScheduleForm({ ...planScheduleForm, agenda: planScheduleForm.agenda.filter((_, i) => i !== idx) })}
                      style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "4px" }}
                      title="Remove item"
                    >
                      <XCircle size={15} />
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="Add another agenda item..."
                  value={newAgendaItem}
                  onChange={(e) => setNewAgendaItem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newAgendaItem.trim()) {
                      e.preventDefault();
                      setPlanScheduleForm({ ...planScheduleForm, agenda: [...planScheduleForm.agenda, newAgendaItem.trim()] });
                      setNewAgendaItem("");
                    }
                  }}
                  style={{ flex: 1, padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    if (newAgendaItem.trim()) {
                      setPlanScheduleForm({ ...planScheduleForm, agenda: [...planScheduleForm.agenda, newAgendaItem.trim()] });
                      setNewAgendaItem("");
                    }
                  }}
                >
                  Add Item
                </button>
              </div>
            </div>

            {/* Attendees list */}
            <div>
              <strong style={{ fontSize: "13px", color: "#0f172a", display: "block", marginBottom: "6px" }}>
                Meeting Invitees & Attendees ({planScheduleForm.attendees.length})
              </strong>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {planScheduleForm.attendees.map((att, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: "12px",
                      padding: "4px 10px",
                      background: "#f1f5f9",
                      color: "#1e293b",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    {att}
                    <button
                      type="button"
                      onClick={() => setPlanScheduleForm({ ...planScheduleForm, attendees: planScheduleForm.attendees.filter((_, i) => i !== idx) })}
                      style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 0 }}
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowPlanScheduleModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => handlePlanScheduleSubmit(false)}
                disabled={submitting || !planScheduleForm.title.trim()}
              >
                Save Schedule as Draft
              </button>
              <button
                type="button"
                className="primary-button btn-blue"
                onClick={() => handlePlanScheduleSubmit(true)}
                disabled={submitting || !planScheduleForm.title.trim()}
              >
                <Send size={14} />
                <span>Submit to Trust Team for Approval</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ==================== STEP 2: TRUST TEAM APPROVAL MODAL ==================== */}
      {showTrustApprovalModal && selectedMRM && (
        <Modal
          title={`Trust Team Review: ${selectedMRM.title}`}
          onClose={() => setShowTrustApprovalModal(false)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <h4 style={{ margin: "0 0 6px 0", fontSize: "15px", color: "#0f172a" }}>{selectedMRM.title}</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "13px", color: "#475569" }}>
                <div><strong>Scheduled Date:</strong> {selectedMRM.scheduledDate} {selectedMRM.scheduledTime && `@ ${selectedMRM.scheduledTime}`}</div>
                <div><strong>Venue:</strong> {selectedMRM.venue}</div>
                <div><strong>Planned By:</strong> {selectedMRM.plannedBy || "QMS Coordinator"}</div>
                <div><strong>Period:</strong> {selectedMRM.targetMonth}</div>
              </div>
            </div>

            <div>
              <strong style={{ fontSize: "13px", color: "#0f172a", display: "block", marginBottom: "6px" }}>Proposed Agenda:</strong>
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", color: "#334155" }}>
                {(selectedMRM.agenda || []).map((ag, i) => (
                  <li key={i} style={{ marginBottom: "3px" }}>{ag}</li>
                ))}
              </ul>
            </div>

            <div>
              <strong style={{ fontSize: "13px", color: "#0f172a", display: "block", marginBottom: "6px" }}>Invitees & Attendees:</strong>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {(selectedMRM.attendees || []).map((att, i) => (
                  <span key={i} style={{ fontSize: "12px", padding: "3px 8px", background: "#e2e8f0", borderRadius: "4px", color: "#334155" }}>
                    {att}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "14px" }}>
              <strong style={{ fontSize: "13px", color: "#0f172a", display: "block", marginBottom: "8px" }}>
                Trust Team Decision
              </strong>
              <div style={{ display: "flex", gap: "16px", marginBottom: "12px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="decision"
                    value="approve"
                    checked={reviewAction === "approve"}
                    onChange={() => setReviewAction("approve")}
                  />
                  <span style={{ fontWeight: "600", color: "#15803d" }}>Approve Meeting Schedule</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="decision"
                    value="changes"
                    checked={reviewAction === "changes"}
                    onChange={() => setReviewAction("changes")}
                  />
                  <span style={{ fontWeight: "600", color: "#d97706" }}>Request Rescheduling / Corrections</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="decision"
                    value="reject"
                    checked={reviewAction === "reject"}
                    onChange={() => setReviewAction("reject")}
                  />
                  <span style={{ fontWeight: "600", color: "#dc2626" }}>Reject Schedule</span>
                </label>
              </div>

              <label style={{ display: "block" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Executive Remarks / Feedback</span>
                <textarea
                  rows={3}
                  placeholder={
                    reviewAction === "approve"
                      ? "Optional remarks for approval..."
                      : "Provide details for the requested revisions or rejection..."
                  }
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                />
              </label>
            </div>

            <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowTrustApprovalModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`primary-button ${reviewAction === "approve" ? "btn-green" : reviewAction === "changes" ? "btn-amber" : "btn-red"}`}
                onClick={handleTrustTeamDecision}
                disabled={submitting}
              >
                <span>{submitting ? "Processing..." : reviewAction === "approve" ? "Sign-off & Approve" : reviewAction === "changes" ? "Request Changes" : "Confirm Reject"}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ==================== STEP 3: EMAIL DISPATCH MODAL ==================== */}
      {showEmailDispatchModal && selectedMRM && (
        <Modal
          title={`Dispatch Meeting Notice via Email: ${selectedMRM.title}`}
          onClose={() => setShowEmailDispatchModal(false)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ padding: "10px 14px", background: "#f0fdf4", borderRadius: "6px", border: "1px solid #bbf7d0", fontSize: "13px", color: "#166534" }}>
              <CheckCircle2 size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: "6px" }} />
              <strong>Trust Team Approval Verified:</strong> This meeting schedule has been signed off. You can now dispatch the official email notice to all Course Coordinators, QMS Coordinator, and Trust Head.
            </div>

            {/* Email Preview Card */}
            <div style={{ padding: "16px", background: "#ffffff", borderRadius: "8px", border: "1px solid #cbd5e1", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", paddingBottom: "12px", borderBottom: "1px solid #e2e8f0" }}>
                <div>
                  <strong style={{ color: "#64748b" }}>To: </strong>
                  <span style={{ color: "#0f172a", fontWeight: "600" }}>
                    All Course Coordinators (coordinator@cdac.in, rajesh.verma@cdac.in, sunita.patil@cdac.in)
                  </span>
                </div>
                <div>
                  <strong style={{ color: "#64748b" }}>Cc: </strong>
                  <span style={{ color: "#0f172a" }}>QMS Coordinator (qm@cdac.in), Trust Head (head@cdac.in)</span>
                </div>
                <div>
                  <strong style={{ color: "#64748b" }}>Subject: </strong>
                  <span style={{ color: "var(--navy)", fontWeight: "700" }}>
                    Meeting Notice: {selectedMRM.title} on {selectedMRM.scheduledDate} at {selectedMRM.scheduledTime || "11:00 AM"}
                  </span>
                </div>
              </div>

              <div style={{ paddingTop: "12px", fontSize: "13px", color: "#334155", lineHeight: "1.6" }}>
                <p style={{ margin: "0 0 10px 0" }}>Dear Academic Coordinators & Quality Team,</p>
                <p style={{ margin: "0 0 10px 0" }}>
                  Please be notified that the <strong>{selectedMRM.title}</strong> has been ratified by the Trust Team and is scheduled as follows:
                </p>
                <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: "6px", marginBottom: "10px", border: "1px solid #e2e8f0" }}>
                  <div>📅 <strong>Date:</strong> {selectedMRM.scheduledDate}</div>
                  <div>⏰ <strong>Time:</strong> {selectedMRM.scheduledTime || "11:00 AM"}</div>
                  <div>📍 <strong>Venue:</strong> {selectedMRM.venue || "Main Boardroom"}</div>
                </div>
                <p style={{ margin: "0 0 6px 0" }}><strong>Agenda Highlights:</strong></p>
                <ul style={{ margin: "0 0 10px 0", paddingLeft: "20px" }}>
                  {(selectedMRM.agenda || []).map((ag, i) => (
                    <li key={i}>{ag}</li>
                  ))}
                </ul>
                <p style={{ margin: "0", color: "#64748b", fontSize: "12px" }}>
                  Please ensure all semester performance records, course rubrics, and lab feedback are ready for review.
                </p>
              </div>
            </div>

            <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowEmailDispatchModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button btn-blue"
                onClick={handleSendEmailNotice}
                disabled={submitting}
              >
                <Mail size={15} />
                <span>{submitting ? "Sending..." : "Send Email Notice to All"}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ==================== STEP 4: UPLOAD MOM DOCUMENT MODAL ==================== */}
      {showUploadMoMModal && selectedMRM && (
        <Modal
          title={`Upload Minutes of Meeting (MoM) Document: ${selectedMRM.title}`}
          onClose={() => setShowUploadMoMModal(false)}
        >
          <form onSubmit={handleUploadMoMSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ padding: "10px 14px", background: "#f0fdf4", borderRadius: "6px", border: "1px solid #bbf7d0", fontSize: "13px", color: "#166534" }}>
                <strong>Step 4:</strong> Once the meeting has concluded, upload the formal Minutes of Meeting (MoM) document and share it. It will also be registered as an official Controlled Document in the Document Library.
              </div>

              {/* Document File Upload Section */}
              <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "8px", border: "2px dashed #94a3b8", textAlign: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "#e0f2fe", color: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FileUp size={22} />
                  </div>
                  <div>
                    <strong style={{ fontSize: "14px", color: "#0f172a" }}>Select or Drop MoM Document File</strong>
                    <span style={{ display: "block", fontSize: "12px", color: "#64748b" }}>
                      Accepted formats: PDF, DOCX, XLSX (Max 15MB)
                    </span>
                  </div>
                  <label
                    style={{
                      marginTop: "6px",
                      padding: "6px 14px",
                      background: "var(--navy)",
                      color: "#ffffff",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    <span>Browse Document File</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xlsx"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setMomUploadForm({
                            ...momUploadForm,
                            fileName: file.name,
                            fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                          });
                        }
                      }}
                    />
                  </label>
                  {momUploadForm.fileName && (
                    <div style={{ marginTop: "6px", fontSize: "12px", color: "#15803d", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Check size={14} /> Selected: {momUploadForm.fileName} ({momUploadForm.fileSize})
                    </div>
                  )}
                </div>
              </div>

              {/* Document metadata fields */}
              <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label style={{ gridColumn: "1 / -1" }}>
                  Document Title in Library
                  <input
                    type="text"
                    required
                    value={momUploadForm.documentName}
                    onChange={(e) => setMomUploadForm({ ...momUploadForm, documentName: e.target.value })}
                  />
                </label>

                <label>
                  Document Category
                  <select
                    value={momUploadForm.documentType}
                    onChange={(e) => setMomUploadForm({ ...momUploadForm, documentType: e.target.value })}
                    style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", width: "100%", background: "#fff" }}
                  >
                    <option value="Forms">Forms</option>
                    <option value="Procedures">Procedures</option>
                    <option value="Templates">Templates</option>
                  </select>
                </label>

                <label>
                  Associated Process
                  <input
                    type="text"
                    readOnly
                    value="Quality Management"
                    style={{ background: "#f1f5f9" }}
                  />
                </label>

                <label style={{ gridColumn: "1 / -1" }}>
                  Executive Meeting Summary & Discussions
                  <textarea
                    rows={3}
                    required
                    placeholder="Summarize the discussions, curriculum evaluation, and key resolutions..."
                    value={momUploadForm.summary}
                    onChange={(e) => setMomUploadForm({ ...momUploadForm, summary: e.target.value })}
                  />
                </label>
              </div>

              {/* Action items assignment */}
              <div>
                <strong style={{ fontSize: "13px", color: "#0f172a", display: "block", marginBottom: "6px" }}>
                  Ratified Action Items ({momUploadForm.actionItems.length})
                </strong>
                {momUploadForm.actionItems.map((act, idx) => (
                  <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px", gap: "8px", marginBottom: "6px" }}>
                    <input
                      type="text"
                      placeholder="Task description..."
                      value={act.task}
                      onChange={(e) => {
                        const next = [...momUploadForm.actionItems];
                        next[idx].task = e.target.value;
                        setMomUploadForm({ ...momUploadForm, actionItems: next });
                      }}
                      style={{ padding: "6px 8px", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                    />
                    <input
                      type="text"
                      placeholder="Assignee coordinator..."
                      value={act.assignee}
                      onChange={(e) => {
                        const next = [...momUploadForm.actionItems];
                        next[idx].assignee = e.target.value;
                        setMomUploadForm({ ...momUploadForm, actionItems: next });
                      }}
                      style={{ padding: "6px 8px", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                    />
                    <input
                      type="date"
                      value={act.deadline}
                      onChange={(e) => {
                        const next = [...momUploadForm.actionItems];
                        next[idx].deadline = e.target.value;
                        setMomUploadForm({ ...momUploadForm, actionItems: next });
                      }}
                      style={{ padding: "6px 8px", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setMomUploadForm({
                      ...momUploadForm,
                      actionItems: [
                        ...momUploadForm.actionItems,
                        {
                          id: `ACT-${String(momUploadForm.actionItems.length + 1).padStart(2, "0")}`,
                          task: "",
                          assignee: "Course Coordinator",
                          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                          status: "In Progress"
                        }
                      ]
                    })
                  }
                  style={{ fontSize: "12px", marginTop: "4px" }}
                >
                  + Add Action Item
                </button>
              </div>

              <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
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
                  disabled={submitting || !momUploadForm.summary.trim()}
                >
                  <FileUp size={15} />
                  <span>{submitting ? "Uploading & Publishing..." : "Upload & Share MoM Document"}</span>
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* ==================== COMPREHENSIVE DETAILS MODAL ==================== */}
      {showDetailModal && selectedMRM && (
        <Modal
          title={`MRM Record: ${selectedMRM.title}`}
          onClose={() => setShowDetailModal(false)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Stage Progress Bar in Details */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Current Status:</span>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  padding: "3px 10px",
                  borderRadius: "12px",
                  background: getStageDetails(selectedMRM).bg,
                  color: getStageDetails(selectedMRM).color,
                  border: `1px solid ${getStageDetails(selectedMRM).border}`
                }}
              >
                {getStageDetails(selectedMRM).name}
              </span>
            </div>

            {/* Sub-tabs */}
            <div className="tabs" style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "6px" }}>
              {[
                { key: "schedule", label: "Schedule & Agenda" },
                { key: "approval", label: "Trust Team Approval" },
                { key: "email", label: "Email Dispatch" },
                { key: "mom", label: "MoM Document" },
                { key: "timeline", label: "Audit Timeline" }
              ].map((tab) => (
                <button
                  key={tab.key}
                  className={detailTab === tab.key ? "tab active" : "tab"}
                  onClick={() => setDetailTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Schedule & Agenda */}
            {detailTab === "schedule" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div><strong>Date:</strong> {selectedMRM.scheduledDate || "N/A"}</div>
                  <div><strong>Time:</strong> {selectedMRM.scheduledTime || "11:00 AM"}</div>
                  <div><strong>Venue:</strong> {selectedMRM.venue || "Main Boardroom"}</div>
                  <div><strong>Period:</strong> {selectedMRM.targetMonth || "Quarterly"}</div>
                  <div><strong>Department:</strong> {selectedMRM.department || "Academic Quality"}</div>
                  <div><strong>Planned By:</strong> {selectedMRM.plannedBy || "QMS Coordinator"}</div>
                </div>

                <div>
                  <strong style={{ display: "block", marginBottom: "4px" }}>Quality Agenda:</strong>
                  <ul style={{ margin: 0, paddingLeft: "18px", color: "#334155" }}>
                    {(selectedMRM.agenda || []).map((ag, i) => (
                      <li key={i} style={{ marginBottom: "3px" }}>{ag}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <strong style={{ display: "block", marginBottom: "4px" }}>Attendees List:</strong>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {(selectedMRM.attendees || []).map((att, i) => (
                      <span key={i} style={{ fontSize: "12px", padding: "3px 8px", background: "#f1f5f9", borderRadius: "4px", border: "1px solid #cbd5e1" }}>
                        {att}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Trust Team Approval */}
            {detailTab === "approval" && (
              <div style={{ fontSize: "13px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {selectedMRM.trustHeadApproval?.approved ? (
                  <div style={{ padding: "14px", background: "#ecfdf5", borderRadius: "8px", border: "1px solid #a7f3d0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#15803d", fontWeight: "700", marginBottom: "6px" }}>
                      <CheckCircle2 size={18} /> Approved by Trust Team
                    </div>
                    <div><strong>Signed off by:</strong> {selectedMRM.trustHeadApproval.approvedBy}</div>
                    <div><strong>Approval Date:</strong> {selectedMRM.trustHeadApproval.approvedAt}</div>
                    <div style={{ marginTop: "6px" }}>
                      <strong>Executive Remarks:</strong>
                      <p style={{ margin: "4px 0 0 0", color: "#166534" }}>{selectedMRM.trustHeadApproval.remarks}</p>
                    </div>
                  </div>
                ) : selectedMRM.status === "Submitted for Approval" ? (
                  <div style={{ padding: "14px", background: "#fef3c7", borderRadius: "8px", border: "1px solid #fde68a", color: "#92400e" }}>
                    <Clock size={18} style={{ display: "inline", verticalAlign: "middle", marginRight: "6px" }} />
                    <strong>Awaiting Review:</strong> This meeting schedule has been submitted and is currently pending Trust Team evaluation.
                  </div>
                ) : (
                  <div style={{ padding: "14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", color: "#64748b" }}>
                    Meeting schedule has not yet been submitted to the Trust Team for approval.
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Email Dispatch */}
            {detailTab === "email" && (
              <div style={{ fontSize: "13px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {selectedMRM.emailNoticeSent || selectedMRM.status === "Notice Emailed" || selectedMRM.sharedWithAll ? (
                  <div style={{ padding: "14px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#166534", fontWeight: "700", marginBottom: "8px" }}>
                      <Mail size={18} /> Meeting Notice Dispatched via Email
                    </div>
                    <div><strong>Dispatched by:</strong> {selectedMRM.sharedBy || "Rahul Kumar (QMS Coordinator)"}</div>
                    <div><strong>Sent at:</strong> {selectedMRM.sharedAt || "Recent"}</div>
                    <div style={{ marginTop: "8px" }}>
                      <strong>Email Recipients:</strong>
                      <ul style={{ margin: "4px 0 0 0", paddingLeft: "18px", color: "#166534" }}>
                        {(selectedMRM.emailRecipients || [
                          "All Course Coordinators (coordinator@cdac.in, rajesh.verma@cdac.in, sunita.patil@cdac.in)",
                          "QMS Coordinator (qm@cdac.in)",
                          "Trust Head (head@cdac.in)"
                        ]).map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: "14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", color: "#64748b" }}>
                    Email notice will be unlocked once the Trust Team formally approves the meeting schedule.
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: MoM Document */}
            {detailTab === "mom" && (
              <div style={{ fontSize: "13px", display: "flex", flexDirection: "column", gap: "12px" }}>
                {selectedMRM.momDocument ? (
                  <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "#dcfce7", color: "#15803d", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <FileText size={22} />
                        </div>
                        <div>
                          <strong style={{ fontSize: "14px", color: "#0f172a" }}>{selectedMRM.momDocument.documentName}</strong>
                          <small style={{ display: "block", color: "#64748b" }}>
                            {selectedMRM.momDocument.fileName} &bull; {selectedMRM.momDocument.fileSize}
                          </small>
                        </div>
                      </div>
                      <Link
                        to={`/documents/${selectedMRM.momDocument.documentId}`}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          background: "var(--navy)",
                          color: "#fff",
                          textDecoration: "none",
                          fontSize: "12px",
                          fontWeight: "600",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        <ExternalLink size={13} /> View in Document Library
                      </Link>
                    </div>

                    <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid #e2e8f0" }}>
                      <strong>Meeting Summary:</strong>
                      <p style={{ margin: "4px 0 10px 0", color: "#334155" }}>
                        {selectedMRM.mom?.summary || "Meeting conducted successfully. MoM uploaded."}
                      </p>

                      {selectedMRM.mom?.actionItems?.length > 0 && (
                        <div>
                          <strong>Assigned Action Items:</strong>
                          <ul style={{ margin: "4px 0 0 0", paddingLeft: "18px" }}>
                            {selectedMRM.mom.actionItems.map((act, i) => (
                              <li key={i} style={{ marginBottom: "4px" }}>
                                <strong>{act.task}</strong> — Assignee: {act.assignee} (Due: {act.deadline})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", textAlign: "center", color: "#64748b" }}>
                    <p style={{ margin: "0 0 10px 0" }}>No Minutes of Meeting (MoM) document has been uploaded yet for this meeting.</p>
                    {isQMSCoordinator && (
                      <button
                        type="button"
                        className="primary-button btn-blue"
                        onClick={() => {
                          setShowDetailModal(false);
                          openUploadMoMModal(selectedMRM);
                        }}
                      >
                        <FileUp size={14} /> Upload MoM Document
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tab 5: Audit Timeline */}
            {detailTab === "timeline" && (
              <div style={{ fontSize: "13px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {(selectedMRM.timeline || []).map((tl, i) => (
                    <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--navy)", marginTop: "6px" }} />
                      <div>
                        <strong>{tl.action}</strong>
                        <span style={{ color: "#64748b", marginLeft: "6px", fontSize: "12px" }}>
                          by {tl.actor} &bull; {tl.timestamp}
                        </span>
                        {tl.details && <p style={{ margin: "2px 0 0 0", color: "#475569" }}>{tl.details}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
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
