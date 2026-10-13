import { mrmData } from "../data/mrm.js";
import { notificationsData } from "../data/notifications.js";
import { activitiesData } from "../data/activities.js";
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

// POST /api/mrm/:id/submit-approval - QMS Coordinator sends MRM to Trust Head for approval
export const submitForApproval = (req, res) => {
  try {
    const mrm = mrmData.find((m) => m.id === req.params.id);
    if (!mrm) {
      return res.status(404).json({ success: false, message: "Management Review Meeting not found" });
    }

    if (req.user?.role !== "qm") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Only the QMS Coordinator is authorized to submit MRMs for Trust Head approval."
      });
    }

    if (!mrm.scheduledDate) {
      return res.status(400).json({
        success: false,
        message: "Meeting must be scheduled before submitting for approval."
      });
    }

    if (!mrm.mom || !mrm.mom.summary) {
      return res.status(400).json({
        success: false,
        message: "Please record the Minutes of Meeting (MoM) before submitting for Trust Head approval."
      });
    }

    mrm.status = "Submitted for Approval";
    mrm.submittedForApprovalAt = formatNow();

    const sender = req.user?.name || "Rahul Kumar";
    const senderRole = req.user?.roleTitle || "QMS Coordinator";

    mrm.timeline.push({
      action: "Submitted for Trust Head Approval",
      actor: `${sender} (${senderRole})`,
      timestamp: mrm.submittedForApprovalAt,
      version: mrm.version || "1.0",
      details: `Complete MRM package (Plan, Schedule, MoM with ${mrm.mom.actionItems?.length || 0} action items) submitted for executive approval.`
    });

    // Notify Trust Head
    notificationsData.unshift({
      id: Date.now(),
      title: "MRM Submitted for Approval",
      text: `${sender} submitted "${mrm.title}" MoM (v${mrm.version || "1.0"}) for your formal approval.`,
      time: "Just now",
      targetRole: "Head",
      read: false,
      createdAt: new Date().toISOString()
    });

    activitiesData.unshift({
      id: `ACT-${Date.now()}`,
      text: `MRM MoM "${mrm.title}" submitted to Trust Head for approval`,
      actor: sender,
      time: "Just now",
      tone: "amber",
      timestamp: new Date().toISOString()
    });

    notifyMRMChange("SUBMITTED_FOR_APPROVAL", mrm);
    res.json({ success: true, message: "Submitted to Trust Head for approval", data: mrm });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/mrm/:id/approve - Trust Head approves
export const approveMRM = (req, res) => {
  try {
    const mrm = mrmData.find((m) => m.id === req.params.id);
    if (!mrm) {
      return res.status(404).json({ success: false, message: "Management Review Meeting not found" });
    }

    // Role check: Only Trust Head can approve
    if (req.user?.role !== "Head") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Only the Trust Head is authorized to approve MRM submissions."
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
      remarks: remarks || "Approved without modifications. Clear for distribution to all Course Coordinators.",
      versionReviewed: mrm.version || "1.0"
    };

    mrm.timeline.push({
      action: "Approved by Trust Head",
      actor: `${trustHeadName} (Trust Head)`,
      timestamp: mrm.trustHeadApproval.approvedAt,
      version: mrm.version || "1.0",
      details: mrm.trustHeadApproval.remarks
    });

    // Notify QMS Coordinator that it can now be shared
    notificationsData.unshift({
      id: Date.now(),
      title: "MRM Approved by Trust Head",
      text: `"${mrm.title}" (v${mrm.version}) was approved by Trust Head. QMS Coordinator can now distribute it to all Course Coordinators.`,
      time: "Just now",
      targetRole: "qm",
      read: false,
      createdAt: new Date().toISOString()
    });

    activitiesData.unshift({
      id: `ACT-${Date.now()}`,
      text: `Trust Head (${trustHeadName}) approved MRM MoM: "${mrm.title}"`,
      actor: trustHeadName,
      time: "Just now",
      tone: "green",
      timestamp: new Date().toISOString()
    });

    notifyMRMChange("APPROVED", mrm);
    res.json({
      success: true,
      message: "MRM approved by Trust Head. Eligible for distribution by QMS Coordinator.",
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

// POST /api/mrm/:id/share - QMS Coordinator shares with all Course Coordinators
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
        message: "Unauthorized: Only the QMS Coordinator is authorized to distribute MRMs to Course Coordinators."
      });
    }

    // Strict Workflow rule: MUST be approved by Trust Head first!
    const isApproved = mrm.status === "Approved" || mrm.status === "Approved by Trust Head" || mrm.trustHeadApproval?.approved;
    if (!isApproved) {
      return res.status(403).json({
        success: false,
        message: "Workflow constraint: Trust Head approval is required before the QMS Coordinator can share the MRM with all Course Coordinators."
      });
    }

    const coordinatorName = req.user?.name || "Rahul Kumar";

    mrm.status = "Shared";
    mrm.sharedWithAll = true;
    mrm.sharedAt = formatNow();
    mrm.sharedBy = coordinatorName;
    mrm.sharedVersion = mrm.version || "1.0";
    if (!Array.isArray(mrm.acknowledgements)) {
      mrm.acknowledgements = [];
    }

    mrm.timeline.push({
      action: "Shared with All Course Coordinators",
      actor: `${coordinatorName} (QMS Coordinator)`,
      timestamp: mrm.sharedAt,
      version: mrm.sharedVersion,
      details: "Distributed approved Minutes of Meeting to all academic coordinators."
    });

    // Broadcast notification to all Course Coordinators
    notificationsData.unshift({
      id: Date.now(),
      title: "MRM Distributed to All Coordinators",
      text: `Approved Minutes of Meeting for "${mrm.title}" (v${mrm.sharedVersion}) has been shared with all Course Coordinators.`,
      time: "Just now",
      targetRole: "owner",
      read: false,
      createdAt: new Date().toISOString()
    });

    activitiesData.unshift({
      id: `ACT-${Date.now()}`,
      text: `QMS Coordinator (${coordinatorName}) shared approved MRM "${mrm.title}" with all Course Coordinators`,
      actor: coordinatorName,
      time: "Just now",
      tone: "green",
      timestamp: new Date().toISOString()
    });

    notifyMRMChange("SHARED_WITH_ALL", mrm);
    res.json({
      success: true,
      message: "MRM and Minutes of Meeting successfully shared with all Course Coordinators!",
      data: mrm
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
