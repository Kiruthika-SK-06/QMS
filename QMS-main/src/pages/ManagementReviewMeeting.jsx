import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
  Filter
} from "lucide-react";
import { useApp } from "../context/AppContext";
import PageIntro from "../components/common/PageIntro";
import StatCard from "../components/common/StatCard";
import StatusBadge from "../components/common/StatusBadge";
import Modal from "../components/tasks/Modal";

// Helper to determine stage details (1 to 6)
const getStageDetails = (mrm) => {
  if (mrm.sharedWithAll || mrm.status === "Shared") {
    return {
      stage: 6,
      name: "Shared with Course Coordinators",
      badgeText: "Shared & Distributed",
      color: "#16a34a",
      bg: "#dcfce7",
      border: "#86efac",
      nextAction: "Distributed to All Academic Coordinators"
    };
  }
  if (
    mrm.status === "Approved" ||
    mrm.status === "Approved by Trust Head" ||
    mrm.trustHeadApproval?.approved
  ) {
    return {
      stage: 5,
      name: "Approved by Trust Head",
      badgeText: "Approved — Ready to Share",
      color: "#15803d",
      bg: "#ecfdf5",
      border: "#a7f3d0",
      nextAction: "QMS Coordinator can now distribute to Course Coordinators"
    };
  }
  if (
    mrm.status === "Submitted for Approval" ||
    mrm.status === "Pending Trust Head Approval"
  ) {
    return {
      stage: 4,
      name: "Submitted for Executive Approval",
      badgeText: "Under Trust Head Review",
      color: "#d97706",
      bg: "#fef3c7",
      border: "#fde68a",
      nextAction: "Awaiting formal review & sign-off from Trust Head"
    };
  }
  if (mrm.status === "Changes Requested") {
    return {
      stage: 3.5,
      name: "Corrections Requested",
      badgeText: "Changes Requested",
      color: "#dc2626",
      bg: "#fee2e2",
      border: "#fca5a5",
      nextAction: "QMS Coordinator needs to revise MoM and resubmit"
    };
  }
  if (mrm.status === "Rejected") {
    return {
      stage: 3.5,
      name: "Submission Rejected",
      badgeText: "Rejected by Trust Head",
      color: "#ef4444",
      bg: "#fee2e2",
      border: "#fca5a5",
      nextAction: "Review mandatory rejection reason from Trust Head"
    };
  }
  if (mrm.mom && mrm.mom.summary) {
    return {
      stage: 3,
      name: "Minutes of Meeting Recorded",
      badgeText: "MoM Recorded",
      color: "var(--navy)",
      bg: "var(--navy-subtle)",
      border: "var(--navy-border)",
      nextAction: "Send complete package to Trust Head for Approval"
    };
  }
  if (mrm.scheduledDate && (mrm.status === "Scheduled" || mrm.status === "Draft")) {
    return {
      stage: 2,
      name: "Meeting Scheduled",
      badgeText: "Scheduled",
      color: "var(--navy)",
      bg: "var(--navy-subtle)",
      border: "var(--navy-border)",
      nextAction: "Convene meeting and record Minutes of Meeting (MoM)"
    };
  }
  return {
    stage: 1,
    name: "Meeting Planned",
    badgeText: "Planned (Pending Schedule)",
    color: "var(--navy)",
    bg: "var(--navy-subtle)",
    border: "var(--navy-border)",
    nextAction: "Specify Date, Time & Venue to schedule meeting"
  };
};

export default function ManagementReviewMeeting() {
  const {
    mrmList,
    addMRM,
    scheduleMRM,
    updateMRM,
    saveMoM,
    submitMRMForApproval,
    approveMRM,
    requestChangesMRM,
    rejectMRM,
    resubmitMRM,
    shareMRM,
    acknowledgeMRM,
    currentUser,
    usersList
  } = useApp();

  const isCourseCoordinator = currentUser?.role === "owner";
  const isQMSCoordinator = currentUser?.role === "qm";
  const isTrustHead = currentUser?.role === "Head";

  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("All");

  // Guided MRM Workflow Studio State
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [workflowMRM, setWorkflowMRM] = useState(null);
  const [workflowStep, setWorkflowStep] = useState(1); // 1: Plan, 2: Schedule, 3: MoM, 4: Review & Submit
  const [workflowSaving, setWorkflowSaving] = useState(false);
  const [workflowError, setWorkflowError] = useState("");
  const [workflowToast, setWorkflowToast] = useState("");
  const [workflowSubmittedSuccess, setWorkflowSubmittedSuccess] = useState(false);

  // Search Params for auto-resume / direct URL navigation
  const [searchParams, setSearchParams] = useSearchParams();

  // Legacy/Detail Modal states
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showMoMModal, setShowMoMModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showReviseModal, setShowReviseModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMRM, setSelectedMRM] = useState(null);
  const [detailTab, setDetailTab] = useState("details"); // 'details' | 'mom' | 'versions' | 'timeline' | 'acknowledgements'

  const [submitting, setSubmitting] = useState(false);

  // Trust Head Review state
  const [reviewAction, setReviewAction] = useState("approve"); // 'approve' | 'changes' | 'reject'
  const [reviewRemarks, setReviewRemarks] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  // Revision state
  const [revisionNotes, setRevisionNotes] = useState("");

  // Stage 1: Plan Form
  const [planForm, setPlanForm] = useState({
    title: "",
    description: "",
    targetMonth: "November 2026",
    department: "Academic Quality & Compliance",
    agenda: [
      "Review of previous action items & closure status",
      "Analysis of student semester feedback & satisfaction index",
      "Course delivery milestones and practical lab examination results",
      "Resource allocation, software licenses & computing server capacity",
      "Recommendations for continual curriculum modernization"
    ]
  });
  const [newAgendaItem, setNewAgendaItem] = useState("");

  // Stage 2: Schedule Form
  const [scheduleForm, setScheduleForm] = useState({
    scheduledDate: "",
    scheduledTime: "11:00 AM",
    venue: "Main Boardroom / Webex Virtual Room",
    attendees: [
      "Rahul Kumar (QMS Coordinator)",
      "Anita Rao (Trust Head)",
      "Priya Sharma (Course Coordinator)",
      "Dr. Rajesh Verma (Course Coordinator)",
      "Sunita Patil (Course Coordinator)"
    ]
  });
  const [newAttendee, setNewAttendee] = useState("");

  // Stage 3: MoM Form
  const [momForm, setMomForm] = useState({
    summary: "",
    discussionPoints: [""],
    decisions: [""],
    actionItems: [
      {
        id: "ACT-01",
        task: "",
        assignee: "Priya Sharma (Course Coordinator)",
        deadline: "",
        status: "In Progress"
      }
    ]
  });

  // Auto-dismiss workflow toast
  useEffect(() => {
    if (workflowToast) {
      const timer = setTimeout(() => setWorkflowToast(""), 4500);
      return () => clearTimeout(timer);
    }
  }, [workflowToast]);

  // Initializers for Forms
  const initPlanForm = (mrm) => {
    if (mrm) {
      setPlanForm({
        title: mrm.title || "",
        description: mrm.description || "",
        targetMonth: mrm.targetMonth || "November 2026",
        department: mrm.department || currentUser?.department || "Academic Quality & Compliance",
        agenda: mrm.agenda?.length
          ? [...mrm.agenda]
          : [
              "Review of previous action items & closure status",
              "Analysis of student semester feedback & satisfaction index",
              "Course delivery milestones and practical lab examination results",
              "Resource allocation, software licenses & computing server capacity",
              "Recommendations for continual curriculum modernization"
            ]
      });
    } else {
      setPlanForm({
        title: "",
        description: "",
        targetMonth: "November 2026",
        department: currentUser?.department || "Academic Quality & Compliance",
        agenda: [
          "Review of previous action items & closure status",
          "Analysis of student semester feedback & satisfaction index",
          "Course delivery milestones and practical lab examination results",
          "Resource allocation, software licenses & computing server capacity",
          "Recommendations for continual curriculum modernization"
        ]
      });
    }
    setNewAgendaItem("");
  };

  const initScheduleForm = (mrm) => {
    const defaultDate =
      mrm?.scheduledDate ||
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    setScheduleForm({
      scheduledDate: defaultDate,
      scheduledTime: mrm?.scheduledTime || "11:00 AM",
      venue: mrm?.venue || "Main Boardroom / Webex Virtual Room",
      attendees: mrm?.attendees?.length
        ? [...mrm.attendees]
        : [
            `${currentUser?.name || "Rahul Kumar"} (QMS Coordinator)`,
            "Anita Rao (Trust Head)",
            "Priya Sharma (Course Coordinator)",
            "Dr. Rajesh Verma (Course Coordinator)",
            "Sunita Patil (Course Coordinator)"
          ]
    });
    setNewAttendee("");
  };

  const initMoMForm = (mrm) => {
    if (mrm?.mom) {
      setMomForm({
        summary: mrm.mom.summary || "",
        discussionPoints: mrm.mom.discussionPoints?.length ? [...mrm.mom.discussionPoints] : [""],
        decisions: mrm.mom.decisions?.length ? [...mrm.mom.decisions] : [""],
        actionItems: mrm.mom.actionItems?.length
          ? mrm.mom.actionItems.map((a) => ({ ...a }))
          : [
              {
                id: "ACT-01",
                task: "",
                assignee: "Priya Sharma (Course Coordinator)",
                deadline: "",
                status: "In Progress"
              }
            ]
      });
    } else {
      setMomForm({
        summary: "",
        discussionPoints: [
          `Review of syllabus progress against targets for ${mrm?.department || "Academic Division"}`,
          "Student semester feedback evaluated with high overall rating",
          "Laboratory computing servers and software license renewal requirements reviewed"
        ],
        decisions: [
          "Approved scheduled syllabus revisions for emerging technologies",
          "Sanctioned procurement of dedicated lab compute resources"
        ],
        actionItems: [
          {
            id: "ACT-01",
            task: "Update laboratory manuals and distribute rubrics to coordinators",
            assignee: "Priya Sharma (Course Coordinator)",
            deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            status: "In Progress"
          },
          {
            id: "ACT-02",
            task: "Finalize curriculum changes for next academic term",
            assignee: "Dr. Rajesh Verma (Course Coordinator)",
            deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            status: "Pending"
          }
        ]
      });
    }
  };

  // Open Guided Workflow Studio
  const openWorkflow = (mrm = null, requestedStep = null) => {
    setWorkflowError("");
    setWorkflowToast("");
    setWorkflowSubmittedSuccess(false);

    if (!mrm) {
      setWorkflowMRM(null);
      setSelectedMRM(null);
      initPlanForm(null);
      initScheduleForm(null);
      initMoMForm(null);
      setWorkflowStep(1);
      setWorkflowOpen(true);
      return;
    }

    setWorkflowMRM(mrm);
    setSelectedMRM(mrm);
    initPlanForm(mrm);
    initScheduleForm(mrm);
    initMoMForm(mrm);

    if (requestedStep) {
      setWorkflowStep(requestedStep);
    } else {
      // Auto-detect the appropriate incomplete step
      if (!mrm.scheduledDate) {
        setWorkflowStep(2);
      } else if (!mrm.mom || !mrm.mom.summary) {
        setWorkflowStep(3);
      } else {
        setWorkflowStep(4);
      }
    }

    setWorkflowOpen(true);
  };

  // URL query parameter synchronization
  useEffect(() => {
    const mrmId = searchParams.get("mrmId");
    const action = searchParams.get("action");
    if (action === "new") {
      openWorkflow(null, 1);
      setSearchParams({}, { replace: true });
    } else if (mrmId && mrmList && mrmList.length > 0) {
      const match = mrmList.find((m) => m.id === mrmId);
      if (match) {
        openWorkflow(match);
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, mrmList]);

  // Stepper accessibility validation
  const canNavigateToStep = (targetStep) => {
    if (workflowSaving) return false;
    if (targetStep === 1) return true;
    if (targetStep === 2) return !!workflowMRM?.id;
    if (targetStep === 3) return !!(workflowMRM?.id && workflowMRM?.scheduledDate);
    if (targetStep === 4) return !!(workflowMRM?.id && workflowMRM?.mom?.summary);
    return false;
  };

  const handleStepClick = (targetStep) => {
    if (workflowSaving) return;
    if (canNavigateToStep(targetStep)) {
      setWorkflowError("");
      setWorkflowStep(targetStep);
    } else {
      setWorkflowError(`Please complete and save previous step(s) before accessing Step ${targetStep}.`);
    }
  };

  // Backward-compatible aliases
  const openPlanModal = () => openWorkflow(null, 1);
  const openScheduleModal = (mrm) => openWorkflow(mrm, 2);
  const openMoMModal = (mrm) => openWorkflow(mrm, 3);
  const openSubmitModal = (mrm) => openWorkflow(mrm, 4);

  // Open Revise Modal
  const openReviseModal = (mrm) => {
    setSelectedMRM(mrm);
    setRevisionNotes("");
    if (mrm.mom) {
      setMomForm({
        summary: mrm.mom.summary || "",
        discussionPoints: mrm.mom.discussionPoints?.length ? [...mrm.mom.discussionPoints] : [""],
        decisions: mrm.mom.decisions?.length ? [...mrm.mom.decisions] : [""],
        actionItems: mrm.mom.actionItems?.length
          ? mrm.mom.actionItems.map((a) => ({ ...a }))
          : []
      });
    }
    setShowReviseModal(true);
  };

  // Open Comprehensive Details Modal
  const openDetailModal = (mrm, tab = "details") => {
    setSelectedMRM(mrm);
    setDetailTab(tab);
    setReviewAction("approve");
    setReviewRemarks("");
    setRejectReason("");
    setShowDetailModal(true);
  };

  // ==================== GUIDED WORKFLOW STEP HANDLERS ====================

  // STEP 1: Plan Meeting Save & Automatic Progression
  const handleStep1PlanSave = async (e) => {
    if (e) e.preventDefault();
    setWorkflowError("");

    if (!planForm.title || !planForm.title.trim()) {
      setWorkflowError("Validation Error: Please enter a Meeting Title.");
      return;
    }
    if (!planForm.targetMonth || !planForm.targetMonth.trim()) {
      setWorkflowError("Validation Error: Please specify the Target Review Period / Month.");
      return;
    }
    if (!planForm.department || !planForm.department.trim()) {
      setWorkflowError("Validation Error: Please specify the Division / Department.");
      return;
    }
    const validAgenda = (planForm.agenda || []).filter((item) => item && item.trim());
    if (validAgenda.length === 0) {
      setWorkflowError("Validation Error: Please provide at least one quality agenda item.");
      return;
    }

    setWorkflowSaving(true);
    try {
      let saved;
      if (workflowMRM && workflowMRM.id) {
        saved = await updateMRM(workflowMRM.id, {
          title: planForm.title.trim(),
          description: planForm.description ? planForm.description.trim() : "",
          targetMonth: planForm.targetMonth.trim(),
          department: planForm.department.trim(),
          agenda: validAgenda
        });
        if (!saved) {
          saved = {
            ...workflowMRM,
            title: planForm.title.trim(),
            description: planForm.description ? planForm.description.trim() : "",
            targetMonth: planForm.targetMonth.trim(),
            department: planForm.department.trim(),
            agenda: validAgenda
          };
        }
      } else {
        saved = await addMRM({
          title: planForm.title.trim(),
          description: planForm.description ? planForm.description.trim() : "",
          targetMonth: planForm.targetMonth.trim(),
          department: planForm.department.trim(),
          agenda: validAgenda,
          plannedBy: currentUser?.name || "Rahul Kumar",
          plannedByRole: currentUser?.roleTitle || "QMS Coordinator"
        });
      }

      if (!saved || !saved.id) {
        throw new Error("Unable to obtain saved meeting record from server.");
      }

      setWorkflowMRM(saved);
      setSelectedMRM(saved);
      initScheduleForm(saved);

      // AUTOMATIC PROGRESSION TO STEP 2
      setWorkflowStep(2);
      setWorkflowToast("Step 1 (Plan) successfully saved! Automatically advanced to Step 2: Schedule Meeting.");
    } catch (err) {
      setWorkflowError(err.message || "Failed to save Meeting Plan. Please try again.");
    } finally {
      setWorkflowSaving(false);
    }
  };

  // STEP 2: Schedule Meeting Save & Automatic Progression
  const handleStep2ScheduleSave = async (e) => {
    if (e) e.preventDefault();
    setWorkflowError("");

    if (!workflowMRM || !workflowMRM.id) {
      setWorkflowError("Error: No active MRM record found. Please complete Step 1 first.");
      return;
    }
    if (!scheduleForm.scheduledDate) {
      setWorkflowError("Validation Error: Please select a scheduled date for the meeting.");
      return;
    }
    if (!scheduleForm.scheduledTime || !scheduleForm.scheduledTime.trim()) {
      setWorkflowError("Validation Error: Please specify the scheduled meeting time.");
      return;
    }
    if (!scheduleForm.venue || !scheduleForm.venue.trim()) {
      setWorkflowError("Validation Error: Please specify the meeting venue or video conference link.");
      return;
    }
    const validAttendees = (scheduleForm.attendees || []).filter((a) => a && a.trim());
    if (validAttendees.length === 0) {
      setWorkflowError("Validation Error: Please include at least one participant/attendee.");
      return;
    }

    setWorkflowSaving(true);
    try {
      const payload = {
        scheduledDate: scheduleForm.scheduledDate,
        scheduledTime: scheduleForm.scheduledTime.trim(),
        venue: scheduleForm.venue.trim(),
        attendees: validAttendees
      };

      const updated = await scheduleMRM(workflowMRM.id, payload);
      const resolvedMRM = updated || { ...workflowMRM, ...payload, status: "Scheduled" };

      setWorkflowMRM(resolvedMRM);
      setSelectedMRM(resolvedMRM);
      initMoMForm(resolvedMRM);

      // AUTOMATIC PROGRESSION TO STEP 3
      setWorkflowStep(3);
      setWorkflowToast(`Meeting scheduled for ${scheduleForm.scheduledDate}! Automatically advanced to Step 3: Minutes of Meeting (MoM).`);
    } catch (err) {
      setWorkflowError(err.message || "Failed to schedule meeting. Please try again.");
    } finally {
      setWorkflowSaving(false);
    }
  };

  // STEP 3: Minutes of Meeting (MoM) Save & Automatic Progression
  const handleStep3MoMSave = async (e) => {
    if (e) e.preventDefault();
    setWorkflowError("");

    if (!workflowMRM || !workflowMRM.id) {
      setWorkflowError("Error: No active MRM record found. Please complete previous steps first.");
      return;
    }
    if (!momForm.summary || !momForm.summary.trim()) {
      setWorkflowError("Validation Error: Executive Meeting Summary is required.");
      return;
    }
    const validDiscussions = (momForm.discussionPoints || []).filter((d) => d && d.trim());
    if (validDiscussions.length === 0) {
      setWorkflowError("Validation Error: Please enter at least one key discussion point.");
      return;
    }
    const validDecisions = (momForm.decisions || []).filter((d) => d && d.trim());
    if (validDecisions.length === 0) {
      setWorkflowError("Validation Error: Please enter at least one key decision taken.");
      return;
    }
    const validActionItems = (momForm.actionItems || []).filter((a) => a.task && a.task.trim());
    if (validActionItems.length === 0) {
      setWorkflowError("Validation Error: Please provide at least one action item with task description.");
      return;
    }
    const incompleteAction = validActionItems.find((a) => !a.assignee?.trim() || !a.deadline);
    if (incompleteAction) {
      setWorkflowError("Validation Error: Every action item must have an assigned coordinator and deadline.");
      return;
    }

    setWorkflowSaving(true);
    try {
      const payload = {
        summary: momForm.summary.trim(),
        discussionPoints: validDiscussions,
        decisions: validDecisions,
        actionItems: validActionItems
      };

      const updated = await saveMoM(workflowMRM.id, payload);
      const resolvedMRM = updated || {
        ...workflowMRM,
        mom: {
          ...payload,
          recordedBy: currentUser?.name || "QMS Coordinator",
          recordedDate: new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
          })
        },
        status: "MoM Recorded"
      };

      setWorkflowMRM(resolvedMRM);
      setSelectedMRM(resolvedMRM);

      // AUTOMATIC PROGRESSION TO STEP 4
      setWorkflowStep(4);
      setWorkflowToast("Minutes of Meeting (MoM) saved successfully! Automatically advanced to Step 4: Final Review and Submission.");
    } catch (err) {
      setWorkflowError(err.message || "Failed to save Minutes of Meeting. Please try again.");
    } finally {
      setWorkflowSaving(false);
    }
  };

  // STEP 4: Review and Submit for Approval (Manual Explicit Trigger)
  const handleStep4FinalSubmit = async () => {
    setWorkflowError("");

    if (!workflowMRM || !workflowMRM.id) {
      setWorkflowError("Error: No active MRM record found to submit.");
      return;
    }

    setWorkflowSaving(true);
    try {
      const updated = await submitMRMForApproval(workflowMRM.id);
      const resolvedMRM = updated || {
        ...workflowMRM,
        status: "Submitted for Approval",
        submittedForApprovalAt: new Date().toLocaleString()
      };

      setWorkflowMRM(resolvedMRM);
      setSelectedMRM(resolvedMRM);
      setWorkflowSubmittedSuccess(true);
      setWorkflowToast("Management Review Meeting package successfully submitted for Trust Head Approval!");
    } catch (err) {
      setWorkflowError(err.message || "Failed to submit MRM for Trust Head approval.");
    } finally {
      setWorkflowSaving(false);
    }
  };

  // Legacy Handlers kept for backward compatibility if invoked elsewhere
  const handlePlanSubmit = handleStep1PlanSave;
  const handleScheduleSubmit = handleStep2ScheduleSave;
  const handleMoMSave = handleStep3MoMSave;
  const handleConfirmSubmitForApproval = handleStep4FinalSubmit;

  // Stage 5: Trust Head Decision Submit
  const handleTrustHeadDecision = async (mrmId) => {
    if (!isTrustHead) {
      alert("Access Denied: Only Trust Head is authorized to evaluate and sign off on MRM submissions.");
      return;
    }
    setSubmitting(true);
    try {
      if (reviewAction === "approve") {
        await approveMRM(mrmId, reviewRemarks.trim());
        alert("Stage 5 Complete: MRM formally APPROVED! QMS Coordinator can now distribute it to all Course Coordinators.");
      } else if (reviewAction === "changes") {
        if (!reviewRemarks.trim()) {
          alert("Please enter comments detailing the required corrections.");
          setSubmitting(false);
          return;
        }
        await requestChangesMRM(mrmId, reviewRemarks.trim());
        alert("Revisions requested. Returned to QMS Coordinator for updating.");
      } else if (reviewAction === "reject") {
        if (!rejectReason.trim()) {
          alert("A mandatory rejection reason is required.");
          setSubmitting(false);
          return;
        }
        await rejectMRM(mrmId, rejectReason.trim());
        alert("MRM submission rejected with reason recorded.");
      }
      setShowDetailModal(false);
    } catch (err) {
      alert(err.message || "Failed to complete Trust Head review action");
    } finally {
      setSubmitting(false);
    }
  };

  // Resubmit after corrections
  const handleResubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await resubmitMRM(selectedMRM.id, momForm, revisionNotes);
      setShowReviseModal(false);
      alert(`Success: MRM revisions resubmitted to Trust Head for review.`);
    } catch (err) {
      alert(err.message || "Failed to resubmit MRM");
    } finally {
      setSubmitting(false);
    }
  };

  // Stage 6: QMS Coordinator Share with Course Coordinators
  const handleShareMRM = async (mrmId) => {
    if (!isQMSCoordinator) {
      alert("Access Denied: Only the QMS Coordinator is authorized to distribute approved MRMs.");
      return;
    }
    setSubmitting(true);
    try {
      await shareMRM(mrmId);
      alert("Stage 6 Complete: Approved MRM and Minutes of Meeting distributed to all Course Coordinators!");
      if (selectedMRM?.id === mrmId) {
        setShowDetailModal(false);
      }
    } catch (err) {
      alert(err.message || "Failed to share MRM");
    } finally {
      setSubmitting(false);
    }
  };

  // Stage 7: Course Coordinator Acknowledge Receipt
  const handleAcknowledgeMRM = async (mrmId) => {
    setSubmitting(true);
    try {
      await acknowledgeMRM(mrmId);
      alert("Thank you: Your acknowledgement for this MRM distribution has been recorded.");
      if (selectedMRM?.id === mrmId) {
        setShowDetailModal(false);
      }
    } catch (err) {
      alert(err.message || "Failed to acknowledge receipt");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered List based on search query and stage
  const filtered = (mrmList || []).filter((m) => {
    const stageInfo = getStageDetails(m);

    const matchesStage =
      stageFilter === "All" ||
      (stageFilter === "Planned" && stageInfo.stage === 1) ||
      (stageFilter === "Scheduled" && stageInfo.stage === 2) ||
      (stageFilter === "MoM Recorded" && stageInfo.stage === 3) ||
      (stageFilter === "Submitted for Approval" && stageInfo.stage === 4) ||
      (stageFilter === "Approved" && stageInfo.stage === 5) ||
      (stageFilter === "Shared" && stageInfo.stage === 6) ||
      (stageFilter === "Revisions" && (stageInfo.stage === 3.5 || m.status === "Changes Requested" || m.status === "Rejected"));

    const q = query.toLowerCase();
    const matchesQuery =
      m.title.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q) ||
      (m.plannedBy && m.plannedBy.toLowerCase().includes(q)) ||
      (m.venue && m.venue.toLowerCase().includes(q)) ||
      (m.department && m.department.toLowerCase().includes(q));

    return matchesStage && matchesQuery;
  });

  // Counts for each stage
  const countStage1 = (mrmList || []).filter((m) => getStageDetails(m).stage === 1).length;
  const countStage2 = (mrmList || []).filter((m) => getStageDetails(m).stage === 2).length;
  const countStage3 = (mrmList || []).filter((m) => getStageDetails(m).stage === 3).length;
  const countStage4 = (mrmList || []).filter((m) => getStageDetails(m).stage === 4).length;
  const countStage5 = (mrmList || []).filter((m) => getStageDetails(m).stage === 5).length;
  const countStage6 = (mrmList || []).filter((m) => getStageDetails(m).stage === 6).length;

  return (
    <>
      <PageIntro
        eyebrow="ISO 9001:2015 Clause 9.3 Quality Governance"
        title="Management Review Meeting (MRM)"
        description="Sequential Quality Workflow: QMS Coordinator plans, schedules, and drafts MoM; sends for Trust Head executive approval; once approved, shares with all Course Coordinators."
        action={
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            {isQMSCoordinator && (
              <button
                className="primary-button"
                onClick={() => openWorkflow(null, 1)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "9px 18px",
                  fontSize: "14px",
                  fontWeight: "600"
                }}
              >
                <Plus size={18} />
                <span>Start MRM Guided Workflow</span>
              </button>
            )}
          </div>
        }
      />

      {/* ACTIVE USER ROLE BANNER */}
      <div
        className="panel"
        style={{
          marginBottom: "20px",
          padding: "16px 20px",
          background: "#ffffff",
          border: "1px solid var(--navy-border)",
          borderRadius: "12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #0e3f68 0%, #0b3457 100%)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              fontSize: "13px",
              boxShadow: "0 2px 4px rgba(11, 52, 87, 0.2)"
            }}
          >
            {isQMSCoordinator ? "QM" : isTrustHead ? "TH" : "CC"}
          </div>
          <div>
            <strong style={{ fontSize: "13px", color: "var(--navy)" }}>
              Active Operator: {currentUser?.name || "Rahul Kumar"} ({currentUser?.roleTitle || "QMS Coordinator"})
            </strong>
            <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--muted)" }}>
              {isQMSCoordinator
                ? "You have full coordinator authority: Plan meetings, schedule date/venue, record MoM, submit for approval, and distribute approved records."
                : isTrustHead
                ? "You have executive authority: Review submitted MRMs, formally approve or request revisions, and sign off for distribution."
                : "You have course coordinator authority: Access shared review records, review action items assigned to you, and acknowledge receipt."}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontSize: "11px",
              padding: "4px 10px",
              borderRadius: "999px",
              background: "var(--navy-subtle)",
              border: "1px solid var(--navy-border)",
              fontWeight: "600",
              color: "var(--navy)"
            }}
          >
            ISO 9001:2015 Compliant Pipeline
          </span>
        </div>
      </div>

      {/* SEQUENTIAL 6-STAGE WORKFLOW PIPELINE INTERACTIVE TRACKER */}
      <section
        className="panel"
        style={{
          padding: "20px",
          marginBottom: "24px",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <strong style={{ fontSize: "14px", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.6px" }}>
              Sequential MRM Lifecycle Pipeline
            </strong>
            <span style={{ display: "block", fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
              Click any stage to filter meetings currently at that phase
            </span>
          </div>
          <button
            type="button"
            className="text-link"
            onClick={() => setStageFilter("All")}
            style={{ fontSize: "12px", cursor: "pointer" }}
          >
            Show All ({mrmList?.length || 0})
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: "12px"
          }}
        >
          {/* Step 1: Plan */}
          <div
            className="pipeline-stage-card"
            onClick={() => setStageFilter("Planned")}
            style={{
              padding: "14px",
              borderRadius: "10px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: stageFilter === "Planned" ? "var(--navy-subtle)" : "#ffffff",
              border: stageFilter === "Planned" ? "2px solid var(--navy)" : "1px solid var(--line)",
              boxShadow: stageFilter === "Planned" ? "0 2px 8px rgba(11, 52, 87, 0.12)" : "var(--shadow-xs)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <span
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: stageFilter === "Planned" ? "var(--navy)" : "var(--navy-subtle)",
                  color: stageFilter === "Planned" ? "#ffffff" : "var(--navy)",
                  border: stageFilter === "Planned" ? "none" : "1px solid var(--navy-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: "700"
                }}
              >
                1
              </span>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  padding: "2px 7px",
                  borderRadius: "999px",
                  background: stageFilter === "Planned" ? "var(--navy)" : countStage1 > 0 ? "var(--navy-subtle)" : "#f1f5f9",
                  color: stageFilter === "Planned" ? "#ffffff" : countStage1 > 0 ? "var(--navy)" : "#94a3b8",
                  border: stageFilter === "Planned" ? "none" : countStage1 > 0 ? "1px solid var(--navy-border)" : "none"
                }}
              >
                {countStage1}
              </span>
            </div>
            <strong style={{ display: "block", fontSize: "13px", color: "var(--navy)" }}>1. Plan Meeting</strong>
            <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "var(--muted)", lineHeight: "1.3" }}>
              QMS Coord drafts agenda, department & objectives.
            </p>
          </div>

          {/* Step 2: Schedule */}
          <div
            className="pipeline-stage-card"
            onClick={() => setStageFilter("Scheduled")}
            style={{
              padding: "14px",
              borderRadius: "10px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: stageFilter === "Scheduled" ? "var(--navy-subtle)" : "#ffffff",
              border: stageFilter === "Scheduled" ? "2px solid var(--navy)" : "1px solid var(--line)",
              boxShadow: stageFilter === "Scheduled" ? "0 2px 8px rgba(11, 52, 87, 0.12)" : "var(--shadow-xs)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <span
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: stageFilter === "Scheduled" ? "var(--navy)" : "var(--navy-subtle)",
                  color: stageFilter === "Scheduled" ? "#ffffff" : "var(--navy)",
                  border: stageFilter === "Scheduled" ? "none" : "1px solid var(--navy-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: "700"
                }}
              >
                2
              </span>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  padding: "2px 7px",
                  borderRadius: "999px",
                  background: stageFilter === "Scheduled" ? "var(--navy)" : countStage2 > 0 ? "var(--navy-subtle)" : "#f1f5f9",
                  color: stageFilter === "Scheduled" ? "#ffffff" : countStage2 > 0 ? "var(--navy)" : "#94a3b8",
                  border: stageFilter === "Scheduled" ? "none" : countStage2 > 0 ? "1px solid var(--navy-border)" : "none"
                }}
              >
                {countStage2}
              </span>
            </div>
            <strong style={{ display: "block", fontSize: "13px", color: "var(--navy)" }}>2. Schedule</strong>
            <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "var(--muted)", lineHeight: "1.3" }}>
              QMS Coord assigns date, time, venue & attendees.
            </p>
          </div>

          {/* Step 3: MoM */}
          <div
            className="pipeline-stage-card"
            onClick={() => setStageFilter("MoM Recorded")}
            style={{
              padding: "14px",
              borderRadius: "10px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: stageFilter === "MoM Recorded" ? "var(--navy-subtle)" : "#ffffff",
              border: stageFilter === "MoM Recorded" ? "2px solid var(--navy)" : "1px solid var(--line)",
              boxShadow: stageFilter === "MoM Recorded" ? "0 2px 8px rgba(11, 52, 87, 0.12)" : "var(--shadow-xs)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <span
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: stageFilter === "MoM Recorded" ? "var(--navy)" : "var(--navy-subtle)",
                  color: stageFilter === "MoM Recorded" ? "#ffffff" : "var(--navy)",
                  border: stageFilter === "MoM Recorded" ? "none" : "1px solid var(--navy-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: "700"
                }}
              >
                3
              </span>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  padding: "2px 7px",
                  borderRadius: "999px",
                  background: stageFilter === "MoM Recorded" ? "var(--navy)" : countStage3 > 0 ? "var(--navy-subtle)" : "#f1f5f9",
                  color: stageFilter === "MoM Recorded" ? "#ffffff" : countStage3 > 0 ? "var(--navy)" : "#94a3b8",
                  border: stageFilter === "MoM Recorded" ? "none" : countStage3 > 0 ? "1px solid var(--navy-border)" : "none"
                }}
              >
                {countStage3}
              </span>
            </div>
            <strong style={{ display: "block", fontSize: "13px", color: "var(--navy)" }}>3. Record MoM</strong>
            <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "var(--muted)", lineHeight: "1.3" }}>
              QMS Coord documents summary, decisions & actions.
            </p>
          </div>

          {/* Step 4: Submit for Approval */}
          <div
            className="pipeline-stage-card"
            onClick={() => setStageFilter("Submitted for Approval")}
            style={{
              padding: "14px",
              borderRadius: "10px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: stageFilter === "Submitted for Approval" ? "var(--status-amber-bg)" : "#ffffff",
              border: stageFilter === "Submitted for Approval" ? "2px solid var(--status-amber)" : "1px solid var(--line)",
              boxShadow: stageFilter === "Submitted for Approval" ? "0 2px 8px rgba(180, 83, 9, 0.12)" : "var(--shadow-xs)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <span
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: stageFilter === "Submitted for Approval" ? "var(--status-amber)" : "var(--navy-subtle)",
                  color: stageFilter === "Submitted for Approval" ? "#ffffff" : "var(--navy)",
                  border: stageFilter === "Submitted for Approval" ? "none" : "1px solid var(--navy-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: "700"
                }}
              >
                4
              </span>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  padding: "2px 7px",
                  borderRadius: "999px",
                  background: countStage4 > 0 ? "var(--status-amber-bg)" : "#f1f5f9",
                  color: countStage4 > 0 ? "var(--status-amber)" : "#94a3b8",
                  border: countStage4 > 0 ? "1px solid var(--status-amber-border)" : "none"
                }}
              >
                {countStage4}
              </span>
            </div>
            <strong style={{ display: "block", fontSize: "13px", color: "var(--navy)" }}>4. Submit Package</strong>
            <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "var(--muted)", lineHeight: "1.3" }}>
              All 3 done: QMS Coord sends to Trust Head.
            </p>
          </div>

          {/* Step 5: Trust Head Approval */}
          <div
            className="pipeline-stage-card"
            onClick={() => setStageFilter("Approved")}
            style={{
              padding: "14px",
              borderRadius: "10px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: stageFilter === "Approved" ? "var(--status-green-bg)" : "#ffffff",
              border: stageFilter === "Approved" ? "2px solid var(--status-green)" : "1px solid var(--line)",
              boxShadow: stageFilter === "Approved" ? "0 2px 8px rgba(22, 101, 52, 0.12)" : "var(--shadow-xs)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <span
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: stageFilter === "Approved" ? "var(--status-green)" : "var(--navy-subtle)",
                  color: stageFilter === "Approved" ? "#ffffff" : "var(--navy)",
                  border: stageFilter === "Approved" ? "none" : "1px solid var(--navy-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: "700"
                }}
              >
                5
              </span>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  padding: "2px 7px",
                  borderRadius: "999px",
                  background: countStage5 > 0 ? "var(--status-green-bg)" : "#f1f5f9",
                  color: countStage5 > 0 ? "var(--status-green)" : "#94a3b8",
                  border: countStage5 > 0 ? "1px solid var(--status-green-border)" : "none"
                }}
              >
                {countStage5}
              </span>
            </div>
            <strong style={{ display: "block", fontSize: "13px", color: "var(--navy)" }}>5. Trust Approval</strong>
            <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "var(--muted)", lineHeight: "1.3" }}>
              Trust Head formally reviews and ratifies record.
            </p>
          </div>

          {/* Step 6: Share */}
          <div
            className="pipeline-stage-card"
            onClick={() => setStageFilter("Shared")}
            style={{
              padding: "14px",
              borderRadius: "10px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: stageFilter === "Shared" ? "var(--navy-subtle)" : "#ffffff",
              border: stageFilter === "Shared" ? "2px solid var(--navy)" : "1px solid var(--line)",
              boxShadow: stageFilter === "Shared" ? "0 2px 8px rgba(11, 52, 87, 0.12)" : "var(--shadow-xs)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <span
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: stageFilter === "Shared" ? "var(--navy)" : "var(--navy-subtle)",
                  color: stageFilter === "Shared" ? "#ffffff" : "var(--navy)",
                  border: stageFilter === "Shared" ? "none" : "1px solid var(--navy-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: "700"
                }}
              >
                6
              </span>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  padding: "2px 7px",
                  borderRadius: "999px",
                  background: countStage6 > 0 ? "var(--navy-subtle)" : "#f1f5f9",
                  color: countStage6 > 0 ? "var(--navy)" : "#94a3b8",
                  border: countStage6 > 0 ? "1px solid var(--navy-border)" : "none"
                }}
              >
                {countStage6}
              </span>
            </div>
            <strong style={{ display: "block", fontSize: "13px", color: "var(--navy)" }}>6. Share with CCs</strong>
            <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "var(--muted)", lineHeight: "1.3" }}>
              Once approved, QMS Coord shares with all CCs.
            </p>
          </div>
        </div>
      </section>

      {/* FILTER & SEARCH BAR */}
      <div className="filter-bar" style={{ marginBottom: "20px" }}>
        <label className="search-field">
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search MRM by title, ID, venue, or coordinator..."
          />
        </label>
        <div className="tabs">
          {[
            { id: "All", label: `All (${mrmList?.length || 0})` },
            { id: "Planned", label: `1. Planned (${countStage1})` },
            { id: "Scheduled", label: `2. Scheduled (${countStage2})` },
            { id: "MoM Recorded", label: `3. MoM (${countStage3})` },
            { id: "Submitted for Approval", label: `4. With Trust (${countStage4})` },
            { id: "Approved", label: `5. Approved (${countStage5})` },
            { id: "Shared", label: `6. Shared (${countStage6})` }
          ].map((tab) => (
            <button
              key={tab.id}
              className={stageFilter === tab.id ? "tab active" : "tab"}
              onClick={() => setStageFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* MRM TABLE */}
      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Meeting ID & Title</th>
                <th>Ver.</th>
                <th>Lifecycle Progress</th>
                <th>Schedule Details</th>
                <th>Minutes (MoM)</th>
                <th>Trust Sign-off</th>
                <th>Current Status</th>
                <th style={{ textAlign: "right" }}>Workflow Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                    <p style={{ fontSize: "14px", margin: "0 0 10px 0" }}>No meetings found matching the selected filter.</p>
                    {isQMSCoordinator && (
                      <button
                        type="button"
                        className="primary-button"
                        onClick={openPlanModal}
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                      >
                        <Plus size={15} /> Plan a New MRM
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((mrm) => {
                  const stageInfo = getStageDetails(mrm);
                  const isApproved =
                    mrm.status === "Approved" ||
                    mrm.status === "Approved by Trust Head" ||
                    mrm.trustHeadApproval?.approved;
                  const isSubmitted =
                    mrm.status === "Submitted for Approval" ||
                    mrm.status === "Pending Trust Head Approval";
                  const isChangesReq = mrm.status === "Changes Requested";
                  const isRej = mrm.status === "Rejected";
                  const isShared = mrm.sharedWithAll || mrm.status === "Shared";

                  const hasAcknowledged = (mrm.acknowledgements || []).some(
                    (a) => a.userId === currentUser?.id || a.name === currentUser?.name
                  );

                  return (
                    <tr key={mrm.id}>
                      {/* 1. Title & ID */}
                      <td style={{ minWidth: "220px" }}>
                        <div>
                          <strong style={{ fontSize: "13px", color: "#0f172a", display: "block" }}>
                            {mrm.title}
                          </strong>
                          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "3px" }}>
                            <code style={{ fontSize: "11px", color: "#0284c7", fontWeight: "600" }}>{mrm.id}</code>
                            <span style={{ fontSize: "11px", color: "#64748b" }}>• {mrm.department || "Academic Division"}</span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Version */}
                      <td>
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "2px 6px",
                            background: "#f1f5f9",
                            borderRadius: "4px",
                            fontWeight: "700",
                            color: "#334155"
                          }}
                        >
                          v{mrm.version || "1.0"}
                        </span>
                      </td>

                      {/* 3. Lifecycle Progress 6-Step Visual Bar */}
                      <td style={{ minWidth: "150px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                            {[1, 2, 3, 4, 5, 6].map((s) => {
                              const isCompleted = stageInfo.stage > s;
                              const isCurrent = Math.floor(stageInfo.stage) === s;
                              return (
                                <div
                                  key={s}
                                  title={`Stage ${s}`}
                                  style={{
                                    height: "6px",
                                    flex: 1,
                                    borderRadius: "3px",
                                    background: isCompleted
                                      ? "#16a34a"
                                      : isCurrent
                                      ? stageInfo.color
                                      : "#e2e8f0",
                                    transition: "all 0.3s ease"
                                  }}
                                />
                              );
                            })}
                          </div>
                          <span style={{ fontSize: "10px", color: stageInfo.color, fontWeight: "700" }}>
                            Stage {Math.floor(stageInfo.stage)} of 6: {stageInfo.badgeText}
                          </span>
                        </div>
                      </td>

                      {/* 4. Schedule Details */}
                      <td style={{ minWidth: "170px" }}>
                        {mrm.scheduledDate ? (
                          <div style={{ fontSize: "12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#0f172a" }}>
                              <Calendar size={13} color="var(--navy)" />
                              <strong>{mrm.scheduledDate}</strong>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#64748b", marginTop: "2px" }}>
                              <MapPin size={12} />
                              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "140px" }}>
                                {mrm.venue || "Virtual"}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: "11px", color: "var(--navy)", fontStyle: "italic", background: "var(--navy-subtle)", padding: "2px 6px", borderRadius: "4px" }}>
                            Needs Scheduling
                          </span>
                        )}
                      </td>

                      {/* 5. Minutes of Meeting (MoM) */}
                      <td>
                        {mrm.mom ? (
                          <div>
                            <span style={{ color: "var(--navy)", fontSize: "12px", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <CheckCircle2 size={13} /> Recorded
                            </span>
                            <small style={{ color: "#64748b", display: "block" }}>
                              {mrm.mom.actionItems?.length || 0} action items
                            </small>
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "11px" }}>Pending MoM</span>
                        )}
                      </td>

                      {/* 6. Trust Approval */}
                      <td>
                        {isApproved ? (
                          <span style={{ color: "#16a34a", fontWeight: "600", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <ShieldCheck size={14} /> Approved
                          </span>
                        ) : isSubmitted ? (
                          <span style={{ color: "#d97706", fontWeight: "600", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <Clock size={13} /> In Review
                          </span>
                        ) : isChangesReq ? (
                          <span style={{ color: "#dc2626", fontWeight: "600", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <RotateCcw size={13} /> Revisions Req.
                          </span>
                        ) : isRej ? (
                          <span style={{ color: "#ef4444", fontWeight: "600", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <XCircle size={13} /> Rejected
                          </span>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "11px" }}>Not Submitted</span>
                        )}
                      </td>

                      {/* 7. Current Status Badge */}
                      <td>
                        <StatusBadge status={mrm.status} />
                      </td>

                      {/* 8. Sequential Actions */}
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <div style={{ display: "inline-flex", gap: "6px", alignItems: "center", justifyContent: "flex-end" }}>
                          {/* View details (always available) */}
                          <button
                            type="button"
                            className="row-action"
                            onClick={() => openDetailModal(mrm)}
                            style={{ cursor: "pointer", fontSize: "12px" }}
                            title="View Full Package"
                          >
                            <Eye size={13} style={{ display: "inline", verticalAlign: "middle" }} /> View
                          </button>

                          {/* ==================== QMS COORDINATOR WORKFLOW ACTIONS ==================== */}
                          {isQMSCoordinator && (
                            <>
                              {/* Stage 1 -> 2: If Planned, Continue Workflow to Schedule */}
                              {stageInfo.stage === 1 && (
                                <button
                                  type="button"
                                  className="primary-button btn-blue"
                                  onClick={() => openWorkflow(mrm, 2)}
                                  style={{
                                    fontSize: "12px",
                                    padding: "4px 10px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px"
                                  }}
                                  title="Continue guided workflow at Step 2: Schedule Meeting"
                                >
                                  <Calendar size={13} />
                                  <span>Continue (Schedule)</span>
                                </button>
                              )}

                              {/* Stage 2 -> 3: If Scheduled, Continue Workflow to Record MoM */}
                              {stageInfo.stage === 2 && (
                                <button
                                  type="button"
                                  className="primary-button btn-teal"
                                  onClick={() => openWorkflow(mrm, 3)}
                                  style={{
                                    fontSize: "12px",
                                    padding: "4px 10px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px"
                                  }}
                                  title="Continue guided workflow at Step 3: Minutes of Meeting (MoM)"
                                >
                                  <Edit size={13} />
                                  <span>Continue (MoM)</span>
                                </button>
                              )}

                              {/* Stage 3 -> 4: If MoM Recorded, Continue to Review & Submit */}
                              {stageInfo.stage === 3 && (
                                <button
                                  type="button"
                                  className="primary-button btn-amber"
                                  onClick={() => openWorkflow(mrm, 4)}
                                  style={{
                                    fontSize: "12px",
                                    padding: "4px 10px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px"
                                  }}
                                  title="Review consolidated summary and submit for Trust Head Approval"
                                >
                                  <Send size={13} />
                                  <span>Review & Submit</span>
                                </button>
                              )}

                              {/* Stage 3.5: If Changes Requested, Revise & Resubmit */}
                              {(isChangesReq || isRej) && (
                                <button
                                  type="button"
                                  className="primary-button btn-purple"
                                  onClick={() => openReviseModal(mrm)}
                                  style={{
                                    fontSize: "12px",
                                    padding: "4px 10px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "3px"
                                  }}
                                >
                                  <RotateCcw size={13} />
                                  <span>Revise MoM</span>
                                </button>
                              )}

                              {/* Stage 4: Under Review indicator (Share is disabled) */}
                              {isSubmitted && (
                                <span
                                  style={{
                                    fontSize: "11px",
                                    color: "#b45309",
                                    background: "#fef3c7",
                                    padding: "3px 8px",
                                    borderRadius: "4px",
                                    fontWeight: "600",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "3px"
                                  }}
                                  title="Meeting package is awaiting Trust Head review. Sharing will unlock once approved."
                                >
                                  <Lock size={11} /> Awaiting Trust Approval
                                </span>
                              )}

                              {/* Stage 5 -> 6: Once Approved, QMS Coordinator can SHARE WITH ALL COURSE COORDINATORS */}
                              {isApproved && !isShared && (
                                <button
                                  type="button"
                                  className="primary-button btn-green"
                                  onClick={() => handleShareMRM(mrm.id)}
                                  disabled={submitting}
                                  style={{
                                    fontSize: "12px",
                                    padding: "4px 10px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    fontWeight: "700"
                                  }}
                                >
                                  <Share2 size={13} />
                                  <span>Share with Course Coordinators</span>
                                </button>
                              )}

                              {/* Stage 6: Already Shared */}
                              {isShared && (
                                <span
                                  style={{
                                    fontSize: "11px",
                                    color: "#15803d",
                                    background: "#dcfce7",
                                    padding: "3px 8px",
                                    borderRadius: "4px",
                                    fontWeight: "600",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "3px"
                                  }}
                                >
                                  <CheckCircle2 size={11} /> Distributed ({mrm.acknowledgements?.length || 0} Acks)
                                </span>
                              )}
                            </>
                          )}

                          {/* ==================== TRUST HEAD WORKFLOW ACTIONS ==================== */}
                          {isTrustHead && isSubmitted && (
                            <button
                              type="button"
                              className="primary-button btn-green"
                              onClick={() => openDetailModal(mrm, "mom")}
                              style={{
                                fontSize: "12px",
                                padding: "4px 10px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px"
                              }}
                            >
                              <ShieldCheck size={13} />
                              <span>Review & Sign-Off</span>
                            </button>
                          )}

                          {/* ==================== COURSE COORDINATOR WORKFLOW ACTIONS ==================== */}
                          {isCourseCoordinator && isShared && !hasAcknowledged && (
                            <button
                              type="button"
                              className="primary-button btn-green"
                              onClick={() => handleAcknowledgeMRM(mrm.id)}
                              disabled={submitting}
                              style={{
                                fontSize: "12px",
                                padding: "4px 10px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px"
                              }}
                            >
                              <Check size={13} />
                              <span>Acknowledge Receipt</span>
                            </button>
                          )}

                          {isCourseCoordinator && isShared && hasAcknowledged && (
                            <span
                              style={{
                                fontSize: "11px",
                                color: "#16a34a",
                                fontWeight: "600",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px"
                              }}
                            >
                              <CheckCircle2 size={12} /> Acknowledged
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ==================== GUIDED MRM WORKFLOW STUDIO (CONTINUOUS AUTO-PROGRESSION) ==================== */}
      {workflowOpen && (
        <Modal
          title={
            workflowMRM
              ? `MRM Workflow Studio: ${workflowMRM.title} (${workflowMRM.id})`
              : "MRM Workflow Studio: Plan New Meeting"
          }
          onClose={() => {
            if (!workflowSaving) setWorkflowOpen(false);
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Header Context / Stage Info */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--line)", paddingBottom: "10px" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  ISO 9001:2015 Clause 9.3 Quality Review
                </span>
                <span style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "var(--ink)", marginTop: "2px" }}>
                  Automatic Step Progression Workflow
                </span>
              </div>
              {workflowMRM && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12px", color: "var(--muted)" }}>Status:</span>
                  <StatusBadge status={workflowMRM.status || "Planned"} />
                </div>
              )}
            </div>

            {/* Stepper Progress Bar */}
            <div className="mrm-workflow-stepper">
              {[
                {
                  num: 1,
                  title: "1. Plan MRM",
                  subtitle: "Scope & Agenda",
                  isCompleted: !!workflowMRM?.id,
                  isAccessible: true
                },
                {
                  num: 2,
                  title: "2. Schedule Meeting",
                  subtitle: "Date, Time & Venue",
                  isCompleted: !!workflowMRM?.scheduledDate,
                  isAccessible: !!workflowMRM?.id
                },
                {
                  num: 3,
                  title: "3. Minutes of Meeting",
                  subtitle: "Discussions & Actions",
                  isCompleted: !!(workflowMRM?.mom && workflowMRM?.mom?.summary),
                  isAccessible: !!(workflowMRM?.id && workflowMRM?.scheduledDate)
                },
                {
                  num: 4,
                  title: "4. Review & Submit",
                  subtitle: "Executive Sign-off",
                  isCompleted:
                    workflowMRM?.status === "Submitted for Approval" ||
                    workflowMRM?.status === "Approved" ||
                    workflowSubmittedSuccess,
                  isAccessible: !!(workflowMRM?.id && workflowMRM?.mom && workflowMRM?.mom?.summary)
                }
              ].map((st, idx, arr) => (
                <React.Fragment key={st.num}>
                  <button
                    type="button"
                    className={`mrm-step-tab ${workflowStep === st.num ? "active" : ""} ${st.isAccessible ? "clickable" : ""}`}
                    onClick={() => handleStepClick(st.num)}
                    disabled={workflowSaving}
                    title={st.isAccessible ? `Jump to Step ${st.num} to view or edit` : `Complete Step ${st.num - 1} first`}
                  >
                    <span
                      className={`mrm-step-badge ${st.isCompleted && workflowStep !== st.num ? "completed" : workflowStep === st.num ? "active" : ""}`}
                    >
                      {st.isCompleted && workflowStep !== st.num ? <Check size={14} /> : st.num}
                    </span>
                    <div className="mrm-step-label-group">
                      <span className="mrm-step-title">{st.title}</span>
                      <span className="mrm-step-subtitle">{st.subtitle}</span>
                    </div>
                  </button>
                  {idx < arr.length - 1 && (
                    <div
                      className={`mrm-step-connector ${st.isCompleted ? "completed" : ""}`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Error Notification Alert */}
            {workflowError && (
              <div className="mrm-workflow-error-alert" role="alert">
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, fontWeight: "500" }}>{workflowError}</div>
                <button
                  type="button"
                  onClick={() => setWorkflowError("")}
                  style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontWeight: "700", padding: "0 4px" }}
                >
                  ×
                </button>
              </div>
            )}

            {/* Toast Notification Alert */}
            {workflowToast && (
              <div className="mrm-workflow-toast-alert" role="status">
                <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, fontWeight: "500" }}>{workflowToast}</div>
                <button
                  type="button"
                  onClick={() => setWorkflowToast("")}
                  style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontWeight: "700", padding: "0 4px" }}
                >
                  ×
                </button>
              </div>
            )}

            {/* STEP 1: PLAN MRM */}
            {workflowStep === 1 && (
              <form onSubmit={handleStep1PlanSave}>
                <div style={{ marginBottom: "16px", padding: "12px 14px", background: "var(--navy-subtle)", borderRadius: "8px", border: "1px solid var(--navy-border)" }}>
                  <strong style={{ display: "block", color: "var(--navy)", fontSize: "13px", marginBottom: "2px" }}>
                    Step 1: Plan Management Review Meeting
                  </strong>
                  <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                    Establish meeting title, review window, division, objectives, and agenda topics. When completed and successfully saved, the workflow will automatically progress to Step 2 (Schedule Meeting).
                  </span>
                </div>

                <div className="form-grid">
                  <label>
                    Meeting Title *
                    <input
                      type="text"
                      required
                      placeholder="e.g. Q4 Academic Curriculum & Lab Infrastructure Review"
                      value={planForm.title}
                      onChange={(e) => {
                        setPlanForm({ ...planForm, title: e.target.value });
                        if (workflowError) setWorkflowError("");
                      }}
                      disabled={workflowSaving}
                    />
                  </label>

                  <label>
                    Target Review Period / Window *
                    <input
                      type="text"
                      required
                      placeholder="e.g. November 2026 or Q4 Academic Cycle"
                      value={planForm.targetMonth}
                      onChange={(e) => {
                        setPlanForm({ ...planForm, targetMonth: e.target.value });
                        if (workflowError) setWorkflowError("");
                      }}
                      disabled={workflowSaving}
                    />
                  </label>

                  <label>
                    Division / Department *
                    <input
                      type="text"
                      required
                      placeholder="e.g. Academic Quality & Compliance"
                      value={planForm.department}
                      onChange={(e) => {
                        setPlanForm({ ...planForm, department: e.target.value });
                        if (workflowError) setWorkflowError("");
                      }}
                      disabled={workflowSaving}
                    />
                  </label>

                  <label>
                    Meeting Objective & Purpose
                    <textarea
                      rows={2}
                      placeholder="Define the primary review focus per ISO 9001:2015 Clause 9.3..."
                      value={planForm.description}
                      onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                      disabled={workflowSaving}
                    />
                  </label>
                </div>

                {/* Agenda Topics */}
                <div style={{ marginTop: "16px", padding: "14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <strong style={{ fontSize: "13px", color: "var(--ink)" }}>
                      Quality Agenda Topics ({planForm.agenda.length}) *
                    </strong>
                  </div>
                  <ul style={{ margin: "0 0 10px 0", paddingLeft: "20px", fontSize: "13px", color: "#334155" }}>
                    {planForm.agenda.map((item, idx) => (
                      <li key={idx} style={{ marginBottom: "6px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                          <span>{item}</span>
                          {planForm.agenda.length > 1 && (
                            <button
                              type="button"
                              style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}
                              onClick={() =>
                                setPlanForm({
                                  ...planForm,
                                  agenda: planForm.agenda.filter((_, i) => i !== idx)
                                })
                              }
                              disabled={workflowSaving}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input
                      type="text"
                      placeholder="Add another agenda topic..."
                      value={newAgendaItem}
                      onChange={(e) => setNewAgendaItem(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (newAgendaItem.trim()) {
                            setPlanForm({ ...planForm, agenda: [...planForm.agenda, newAgendaItem.trim()] });
                            setNewAgendaItem("");
                          }
                        }
                      }}
                      disabled={workflowSaving}
                      style={{ flex: 1, padding: "7px 10px", fontSize: "13px" }}
                    />
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={workflowSaving || !newAgendaItem.trim()}
                      onClick={() => {
                        if (newAgendaItem.trim()) {
                          setPlanForm({ ...planForm, agenda: [...planForm.agenda, newAgendaItem.trim()] });
                          setNewAgendaItem("");
                        }
                      }}
                    >
                      Add Agenda
                    </button>
                  </div>
                </div>

                <div className="modal-actions" style={{ marginTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setWorkflowOpen(false)}
                    disabled={workflowSaving}
                  >
                    Exit Studio
                  </button>
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={workflowSaving}
                    style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontWeight: "700" }}
                  >
                    {workflowSaving ? (
                      <>
                        <Clock size={16} className="spin" />
                        <span>Saving Plan...</span>
                      </>
                    ) : (
                      <>
                        <span>Save Plan & Proceed to Schedule</span>
                        <ChevronRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: SCHEDULE MEETING */}
            {workflowStep === 2 && (
              <form onSubmit={handleStep2ScheduleSave}>
                <div style={{ marginBottom: "16px", padding: "12px 14px", background: "var(--navy-subtle)", borderRadius: "8px", border: "1px solid var(--navy-border)" }}>
                  <strong style={{ display: "block", color: "var(--navy)", fontSize: "13px", marginBottom: "2px" }}>
                    Step 2: Schedule Meeting — {workflowMRM?.title || planForm.title}
                  </strong>
                  <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                    Specify meeting date, session time, venue / virtual link, and invited attendees. Saving successfully will automatically advance to Step 3 (Minutes of Meeting).
                  </span>
                </div>

                <div className="form-grid">
                  <label>
                    Scheduled Date *
                    <input
                      type="date"
                      required
                      value={scheduleForm.scheduledDate}
                      onChange={(e) => {
                        setScheduleForm({ ...scheduleForm, scheduledDate: e.target.value });
                        if (workflowError) setWorkflowError("");
                      }}
                      disabled={workflowSaving}
                    />
                  </label>

                  <label>
                    Scheduled Time Window *
                    <input
                      type="text"
                      required
                      placeholder="e.g. 11:00 AM - 01:00 PM"
                      value={scheduleForm.scheduledTime}
                      onChange={(e) => {
                        setScheduleForm({ ...scheduleForm, scheduledTime: e.target.value });
                        if (workflowError) setWorkflowError("");
                      }}
                      disabled={workflowSaving}
                    />
                  </label>

                  <label>
                    Meeting Venue / Video Link *
                    <input
                      type="text"
                      required
                      placeholder="e.g. Main Boardroom / Webex Virtual Room"
                      value={scheduleForm.venue}
                      onChange={(e) => {
                        setScheduleForm({ ...scheduleForm, venue: e.target.value });
                        if (workflowError) setWorkflowError("");
                      }}
                      disabled={workflowSaving}
                    />
                  </label>
                </div>

                {/* Attendees list */}
                <div style={{ marginTop: "16px", padding: "14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <strong style={{ fontSize: "13px", display: "block", marginBottom: "8px", color: "var(--ink)" }}>
                    Invited Attendees & Coordinators ({scheduleForm.attendees.length}) *
                  </strong>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                    {scheduleForm.attendees.map((att, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: "12px",
                          padding: "4px 8px",
                          background: "var(--navy-subtle)",
                          color: "var(--navy)",
                          borderRadius: "4px",
                          border: "1px solid var(--navy-border)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px"
                        }}
                      >
                        {att}
                        {scheduleForm.attendees.length > 1 && (
                          <button
                            type="button"
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--navy)", padding: 0, fontWeight: "700" }}
                            onClick={() =>
                              setScheduleForm({
                                ...scheduleForm,
                                attendees: scheduleForm.attendees.filter((_, i) => i !== idx)
                              })
                            }
                            disabled={workflowSaving}
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: "6px" }}>
                    <input
                      type="text"
                      placeholder="Add attendee name & designation..."
                      value={newAttendee}
                      onChange={(e) => setNewAttendee(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (newAttendee.trim()) {
                            setScheduleForm({ ...scheduleForm, attendees: [...scheduleForm.attendees, newAttendee.trim()] });
                            setNewAttendee("");
                          }
                        }
                      }}
                      disabled={workflowSaving}
                      style={{ flex: 1, padding: "7px 10px", fontSize: "13px" }}
                    />
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={workflowSaving || !newAttendee.trim()}
                      onClick={() => {
                        if (newAttendee.trim()) {
                          setScheduleForm({
                            ...scheduleForm,
                            attendees: [...scheduleForm.attendees, newAttendee.trim()]
                          });
                          setNewAttendee("");
                        }
                      }}
                    >
                      Add Attendee
                    </button>
                  </div>
                </div>

                <div className="modal-actions" style={{ marginTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setWorkflowError("");
                      setWorkflowStep(1);
                    }}
                    disabled={workflowSaving}
                  >
                    ← Back to Plan
                  </button>
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={workflowSaving}
                    style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontWeight: "700" }}
                  >
                    {workflowSaving ? (
                      <>
                        <Clock size={16} className="spin" />
                        <span>Saving Schedule...</span>
                      </>
                    ) : (
                      <>
                        <span>Save Schedule & Proceed to MoM</span>
                        <ChevronRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: MINUTES OF MEETING (MoM) */}
            {workflowStep === 3 && (
              <form onSubmit={handleStep3MoMSave}>
                <div style={{ marginBottom: "16px", padding: "12px 14px", background: "var(--navy-subtle)", borderRadius: "8px", border: "1px solid var(--navy-border)" }}>
                  <strong style={{ display: "block", color: "var(--navy)", fontSize: "13px", marginBottom: "2px" }}>
                    Step 3: Minutes of Meeting (MoM) — {workflowMRM?.title || planForm.title}
                  </strong>
                  <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                    Record meeting proceedings, compliance findings, decisions, and action items with assignees and deadlines. Once saved, you will advance automatically to Step 4 (Review & Submit).
                  </span>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "13px", color: "var(--ink)" }}>
                    Executive Meeting Summary *
                  </label>
                  <textarea
                    required
                    rows={3}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    placeholder="Summarize the core quality findings, syllabus milestones, and strategic takeaways..."
                    value={momForm.summary}
                    onChange={(e) => {
                      setMomForm({ ...momForm, summary: e.target.value });
                      if (workflowError) setWorkflowError("");
                    }}
                    disabled={workflowSaving}
                  />
                </div>

                {/* Discussion Points */}
                <div style={{ marginBottom: "16px", padding: "14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <strong style={{ fontSize: "13px", color: "var(--ink)" }}>
                      Key Discussion Points ({momForm.discussionPoints.length}) *
                    </strong>
                    <button
                      type="button"
                      className="secondary-button"
                      style={{ fontSize: "11px", padding: "2px 8px" }}
                      onClick={() => setMomForm({ ...momForm, discussionPoints: [...momForm.discussionPoints, ""] })}
                      disabled={workflowSaving}
                    >
                      + Add Point
                    </button>
                  </div>
                  {momForm.discussionPoints.map((pt, idx) => (
                    <div key={idx} style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
                      <input
                        type="text"
                        style={{ flex: 1, padding: "6px 10px", fontSize: "13px" }}
                        placeholder={`Discussion point #${idx + 1}`}
                        value={pt}
                        onChange={(e) => {
                          const updated = [...momForm.discussionPoints];
                          updated[idx] = e.target.value;
                          setMomForm({ ...momForm, discussionPoints: updated });
                        }}
                        disabled={workflowSaving}
                      />
                      {momForm.discussionPoints.length > 1 && (
                        <button
                          type="button"
                          className="row-action"
                          style={{ color: "#ef4444" }}
                          onClick={() => {
                            const updated = momForm.discussionPoints.filter((_, i) => i !== idx);
                            setMomForm({ ...momForm, discussionPoints: updated });
                          }}
                          disabled={workflowSaving}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Decisions Taken */}
                <div style={{ marginBottom: "16px", padding: "14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <strong style={{ fontSize: "13px", color: "var(--ink)" }}>
                      Decisions Taken ({momForm.decisions.length}) *
                    </strong>
                    <button
                      type="button"
                      className="secondary-button"
                      style={{ fontSize: "11px", padding: "2px 8px" }}
                      onClick={() => setMomForm({ ...momForm, decisions: [...momForm.decisions, ""] })}
                      disabled={workflowSaving}
                    >
                      + Add Decision
                    </button>
                  </div>
                  {momForm.decisions.map((dec, idx) => (
                    <div key={idx} style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
                      <input
                        type="text"
                        style={{ flex: 1, padding: "6px 10px", fontSize: "13px" }}
                        placeholder={`Decision #${idx + 1}`}
                        value={dec}
                        onChange={(e) => {
                          const updated = [...momForm.decisions];
                          updated[idx] = e.target.value;
                          setMomForm({ ...momForm, decisions: updated });
                        }}
                        disabled={workflowSaving}
                      />
                      {momForm.decisions.length > 1 && (
                        <button
                          type="button"
                          className="row-action"
                          style={{ color: "#ef4444" }}
                          onClick={() => {
                            const updated = momForm.decisions.filter((_, i) => i !== idx);
                            setMomForm({ ...momForm, decisions: updated });
                          }}
                          disabled={workflowSaving}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Action Items */}
                <div style={{ marginBottom: "16px", padding: "14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <strong style={{ fontSize: "13px", color: "var(--ink)" }}>
                      Action Items & Responsible Coordinators ({momForm.actionItems.length}) *
                    </strong>
                    <button
                      type="button"
                      className="secondary-button"
                      style={{ fontSize: "11px", padding: "2px 8px" }}
                      onClick={() =>
                        setMomForm({
                          ...momForm,
                          actionItems: [
                            ...momForm.actionItems,
                            {
                              id: `ACT-0${momForm.actionItems.length + 1}`,
                              task: "",
                              assignee: "Priya Sharma (Course Coordinator)",
                              deadline: "",
                              status: "In Progress"
                            }
                          ]
                        })
                      }
                      disabled={workflowSaving}
                    >
                      + Add Action Item
                    </button>
                  </div>

                  {momForm.actionItems.map((act, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "10px",
                        marginBottom: "8px",
                        background: "#ffffff",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1"
                      }}
                    >
                      <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 30px", gap: "8px", alignItems: "center" }}>
                        <input
                          type="text"
                          placeholder="Task description *"
                          value={act.task}
                          style={{ padding: "6px 8px", fontSize: "12px" }}
                          onChange={(e) => {
                            const items = [...momForm.actionItems];
                            items[idx].task = e.target.value;
                            setMomForm({ ...momForm, actionItems: items });
                          }}
                          disabled={workflowSaving}
                        />
                        <input
                          type="text"
                          placeholder="Assignee (Coordinator) *"
                          value={act.assignee}
                          style={{ padding: "6px 8px", fontSize: "12px" }}
                          onChange={(e) => {
                            const items = [...momForm.actionItems];
                            items[idx].assignee = e.target.value;
                            setMomForm({ ...momForm, actionItems: items });
                          }}
                          disabled={workflowSaving}
                        />
                        <input
                          type="date"
                          value={act.deadline}
                          style={{ padding: "6px 8px", fontSize: "12px" }}
                          onChange={(e) => {
                            const items = [...momForm.actionItems];
                            items[idx].deadline = e.target.value;
                            setMomForm({ ...momForm, actionItems: items });
                          }}
                          disabled={workflowSaving}
                        />
                        {momForm.actionItems.length > 1 && (
                          <button
                            type="button"
                            style={{ border: "none", background: "none", color: "#ef4444", cursor: "pointer", fontWeight: "700" }}
                            onClick={() => {
                              const items = momForm.actionItems.filter((_, i) => i !== idx);
                              setMomForm({ ...momForm, actionItems: items });
                            }}
                            disabled={workflowSaving}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="modal-actions" style={{ marginTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setWorkflowError("");
                      setWorkflowStep(2);
                    }}
                    disabled={workflowSaving}
                  >
                    ← Back to Schedule
                  </button>
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={workflowSaving}
                    style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontWeight: "700" }}
                  >
                    {workflowSaving ? (
                      <>
                        <Clock size={16} className="spin" />
                        <span>Saving MoM...</span>
                      </>
                    ) : (
                      <>
                        <span>Save MoM & Proceed to Review</span>
                        <ChevronRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 4: REVIEW AND SUBMIT FOR APPROVAL */}
            {workflowStep === 4 && (
              <div>
                {workflowSubmittedSuccess ? (
                  <div style={{ textAlign: "center", padding: "30px 20px" }}>
                    <div
                      style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "50%",
                        background: "#dcfce7",
                        color: "#16a34a",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "16px"
                      }}
                    >
                      <CheckCircle2 size={36} />
                    </div>
                    <h3 style={{ margin: "0 0 8px 0", fontSize: "19px", color: "var(--navy)", fontWeight: "700" }}>
                      MRM Submitted for Executive Approval Successfully!
                    </h3>
                    <p style={{ margin: "0 auto 20px auto", maxWidth: "520px", fontSize: "13px", color: "var(--muted)", lineHeight: "1.5" }}>
                      The complete Management Review Meeting package (Plan, Schedule, and Minutes of Meeting) has been routed to Anita Rao (Trust Head) for formal sign-off. Once approved, you will be able to distribute it to all Course Coordinators.
                    </p>

                    <div style={{ maxWidth: "480px", margin: "0 auto 24px auto", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px", textAlign: "left", fontSize: "13px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ color: "#64748b" }}>Meeting ID:</span>
                        <strong style={{ color: "var(--navy)" }}>{workflowMRM?.id}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ color: "#64748b" }}>Current Status:</span>
                        <StatusBadge status="Submitted for Approval" />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ color: "#64748b" }}>Target Approver:</span>
                        <strong>Anita Rao (Trust Head)</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748b" }}>Submitted By:</span>
                        <span>{currentUser?.name || "Rahul Kumar"} (QMS Coordinator)</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => setWorkflowOpen(false)}
                      style={{ padding: "10px 24px", fontSize: "14px", fontWeight: "600" }}
                    >
                      Close Studio & Return to MRM Table
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ marginBottom: "16px", padding: "12px 14px", background: "var(--navy-subtle)", borderRadius: "8px", border: "1px solid var(--navy-border)" }}>
                      <strong style={{ display: "block", color: "var(--navy)", fontSize: "13px", marginBottom: "2px" }}>
                        Step 4: Review Summary & Submit for Executive Sign-off
                      </strong>
                      <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                        Please review the consolidated MRM details below. You can navigate back to any previous step to make corrections. When ready, click the button below to submit the complete dossier to Trust Head for formal sign-off.
                      </span>
                    </div>

                    {/* 1. PLAN SUMMARY CARD */}
                    <div className="mrm-summary-card">
                      <div className="mrm-summary-header">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#dcfce7", color: "#16a34a", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700" }}>
                            ✓
                          </span>
                          <strong style={{ fontSize: "14px", color: "var(--navy)" }}>1. Meeting Plan & Agenda</strong>
                        </div>
                        <button
                          type="button"
                          className="text-link"
                          style={{ fontSize: "12px", cursor: "pointer" }}
                          onClick={() => {
                            setWorkflowError("");
                            setWorkflowStep(1);
                          }}
                        >
                          Edit Plan
                        </button>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px", marginBottom: "10px" }}>
                        <div>
                          <span style={{ color: "#64748b", display: "block", fontSize: "11px" }}>Title:</span>
                          <strong>{workflowMRM?.title || planForm.title}</strong>
                        </div>
                        <div>
                          <span style={{ color: "#64748b", display: "block", fontSize: "11px" }}>Target Period:</span>
                          <strong>{workflowMRM?.targetMonth || planForm.targetMonth}</strong>
                        </div>
                        <div>
                          <span style={{ color: "#64748b", display: "block", fontSize: "11px" }}>Department:</span>
                          <strong>{workflowMRM?.department || planForm.department}</strong>
                        </div>
                        <div>
                          <span style={{ color: "#64748b", display: "block", fontSize: "11px" }}>Planned By:</span>
                          <span>{workflowMRM?.plannedBy || currentUser?.name || "QMS Coordinator"}</span>
                        </div>
                      </div>
                      {planForm.description && (
                        <p style={{ margin: "0 0 10px 0", fontSize: "12px", color: "#475569" }}>
                          <strong>Objective:</strong> {planForm.description}
                        </p>
                      )}
                      <div>
                        <span style={{ color: "#64748b", display: "block", fontSize: "11px", marginBottom: "4px" }}>
                          Agenda Topics ({(workflowMRM?.agenda || planForm.agenda)?.length || 0}):
                        </span>
                        <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "12px", color: "#334155" }}>
                          {(workflowMRM?.agenda || planForm.agenda || []).map((ag, i) => (
                            <li key={i}>{ag}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* 2. SCHEDULE SUMMARY CARD */}
                    <div className="mrm-summary-card">
                      <div className="mrm-summary-header">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#dcfce7", color: "#16a34a", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700" }}>
                            ✓
                          </span>
                          <strong style={{ fontSize: "14px", color: "var(--navy)" }}>2. Schedule & Attendance</strong>
                        </div>
                        <button
                          type="button"
                          className="text-link"
                          style={{ fontSize: "12px", cursor: "pointer" }}
                          onClick={() => {
                            setWorkflowError("");
                            setWorkflowStep(2);
                          }}
                        >
                          Edit Schedule
                        </button>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px", marginBottom: "10px" }}>
                        <div>
                          <span style={{ color: "#64748b", display: "block", fontSize: "11px" }}>Scheduled Date:</span>
                          <strong>{workflowMRM?.scheduledDate || scheduleForm.scheduledDate}</strong>
                        </div>
                        <div>
                          <span style={{ color: "#64748b", display: "block", fontSize: "11px" }}>Time:</span>
                          <strong>{workflowMRM?.scheduledTime || scheduleForm.scheduledTime}</strong>
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <span style={{ color: "#64748b", display: "block", fontSize: "11px" }}>Venue / Video Link:</span>
                          <strong>{workflowMRM?.venue || scheduleForm.venue}</strong>
                        </div>
                      </div>
                      <div>
                        <span style={{ color: "#64748b", display: "block", fontSize: "11px", marginBottom: "4px" }}>
                          Attendees ({(workflowMRM?.attendees || scheduleForm.attendees)?.length || 0}):
                        </span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                          {(workflowMRM?.attendees || scheduleForm.attendees || []).map((att, i) => (
                            <span
                              key={i}
                              style={{
                                fontSize: "11px",
                                padding: "3px 8px",
                                background: "#f1f5f9",
                                borderRadius: "4px",
                                color: "#334155"
                              }}
                            >
                              {att}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 3. MoM SUMMARY CARD */}
                    <div className="mrm-summary-card">
                      <div className="mrm-summary-header">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#dcfce7", color: "#16a34a", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700" }}>
                            ✓
                          </span>
                          <strong style={{ fontSize: "14px", color: "var(--navy)" }}>3. Minutes of Meeting (MoM)</strong>
                        </div>
                        <button
                          type="button"
                          className="text-link"
                          style={{ fontSize: "12px", cursor: "pointer" }}
                          onClick={() => {
                            setWorkflowError("");
                            setWorkflowStep(3);
                          }}
                        >
                          Edit MoM
                        </button>
                      </div>
                      <div style={{ marginBottom: "10px", fontSize: "13px" }}>
                        <span style={{ color: "#64748b", display: "block", fontSize: "11px" }}>Executive Summary:</span>
                        <p style={{ margin: "2px 0 0 0", color: "#334155", lineHeight: "1.4" }}>
                          {workflowMRM?.mom?.summary || momForm.summary}
                        </p>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px", fontSize: "12px" }}>
                        <div>
                          <span style={{ color: "#64748b", display: "block", fontSize: "11px", marginBottom: "2px" }}>
                            Discussions ({(workflowMRM?.mom?.discussionPoints || momForm.discussionPoints)?.length || 0}):
                          </span>
                          <ul style={{ margin: 0, paddingLeft: "18px", color: "#334155" }}>
                            {(workflowMRM?.mom?.discussionPoints || momForm.discussionPoints || []).map((dp, i) => (
                              <li key={i}>{dp}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span style={{ color: "#64748b", display: "block", fontSize: "11px", marginBottom: "2px" }}>
                            Decisions ({(workflowMRM?.mom?.decisions || momForm.decisions)?.length || 0}):
                          </span>
                          <ul style={{ margin: 0, paddingLeft: "18px", color: "#334155" }}>
                            {(workflowMRM?.mom?.decisions || momForm.decisions || []).map((dc, i) => (
                              <li key={i}>{dc}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div>
                        <span style={{ color: "#64748b", display: "block", fontSize: "11px", marginBottom: "4px" }}>
                          Action Items ({(workflowMRM?.mom?.actionItems || momForm.actionItems)?.length || 0}):
                        </span>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {(workflowMRM?.mom?.actionItems || momForm.actionItems || []).map((act, i) => (
                            <div
                              key={i}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                padding: "6px 10px",
                                background: "#f8fafc",
                                borderRadius: "4px",
                                border: "1px solid #e2e8f0",
                                fontSize: "12px"
                              }}
                            >
                              <span style={{ fontWeight: "600", color: "#0f172a" }}>{act.task}</span>
                              <span style={{ color: "#64748b" }}>
                                Assigned: <strong>{act.assignee}</strong> • Due: {act.deadline || "TBD"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* SUBMISSION ADVISORY */}
                    <div style={{ padding: "14px 16px", background: "var(--status-amber-bg)", border: "1px solid var(--status-amber-border)", borderRadius: "8px", marginBottom: "20px" }}>
                      <strong style={{ fontSize: "13px", color: "var(--status-amber)", display: "block", marginBottom: "3px" }}>
                        Ready for Executive Submission
                      </strong>
                      <span style={{ fontSize: "12px", color: "#92400e" }}>
                        All 3 stages (Plan, Schedule, MoM) have been fully completed and validated. Clicking the button below will route this record to Anita Rao (Trust Head) for formal sign-off.
                      </span>
                    </div>

                    <div className="modal-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => {
                          setWorkflowError("");
                          setWorkflowStep(3);
                        }}
                        disabled={workflowSaving}
                      >
                        ← Back to MoM
                      </button>
                      <button
                        type="button"
                        className="primary-button btn-amber"
                        onClick={handleStep4FinalSubmit}
                        disabled={workflowSaving}
                        style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontWeight: "700", padding: "10px 20px" }}
                      >
                        {workflowSaving ? (
                          <>
                            <Clock size={16} className="spin" />
                            <span>Submitting to Trust Head...</span>
                          </>
                        ) : (
                          <>
                            <Send size={16} />
                            <span>Submit for Trust Head Approval</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ==================== MODAL 5: REVISE & RESUBMIT ==================== */}
      {showReviseModal && selectedMRM && (
        <Modal
          title={`Revise MoM & Resubmit — ${selectedMRM.title} (v${selectedMRM.version || "1.0"})`}
          onClose={() => setShowReviseModal(false)}
        >
          <form onSubmit={handleResubmit}>
            <div style={{ padding: "12px", background: "#fee2e2", borderRadius: "8px", border: "1px solid #fca5a5", marginBottom: "14px" }}>
              <strong style={{ fontSize: "13px", color: "#991b1b", display: "block" }}>
                Trust Head Feedback / Requested Changes:
              </strong>
              <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#7f1d1d" }}>
                "{selectedMRM.trustHeadApproval?.remarks || "Revisions requested by Trust Head"}"
              </p>
            </div>

            <label style={{ display: "block", marginBottom: "12px" }}>
              Revision Notes *
              <textarea
                required
                rows={2}
                placeholder="Detail what adjustments were made to address the feedback..."
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                style={{ width: "100%", padding: "8px", fontSize: "13px", marginTop: "4px" }}
              />
            </label>

            <label style={{ display: "block", marginBottom: "12px" }}>
              Updated Executive Summary
              <textarea
                rows={3}
                value={momForm.summary}
                onChange={(e) => setMomForm({ ...momForm, summary: e.target.value })}
                style={{ width: "100%", padding: "8px", fontSize: "13px", marginTop: "4px" }}
              />
            </label>

            <div className="modal-actions" style={{ marginTop: "18px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowReviseModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary-button btn-purple"
                disabled={submitting}
              >
                <span>{submitting ? "Resubmitting..." : "Resubmit to Trust Head"}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ==================== MODAL 6: COMPREHENSIVE DETAIL VIEW ==================== */}
      {showDetailModal && selectedMRM && (
        <Modal
          title={`MRM Record: ${selectedMRM.title} (v${selectedMRM.version || "1.0"})`}
          onClose={() => setShowDetailModal(false)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Header info bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
                padding: "12px 14px",
                background: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0"
              }}
            >
              <div>
                <span style={{ fontSize: "12px", color: "#64748b" }}>Meeting ID:</span>{" "}
                <strong style={{ fontSize: "13px", color: "#0284c7" }}>{selectedMRM.id}</strong>
                <span style={{ margin: "0 8px", color: "#cbd5e1" }}>|</span>
                <span style={{ fontSize: "12px", color: "#64748b" }}>Version:</span>{" "}
                <strong>v{selectedMRM.version || "1.0"}</strong>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <StatusBadge status={selectedMRM.status} />
              </div>
            </div>

            {/* Tab navigation */}
            <div className="tabs" style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "4px" }}>
              <button
                className={detailTab === "details" ? "tab active" : "tab"}
                onClick={() => setDetailTab("details")}
              >
                Meeting Plan & Schedule
              </button>
              <button
                className={detailTab === "mom" ? "tab active" : "tab"}
                onClick={() => setDetailTab("mom")}
              >
                Minutes of Meeting ({selectedMRM.mom ? "Recorded" : "Draft"})
              </button>
              <button
                className={detailTab === "versions" ? "tab active" : "tab"}
                onClick={() => setDetailTab("versions")}
              >
                Version History ({(selectedMRM.versionHistory || []).length})
              </button>
              <button
                className={detailTab === "timeline" ? "tab active" : "tab"}
                onClick={() => setDetailTab("timeline")}
              >
                Audit Timeline ({(selectedMRM.timeline || []).length})
              </button>
              {selectedMRM.sharedWithAll && (
                <button
                  className={detailTab === "acknowledgements" ? "tab active" : "tab"}
                  onClick={() => setDetailTab("acknowledgements")}
                >
                  Acknowledgements ({(selectedMRM.acknowledgements || []).length})
                </button>
              )}
            </div>

            {/* TAB 1: DETAILS */}
            {detailTab === "details" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px" }}>
                  <div>
                    <span style={{ color: "#64748b", display: "block" }}>Scheduled Date & Time</span>
                    <strong>{selectedMRM.scheduledDate ? `${selectedMRM.scheduledDate} at ${selectedMRM.scheduledTime || "11:00 AM"}` : "Pending Scheduling (Stage 1)"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", display: "block" }}>Venue / Meeting Link</span>
                    <strong>{selectedMRM.venue || "TBD during scheduling"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", display: "block" }}>Planned By</span>
                    <strong>{selectedMRM.plannedBy} ({selectedMRM.plannedByRole || "QMS Coordinator"})</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", display: "block" }}>Department / Division</span>
                    <strong>{selectedMRM.department || "Academic Quality Division"}</strong>
                  </div>
                </div>

                {selectedMRM.description && (
                  <div>
                    <strong style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                      Meeting Purpose & Scope
                    </strong>
                    <p style={{ margin: 0, fontSize: "13px", color: "#334155", background: "#f8fafc", padding: "10px", borderRadius: "6px" }}>
                      {selectedMRM.description}
                    </p>
                  </div>
                )}

                <div>
                  <strong style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                    Quality Agenda Topics
                  </strong>
                  <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "#334155" }}>
                    {(selectedMRM.agenda || []).map((ag, i) => (
                      <li key={i} style={{ marginBottom: "4px" }}>{ag}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <strong style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                    Invited Participants
                  </strong>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {(selectedMRM.attendees || []).map((att, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: "12px",
                          padding: "3px 8px",
                          background: "#f1f5f9",
                          borderRadius: "4px",
                          border: "1px solid #e2e8f0",
                          color: "#334155"
                        }}
                      >
                        {att}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MoM */}
            {detailTab === "mom" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {selectedMRM.mom ? (
                  <div>
                    <div style={{ marginBottom: "12px" }}>
                      <strong style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                        Recorded Summary by {selectedMRM.mom.recordedBy} on {selectedMRM.mom.recordedDate}
                      </strong>
                      <p style={{ margin: 0, fontSize: "13px", color: "#1e293b", background: "#f8fafc", padding: "10px", borderRadius: "6px" }}>
                        {selectedMRM.mom.summary}
                      </p>
                    </div>

                    {selectedMRM.mom.discussionPoints?.length > 0 && (
                      <div style={{ marginBottom: "12px" }}>
                        <strong style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                          Discussion Points
                        </strong>
                        <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", color: "#334155" }}>
                          {selectedMRM.mom.discussionPoints.map((p, i) => (
                            <li key={i} style={{ marginBottom: "3px" }}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedMRM.mom.decisions?.length > 0 && (
                      <div style={{ marginBottom: "12px" }}>
                        <strong style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                          Decisions Taken
                        </strong>
                        <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", color: "#166534" }}>
                          {selectedMRM.mom.decisions.map((d, i) => (
                            <li key={i} style={{ marginBottom: "3px", fontWeight: "500" }}>{d}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedMRM.mom.actionItems?.length > 0 && (
                      <div>
                        <strong style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                          Action Items ({selectedMRM.mom.actionItems.length})
                        </strong>
                        <div className="table-wrap">
                          <table style={{ fontSize: "12px" }}>
                            <thead>
                              <tr>
                                <th>Action Item</th>
                                <th>Assignee</th>
                                <th>Deadline</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedMRM.mom.actionItems.map((act, i) => (
                                <tr key={i}>
                                  <td><strong>{act.task}</strong></td>
                                  <td>{act.assignee}</td>
                                  <td>{act.deadline || "TBD"}</td>
                                  <td><StatusBadge status={act.status || "Pending"} /></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: "24px", background: "#f8fafc", borderRadius: "8px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
                    Minutes of Meeting have not been recorded yet.
                    {isQMSCoordinator && selectedMRM.scheduledDate && (
                      <div style={{ marginTop: "10px" }}>
                        <button
                          type="button"
                          className="primary-button btn-teal"
                          onClick={() => {
                            setShowDetailModal(false);
                            openMoMModal(selectedMRM);
                          }}
                        >
                          <span>Record MoM Now (Stage 3)</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: VERSIONS */}
            {detailTab === "versions" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong>Current Version: v{selectedMRM.version || "1.0"}</strong>
                    <StatusBadge status={selectedMRM.status} />
                  </div>
                </div>

                {(selectedMRM.versionHistory || []).length > 0 ? (
                  <div>
                    {selectedMRM.versionHistory.map((ver, idx) => (
                      <div key={idx} style={{ padding: "12px", marginBottom: "8px", background: "#ffffff", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <strong style={{ color: "#0284c7" }}>Version v{ver.version}</strong>
                          <small style={{ color: "#64748b" }}>Archived: {ver.archivedAt}</small>
                        </div>
                        {ver.revisionNotes && (
                          <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: "#475569" }}>
                            <strong>Notes:</strong> {ver.revisionNotes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: "13px", color: "#64748b" }}>Initial version (v1.0). No previous revisions archived.</p>
                )}
              </div>
            )}

            {/* TAB 4: AUDIT TIMELINE */}
            {detailTab === "timeline" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {(selectedMRM.timeline || []).map((ev, idx) => (
                  <div key={idx} style={{ display: "flex", gap: "12px", padding: "10px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                    <div style={{ marginTop: "2px" }}>
                      <CheckCircle2 size={16} color="#0284c7" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong style={{ fontSize: "13px", color: "#0f172a" }}>{ev.action}</strong>
                        <small style={{ color: "#64748b" }}>{ev.timestamp}</small>
                      </div>
                      <small style={{ color: "#0284c7", display: "block" }}>
                        Actor: {ev.actor} • Version: v{ev.version || "1.0"}
                      </small>
                      {ev.details && (
                        <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#475569" }}>{ev.details}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 5: ACKNOWLEDGEMENTS */}
            {detailTab === "acknowledgements" && selectedMRM.sharedWithAll && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <p style={{ fontSize: "13px", color: "#166534", margin: 0 }}>
                  Distributed by <strong>{selectedMRM.sharedBy}</strong> on {selectedMRM.sharedAt}.
                </p>

                {(selectedMRM.acknowledgements || []).length > 0 ? (
                  <div className="table-wrap">
                    <table style={{ fontSize: "12px" }}>
                      <thead>
                        <tr>
                          <th>Coordinator Name</th>
                          <th>Role</th>
                          <th>Department</th>
                          <th>Acknowledged On</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedMRM.acknowledgements.map((ack, i) => (
                          <tr key={i}>
                            <td><strong>{ack.name}</strong></td>
                            <td>{ack.role}</td>
                            <td>{ack.department}</td>
                            <td>{ack.acknowledgedAt}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ fontSize: "13px", color: "#64748b" }}>
                    No Course Coordinators have acknowledged receipt yet.
                  </p>
                )}
              </div>
            )}

            {/* ACTION SECTION IN MODAL */}
            <div style={{ marginTop: "10px", borderTop: "1px solid #e2e8f0", paddingTop: "14px" }}>
              {/* Trust Head Evaluation Section */}
              {isTrustHead && (selectedMRM.status === "Submitted for Approval" || selectedMRM.status === "Pending Trust Head Approval") && (
                <div
                  style={{
                    padding: "16px",
                    background: "#f0fdf4",
                    borderRadius: "8px",
                    border: "1px solid #86efac",
                    marginBottom: "12px"
                  }}
                >
                  <strong style={{ fontSize: "14px", color: "#166534", display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                    <ShieldCheck size={18} />
                    Trust Head Executive Evaluation & Sign-off
                  </strong>

                  <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="reviewAction"
                        checked={reviewAction === "approve"}
                        onChange={() => setReviewAction("approve")}
                      />
                      <strong style={{ color: "#166534" }}>Approve MRM</strong>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="reviewAction"
                        checked={reviewAction === "changes"}
                        onChange={() => setReviewAction("changes")}
                      />
                      <strong style={{ color: "#d97706" }}>Request Corrections</strong>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="reviewAction"
                        checked={reviewAction === "reject"}
                        onChange={() => setReviewAction("reject")}
                      />
                      <strong style={{ color: "#dc2626" }}>Reject Submission</strong>
                    </label>
                  </div>

                  {reviewAction === "approve" && (
                    <div>
                      <input
                        type="text"
                        style={{ width: "100%", padding: "7px 10px", fontSize: "13px", marginBottom: "10px" }}
                        placeholder="Optional remarks (e.g. Approved without modifications. Clear for distribution.)..."
                        value={reviewRemarks}
                        onChange={(e) => setReviewRemarks(e.target.value)}
                      />
                      <button
                        type="button"
                        className="primary-button btn-green"
                        onClick={() => handleTrustHeadDecision(selectedMRM.id)}
                        disabled={submitting}
                      >
                        <span>{submitting ? "Signing..." : "Ratify & Approve MRM (Stage 5)"}</span>
                      </button>
                    </div>
                  )}

                  {reviewAction === "changes" && (
                    <div>
                      <textarea
                        required
                        rows={2}
                        style={{ width: "100%", padding: "7px 10px", fontSize: "13px", marginBottom: "10px" }}
                        placeholder="Specify comments and required corrections for the QMS Coordinator..."
                        value={reviewRemarks}
                        onChange={(e) => setReviewRemarks(e.target.value)}
                      />
                      <button
                        type="button"
                        className="primary-button btn-amber"
                        onClick={() => handleTrustHeadDecision(selectedMRM.id)}
                        disabled={submitting}
                      >
                        <span>{submitting ? "Submitting..." : "Send Revision Request"}</span>
                      </button>
                    </div>
                  )}

                  {reviewAction === "reject" && (
                    <div>
                      <textarea
                        required
                        rows={2}
                        style={{ width: "100%", padding: "7px 10px", fontSize: "13px", marginBottom: "10px" }}
                        placeholder="Mandatory reason for rejecting this MRM submission..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      />
                      <button
                        type="button"
                        className="primary-button btn-red"
                        onClick={() => handleTrustHeadDecision(selectedMRM.id)}
                        disabled={submitting}
                      >
                        <span>{submitting ? "Rejecting..." : "Confirm Rejection"}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* QMS Coordinator Sharing in Detail Modal (Only after approval) */}
              {isQMSCoordinator && (selectedMRM.status === "Approved" || selectedMRM.status === "Approved by Trust Head" || selectedMRM.trustHeadApproval?.approved) && !selectedMRM.sharedWithAll && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "#f0fdf4", borderRadius: "6px", border: "1px solid #86efac", marginBottom: "10px" }}>
                  <span style={{ fontSize: "13px", color: "#166534" }}>
                    <strong>Trust Head has approved this MRM!</strong> Ready for distribution to Course Coordinators.
                  </span>
                  <button
                    type="button"
                    className="primary-button btn-green"
                    onClick={() => handleShareMRM(selectedMRM.id)}
                    disabled={submitting}
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    <Share2 size={16} />
                    <span>Share with Course Coordinators (Stage 6)</span>
                  </button>
                </div>
              )}

              <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowDetailModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
