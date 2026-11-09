import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import os from "os";
import { auditData } from "../data/audits.js";
import { notificationsData } from "../data/notifications.js";
import { broadcastRealtimeEvent } from "../utils/realtime.js";

const TMP_STORE_PATH = path.join(os.tmpdir(), "qms_audits_store.json");

const loadAuditsFromDisk = () => {
  try {
    if (fs.existsSync(TMP_STORE_PATH)) {
      const content = fs.readFileSync(TMP_STORE_PATH, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const map = new Map();
        parsed.forEach((a) => {
          if (a && a.id) {
            if (a.scheduledDate && a.scheduledDate.includes(" to ")) {
              a.scheduledDate = a.scheduledDate.split(" to ")[0].trim();
            }
            if (a.auditDates?.startDate) {
              a.auditDates.endDate = a.auditDates.startDate;
            }
            map.set(a.id, a);
          }
        });
        auditData.forEach((a) => a && a.id && !map.has(a.id) && map.set(a.id, a));
        const merged = Array.from(map.values());
        auditData.length = 0;
        auditData.push(...merged);
      }
    }
  } catch (e) {
    // Ignore tmp read errors
  }
};

const saveAuditsToDisk = () => {
  try {
    fs.writeFileSync(TMP_STORE_PATH, JSON.stringify(auditData), "utf-8");
  } catch (e) {
    // Ignore tmp write errors
  }
};

// Initial load on container initialization
loadAuditsFromDisk();

const formatNow = () => {
  const d = new Date();
  return d.toISOString().replace("T", " ").substring(0, 19);
};

// Helper to push system notifications
const pushNotification = (title, text, targetRole = "all") => {
  const id = Date.now() + Math.floor(Math.random() * 1000);
  const notif = {
    id,
    title,
    text,
    time: "Just now",
    targetRole,
    read: false,
    createdAt: new Date().toISOString()
  };
  notificationsData.unshift(notif);
  broadcastRealtimeEvent("new_notification", notif);
  return notif;
};

// POST /api/audit/sync - Client-driven sync to ensure serverless containers never lose newly scheduled audits
export const syncAudits = (req, res) => {
  try {
    const { audits } = req.body;
    if (Array.isArray(audits) && audits.length > 0) {
      loadAuditsFromDisk();
      const map = new Map();
      auditData.forEach((a) => a && a.id && map.set(a.id, a));
      audits.forEach((clientAudit) => {
        if (!clientAudit || !clientAudit.id) return;
        const existing = map.get(clientAudit.id);
        if (!existing) {
          map.set(clientAudit.id, clientAudit);
        } else {
          const clientStage = Number(clientAudit.stage) || 1;
          const existingStage = Number(existing.stage) || 1;
          if (clientStage >= existingStage) {
            map.set(clientAudit.id, { ...existing, ...clientAudit });
          }
        }
      });
      auditData.length = 0;
      auditData.push(...Array.from(map.values()));
      saveAuditsToDisk();
    }
    res.json({ success: true, count: auditData.length, data: auditData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/audit (Role-filtered)
export const getAllAudits = (req, res) => {
  try {
    loadAuditsFromDisk();
    const { role } = req.query;
    let userRole = role;
    let userName = req.user?.name;

    if (!userRole && req.headers["authorization"]) {
      try {
        const token = req.headers["authorization"].split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "qms_jwt_secret_key_super_secure_2026");
        if (decoded) {
          userRole = decoded.role;
          userName = decoded.name;
        }
      } catch (e) {}
    }
    userRole = req.user?.role || userRole;

    let list = [...auditData];

    if (userRole === "owner") {
      // Course coordinator only sees their own process once schedule is shared by QMS (stage >= 3)
      list = list.filter(
        (a) =>
          a.stage >= 3 &&
          ((a.process && a.process.toLowerCase().includes("course")) ||
            (userName && a.internalAuditee?.name && a.internalAuditee.name.toLowerCase().includes(userName.toLowerCase())))
      );
    } else if (userRole === "auditor") {
      // Auditor conducts audits once schedule has been officially shared by QMS (stage >= 3)
      list = list.filter((a) => a.stage >= 3);
    }

    const dummyIds = new Set(["IA-2026-001", "IA-2026-002", "IA-2026-003"]);
    const sorted = list.sort((a, b) => {
      const aIsNew = a.isNew === true || (!dummyIds.has(a.id) && !a.id?.endsWith("-001") && !a.id?.endsWith("-002") && !a.id?.endsWith("-003"));
      const bIsNew = b.isNew === true || (!dummyIds.has(b.id) && !b.id?.endsWith("-001") && !b.id?.endsWith("-002") && !b.id?.endsWith("-003"));
      if (aIsNew && !bIsNew) return -1;
      if (!aIsNew && bIsNew) return 1;
      if (aIsNew && bIsNew) {
        const aTime = a.createdAt || 0;
        const bTime = b.createdAt || 0;
        if (bTime !== aTime) return bTime - aTime;
        return b.id.localeCompare(a.id);
      }
      return a.id.localeCompare(b.id);
    });
    res.json({ success: true, count: sorted.length, data: sorted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/audit/:id
export const getAuditById = (req, res) => {
  try {
    const audit = auditData.find((a) => a.id === req.params.id);
    if (!audit) {
      return res.status(404).json({ success: false, message: "Internal Audit not found" });
    }
    res.json({ success: true, data: audit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/audit - Schedule New Internal Audit (Submitted to Trust Head for Approval)
export const createAudit = (req, res) => {
  try {
    const {
      title,
      process,
      processId,
      date,
      startDate: rawStartDate,
      endDate: rawEndDate,
      internalAuditor,
      internalAuditee,
      scope,
      venue,
      notes
    } = req.body;

    const finalDate = date || rawStartDate;
    const startDate = rawStartDate || finalDate;
    const endDate = rawEndDate || finalDate;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: "Audit date is required." });
    }

    if (!process) {
      return res.status(400).json({ success: false, message: "Audit process is required." });
    }

    if (!internalAuditor || !internalAuditor.name) {
      return res.status(400).json({ success: false, message: "Internal Auditor assignment is required." });
    }

    if (!internalAuditee || !internalAuditee.name) {
      return res.status(400).json({ success: false, message: "Internal Auditee assignment is required." });
    }

    const year = new Date().getFullYear();
    const existingForYear = auditData.filter((a) => a.id.startsWith(`IA-${year}`));
    const seq = String(existingForYear.length + 1).padStart(3, "0");
    const id = req.body.id || `IA-${year}-${seq}`;

    const scheduledDateStr = startDate;
    const auditorName = internalAuditor.name;
    const auditeeName = internalAuditee.name;
    const scheduledByName = req.user?.name || "Rahul Kumar";
    const scheduledByRole = req.user?.roleTitle || "QMS Coordinator";

    const newAudit = {
      id,
      isNew: req.body.isNew !== undefined ? req.body.isNew : true,
      createdAt: req.body.createdAt || Date.now(),
      title: title || `${process} Internal Quality Audit`,
      process,
      processId: processId || "PROC-01",
      auditDates: {
        startDate,
        endDate: startDate
      },
      scheduledDate: scheduledDateStr,
      internalAuditor: {
        id: internalAuditor.id || "IA001",
        name: auditorName,
        role: internalAuditor.role || "Internal Auditor",
        email: internalAuditor.email || `${auditorName.toLowerCase().replace(/\s+/g, ".")}@cdac.in`,
        department: internalAuditor.department || "Internal Quality Audit Cell"
      },
      internalAuditee: {
        id: internalAuditee.id || "CC001",
        name: auditeeName,
        role: internalAuditee.role || "Course Coordinator",
        email: internalAuditee.email || `${auditeeName.toLowerCase().replace(/\s+/g, ".")}@cdac.in`,
        department: internalAuditee.department || "Academic Division"
      },
      scheduledBy: {
        name: scheduledByName,
        role: scheduledByRole,
        scheduledAt: formatNow()
      },
      scope: scope || `Verification of standard operating procedures, documentation records, and ISO 9001:2015 Clause compliance for ${process}.`,
      venue: venue || "Academic Section & QMS Portal",
      notes: notes || "",
      // Stage 2: Awaiting Trust Head Approval
      status: "Awaiting Trust Head Approval",
      stage: 2,
      stageLabel: "Awaiting Trust Head Approval",

      scheduleShared: null,
      trustHeadConfirmation: null,
      noticingSheet: null,
      ncDocs: null,
      auditeeClosure: null,
      qmsFinalClosure: null,

      timeline: [
        {
          action: "Audit Scheduled",
          actor: `${scheduledByName} (${scheduledByRole})`,
          timestamp: formatNow(),
          details: `Scheduled ${process} audit for ${scheduledDateStr}. Automatically submitted to Trust Head for formal ratification & approval.`
        }
      ]
    };

    auditData.unshift(newAudit);
    saveAuditsToDisk();

    // Push automatic notification to Trust Head (Action Required: Confirm Schedule)
    pushNotification(
      "New Internal Audit Scheduled - Approval Required",
      `Internal Audit (${newAudit.id}) for ${newAudit.process} scheduled for ${scheduledDateStr}. Please review and approve the schedule.`,
      "Head"
    );

    // Push notification to QMS Coordinator
    pushNotification(
      "Internal Audit Scheduled",
      `Internal Audit (${newAudit.id}) for ${newAudit.process} scheduled. Submitted to Trust Head for approval.`,
      "qm"
    );

    broadcastRealtimeEvent("audit_scheduled", {
      auditId: newAudit.id,
      process: newAudit.process,
      title: newAudit.title,
      scheduledBy: scheduledByName
    });

    res.status(201).json({
      success: true,
      message: `Internal Audit ${newAudit.id} scheduled and submitted to Trust Head for approval.`,
      data: newAudit
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/audit/:id/confirm-schedule - Trust Head approves audit schedule
export const confirmSchedule = (req, res) => {
  try {
    const audit = auditData.find((a) => a.id === req.params.id);
    if (!audit) {
      return res.status(404).json({ success: false, message: "Internal Audit not found" });
    }

    const isTrustHeadUser = req.user?.role?.toLowerCase() === "head";
    const userName = isTrustHeadUser ? (req.user?.name || "Trust Head") : (req.body?.confirmedBy || "Trust Head");
    const userRole = "Trust Head";
    const remarks = req.body?.remarks || "Audit schedule ratified and authorized for execution.";

    audit.trustHeadConfirmation = {
      confirmed: true,
      confirmedBy: userName,
      confirmedRole: userRole,
      confirmedAt: formatNow(),
      remarks
    };

    audit.status = "Approved by Trust Head";
    audit.stage = 2.5;
    audit.stageLabel = "Approved by Trust Head (Pending QMS Distribution)";

    audit.timeline.push({
      action: "Schedule Approved by Trust Head",
      actor: `${userName} (${userRole})`,
      timestamp: formatNow(),
      details: `Trust Head ratified the audit schedule. Automated approval notification dispatched to QMS Coordinator to distribute schedule.`
    });
    saveAuditsToDisk();

    // Automatically send message / notification to QMS Coordinator ONLY
    pushNotification(
      "Audit Schedule Approved by Trust Head",
      `Trust Head (${userName}) has approved the audit schedule for ${audit.process} (${audit.id}). You can now share the schedule with Course Coordinators, Trust Head, and Internal Auditors.`,
      "qm"
    );

    broadcastRealtimeEvent("audit_schedule_confirmed", {
      auditId: audit.id,
      title: audit.title,
      confirmedBy: userName
    });

    res.json({
      success: true,
      message: "Audit schedule approved by Trust Head. Notification automatically dispatched to QMS Coordinator.",
      data: audit
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/audit/:id/share-schedule - QMS Coordinator shares schedule to Course Coordinators, Trust Head & Auditors
export const shareSchedule = (req, res) => {
  try {
    const audit = auditData.find((a) => a.id === req.params.id);
    if (!audit) {
      return res.status(404).json({ success: false, message: "Internal Audit not found" });
    }

    const userName = req.user?.name || "Rahul Kumar";
    const userRole = req.user?.roleTitle || "QMS Coordinator";

    audit.scheduleShared = {
      shared: true,
      sharedAt: formatNow(),
      sharedBy: `${userName} (${userRole})`,
      docTitle: `Internal_Audit_Schedule_${audit.id}.pdf`,
      recipients: [
        { role: "Course Coordinator (Auditee)", name: audit.internalAuditee?.name, email: audit.internalAuditee?.email },
        { role: "Trust Head", name: "Trust Head", email: "trusthead@cdac.in" },
        { role: "Internal Auditor", name: audit.internalAuditor?.name, email: audit.internalAuditor?.email }
      ]
    };

    audit.status = "Schedule Dispatched";
    audit.stage = 3;
    audit.stageLabel = "Schedule Dispatched (Audit in Progress)";

    audit.timeline.push({
      action: "Schedule Dispatched to All Stakeholders",
      actor: `${userName} (${userRole})`,
      timestamp: formatNow(),
      details: `QMS Coordinator officially dispatched confirmed audit schedule to Course Coordinator (${audit.internalAuditee?.name}), Trust Head (Trust Head), and Internal Auditor (${audit.internalAuditor?.name}).`
    });
    saveAuditsToDisk();

    // Notify Course Coordinator (Auditee)
    pushNotification(
      "Internal Audit Schedule Announced",
      `Internal Audit (${audit.id}) for ${audit.process} scheduled for ${audit.scheduledDate}. Auditor: ${audit.internalAuditor?.name}.`,
      "owner"
    );

    // Notify Internal Auditor (Now they can conduct the audit and submit sheet to QMS)
    pushNotification(
      "Internal Audit Assignment - Ready for Execution",
      `Audit schedule for ${audit.process} (${audit.id}) has been shared. Please conduct audit inspection and submit Noticing Sheet to QMS Coordinator.`,
      "auditor"
    );

    // Notify Trust Head
    pushNotification(
      "Audit Schedule Dispatched",
      `Internal Audit (${audit.id}) schedule has been dispatched to all stakeholders.`,
      "Head"
    );

    // Notify QMS
    pushNotification(
      "Audit Schedule Dispatched to All",
      `Schedule for ${audit.process} (${audit.id}) shared with Course Coordinators, Trust Head, and Internal Auditors.`,
      "qm"
    );

    broadcastRealtimeEvent("audit_schedule_shared", {
      auditId: audit.id,
      title: audit.title,
      sharedBy: userName
    });

    res.json({
      success: true,
      message: `Audit schedule for ${audit.id} successfully shared with Course Coordinators, Trust Head, and Internal Auditors.`,
      data: audit
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/audit/:id/noticing-sheet - Internal Auditor shares Noticing Sheet to QMS Coordinator
export const submitNoticingSheet = (req, res) => {
  try {
    const audit = auditData.find((a) => a.id === req.params.id);
    if (!audit) {
      return res.status(404).json({ success: false, message: "Internal Audit not found" });
    }

    const userName = req.user?.name || audit.internalAuditor.name || "Internal Auditor";
    const userRole = req.user?.roleTitle || "Internal Auditor";
    const {
      sheetNo,
      summary,
      findings,
      fileName,
      fileData
    } = req.body;

    const parsedFindings = Array.isArray(findings) && findings.length > 0 ? findings : [
      {
        id: `NC-01`,
        type: "Minor NC",
        clause: "ISO 9001:2015 Clause 8.5.1",
        description: summary || "Process documentation record gap identified during sample verification.",
        targetDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      }
    ];

    audit.noticingSheet = {
      submitted: true,
      sheetNo: sheetNo || `NS-${new Date().getFullYear()}-${String(Math.floor(100 + Math.random() * 900))}`,
      submittedBy: `${userName} (${userRole})`,
      submittedAt: formatNow(),
      fileName: fileName || `Noticing_Sheet_${audit.id}.pdf`,
      fileData: fileData || null,
      summary: summary || "Auditing completed across operational records. Identified actionable non-conformance items.",
      findings: parsedFindings
    };

    audit.status = "Noticing Sheet Submitted";
    audit.stage = 4;
    audit.stageLabel = "Noticing Sheet Submitted (Under QMS Review)";

    audit.timeline.push({
      action: "Noticing Sheet Submitted",
      actor: `${userName} (${userRole})`,
      timestamp: formatNow(),
      details: `Internal Auditor submitted Noticing Sheet (${audit.noticingSheet.sheetNo}) to QMS Coordinator only.`
    });
    saveAuditsToDisk();

    // Automatically send notification to QMS Coordinator ONLY
    pushNotification(
      "Noticing Sheet Submitted by Auditor",
      `Internal Auditor (${userName}) submitted Noticing Sheet for ${audit.process} (${audit.id}). Please review and share NC Docs.`,
      "qm"
    );

    broadcastRealtimeEvent("noticing_sheet_submitted", {
      auditId: audit.id,
      title: audit.title,
      submittedBy: userName
    });

    res.json({
      success: true,
      message: "Noticing Sheet submitted and shared with QMS Coordinator for review.",
      data: audit
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/audit/:id/share-nc-docs - QMS Coordinator reviews & shares NC docs to Auditor & Auditee
export const shareNCDocs = (req, res) => {
  try {
    const audit = auditData.find((a) => a.id === req.params.id);
    if (!audit) {
      return res.status(404).json({ success: false, message: "Internal Audit not found" });
    }

    const userName = req.user?.name || "Rahul Kumar";
    const userRole = req.user?.roleTitle || "QMS Coordinator";
    const { remarks, fileName } = req.body;

    audit.ncDocs = {
      shared: true,
      sharedBy: `${userName} (${userRole})`,
      sharedAt: formatNow(),
      fileName: fileName || `NC_Formal_Notice_${audit.id}.pdf`,
      remarks: remarks || "Noticing Sheet reviewed and validated. Formal Non-Conformance notice issued to Auditee for corrective action.",
      sharedWith: [
        { role: "Internal Auditor", name: audit.internalAuditor.name, email: audit.internalAuditor.email },
        { role: "Internal Auditee (Course Coordinator)", name: audit.internalAuditee.name, email: audit.internalAuditee.email }
      ]
    };

    audit.status = "NC Docs Shared";
    audit.stage = 5;
    audit.stageLabel = "NC Docs Shared (Action Required: Auditee CAPA)";

    audit.timeline.push({
      action: "NC Docs Shared",
      actor: `${userName} (${userRole})`,
      timestamp: formatNow(),
      details: `QMS Coordinator reviewed Noticing Sheet and shared official NC Docs with ${audit.internalAuditee.name} (Auditee) and ${audit.internalAuditor.name} (Auditor).`
    });
    saveAuditsToDisk();

    // Notify Auditee (Course Coordinator) to take corrective action and close
    pushNotification(
      "NC Docs Issued - Corrective Action Required",
      `QMS Coordinator has issued NC Docs for ${audit.process} (${audit.id}). Please review findings, take corrective action, and close the NC.`,
      "owner"
    );

    // Notify Auditor
    pushNotification(
      "NC Docs Distributed to Auditee",
      `NC Docs for ${audit.process} (${audit.id}) have been issued to Course Coordinator by QMS Coordinator.`,
      "auditor"
    );

    broadcastRealtimeEvent("nc_docs_shared", {
      auditId: audit.id,
      title: audit.title,
      sharedBy: userName
    });

    res.json({
      success: true,
      message: "NC Documents successfully shared to Internal Auditor and Auditee.",
      data: audit
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/audit/:id/auditee-close - Auditee implements corrective action & closes NC
export const auditeeClose = (req, res) => {
  try {
    const audit = auditData.find((a) => a.id === req.params.id);
    if (!audit) {
      return res.status(404).json({ success: false, message: "Internal Audit not found" });
    }

    const userName = req.user?.name || audit.internalAuditee.name || "Course Coordinator";
    const userRole = req.user?.roleTitle || "Course Coordinator";
    const {
      rootCause,
      correctiveAction,
      evidenceFileName,
      remarks
    } = req.body;

    if (!correctiveAction) {
      return res.status(400).json({ success: false, message: "Corrective Action taken description is required." });
    }

    audit.auditeeClosure = {
      closed: true,
      closedBy: `${userName} (${userRole})`,
      closedAt: formatNow(),
      rootCause: rootCause || "Operational procedure delay during transition period.",
      correctiveAction,
      evidenceFileName: evidenceFileName || `CAPA_Evidence_${audit.id}.pdf`,
      remarks: remarks || "Corrective actions completed and validated. Passed to QMS Coordinator for final review."
    };

    audit.status = "Pending QMS Sign-off";
    audit.stage = 6;
    audit.stageLabel = "Process Closed by Auditee (Pending QMS Sign-off)";

    audit.timeline.push({
      action: "Audit Process Closed by Auditee",
      actor: `${userName} (${userRole})`,
      timestamp: formatNow(),
      details: `Corrective Action Plan & Evidence submitted by ${userRole}. Passed to QMS Coordinator for final sign-off.`
    });
    saveAuditsToDisk();

    // Notify QMS Coordinator for final sign-off and all stakeholders
    pushNotification(
      "Audit Process Closed by Auditee - Final Sign-off Required",
      `Internal audit process for ${audit.process} (${audit.id}) has been closed by ${userName} with CAPA. Passed to QMS Coordinator for final sign-off.`,
      "qm"
    );
    pushNotification(
      "Audit Process Closed & Passed to QMS",
      `Internal audit process for ${audit.process} (${audit.id}) has been closed by ${userName} and passed to QMS Coordinator for final sign-off.`,
      "all"
    );

    broadcastRealtimeEvent("auditee_closed", {
      auditId: audit.id,
      title: audit.title,
      closedBy: userName
    });

    res.json({
      success: true,
      message: "Audit process closed by Auditee and passed to QMS Coordinator for final sign-off.",
      data: audit
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/audit/:id/final-close - QMS Coordinator closes audit, completing entire process
export const finalCloseAudit = (req, res) => {
  try {
    const audit = auditData.find((a) => a.id === req.params.id);
    if (!audit) {
      return res.status(404).json({ success: false, message: "Internal Audit not found" });
    }

    const userName = req.user?.name || "Rahul Kumar";
    const userRole = req.user?.roleTitle || "QMS Coordinator";
    const { remarks } = req.body;

    audit.qmsFinalClosure = {
      closed: true,
      closedBy: `${userName} (${userRole})`,
      closedAt: formatNow(),
      remarks: remarks || "All corrective action evidences thoroughly reviewed, verified with process logs, and found fully conforming with ISO 9001:2015. Audit officially closed.",
      completedAt: formatNow()
    };

    audit.status = "Completed";
    audit.stage = 7;
    audit.stageLabel = "Completed / Closed";

    audit.timeline.push({
      action: "Final Audit Closed",
      actor: `${userName} (${userRole})`,
      timestamp: formatNow(),
      details: `QMS Coordinator verified CAPA effectiveness and closed the entire audit process.`
    });
    saveAuditsToDisk();

    // Notify all stakeholders that the audit is officially completed
    pushNotification(
      "Internal Audit Completed & Officially Closed",
      `Internal Audit (${audit.id}) for ${audit.process} has been fully completed and closed by QMS Coordinator (${userName}). The entire audit workflow is complete.`,
      "all"
    );

    broadcastRealtimeEvent("audit_final_closed", {
      auditId: audit.id,
      title: audit.title,
      closedBy: userName
    });

    res.json({
      success: true,
      message: `Internal Audit ${audit.id} has been fully closed. The entire audit process is now completed!`,
      data: audit
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/audit/:id/download/:type - Download simulated official Audit Document / Certificate
export const downloadAuditDoc = (req, res) => {
  try {
    const audit = auditData.find((a) => a.id === req.params.id);
    if (!audit) {
      return res.status(404).json({ success: false, message: "Internal Audit not found" });
    }

    const type = req.params.type || "full";
    const fileName = `Audit_${audit.id}_${type.toUpperCase()}.txt`;

    const reportContent = `
================================================================================
          CENTRE FOR DEVELOPMENT OF ADVANCED COMPUTING (C-DAC)
              QUALITY MANAGEMENT SYSTEM - INTERNAL QUALITY AUDIT (IQA)
================================================================================

AUDIT REFERENCE:       ${audit.id}
AUDIT TITLE:           ${audit.title}
PROCESS AUDITED:       ${audit.process}
SCHEDULED DATES:       ${audit.scheduledDate}
VENUE / MODE:          ${audit.venue}
CURRENT STAGE:         Stage ${audit.stage}/7 - ${audit.stageLabel}
OVERALL STATUS:        ${audit.status.toUpperCase()}

--------------------------------------------------------------------------------
KEY STAKEHOLDERS & PARTICIPANTS
--------------------------------------------------------------------------------
* QMS Coordinator:     ${audit.scheduledBy?.name || "Rahul Kumar"}
* Trust Head:          ${audit.trustHeadConfirmation?.confirmedBy || "Trust Head"}
* Internal Auditor:    ${audit.internalAuditor?.name} (${audit.internalAuditor?.department})
* Internal Auditee:    ${audit.internalAuditee?.name} (${audit.internalAuditee?.department})

--------------------------------------------------------------------------------
1. AUDIT SCOPE & OBJECTIVES
--------------------------------------------------------------------------------
${audit.scope}

--------------------------------------------------------------------------------
2. SCHEDULE SHARING & TRUST HEAD CONFIRMATION
--------------------------------------------------------------------------------
* Schedule Dispatched: ${audit.scheduleShared ? `Yes, on ${audit.scheduleShared.sharedAt} by ${audit.scheduleShared.sharedBy}` : "Pending Dispatch"}
* Trust Head Status:   ${audit.trustHeadConfirmation ? `CONFIRMED on ${audit.trustHeadConfirmation.confirmedAt}` : "Pending Confirmation"}
* Trust Head Remarks:  ${audit.trustHeadConfirmation?.remarks || "N/A"}

--------------------------------------------------------------------------------
3. AUDIT FINDINGS & NOTICING SHEET (INTERNAL AUDITOR)
--------------------------------------------------------------------------------
* Noticing Sheet Ref:  ${audit.noticingSheet?.sheetNo || "N/A"}
* Submitted By:        ${audit.noticingSheet?.submittedBy || "N/A"} on ${audit.noticingSheet?.submittedAt || "N/A"}
* Summary:             ${audit.noticingSheet?.summary || "Audit not completed yet."}
* Findings & NCs:
${(audit.noticingSheet?.findings || []).map((f, i) => `   [${i + 1}] ${f.id} (${f.type}) - ${f.clause}: ${f.description}`).join("\n") || "   None"}

--------------------------------------------------------------------------------
4. FORMAL NC NOTICE & DISTRIBUTION (QMS COORDINATOR)
--------------------------------------------------------------------------------
* NC Notice Shared:    ${audit.ncDocs ? `Yes, on ${audit.ncDocs.sharedAt} by ${audit.ncDocs.sharedBy}` : "Pending Review"}
* QMS Remarks:         ${audit.ncDocs?.remarks || "N/A"}

--------------------------------------------------------------------------------
5. AUDITEE CORRECTIVE ACTION & CLOSURE (AUDITEE)
--------------------------------------------------------------------------------
* Closure Status:      ${audit.auditeeClosure ? `SUBMITTED on ${audit.auditeeClosure.closedAt} by ${audit.auditeeClosure.closedBy}` : "Pending Auditee Action"}
* Root Cause Analysis: ${audit.auditeeClosure?.rootCause || "N/A"}
* Corrective Action:   ${audit.auditeeClosure?.correctiveAction || "N/A"}
* Evidence Attached:   ${audit.auditeeClosure?.evidenceFileName || "N/A"}

--------------------------------------------------------------------------------
6. FINAL AUDIT CLOSURE & QMS SIGN-OFF
--------------------------------------------------------------------------------
* Final Sign-off:      ${audit.qmsFinalClosure ? `OFFICIALLY CLOSED on ${audit.qmsFinalClosure.closedAt} by ${audit.qmsFinalClosure.closedBy}` : "In Progress"}
* Final QMS Remarks:   ${audit.qmsFinalClosure?.remarks || "Awaiting final QMS sign-off."}

--------------------------------------------------------------------------------
AUDIT TRAIL & LOGS
--------------------------------------------------------------------------------
${audit.timeline.map((t, idx) => `[${idx + 1}] ${t.timestamp} | ${t.action} | ${t.actor}\n    -> ${t.details}`).join("\n")}

================================================================================
Certified ISO 9001:2015 Quality Record • Electronically Signed & Verified
================================================================================
`;

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.send(reportContent);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
