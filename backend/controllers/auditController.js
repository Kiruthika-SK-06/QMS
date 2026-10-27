import { auditData } from "../data/audits.js";
import { notifyAllUsers } from "../utils/realtime.js";

const formatNow = () => {
  const d = new Date();
  return d.toISOString().replace("T", " ").substring(0, 19);
};

// GET /api/audit
export const getAllAudits = (req, res) => {
  try {
    const sorted = [...auditData].sort((a, b) => b.id.localeCompare(a.id));
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

// POST /api/audit - Schedule New Internal Audit (QMS Coordinator)
export const createAudit = (req, res) => {
  try {
    const {
      title,
      process,
      processId,
      startDate,
      endDate,
      internalAuditor,
      internalAuditee,
      scope,
      venue,
      notes
    } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: "Audit start and end dates are required." });
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
    const id = `IA-${year}-${seq}`;

    const scheduledDateStr = startDate === endDate ? startDate : `${startDate} to ${endDate}`;
    const auditorName = internalAuditor.name;
    const auditeeName = internalAuditee.name;
    const scheduledByName = req.user?.name || "Rahul Kumar";
    const scheduledByRole = req.user?.roleTitle || "QMS Coordinator";

    const newAudit = {
      id,
      title: title || `${process} Internal Quality Audit`,
      process,
      processId: processId || "PROC-01",
      auditDates: {
        startDate,
        endDate
      },
      scheduledDate: scheduledDateStr,
      internalAuditor: {
        id: internalAuditor.id || "IA001",
        name: auditorName,
        role: internalAuditor.role || "Internal Auditor",
        email: internalAuditor.email || "auditor@cdac.in",
        department: internalAuditor.department || "Internal Quality Audit Cell"
      },
      internalAuditee: {
        id: internalAuditee.id || "CC001",
        name: auditeeName,
        role: internalAuditee.role || "Course Coordinator",
        email: internalAuditee.email || "coordinator@cdac.in",
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
      status: "Scheduled",
      stage: 1,
      stageLabel: "Draft Scheduled (Ready to Share)",

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
          details: `Scheduled ${process} audit for ${scheduledDateStr}. Assigned Auditor: ${auditorName}, Auditee: ${auditeeName}.`
        }
      ]
    };

    auditData.unshift(newAudit);

    notifyAllUsers("audit_scheduled", {
      auditId: newAudit.id,
      process: newAudit.process,
      title: newAudit.title,
      scheduledBy: scheduledByName
    });

    res.status(201).json({
      success: true,
      message: `Internal Audit ${newAudit.id} scheduled successfully. You can now share the schedule docs.`,
      data: newAudit
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/audit/:id/share-schedule - QMS Coordinator shares schedule to Auditee, Trust Head & Auditor
export const shareSchedule = (req, res) => {
  try {
    const audit = auditData.find((a) => a.id === req.params.id);
    if (!audit) {
      return res.status(404).json({ success: false, message: "Internal Audit not found" });
    }

    const userName = req.user?.name || "Rahul Kumar";
    const userRole = req.user?.roleTitle || "QMS Coordinator";

    const shareInfo = {
      shared: true,
      sharedAt: formatNow(),
      sharedBy: `${userName} (${userRole})`,
      docTitle: `Internal_Audit_Schedule_${audit.id}.pdf`,
      recipients: [
        {
          role: "Course Coordinator (Auditee)",
          name: audit.internalAuditee.name,
          email: audit.internalAuditee.email
        },
        {
          role: "Trust Head",
          name: "Anita Rao",
          email: "trusthead@cdac.in"
        },
        {
          role: "Internal Auditor",
          name: audit.internalAuditor.name,
          email: audit.internalAuditor.email
        }
      ]
    };

    audit.scheduleShared = shareInfo;
    audit.status = "Schedule Shared";
    audit.stage = 2;
    audit.stageLabel = "Schedule Shared (Awaiting Trust Head Confirmation)";

    audit.timeline.push({
      action: "Schedule Docs Shared",
      actor: `${userName} (${userRole})`,
      timestamp: formatNow(),
      details: `Audit schedule notification and documents dispatched to ${audit.internalAuditee.name} (Auditee), Anita Rao (Trust Head), and ${audit.internalAuditor.name} (Auditor).`
    });

    notifyAllUsers("audit_schedule_shared", {
      auditId: audit.id,
      title: audit.title,
      process: audit.process,
      sharedBy: userName
    });

    res.json({
      success: true,
      message: `Audit schedule successfully shared with Course Coordinator, Trust Head, and Internal Auditor.`,
      data: audit
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/audit/:id/confirm-schedule - Trust Head confirms audit schedule
export const confirmSchedule = (req, res) => {
  try {
    const audit = auditData.find((a) => a.id === req.params.id);
    if (!audit) {
      return res.status(404).json({ success: false, message: "Internal Audit not found" });
    }

    const userName = req.user?.name || "Anita Rao";
    const userRole = req.user?.roleTitle || "Trust Head";
    const remarks = req.body?.remarks || "Audit schedule ratified. Authorized to conduct quality inspection.";

    audit.trustHeadConfirmation = {
      confirmed: true,
      confirmedBy: userName,
      confirmedRole: userRole,
      confirmedAt: formatNow(),
      remarks
    };

    audit.status = "Schedule Confirmed";
    audit.stage = 2.5;
    audit.stageLabel = "Schedule Confirmed (Audit In Progress)";

    audit.timeline.push({
      action: "Schedule Confirmed by Trust Head",
      actor: `${userName} (${userRole})`,
      timestamp: formatNow(),
      details: `Trust Head confirmed the audit schedule. Remarks: "${remarks}"`
    });

    notifyAllUsers("audit_schedule_confirmed", {
      auditId: audit.id,
      title: audit.title,
      confirmedBy: userName
    });

    res.json({
      success: true,
      message: "Audit schedule confirmed by Trust Head. Internal Auditor can now proceed with audit execution.",
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

    const userName = req.user?.name || audit.internalAuditor.name || "Vikas Deshmukh";
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
    audit.stage = 3;
    audit.stageLabel = "Noticing Sheet Submitted (Under QMS Review)";

    audit.timeline.push({
      action: "Noticing Sheet Submitted",
      actor: `${userName} (${userRole})`,
      timestamp: formatNow(),
      details: `Internal Auditor shared Noticing Sheet (${audit.noticingSheet.sheetNo}) with ${parsedFindings.length} findings to QMS Coordinator.`
    });

    notifyAllUsers("noticing_sheet_submitted", {
      auditId: audit.id,
      title: audit.title,
      submittedBy: userName,
      ncCount: parsedFindings.length
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
      remarks: remarks || "Noticing Sheet reviewed and validated. Formal Non-Conformance notice issued to Auditee for corrective and preventive action (CAPA).",
      sharedWith: [
        { role: "Internal Auditor", name: audit.internalAuditor.name, email: audit.internalAuditor.email },
        { role: "Internal Auditee (Course Coordinator)", name: audit.internalAuditee.name, email: audit.internalAuditee.email }
      ]
    };

    audit.status = "NC Docs Shared";
    audit.stage = 4;
    audit.stageLabel = "NC Docs Shared (Action Required by Auditee)";

    audit.timeline.push({
      action: "NC Docs Shared",
      actor: `${userName} (${userRole})`,
      timestamp: formatNow(),
      details: `QMS Coordinator reviewed Noticing Sheet and shared official NC Docs with ${audit.internalAuditee.name} (Auditee) and ${audit.internalAuditor.name} (Auditor).`
    });

    notifyAllUsers("nc_docs_shared", {
      auditId: audit.id,
      title: audit.title,
      sharedBy: userName,
      auditee: audit.internalAuditee.name
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

    const userName = req.user?.name || audit.internalAuditee.name || "Priya Sharma";
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
      remarks: remarks || "Corrective actions completed and validated. Submitted for QMS Coordinator final review."
    };

    audit.status = "Closed by Auditee";
    audit.stage = 5;
    audit.stageLabel = "Closed by Auditee (Pending QMS Final Close)";

    audit.timeline.push({
      action: "Auditee Closure Submitted",
      actor: `${userName} (${userRole})`,
      timestamp: formatNow(),
      details: `Auditee submitted Corrective Action Plan & Evidence. Ready for QMS Coordinator final closure.`
    });

    notifyAllUsers("auditee_closed", {
      auditId: audit.id,
      title: audit.title,
      closedBy: userName
    });

    res.json({
      success: true,
      message: "Auditee closure submitted successfully. Awaiting QMS Coordinator final sign-off.",
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

    audit.status = "Closed";
    audit.stage = 6;
    audit.stageLabel = "Completed / Closed";

    audit.timeline.push({
      action: "Final Audit Closed",
      actor: `${userName} (${userRole})`,
      timestamp: formatNow(),
      details: `QMS Coordinator verified CAPA effectiveness and closed the entire audit lifecycle.`
    });

    notifyAllUsers("audit_final_closed", {
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
CURRENT STAGE:         Stage ${audit.stage}/6 - ${audit.stageLabel}
OVERALL STATUS:        ${audit.status.toUpperCase()}

--------------------------------------------------------------------------------
KEY STAKEHOLDERS & PARTICIPANTS
--------------------------------------------------------------------------------
* QMS Coordinator:     ${audit.scheduledBy?.name || "Rahul Kumar"}
* Trust Head:          ${audit.trustHeadConfirmation?.confirmedBy || "Anita Rao"}
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
