import { mrmData } from "../data/mrm.js";
import { notificationsData } from "../data/notifications.js";
import { activitiesData } from "../data/activities.js";
import { documentsData } from "../data/documents.js";
import { broadcastRealtimeEvent } from "../utils/realtime.js";

// Helper to notify all real-time listeners
const notifyMRMChange = (action, mrm) => {
  try {
    broadcastRealtimeEvent("MRM_UPDATED", { action, mrm });
  } catch (err) {
    console.error("Real-time MRM broadcast error:", err);
  }
};

// Helper to format timestamps
const formatNow = () =>
  new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

// GET /api/mrm - List all MRM meetings
export const getAllMRMs = (req, res) => {
  try {
    const { status, shared } = req.query;
    let list = [...mrmData];

    if (status) {
      list = list.filter((m) => m.status.toLowerCase() === status.toLowerCase());
    }

    if (shared !== undefined) {
      const isShared = shared === "true";
      list = list.filter((m) => m.sharedWithAll === isShared);
    }

    res.json({
      success: true,
      count: list.length,
      data: list
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/mrm/:id - Get single MRM
export const getMRMById = (req, res) => {
  try {
    const mrm = mrmData.find((m) => m.id === req.params.id);
    if (!mrm) {
      return res.status(404).json({ success: false, message: "Management Review Meeting not found" });
    }
    res.json({ success: true, data: mrm });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/mrm - QMS Coordinator plans MRM (or plans & schedules if date provided)
export const createMRM = (req, res) => {
  try {
    // Role check: Only QMS Coordinator can plan Management Review Meetings
    if (req.user?.role !== "qm") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Only the QMS Coordinator is authorized to plan Management Review Meetings."
      });
    }

    const { title, description, targetMonth, scheduledDate, scheduledTime, venue, agenda, attendees, department } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Meeting title is required" });
    }

    const plannerName = req.user?.name || "Rahul Kumar";
    const plannerRole = req.user?.roleTitle || "QMS Coordinator";
    const isScheduled = !!scheduledDate;

    const newMRM = {
      id: `MRM-${new Date().getFullYear()}-${String(mrmData.length + 1).padStart(3, "0")}`,
      title: title.trim(),
      description: (description || "").trim(),
      version: "1.0",
      versionHistory: [],
      status: isScheduled ? "Scheduled" : "Planned",
      targetMonth: targetMonth || "Current Quarter",
      scheduledDate: scheduledDate || null,
      scheduledTime: scheduledTime || (isScheduled ? "10:00 AM" : null),
      venue: venue || (isScheduled ? "Conference Room / Virtual" : null),
      plannedBy: plannerName,
      plannedByRole: plannerRole,
      department: department || req.user?.department || "Quality Assurance & Compliance",
      agenda: Array.isArray(agenda) && agenda.length ? agenda : [
        "Review of previous action items & closure status",
        "Process performance & course delivery review",
        "Student & stakeholder feedback",
        "Resource requirements & continual improvement"
      ],
      attendees: Array.isArray(attendees) && attendees.length ? attendees : [
        `${plannerName} (${plannerRole})`,
        "Anita Rao (Trust Head)",
        "Priya Sharma (Course Coordinator)",
        "Dr. Rajesh Verma (Course Coordinator)"
      ],
      mom: null,
      submittedForApprovalAt: null,
      trustHeadApproval: null,
      sharedWithAll: false,
      sharedAt: null,
      sharedBy: null,
      sharedVersion: null,
      recipients: ["All Course Coordinators"],
      acknowledgements: [],
      timeline: [
        {
          action: isScheduled ? "Meeting Planned & Scheduled" : "Meeting Planned",
          actor: `${plannerName} (${plannerRole})`,
          timestamp: formatNow(),
          version: "1.0",
          details: isScheduled
            ? `Scheduled for ${scheduledDate} at ${scheduledTime || "10:00 AM"}`
            : `Meeting plan created for ${targetMonth || "upcoming review window"}`
        }
      ]
    };

    mrmData.unshift(newMRM);

    // Notifications & Activities
    notificationsData.unshift({
      id: Date.now(),
      title: isScheduled ? "New MRM Scheduled" : "New MRM Planned",
      text: `${plannerName} ${isScheduled ? `scheduled "${newMRM.title}" for ${newMRM.scheduledDate}` : `planned "${newMRM.title}"`}.`,
      time: "Just now",
      targetRole: "all",
      read: false,
      createdAt: new Date().toISOString()
    });

    activitiesData.unshift({
      id: `ACT-${Date.now()}`,
      text: `QMS Coordinator planned Management Review Meeting: ${newMRM.title}`,
      actor: plannerName,
      time: "Just now",
      tone: "blue",
      timestamp: new Date().toISOString()
    });

    notifyMRMChange("PLANNED", newMRM);
    res.status(201).json({ success: true, data: newMRM });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/mrm/:id/schedule - QMS Coordinator schedules a planned meeting
export const scheduleMRM = (req, res) => {
  try {
    if (req.user?.role !== "qm") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Only the QMS Coordinator is authorized to schedule Management Review Meetings."
      });
    }

    const mrm = mrmData.find((m) => m.id === req.params.id);
    if (!mrm) {
      return res.status(404).json({ success: false, message: "Management Review Meeting not found" });
    }

    const { scheduledDate, scheduledTime, venue, attendees, agenda } = req.body;
    if (!scheduledDate) {
      return res.status(400).json({ success: false, message: "Scheduled date is required to schedule the meeting" });
    }

    const schedulerName = req.user?.name || "Rahul Kumar";
    const schedulerRole = req.user?.roleTitle || "QMS Coordinator";

    mrm.scheduledDate = scheduledDate;
    mrm.scheduledTime = scheduledTime || mrm.scheduledTime || "10:00 AM";
    mrm.venue = venue || mrm.venue || "Main Boardroom / Virtual Meet";
    if (Array.isArray(attendees) && attendees.length) {
      mrm.attendees = attendees;
    }
    if (Array.isArray(agenda) && agenda.length) {
      mrm.agenda = agenda;
    }
    mrm.status = "Scheduled";

    mrm.timeline.push({
      action: "Meeting Scheduled",
      actor: `${schedulerName} (${schedulerRole})`,
      timestamp: formatNow(),
      version: mrm.version || "1.0",
      details: `Scheduled for ${scheduledDate} at ${mrm.scheduledTime} at ${mrm.venue}`
    });

    notificationsData.unshift({
      id: Date.now(),
      title: "MRM Scheduled",
      text: `${schedulerName} scheduled "${mrm.title}" for ${scheduledDate} at ${mrm.scheduledTime}.`,
      time: "Just now",
      targetRole: "all",
      read: false,
      createdAt: new Date().toISOString()
    });

    activitiesData.unshift({
      id: `ACT-${Date.now()}`,
      text: `QMS Coordinator scheduled MRM: ${mrm.title} for ${scheduledDate}`,
      actor: schedulerName,
      time: "Just now",
      tone: "blue",
      timestamp: new Date().toISOString()
    });

    notifyMRMChange("SCHEDULED", mrm);
    res.json({ success: true, message: "Meeting scheduled successfully", data: mrm });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/mrm/:id - Update meeting schedule or details
export const updateMRM = (req, res) => {
  try {
    const index = mrmData.findIndex((m) => m.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: "Management Review Meeting not found" });
    }

    const existing = mrmData[index];
    const updated = {
      ...existing,
      ...req.body,
      id: existing.id // protect ID
    };

    mrmData[index] = updated;
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/mrm/:id/mom - QMS Coordinator records Minutes of Meeting (MoM)
export const saveMoM = (req, res) => {
  try {
    const mrm = mrmData.find((m) => m.id === req.params.id);
    if (!mrm) {
      return res.status(404).json({ success: false, message: "Management Review Meeting not found" });
    }

    if (req.user?.role !== "qm" && req.user?.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Only QMS Coordinator is authorized to record Minutes of Meeting."
      });
    }

    const { summary, discussionPoints, actionItems, decisions } = req.body;
    if (!summary || !summary.trim()) {
      return res.status(400).json({ success: false, message: "MoM Executive Summary is required." });
    }

    const authorName = req.user?.name || "Rahul Kumar";
    const authorRole = req.user?.roleTitle || "QMS Coordinator";

    mrm.mom = {
      recordedBy: authorName,
      recordedRole: authorRole,
      recordedDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      summary: summary.trim(),
      discussionPoints: Array.isArray(discussionPoints) ? discussionPoints.filter(p => p && p.trim()) : [],
      actionItems: Array.isArray(actionItems) ? actionItems : [],
      decisions: Array.isArray(decisions) ? decisions.filter(d => d && d.trim()) : []
    };

    mrm.status = "MoM Recorded";

    mrm.timeline.push({
      action: "Minutes of Meeting Recorded",
      actor: `${authorName} (${authorRole})`,
      timestamp: formatNow(),
      version: mrm.version || "1.0",
      details: `MoM recorded with ${mrm.mom.actionItems.length} action items and ${mrm.mom.decisions.length} decisions.`
    });

    activitiesData.unshift({
      id: `ACT-${Date.now()}`,
      text: `Minutes of Meeting recorded for "${mrm.title}" by ${authorName}`,
      actor: authorName,
      time: "Just now",
      tone: "blue",
      timestamp: new Date().toISOString()
    });

    notifyMRMChange("MOM_SAVED", mrm);
    res.json({ success: true, message: "MoM recorded successfully. Ready for approval submission.", data: mrm });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/mrm/:id/submit-approval - QMS Coordinator sends planned & scheduled MRM to Trust Team for approval
export const submitForApproval = (req, res) => {
  try {
    const mrm = mrmData.find((m) => m.id === req.params.id);
    if (!mrm) {
      return res.status(404).json({ success: false, message: "Management Review Meeting not found" });
    }

    if (req.user?.role !== "qm") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Only the QMS Coordinator is authorized to submit MRMs for Trust Team approval."
      });
    }

    if (!mrm.scheduledDate) {
      return res.status(400).json({
        success: false,
        message: "Meeting must be planned and scheduled (specify Date, Time & Venue) before submitting for Trust Team approval."
      });
    }

    mrm.status = "Submitted for Approval";
    mrm.submittedForApprovalAt = formatNow();

    const sender = req.user?.name || "Rahul Kumar";
    const senderRole = req.user?.roleTitle || "QMS Coordinator";

    mrm.timeline.push({
      action: "Submitted for Trust Team Approval",
      actor: `${sender} (${senderRole})`,
      timestamp: mrm.submittedForApprovalAt,
      version: mrm.version || "1.0",
      details: `Meeting plan & schedule for ${mrm.scheduledDate} at ${mrm.scheduledTime || "11:00 AM"} (${mrm.venue || "Boardroom"}) submitted for Trust Team approval.`
    });

    // Notify Trust Team
    notificationsData.unshift({
      id: Date.now(),
      title: "MRM Schedule Submitted for Approval",
      text: `${sender} submitted proposed meeting "${mrm.title}" (${mrm.scheduledDate}) for Trust Team approval.`,
      time: "Just now",
      targetRole: "Head",
      read: false,
      createdAt: new Date().toISOString()
    });

    activitiesData.unshift({
      id: `ACT-${Date.now()}`,
      text: `Meeting schedule "${mrm.title}" submitted to Trust Team for approval`,
      actor: sender,
      time: "Just now",
      tone: "amber",
      timestamp: new Date().toISOString()
    });

    notifyMRMChange("SUBMITTED_FOR_APPROVAL", mrm);
    res.json({ success: true, message: "Meeting plan and schedule submitted to Trust Team for approval", data: mrm });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/mrm/:id/approve - Trust Team approves meeting plan and schedule
export const approveMRM = (req, res) => {
  try {
    const mrm = mrmData.find((m) => m.id === req.params.id);
    if (!mrm) {
      return res.status(404).json({ success: false, message: "Management Review Meeting not found" });
    }

    // Role check: Only Trust Team can approve
    if (req.user?.role !== "Head") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Only the Trust Team is authorized to approve MRM schedules."
      });
    }

    const { remarks = "" } = req.body;
    const trustHeadName = req.user?.name || "Anita Rao";

    mrm.status = "Approved";
    mrm.trustHeadApproval = {
      decision: "Approved",
      approved: true,
      approvedBy: trustHeadName,
      approvedAt: formatNow(),
      remarks: remarks || "Meeting plan & schedule approved by Trust Team. Clear to share with all Course Coordinators, QMS Coordinator, and Trust Head via email.",
      versionReviewed: mrm.version || "1.0"
    };

    mrm.timeline.push({
      action: "Approved by Trust Team",
      actor: `${trustHeadName} (Trust Team)`,
      timestamp: mrm.trustHeadApproval.approvedAt,
      version: mrm.version || "1.0",
      details: mrm.trustHeadApproval.remarks
    });

    // Notify QMS Coordinator that it can now be shared via email
    notificationsData.unshift({
      id: Date.now(),
      title: "MRM Schedule Approved by Trust Team",
      text: `"${mrm.title}" schedule was approved by Trust Team. QMS Coordinator can now dispatch the meeting notice via email to all Course Coordinators, QMS Coordinator, and Trust Head.`,
      time: "Just now",
      targetRole: "qm",
      read: false,
      createdAt: new Date().toISOString()
    });

    activitiesData.unshift({
      id: `ACT-${Date.now()}`,
      text: `Trust Team (${trustHeadName}) approved MRM schedule: "${mrm.title}"`,
      actor: trustHeadName,
      time: "Just now",
      tone: "green",
      timestamp: new Date().toISOString()
    });

    notifyMRMChange("APPROVED", mrm);
    res.json({
      success: true,
      message: "MRM plan and schedule approved by Trust Team. Ready for email dispatch to all Course Coordinators, QMS Coordinator, and Trust Head.",
      data: mrm
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/mrm/:id/request-changes - Trust Head requests corrections
export const requestChangesMRM = (req, res) => {
  try {
    const mrm = mrmData.find((m) => m.id === req.params.id);
    if (!mrm) {
      return res.status(404).json({ success: false, message: "Management Review Meeting not found" });
    }

    // Role check: Only Trust Head can request corrections
    if (req.user?.role !== "Head") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Only the Trust Head is authorized to review or request corrections for MRMs."
      });
    }

    const { remarks, comments } = req.body;
    const correctionComments = remarks || comments;
    if (!correctionComments || !correctionComments.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comments are required when requesting corrections."
      });
    }

    const trustHeadName = req.user?.name || "Anita Rao";

    mrm.status = "Changes Requested";
    mrm.trustHeadApproval = {
      decision: "Changes Requested",
      approved: false,
      approvedBy: trustHeadName,
      approvedAt: formatNow(),
      remarks: correctionComments.trim(),
      versionReviewed: mrm.version || "1.0"
    };

    mrm.timeline.push({
      action: "Corrections Requested by Trust Head",
      actor: `${trustHeadName} (Trust Head)`,
      timestamp: mrm.trustHeadApproval.approvedAt,
      version: mrm.version || "1.0",
      details: correctionComments.trim()
    });

    notificationsData.unshift({
      id: Date.now(),
      title: "MRM Revisions Requested",
      text: `Trust Head requested corrections on "${mrm.title}": ${correctionComments.trim()}`,
      time: "Just now",
      targetRole: "owner",
      read: false,
      createdAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: "Corrections requested. Returned to Course Coordinator for revisions.",
      data: mrm
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/mrm/:id/reject - Trust Head rejects submission with mandatory reason
export const rejectMRM = (req, res) => {
  try {
    const mrm = mrmData.find((m) => m.id === req.params.id);
    if (!mrm) {
      return res.status(404).json({ success: false, message: "Management Review Meeting not found" });
    }

    if (req.user?.role !== "Head") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Only the Trust Head can reject an MRM submission."
      });
    }

    const { reason, remarks } = req.body;
    const mandatoryReason = reason || remarks;

    if (!mandatoryReason || !mandatoryReason.trim()) {
      return res.status(400).json({
        success: false,
        message: "A mandatory rejection reason is required."
      });
    }

    const trustHeadName = req.user?.name || "Anita Rao";

    mrm.status = "Rejected";
    mrm.trustHeadApproval = {
      decision: "Rejected",
      approved: false,
      rejected: true,
      approvedBy: trustHeadName,
      approvedAt: formatNow(),
      remarks: mandatoryReason.trim(),
      versionReviewed: mrm.version || "1.0"
    };

    mrm.timeline.push({
      action: "Rejected by Trust Head",
      actor: `${trustHeadName} (Trust Head)`,
      timestamp: mrm.trustHeadApproval.approvedAt,
      version: mrm.version || "1.0",
      details: `Rejected: ${mandatoryReason.trim()}`
    });

    notificationsData.unshift({
      id: Date.now(),
      title: "MRM Submission Rejected",
      text: `Trust Head rejected "${mrm.title}". Reason: ${mandatoryReason.trim()}`,
      time: "Just now",
      targetRole: "owner",
      read: false,
      createdAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: "MRM submission rejected with reason recorded.",
      data: mrm
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/mrm/:id/resubmit - Course Coordinator revises and resubmits MRM
export const resubmitMRM = (req, res) => {
  try {
    const mrm = mrmData.find((m) => m.id === req.params.id);
    if (!mrm) {
      return res.status(404).json({ success: false, message: "Management Review Meeting not found" });
    }

    const authorName = req.user?.name || "Course Coordinator";
    const { mom, revisionNotes } = req.body;

    // Archive current snapshot into versionHistory
    if (!Array.isArray(mrm.versionHistory)) {
      mrm.versionHistory = [];
    }

    mrm.versionHistory.push({
      version: mrm.version || "1.0",
      mom: JSON.parse(JSON.stringify(mrm.mom || {})),
      trustHeadApproval: mrm.trustHeadApproval,
      submittedAt: mrm.submittedForApprovalAt,
      archivedAt: formatNow(),
      revisionNotes: revisionNotes || "Revisions addressing Trust Head comments"
    });

    // Increment version (e.g. 1.0 -> 1.1)
    const currentVersionNum = parseFloat(mrm.version || "1.0");
    const nextVersion = (currentVersionNum + 0.1).toFixed(1);
    mrm.version = nextVersion;

    if (mom) {
      mrm.mom = {
        ...mrm.mom,
        ...mom,
        recordedBy: authorName,
        recordedDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      };
    }

    // Reset approval state: must go through approval again!
    mrm.status = "Submitted for Approval";
    mrm.submittedForApprovalAt = formatNow();
    mrm.trustHeadApproval = null;

    mrm.timeline.push({
      action: `Revised & Resubmitted (v${mrm.version})`,
      actor: `${authorName} (${req.user?.roleTitle || "Course Coordinator"})`,
      timestamp: mrm.submittedForApprovalAt,
      version: mrm.version,
      details: revisionNotes || "Addressed requested changes and resubmitted for Trust Head approval."
    });

    notificationsData.unshift({
      id: Date.now(),
      title: "Revised MRM Resubmitted",
      text: `${authorName} revised and resubmitted "${mrm.title}" (v${mrm.version}) for Trust Head approval.`,
      time: "Just now",
      targetRole: "Head",
      read: false,
      createdAt: new Date().toISOString()
    });

    notifyMRMChange("RESUBMITTED", mrm);
    res.json({
      success: true,
      message: `MRM v${mrm.version} resubmitted for Trust Head review.`,
      data: mrm
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/mrm/:id/share - QMS Coordinator shares approved MRM via email to all Course Coordinators, QMS Coordinator, and Trust Head
export const shareMRM = (req, res) => {
  try {
    const mrm = mrmData.find((m) => m.id === req.params.id);
    if (!mrm) {
      return res.status(404).json({ success: false, message: "Management Review Meeting not found" });
    }

    // Role check: Only QMS Coordinator can share
    if (req.user?.role !== "qm") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Only the QMS Coordinator is authorized to dispatch MRM meeting notices via email."
      });
    }

    // Strict Workflow rule: MUST be approved by Trust Team first!
    const isApproved = mrm.status === "Approved" || mrm.status === "Approved by Trust Head" || mrm.trustHeadApproval?.approved;
    if (!isApproved) {
      return res.status(403).json({
        success: false,
        message: "Workflow constraint: Trust Team approval is required before sharing the meeting notice via email."
      });
    }

    const coordinatorName = req.user?.name || "Rahul Kumar";

    mrm.status = "Notice Emailed";
    mrm.sharedWithAll = true;
    mrm.emailNoticeSent = true;
    mrm.sharedAt = formatNow();
    mrm.sharedBy = coordinatorName;
    mrm.sharedVersion = mrm.version || "1.0";
    mrm.emailRecipients = [
      "All Course Coordinators (coordinator@cdac.in, rajesh.verma@cdac.in, sunita.patil@cdac.in)",
      "QMS Coordinator (qm@cdac.in)",
      "Trust Head (head@cdac.in)"
    ];

    if (!Array.isArray(mrm.acknowledgements)) {
      mrm.acknowledgements = [];
    }

    mrm.timeline.push({
      action: "Meeting Notice Emailed",
      actor: `${coordinatorName} (QMS Coordinator)`,
      timestamp: mrm.sharedAt,
      version: mrm.sharedVersion,
      details: `Meeting invitation and schedule dispatched via email to all Course Coordinators, QMS Coordinator, and Trust Head for meeting on ${mrm.scheduledDate} at ${mrm.scheduledTime || "11:00 AM"}.`
    });

    // Broadcast notification to all recipients
    notificationsData.unshift({
      id: Date.now(),
      title: "MRM Invitation Emailed to Coordinators & Trust Head",
      text: `Approved meeting notice for "${mrm.title}" (${mrm.scheduledDate}) sent via email to All Course Coordinators, QMS Coordinator, and Trust Head.`,
      time: "Just now",
      targetRole: "all",
      read: false,
      createdAt: new Date().toISOString()
    });

    activitiesData.unshift({
      id: `ACT-${Date.now()}`,
      text: `QMS Coordinator (${coordinatorName}) emailed MRM schedule for "${mrm.title}" to All Course Coordinators, QMS Coordinator, and Trust Head`,
      actor: coordinatorName,
      time: "Just now",
      tone: "green",
      timestamp: new Date().toISOString()
    });

    notifyMRMChange("SHARED_WITH_ALL", mrm);
    res.json({
      success: true,
      message: "Meeting notice successfully dispatched via email to all Course Coordinators, QMS Coordinator, and Trust Head!",
      data: mrm
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/mrm/:id/upload-mom - Once meeting is done, QMS coordinator shares MoM in document (upload document)
export const uploadMoMDocument = (req, res) => {
  try {
    const mrm = mrmData.find((m) => m.id === req.params.id);
    if (!mrm) {
      return res.status(404).json({ success: false, message: "Management Review Meeting not found" });
    }

    if (req.user?.role !== "qm") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Only the QMS Coordinator is authorized to upload and share Minutes of Meeting documents."
      });
    }

    const {
      summary,
      discussionPoints,
      actionItems,
      decisions,
      documentName,
      documentType = "Forms",
      fileName,
      fileSize = "1.4 MB",
      documentDescription
    } = req.body;

    const authorName = req.user?.name || "Rahul Kumar";
    const authorRole = req.user?.roleTitle || "QMS Coordinator";

    // Create and register the controlled document in QMS Document Library
    const docId = `DOC-MOM-${new Date().getFullYear()}-${String(documentsData.length + 1).padStart(3, "0")}`;
    const registeredDoc = {
      id: docId,
      name: (documentName || `Minutes of Meeting - ${mrm.title}`).trim(),
      type: documentType || "Forms",
      process: "Quality Management",
      owner: authorName,
      version: "1.0",
      updated: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      updatedBy: authorName,
      status: "Approved",
      submittedBy: authorName,
      description: documentDescription || `Official Minutes of Management Review Meeting held on ${mrm.scheduledDate || "recent schedule"}. Summary: ${summary || mrm.title}`,
      fileName: fileName || `${mrm.id}_Minutes_of_Meeting.pdf`,
      fileSize: fileSize || "1.4 MB",
      versions: [
        {
          version: "1.0",
          date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
          author: authorName,
          status: "Current",
          notes: `Official MoM for MRM ${mrm.id} uploaded by QMS Coordinator`
        }
      ]
    };

    // Register into documents database
    documentsData.unshift(registeredDoc);

    // Attach MoM details and document reference onto MRM
    mrm.mom = {
      recordedBy: authorName,
      recordedRole: authorRole,
      recordedDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      summary: summary || `Meeting successfully conducted on ${mrm.scheduledDate}. MoM document registered in Document Library.`,
      discussionPoints: Array.isArray(discussionPoints) && discussionPoints.length ? discussionPoints.filter(p => p && p.trim()) : [
        "Curriculum delivery review and faculty feedback evaluated.",
        "Infrastructure and compute server allocations reviewed."
      ],
      actionItems: Array.isArray(actionItems) ? actionItems : [],
      decisions: Array.isArray(decisions) && decisions.length ? decisions.filter(d => d && d.trim()) : [
        "Approved curriculum updates and resource allocations."
      ]
    };

    mrm.momDocument = {
      documentId: registeredDoc.id,
      documentName: registeredDoc.name,
      fileName: registeredDoc.fileName,
      fileSize: registeredDoc.fileSize,
      uploadedBy: authorName,
      uploadedAt: formatNow(),
      documentUrl: `/documents/${registeredDoc.id}`
    };

    mrm.status = "MoM Document Uploaded";
    mrm.meetingDone = true;

    mrm.timeline.push({
      action: "MoM Document Uploaded & Published",
      actor: `${authorName} (${authorRole})`,
      timestamp: formatNow(),
      version: mrm.version || "1.0",
      details: `Meeting completed. Minutes of Meeting document "${registeredDoc.name}" (${registeredDoc.id}) registered in Document Library and shared.`
    });

    notificationsData.unshift({
      id: Date.now(),
      title: "MRM MoM Document Uploaded & Published",
      text: `QMS Coordinator uploaded the Minutes of Meeting document for "${mrm.title}". Accessible in Document Library (${registeredDoc.id}).`,
      time: "Just now",
      targetRole: "all",
      read: false,
      createdAt: new Date().toISOString()
    });

    activitiesData.unshift({
      id: `ACT-${Date.now()}`,
      text: `QMS Coordinator uploaded MoM document "${registeredDoc.name}" for ${mrm.title}`,
      actor: authorName,
      time: "Just now",
      tone: "green",
      timestamp: new Date().toISOString()
    });

    notifyMRMChange("MOM_DOCUMENT_UPLOADED", mrm);
    res.json({
      success: true,
      message: "Minutes of Meeting document uploaded and published in QMS Document Library successfully!",
      data: mrm,
      document: registeredDoc
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/mrm/:id/acknowledge - Course Coordinator acknowledges receiving shared MRM
export const acknowledgeMRM = (req, res) => {
  try {
    const mrm = mrmData.find((m) => m.id === req.params.id);
    if (!mrm) {
      return res.status(404).json({ success: false, message: "Management Review Meeting not found" });
    }

    if (!mrm.sharedWithAll && mrm.status !== "Shared") {
      return res.status(400).json({
        success: false,
        message: "Cannot acknowledge an MRM that has not yet been shared."
      });
    }

    const userId = req.user?.id || req.user?.employeeId || "CC-208";
    const userName = req.user?.name || "Course Coordinator";

    if (!Array.isArray(mrm.acknowledgements)) {
      mrm.acknowledgements = [];
    }

    const existingAck = mrm.acknowledgements.find((a) => a.userId === userId || a.name === userName);
    if (existingAck) {
      return res.json({
        success: true,
        message: "You have already acknowledged receipt of this MRM.",
        data: mrm
      });
    }

    const newAck = {
      userId,
      name: userName,
      role: req.user?.roleTitle || "Course Coordinator",
      department: req.user?.department || "Academic Division",
      acknowledgedAt: formatNow()
    };

    mrm.acknowledgements.push(newAck);

    mrm.timeline.push({
      action: "Receipt Acknowledged",
      actor: `${userName} (Course Coordinator)`,
      timestamp: newAck.acknowledgedAt,
      version: mrm.sharedVersion || mrm.version || "1.0",
      details: `${userName} acknowledged receipt and review of the distributed MRM.`
    });

    res.json({
      success: true,
      message: "MRM receipt acknowledged successfully.",
      data: mrm
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/mrm/:id/archive - Archive meeting
export const archiveMRM = (req, res) => {
  try {
    const mrm = mrmData.find((m) => m.id === req.params.id);
    if (!mrm) {
      return res.status(404).json({ success: false, message: "Management Review Meeting not found" });
    }

    mrm.status = "Archived";
    mrm.timeline.push({
      action: "Meeting Archived",
      actor: `${req.user?.name || "Administrator"}`,
      timestamp: formatNow(),
      version: mrm.version || "1.0",
      details: "Archived to historical records."
    });

    res.json({ success: true, message: "MRM archived successfully", data: mrm });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/mrm/:id - Delete meeting
export const deleteMRM = (req, res) => {
  try {
    const idx = mrmData.findIndex((m) => m.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: "Management Review Meeting not found" });
    }
    mrmData.splice(idx, 1);
    res.json({ success: true, message: "MRM deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
