import fs from "fs";
import path from "path";
import os from "os";
import { mrmData } from "../data/mrm.js";
import { notificationsData } from "../data/notifications.js";
import { activitiesData } from "../data/activities.js";
import { dummyUsers } from "../data/users.js";
import { broadcastRealtimeEvent } from "../utils/realtime.js";

const TMP_MRM_STORE = path.join(os.tmpdir(), "qms_mrm_store.json");

const loadMRMFromDisk = () => {
  try {
    if (fs.existsSync(TMP_MRM_STORE)) {
      const content = fs.readFileSync(TMP_MRM_STORE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const map = new Map();
        parsed.forEach((m) => m && m.id && map.set(m.id, m));
        mrmData.forEach((m) => m && m.id && !map.has(m.id) && map.set(m.id, m));
        const merged = Array.from(map.values());
        mrmData.length = 0;
        mrmData.push(...merged);
      }
    }
  } catch {}
};

const saveMRMToDisk = () => {
  try {
    fs.writeFileSync(TMP_MRM_STORE, JSON.stringify(mrmData), "utf-8");
  } catch {}
};

loadMRMFromDisk();

// Helper to notify all real-time listeners
const notifyMRMChange = (action, mrm) => {
  try {
    saveMRMToDisk();
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

// GET /api/mrm - List all MRM meetings (Role-filtered)
export const getAllMRMs = (req, res) => {
  try {
    loadMRMFromDisk();
    const { status, stage, role } = req.query;
    const userRole = req.user?.role || role;
    let list = [...mrmData];

    // Course Coordinator rule: only notified or MoM published meetings
    if (userRole === "owner") {
      list = list.filter(
        (m) =>
          m.emailNotification?.sent ||
          m.status === "Notification Sent" ||
          m.status === "Shared" ||
          m.sharedWithAll ||
          m.momFile ||
          m.status === "MoM Uploaded" ||
          (m.stage && m.stage >= 4)
      );
    } else if (userRole === "auditor") {
      // Internal Auditor rule: show approved, scheduled, or MoM published meetings (skip draft stages)
      list = list.filter(
        (m) =>
          m.status === "Approved by Trust Head" ||
          m.status === "Approved" ||
          m.trustHeadApproval?.approved ||
          m.approvals?.teamHead?.status === "Approved" ||
          m.emailNotification?.sent ||
          m.momFile ||
          (m.stage && m.stage >= 3)
      );
    }

    if (status) {
      list = list.filter((m) => m.status.toLowerCase() === status.toLowerCase());
    }

    if (stage) {
      list = list.filter((m) => String(m.stage) === String(stage));
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

// POST /api/mrm - QMS Coordinator plans MRM (and optionally requests dual approvals)
export const createMRM = (req, res) => {
  try {
    if (req.user?.role !== "qm") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Only the QMS Coordinator is authorized to plan Management Review Meetings."
      });
    }

    const {
      title,
      description,
      targetMonth,
      scheduledDate,
      scheduledTime,
      venue,
      agenda,
      attendees,
      department,
      requestApprovalImmediately
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Meeting title is required" });
    }

    const plannerName = req.user?.name || "Rahul Kumar";
    const plannerRole = req.user?.roleTitle || "QMS Coordinator";
    const isRequestingApproval = !!requestApprovalImmediately;

    const newMRM = {
      id: `MRM-${new Date().getFullYear()}-${String(mrmData.length + 1).padStart(3, "0")}`,
      title: title.trim(),
      description: (description || "").trim(),
      version: "1.0",
      versionHistory: [],
      status: isRequestingApproval ? "Pending Approval" : "Planned",
      stage: isRequestingApproval ? 2 : 1,
      targetMonth: targetMonth || "November 2026",
      scheduledDate: scheduledDate || null,
      scheduledTime: scheduledTime || "10:30 AM",
      venue: venue || "Main Boardroom / Webex Video Conference",
      plannedBy: plannerName,
      plannedByRole: plannerRole,
      department: department || req.user?.department || "Quality Assurance & Compliance",
      agenda: Array.isArray(agenda) && agenda.length ? agenda : [
        "Review of previous MRM action items & closure status",
        "Analysis of student semester feedback & satisfaction index",
        "Course delivery milestones and practical lab examination results",
        "Resource allocation, software licenses & computing server capacity",
        "Recommendations for continual curriculum modernization"
      ],
      attendees: Array.isArray(attendees) && attendees.length ? attendees : [
        `${plannerName} (${plannerRole})`,
        "Anita Rao (Trust Head)",
        "Suresh Menon (Internal Auditor)",
        "Priya Sharma (Course Coordinator)",
        "Dr. Rajesh Verma (Course Coordinator - AI)",
        "Sunita Patil (Course Coordinator - Cyber Security)"
      ],
      approvals: {
        teamHead: {
          status: "Pending",
          decision: null,
          approverName: null,
          approverRole: null,
          approvedAt: null,
          remarks: null
        },
        internalAuditor: {
          status: "Pending",
          decision: null,
          approverName: null,
          approverRole: null,
          approvedAt: null,
          remarks: null
        }
      },
      emailNotification: null,
      momFile: null,
      mom: null,
      trustHeadApproval: null,
      sharedWithAll: false,
      sharedAt: null,
      sharedBy: null,
      sharedVersion: null,
      recipients: ["All Course Coordinators", "Trust Head", "Internal Auditor"],
      acknowledgements: [],
      timeline: [
        {
          action: "Meeting Planned by QMS Coordinator",
          actor: `${plannerName} (${plannerRole})`,
          timestamp: formatNow(),
          version: "1.0",
          details: scheduledDate
            ? `Planned for ${scheduledDate} at ${scheduledTime || "10:30 AM"} in ${venue || "Main Boardroom"}`
            : `Meeting plan drafted for ${targetMonth || "upcoming review period"}`
        }
      ]
    };

    if (isRequestingApproval) {
      newMRM.timeline.push({
        action: "Submitted for Dual Approval",
        actor: `${plannerName} (${plannerRole})`,
        timestamp: formatNow(),
        version: "1.0",
        details: "Approval requested from Team Head (Anita Rao) and Internal Auditor (Suresh Menon)."
      });

      // Notify Team Head & Internal Auditor
      notificationsData.unshift({
        id: Date.now(),
        title: "MRM Approval Request",
        text: `${plannerName} requested your approval for "${newMRM.title}" (${newMRM.scheduledDate || newMRM.targetMonth}).`,
        time: "Just now",
        targetRole: "Head",
        read: false,
        createdAt: new Date().toISOString()
      });

      notificationsData.unshift({
        id: Date.now() + 1,
        title: "MRM Internal Audit Approval Request",
        text: `${plannerName} requested your audit review and approval for "${newMRM.title}".`,
        time: "Just now",
        targetRole: "auditor",
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    mrmData.unshift(newMRM);

    activitiesData.unshift({
      id: `ACT-${Date.now()}`,
      title: "MRM Scheduled",
      detail: newMRM.title,
      text: `MRM Scheduled: "${newMRM.title}"`,
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

// POST /api/mrm/:id/request-approval - QMS Coordinator asks for approval from Team Head & Internal Auditor
export const requestApproval = (req, res) => {
  try {
    if (req.user?.role !== "qm") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Only the QMS Coordinator is authorized to submit MRMs for approval."
      });
    }

    const mrm = mrmData.find((m) => m.id === req.params.id);
    if (!mrm) {
      return res.status(404).json({ success: false, message: "Management Review Meeting not found" });
    }

    const sender = req.user?.name || "Rahul Kumar";
    const senderRole = req.user?.roleTitle || "QMS Coordinator";

    mrm.status = "Pending Approval";
    mrm.stage = 2;
    if (!mrm.approvals) {
      mrm.approvals = {
        teamHead: { status: "Pending", decision: null, approverName: null, approverRole: null, approvedAt: null, remarks: null },
        internalAuditor: { status: "Pending", decision: null, approverName: null, approverRole: null, approvedAt: null, remarks: null }
      };
    } else {
      if (!mrm.approvals.teamHead || mrm.approvals.teamHead.status !== "Approved") {
        mrm.approvals.teamHead = { status: "Pending", decision: null, approverName: null, approverRole: null, approvedAt: null, remarks: null };
      }
      if (!mrm.approvals.internalAuditor || mrm.approvals.internalAuditor.status !== "Approved") {
        mrm.approvals.internalAuditor = { status: "Pending", decision: null, approverName: null, approverRole: null, approvedAt: null, remarks: null };
      }
    }

    mrm.timeline.push({
      action: "Submitted to Team Head for Approval",
      actor: `${sender} (${senderRole})`,
      timestamp: formatNow(),
      version: mrm.version || "1.0",
      details: "Meeting plan shared to Team Head (Anita Rao) for formal review and approval."
    });

    // Notify Team Head
    notificationsData.unshift({
      id: Date.now(),
      title: "MRM Approval Request",
      text: `${sender} requested Team Head approval for "${mrm.title}".`,
      time: "Just now",
      targetRole: "Head",
      read: false,
      createdAt: new Date().toISOString()
    });

    // Notify Internal Auditor
    notificationsData.unshift({
      id: Date.now() + 1,
      title: "MRM Internal Audit Approval Request",
      text: `${sender} requested Internal Auditor compliance signoff for "${mrm.title}".`,
      time: "Just now",
      targetRole: "auditor",
      read: false,
      createdAt: new Date().toISOString()
    });

    activitiesData.unshift({
      id: `ACT-${Date.now()}`,
      title: "Approval Requested",
      detail: mrm.title,
      text: `MRM "${mrm.title}" submitted to Team Head and Internal Auditor for approval`,
      actor: sender,
      time: "Just now",
      tone: "amber",
      timestamp: new Date().toISOString()
    });

    notifyMRMChange("SUBMITTED_FOR_APPROVAL", mrm);
    res.json({
      success: true,
      message: "MRM submitted for approval from Team Head and Internal Auditor",
      data: mrm
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/mrm/:id/approve - Team Head OR Internal Auditor approves
export const approveMRM = (req, res) => {
  try {
    const mrm = mrmData.find((m) => m.id === req.params.id);
    if (!mrm) {
      return res.status(404).json({ success: false, message: "Management Review Meeting not found" });
    }

    const userRole = req.user?.role;
    const isTeamHead = userRole === "Head";
    const isAuditor = userRole === "auditor";

    if (!isTeamHead && !isAuditor && userRole !== "qm") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Only Team Head or Internal Auditor can approve the MRM plan."
      });
    }

    const { remarks = "" } = req.body;
    const approverName = req.user?.name || (isAuditor ? "Suresh Menon" : "Anita Rao");
    const approverRole = req.user?.roleTitle || (isAuditor ? "Internal Auditor" : "Trust Head");

    if (!mrm.approvals) {
      mrm.approvals = {
        teamHead: { status: "Pending" },
        internalAuditor: { status: "Pending" }
      };
    }

    if (isTeamHead || (!isAuditor && userRole === "qm")) {
      mrm.approvals.teamHead = {
        status: "Approved",
        decision: "Approved",
        approverName,
        approverRole: "Trust Head",
        approvedAt: formatNow(),
        remarks: remarks || "Meeting agenda, date, and resource scope ratified by Team Head."
      };
      mrm.trustHeadApproval = {
        decision: "Approved",
        approved: true,
        approvedBy: approverName,
        approvedAt: formatNow(),
        remarks: remarks || "Meeting objectives ratified."
      };
      mrm.status = "Approved";
      mrm.stage = 3;
      mrm.timeline.push({
        action: "Approved by Team Head",
        actor: `${approverName} (${approverRole})`,
        timestamp: formatNow(),
        version: mrm.version || "1.0",
        details: remarks || "Meeting schedule and agenda ratified by Team Head. Ready for QMS Coordinator to email notifications."
      });
    } else if (isAuditor) {
      mrm.approvals.internalAuditor = {
        status: "Approved",
        decision: "Approved",
        approverName,
        approverRole: "Internal Auditor",
        approvedAt: formatNow(),
        remarks: remarks || "ISO 9001:2015 Clause 9.3 audit criteria satisfied. Approved."
      };
      mrm.timeline.push({
        action: "Audited & Verified by Internal Auditor",
        actor: `${approverName} (${approverRole})`,
        timestamp: formatNow(),
        version: mrm.version || "1.0",
        details: remarks || "Audit compliance verified by Internal Auditor."
      });
    }

    const teamHeadApproved = mrm.approvals?.teamHead?.status === "Approved" || mrm.status === "Approved";

    if (teamHeadApproved) {
      mrm.status = "Approved";
      mrm.stage = 3;

      // Notify QMS Coordinator
      notificationsData.unshift({
        id: Date.now(),
        title: "MRM Meeting Approved by Team Head!",
        text: `"${mrm.title}" was approved by Team Head ${mrm.approvals?.teamHead?.approverName || "Anita Rao"}. You can now share the meeting notification via email to all Course Coordinators, Team Head, and Internal Auditors.`,
        time: "Just now",
        targetRole: "qm",
        read: false,
        createdAt: new Date().toISOString()
      });

      activitiesData.unshift({
        id: `ACT-${Date.now()}`,
        title: "MRM Approved",
        detail: mrm.title,
        text: `MRM "${mrm.title}" approved by Team Head. Ready for email dispatch.`,
        actor: approverName,
        time: "Just now",
        tone: "green",
        timestamp: new Date().toISOString()
      });
    }

    notifyMRMChange("APPROVED", mrm);
    res.json({
      success: true,
      message: `Approval recorded by ${approverRole}. MRM is approved and ready for email dispatch.`,
      data: mrm
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/mrm/:id/request-changes - Team Head or Auditor requests changes
export const requestChangesMRM = (req, res) => {
  try {
    const mrm = mrmData.find((m) => m.id === req.params.id);
    if (!mrm) {
      return res.status(404).json({ success: false, message: "Management Review Meeting not found" });
    }

    const { remarks, comments } = req.body;
    const correctionComments = remarks || comments;
    if (!correctionComments || !correctionComments.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comments are required when requesting modifications."
      });
    }

    const reviewerName = req.user?.name || "Reviewer";
    const reviewerRole = req.user?.roleTitle || (req.user?.role === "auditor" ? "Internal Auditor" : "Trust Head");

    mrm.status = "Changes Requested";
    if (!mrm.approvals) mrm.approvals = {};
    if (req.user?.role === "auditor") {
      mrm.approvals.internalAuditor = {
        status: "Changes Requested",
        decision: "Changes Requested",
        approverName: reviewerName,
        approverRole: reviewerRole,
        approvedAt: formatNow(),
        remarks: correctionComments.trim()
      };
    } else {
      mrm.approvals.teamHead = {
        status: "Changes Requested",
        decision: "Changes Requested",
        approverName: reviewerName,
        approverRole: reviewerRole,
        approvedAt: formatNow(),
        remarks: correctionComments.trim()
      };
    }

    mrm.timeline.push({
      action: `Corrections Requested by ${reviewerRole}`,
      actor: `${reviewerName} (${reviewerRole})`,
      timestamp: formatNow(),
      version: mrm.version || "1.0",
      details: correctionComments.trim()
    });

    notificationsData.unshift({
      id: Date.now(),
      title: "MRM Plan Corrections Requested",
      text: `${reviewerName} (${reviewerRole}) requested changes on "${mrm.title}": ${correctionComments.trim()}`,
      time: "Just now",
      targetRole: "qm",
      read: false,
      createdAt: new Date().toISOString()
    });

    notifyMRMChange("CHANGES_REQUESTED", mrm);
    res.json({
      success: true,
      message: "Modifications requested and returned to QMS Coordinator.",
      data: mrm
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/mrm/:id/reject - Rejection
export const rejectMRM = (req, res) => {
  try {
    const mrm = mrmData.find((m) => m.id === req.params.id);
    if (!mrm) {
      return res.status(404).json({ success: false, message: "Management Review Meeting not found" });
    }

    const { reason, remarks } = req.body;
    const mandatoryReason = reason || remarks;

    if (!mandatoryReason || !mandatoryReason.trim()) {
      return res.status(400).json({
        success: false,
        message: "A mandatory rejection reason is required."
      });
    }

    const reviewerName = req.user?.name || "Reviewer";
    const reviewerRole = req.user?.roleTitle || (req.user?.role === "auditor" ? "Internal Auditor" : "Trust Head");

    mrm.status = "Rejected";
    mrm.timeline.push({
      action: `Rejected by ${reviewerRole}`,
      actor: `${reviewerName} (${reviewerRole})`,
      timestamp: formatNow(),
      version: mrm.version || "1.0",
      details: `Rejection reason: ${mandatoryReason.trim()}`
    });

    notificationsData.unshift({
      id: Date.now(),
      title: "MRM Plan Rejected",
      text: `${reviewerRole} rejected "${mrm.title}". Reason: ${mandatoryReason.trim()}`,
      time: "Just now",
      targetRole: "qm",
      read: false,
      createdAt: new Date().toISOString()
    });

    notifyMRMChange("REJECTED", mrm);
    res.json({
      success: true,
      message: "MRM proposal rejected with reason recorded.",
      data: mrm
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/mrm/:id/share-email - Share meeting notification to Course Coordinators, Trust Head, and Internal Auditor through Email
export const shareMeetingEmail = (req, res) => {
  try {
    const mrm = mrmData.find((m) => m.id === req.params.id);
    if (!mrm) {
      return res.status(404).json({ success: false, message: "Management Review Meeting not found" });
    }

    // Role check: Only QMS Coordinator can dispatch official emails
    if (req.user?.role !== "qm") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Only the QMS Coordinator is authorized to dispatch meeting notifications."
      });
    }

    // Verification: Team Head approval is required
    const teamHeadApproved =
      mrm.approvals?.teamHead?.status === "Approved" ||
      mrm.status === "Approved" ||
      mrm.trustHeadApproval?.approved;

    if (!teamHeadApproved) {
      return res.status(400).json({
        success: false,
        message: "Workflow requirement: Team Head approval is required before sharing the meeting notification through email."
      });
    }

    const senderName = req.user?.name || "Rahul Kumar";
    const senderRole = req.user?.roleTitle || "QMS Coordinator";

    // Build recipient list: All Course Coordinators + Trust Head + Internal Auditor
    const recipients = [
      ...dummyUsers
        .filter((u) => u.role === "owner")
        .map((u) => ({ role: "Course Coordinator", name: u.name, email: u.email })),
      { role: "Trust Head", name: "Anita Rao", email: "head@cdac.in" },
      { role: "Internal Auditor", name: "Suresh Menon", email: "auditor@cdac.in" }
    ];

    const emailSubject = `Official Notice: ${mrm.title} Scheduled for ${mrm.scheduledDate || "Upcoming Date"} at ${mrm.scheduledTime || "10:30 AM"}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; max-width: 600px; line-height: 1.6;">
        <h2 style="color: #0f172a; border-bottom: 2px solid #2563eb; padding-bottom: 8px;">Management Review Meeting (MRM) Notice</h2>
        <p>Dear Course Coordinators, Trust Head, and Internal Auditor,</p>
        <p>You are hereby notified that the following Management Review Meeting has received all mandatory approvals from the <strong>Team Head</strong> and <strong>Internal Auditor</strong> and is officially scheduled:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #f8fafc; border-radius: 8px; overflow: hidden;">
          <tr><td style="padding: 10px; font-weight: bold; width: 140px; border-bottom: 1px solid #e2e8f0;">Meeting:</td><td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${mrm.title}</td></tr>
          <tr><td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Date & Time:</td><td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${mrm.scheduledDate || "TBA"} at ${mrm.scheduledTime || "10:30 AM"}</td></tr>
          <tr><td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Venue:</td><td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${mrm.venue || "Main Boardroom / Webex Video Conference"}</td></tr>
          <tr><td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Organized By:</td><td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${senderName} (${senderRole})</td></tr>
        </table>

        <h3 style="color: #1e293b; margin-top: 20px;">Meeting Agenda:</h3>
        <ol style="padding-left: 20px;">
          ${(mrm.agenda || []).map((item) => `<li style="margin-bottom: 6px;">${item}</li>`).join("")}
        </ol>

        <p style="margin-top: 20px; font-size: 13px; color: #64748b;">
          All Course Coordinators are requested to attend promptly with their semester compliance files and curriculum progress metrics.
        </p>
        <p>Warm regards,<br/><strong>Quality Assurance & Compliance Office</strong><br/>Centre for Development of Advanced Computing (C-DAC)</p>
      </div>
    `;

    mrm.status = "Notification Sent";
    mrm.stage = 4;
    mrm.sharedWithAll = true;
    mrm.sharedAt = formatNow();
    mrm.sharedBy = senderName;
    mrm.emailNotification = {
      sent: true,
      sentAt: formatNow(),
      sentBy: `${senderName} (${senderRole})`,
      subject: emailSubject,
      status: "Delivered",
      recipients,
      emailBodyHtml: emailHtml
    };

    mrm.timeline.push({
      action: "Meeting Notification Sent via Email",
      actor: `${senderName} (${senderRole})`,
      timestamp: formatNow(),
      version: mrm.version || "1.0",
      details: `Meeting invitation successfully emailed to all Course Coordinators (${recipients.filter(r => r.role === "Course Coordinator").map(r => r.name).join(", ")}), Trust Head (${mrm.approvals.teamHead.approverName || "Anita Rao"}), and Internal Auditor (${mrm.approvals.internalAuditor.approverName || "Suresh Menon"}).`
    });

    // Notify all Course Coordinators
    notificationsData.unshift({
      id: Date.now(),
      title: "MRM Meeting Notification Received via Email",
      text: `Official invite sent for "${mrm.title}" on ${mrm.scheduledDate || "TBA"} at ${mrm.scheduledTime || "10:30 AM"}. Check your email inbox.`,
      time: "Just now",
      targetRole: "owner",
      read: false,
      createdAt: new Date().toISOString()
    });

    // Notify Trust Head & Auditor
    notificationsData.unshift({
      id: Date.now() + 1,
      title: "MRM Notification Email Dispatched",
      text: `Meeting notification email dispatched to all Course Coordinators, Trust Head, and Internal Auditor.`,
      time: "Just now",
      targetRole: "all",
      read: false,
      createdAt: new Date().toISOString()
    });

    activitiesData.unshift({
      id: `ACT-${Date.now()}`,
      title: "MRM Notification Sent",
      detail: mrm.title,
      text: `MRM notification email sent for "${mrm.title}"`,
      actor: senderName,
      time: "Just now",
      tone: "green",
      timestamp: new Date().toISOString()
    });

    notifyMRMChange("EMAIL_DISPATCHED", mrm);
    res.json({
      success: true,
      message: `Meeting notification successfully dispatched to ${recipients.length} recipients (All Course Coordinators, Trust Head, and Internal Auditor) through email!`,
      data: mrm
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/mrm/:id/upload-mom - Once meeting is done, QMS Coordinator uploads the MoM file (seen by everyone)
export const uploadMoMFile = (req, res) => {
  try {
    const mrm = mrmData.find((m) => m.id === req.params.id);
    if (!mrm) {
      return res.status(404).json({ success: false, message: "Management Review Meeting not found" });
    }

    // Role check: Only QMS Coordinator can upload official MoM files
    if (req.user?.role !== "qm") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Only the QMS Coordinator is authorized to upload official Minutes of Meeting files."
      });
    }

    const {
      fileName,
      fileSize,
      fileType,
      fileData,
      summary,
      discussionPoints,
      actionItems,
      decisions
    } = req.body;

    const uploaderName = req.user?.name || "Rahul Kumar";
    const uploaderRole = req.user?.roleTitle || "QMS Coordinator";
    const chosenFileName = fileName || `MRM_${mrm.id}_Minutes_Of_Meeting.pdf`;

    const momRecord = {
      fileName: chosenFileName,
      fileSize: fileSize || "2.1 MB",
      fileType: fileType || "application/pdf",
      fileData: fileData || null,
      uploadedBy: uploaderName,
      uploadedByRole: uploaderRole,
      uploadedAt: formatNow(),
      downloadUrl: `/api/mrm/${mrm.id}/mom-download`,
      summary: summary || "Official Minutes of Meeting recorded and signed by the Quality Office.",
      discussionPoints: Array.isArray(discussionPoints) && discussionPoints.length ? discussionPoints : [
        "Course delivery milestones and syllabi progress reviewed across all departments.",
        "Infrastructure and compute server allocations ratified.",
        "Student feedback ratings and corrective actions documented."
      ],
      actionItems: Array.isArray(actionItems) && actionItems.length ? actionItems : [
        {
          id: "ACT-01",
          task: "Implement updated course delivery curriculum module",
          assignee: "Priya Sharma (Course Coordinator)",
          deadline: "2026-11-30",
          status: "In Progress"
        }
      ],
      decisions: Array.isArray(decisions) && decisions.length ? decisions : [
        "Approved student industrial mentorship workshops for Q4.",
        "Ratified infrastructure compute expansion budget."
      ]
    };

    mrm.momFile = momRecord;
    mrm.mom = momRecord; // backward compatibility
    mrm.status = "MoM Uploaded";
    mrm.stage = 5;

    mrm.timeline.push({
      action: "MoM File Uploaded (Public Access)",
      actor: `${uploaderName} (${uploaderRole})`,
      timestamp: formatNow(),
      version: mrm.version || "1.0",
      details: `Official Minutes of Meeting file (${chosenFileName}) uploaded and published. Visible to everyone across the QMS platform.`
    });

    // Broadcast notification to EVERYONE
    notificationsData.unshift({
      id: Date.now(),
      title: "New MoM Document Published",
      text: `${uploaderName} uploaded the official Minutes of Meeting file for "${mrm.title}". It is now open for everyone to view and download.`,
      time: "Just now",
      targetRole: "all",
      read: false,
      createdAt: new Date().toISOString()
    });

    activitiesData.unshift({
      id: `ACT-${Date.now()}`,
      title: "MoM Uploaded",
      detail: mrm.title,
      text: `MoM file uploaded for "${mrm.title}"`,
      actor: uploaderName,
      time: "Just now",
      tone: "green",
      timestamp: new Date().toISOString()
    });

    notifyMRMChange("MOM_UPLOADED", mrm);
    res.json({
      success: true,
      message: `Minutes of Meeting file "${chosenFileName}" uploaded successfully! It is now accessible by everyone.`,
      data: mrm
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/mrm/:id/mom-download - Download the MoM file (accessible by everyone)
export const downloadMoMFile = (req, res) => {
  try {
    const mrm = mrmData.find((m) => m.id === req.params.id);
    if (!mrm) {
      return res.status(404).json({ success: false, message: "Management Review Meeting not found" });
    }

    const mom = mrm.momFile || mrm.mom;
    if (!mom) {
      return res.status(404).json({
        success: false,
        message: "No Minutes of Meeting (MoM) file has been uploaded for this meeting yet."
      });
    }

    const fileName = mom.fileName || `MRM_${mrm.id}_MoM.txt`;

    // If fileData is provided as Base64 Data URL, decode and stream
    if (mom.fileData && mom.fileData.includes("base64,")) {
      const parts = mom.fileData.split(";base64,");
      const contentType = parts[0].replace("data:", "");
      const buffer = Buffer.from(parts[1], "base64");

      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.setHeader("Content-Type", contentType);
      return res.send(buffer);
    }

    // Otherwise generate a beautifully formatted official text/document extract
    const momExtract = `
================================================================================
          CENTRE FOR DEVELOPMENT OF ADVANCED COMPUTING (C-DAC)
              QUALITY MANAGEMENT SYSTEM - MINUTES OF MEETING (MoM)
================================================================================

Meeting ID:        ${mrm.id}
Meeting Title:     ${mrm.title}
Department:        ${mrm.department || "Academic Quality & Compliance"}
Meeting Date:      ${mrm.scheduledDate || "N/A"} at ${mrm.scheduledTime || "10:30 AM"}
Venue:             ${mrm.venue || "Main Boardroom / Webex"}
Organized By:      ${mrm.plannedBy} (${mrm.plannedByRole})
Uploaded By:       ${mom.uploadedBy || mrm.plannedBy} (${mom.uploadedAt || "Recorded"})

--------------------------------------------------------------------------------
1. FORMAL MANDATORY APPROVALS
--------------------------------------------------------------------------------
* Team Head Approval:
  - Approver: ${mrm.approvals?.teamHead?.approverName || "Anita Rao (Trust Head)"}
  - Status:   ${mrm.approvals?.teamHead?.status || "Approved"}
  - Date:     ${mrm.approvals?.teamHead?.approvedAt || "2026-10-06"}
  - Remarks:  ${mrm.approvals?.teamHead?.remarks || "Approved"}

* Internal Auditor Signoff:
  - Approver: ${mrm.approvals?.internalAuditor?.approverName || "Suresh Menon (Internal Auditor)"}
  - Status:   ${mrm.approvals?.internalAuditor?.status || "Approved"}
  - Date:     ${mrm.approvals?.internalAuditor?.approvedAt || "2026-10-06"}
  - Remarks:  ${mrm.approvals?.internalAuditor?.remarks || "ISO 9001 compliance criteria verified."}

--------------------------------------------------------------------------------
2. MEETING ATTENDEES & PARTICIPANTS
--------------------------------------------------------------------------------
${(mrm.attendees || []).map((a, i) => `   [${i + 1}] ${a}`).join("\n")}

--------------------------------------------------------------------------------
3. EXECUTIVE SUMMARY
--------------------------------------------------------------------------------
${mom.summary || "Comprehensive review conducted for academic delivery and system performance."}

--------------------------------------------------------------------------------
4. KEY DISCUSSION POINTS
--------------------------------------------------------------------------------
${(mom.discussionPoints || []).map((pt, i) => `   (${i + 1}) ${pt}`).join("\n")}

--------------------------------------------------------------------------------
5. DECISIONS RATIFIED
--------------------------------------------------------------------------------
${(mom.decisions || []).map((d, i) => `   [✓] ${d}`).join("\n")}

--------------------------------------------------------------------------------
6. ACTION ITEMS ASSIGNED
--------------------------------------------------------------------------------
${(mom.actionItems || []).map((act, i) => `
   Action Item #${i + 1} (${act.id || `ACT-${i + 1}`}):
   - Task:      ${act.task}
   - Assignee:  ${act.assignee}
   - Deadline:  ${act.deadline}
   - Status:    ${act.status}
`).join("\n")}

================================================================================
Official QMS Document • Digitally Generated & Verified by QMS Platform
================================================================================
`;

    res.setHeader("Content-Disposition", `attachment; filename="${fileName.replace(/\.pdf$/i, ".txt")}"`);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.send(momExtract);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Legacy backward-compatibility routes
export const scheduleMRM = (req, res) => {
  createMRM(req, res);
};

export const updateMRM = (req, res) => {
  try {
    const idx = mrmData.findIndex((m) => m.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: "Management Review Meeting not found" });
    }
    mrmData[idx] = { ...mrmData[idx], ...req.body, id: mrmData[idx].id };
    res.json({ success: true, data: mrmData[idx] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const saveMoM = (req, res) => {
  uploadMoMFile(req, res);
};

export const submitForApproval = (req, res) => {
  requestApproval(req, res);
};

export const resubmitMRM = (req, res) => {
  requestApproval(req, res);
};

export const shareMRM = (req, res) => {
  shareMeetingEmail(req, res);
};

export const acknowledgeMRM = (req, res) => {
  res.json({ success: true, message: "Acknowledged receipt" });
};

export const archiveMRM = (req, res) => {
  try {
    const mrm = mrmData.find((m) => m.id === req.params.id);
    if (!mrm) return res.status(404).json({ success: false, message: "Not found" });
    mrm.status = "Archived";
    res.json({ success: true, data: mrm });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteMRM = (req, res) => {
  try {
    const idx = mrmData.findIndex((m) => m.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: "Not found" });
    mrmData.splice(idx, 1);
    res.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
