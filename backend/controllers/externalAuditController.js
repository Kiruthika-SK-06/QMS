import fs from "fs";
import path from "path";
import os from "os";
import jwt from "jsonwebtoken";
import { externalAuditData } from "../data/externalAudit.js";
import { notificationsData } from "../data/notifications.js";
import { activitiesData } from "../data/activities.js";
import { broadcastRealtimeEvent } from "../utils/realtime.js";

const TMP_EXTERNAL_AUDIT_STORE = path.join(os.tmpdir(), "qms_external_audits_store.json");

const loadFromDisk = () => {
  try {
    if (fs.existsSync(TMP_EXTERNAL_AUDIT_STORE)) {
      const content = fs.readFileSync(TMP_EXTERNAL_AUDIT_STORE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const map = new Map();
        parsed.forEach((a) => a && a.id && map.set(a.id, a));
        externalAuditData.forEach((a) => a && a.id && !map.has(a.id) && map.set(a.id, a));
        const merged = Array.from(map.values());
        externalAuditData.length = 0;
        externalAuditData.push(...merged);
      }
    }
  } catch {}
};

const saveToDisk = () => {
  try {
    fs.writeFileSync(TMP_EXTERNAL_AUDIT_STORE, JSON.stringify(externalAuditData), "utf-8");
  } catch {}
};

loadFromDisk();

const notifyChange = (action, audit) => {
  try {
    saveToDisk();
    broadcastRealtimeEvent("EXTERNAL_AUDIT_UPDATED", { action, audit });
  } catch (err) {
    console.error("Real-time External Audit broadcast error:", err);
  }
};

const formatNow = () =>
  new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

// Deterministic sort: New external audits first, dummy ones below
export const sortExternalAuditsList = (list) => {
  if (!Array.isArray(list)) return [];
  const dummyIds = new Set(["EA-2026-001", "EA-2026-002", "EA-2026-003"]);

  return [...list].sort((a, b) => {
    const aIsNew = a.isNew === true || (!dummyIds.has(a.id) && !a.id?.endsWith("-001") && !a.id?.endsWith("-002") && !a.id?.endsWith("-003"));
    const bIsNew = b.isNew === true || (!dummyIds.has(b.id) && !b.id?.endsWith("-001") && !b.id?.endsWith("-002") && !b.id?.endsWith("-003"));

    if (aIsNew && !bIsNew) return -1;
    if (!aIsNew && bIsNew) return 1;

    if (aIsNew && bIsNew) {
      const aTime = a.createdAt || 0;
      const bTime = b.createdAt || 0;
      if (bTime !== aTime) return bTime - aTime;
      return (b.id || "").localeCompare(a.id || "");
    }

    return (a.id || "").localeCompare(b.id || "");
  });
};

// GET /api/external-audit
export const getAllExternalAudits = (req, res) => {
  try {
    loadFromDisk();
    const { status, stage, role } = req.query;
    let userRole = role;

    if (!userRole && req.headers?.["authorization"]) {
      try {
        const token = req.headers["authorization"].split(" ")[1];
        if (token && token.startsWith("session-token-")) {
          userRole = token.split("-")[2];
        } else if (token) {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || "qms_jwt_secret_key_super_secure_2026");
          if (decoded) userRole = decoded.role;
        }
      } catch {}
    }
    userRole = (req.user?.role || req.headers?.["x-user-role"] || req.headers?.["x-demo-role"] || userRole || "").toLowerCase();

    let list = [...externalAuditData];

    // Non-QMS users (Course Coordinator, Trust Head, Internal Auditor)
    // only see external audits once QMS Coordinator shares the schedule (stage >= 2)
    if (userRole === "owner" || userRole === "head" || userRole === "auditor") {
      list = list.filter((a) => a.stage >= 2);
    }

    // Role-specific field privacy:
    // User requirement: NC docs are shared with Course Coordinators ONLY.
    // Internal Auditor and Trust Head see the external audit, but detailed course NC assignments are restricted to Course Coordinators.
    if (userRole === "auditor" || userRole === "head") {
      list = list.map((a) => {
        if (a.ncDocument) {
          return {
            ...a,
            ncDocument: {
              ...a.ncDocument,
              // Keep high-level summary but restrict individual course action delegations
              isRestrictedForRole: true
            }
          };
        }
        return a;
      });
    }

    if (status) {
      list = list.filter((a) => (a.status || "").toLowerCase() === status.toLowerCase());
    }
    if (stage) {
      list = list.filter((a) => String(a.stage) === String(stage));
    }

    const sorted = sortExternalAuditsList(list);
    res.json({ success: true, count: sorted.length, data: sorted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/external-audit/sync
export const syncExternalAudits = (req, res) => {
  try {
    const { audits } = req.body;
    if (Array.isArray(audits) && audits.length > 0) {
      loadFromDisk();
      const map = new Map();
      externalAuditData.forEach((a) => a && a.id && map.set(a.id, a));
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
      externalAuditData.length = 0;
      externalAuditData.push(...Array.from(map.values()));
      saveToDisk();
    }
    res.json({ success: true, count: externalAuditData.length, data: externalAuditData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/external-audit - Step 1: QMS Coordinator logs incoming External Audit schedule email
export const logIncomingExternalAuditSchedule = (req, res) => {
  try {
    loadFromDisk();
    const {
      id,
      title,
      scope,
      externalAgency,
      leadAuditor,
      targetPeriod,
      scheduledDate,
      scheduledTime,
      venue,
      department,
      process,
      incomingScheduleEmail
    } = req.body;

    if (!title || !title.trim() || !scheduledDate) {
      return res.status(400).json({
        success: false,
        message: "External Audit title and scheduled date are required."
      });
    }

    const auditId = id || `EA-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`;
    const auditorName = leadAuditor?.name || "Dr. Robert Vance";
    const agencyName = externalAgency || "TÜV SÜD South Asia Certification Body";

    const newAudit = {
      id: auditId,
      isNew: true,
      createdAt: req.body.createdAt || Date.now(),
      title: title.trim(),
      scope: (scope || "Annual ISO 9001:2015 Surveillance Audit covering academic delivery, laboratory procedures, and quality standard conformity.").trim(),
      externalAgency: agencyName,
      leadAuditor: {
        name: auditorName,
        title: leadAuditor?.title || "Lead External Auditor (ISO 9001:2015)",
        agency: agencyName,
        email: leadAuditor?.email || "lead.auditor@tuvsud.com",
        phone: leadAuditor?.phone || "+91 98230 45678"
      },
      targetPeriod: targetPeriod || "November 2026",
      scheduledDate,
      scheduledTime: scheduledTime || "09:30 AM",
      venue: venue || "Main Boardroom / Hybrid Video Conference",
      department: department || "Quality Assurance & Compliance",
      process: process || "All Processes (Comprehensive Academic Quality Review)",
      stage: 1,
      status: "Audit Schedule Received (from External Auditor)",

      incomingScheduleEmail: {
        received: true,
        receivedAt: formatNow(),
        from: `${auditorName} <${leadAuditor?.email || "lead.auditor@certification-agency.org"}>`,
        to: "Rahul Kumar (QMS Coordinator) <qm@cdac.in>",
        subject: incomingScheduleEmail?.subject || `Official Notice: ISO 9001:2015 External Audit Schedule (${auditId})`,
        bodyHtml: incomingScheduleEmail?.bodyHtml || `<p>Dear Rahul Kumar (QMS Coordinator),</p><p>This email confirms that the ISO 9001:2015 External Audit for "${title.trim()}" is scheduled for <strong>${scheduledDate} at ${scheduledTime || "09:30 AM"}</strong>.</p><p>Please notify your course coordinators, trust head, and internal auditors.</p><p>Regards,<br/><strong>${auditorName}</strong> (${agencyName})</p>`,
        attachments: [
          {
            fileName: incomingScheduleEmail?.fileName || `ISO_9001_External_Audit_Plan_${auditId}.pdf`,
            fileSize: "1.8 MB",
            fileType: "application/pdf"
          }
        ]
      },

      shareWithStakeholders: null,
      ncDocument: null,
      externalAuditorApproval: null,
      qmsClosure: null,

      timeline: [
        {
          action: "Audit Schedule Received via Email",
          actor: `${auditorName} (External Auditor - ${agencyName})`,
          timestamp: formatNow(),
          details: `External audit schedule and plan received via email by QMS Coordinator. Scheduled for ${scheduledDate} at ${scheduledTime || "09:30 AM"}.`
        }
      ]
    };

    const existingIdx = externalAuditData.findIndex((a) => a && a.id === newAudit.id);
    if (existingIdx >= 0) {
      externalAuditData[existingIdx] = { ...externalAuditData[existingIdx], ...newAudit };
    } else {
      externalAuditData.unshift(newAudit);
    }

    saveToDisk();

    // Push notification to QMS Coordinator confirming logging
    notificationsData.unshift({
      id: Date.now(),
      title: "External Audit Schedule Logged",
      text: `Incoming audit schedule from ${auditorName} (${agencyName}) logged. You can now share it to Course Coordinators, Trust Head, and Internal Auditor.`,
      time: "Just now",
      targetRole: "qm",
      read: false,
      createdAt: new Date().toISOString()
    });

    activitiesData.unshift({
      id: `ACT-${Date.now()}`,
      title: "External Audit Email Received",
      detail: newAudit.title,
      text: `External Auditor schedule received from ${auditorName} for ${scheduledDate}.`,
      actor: "Rahul Kumar (QMS Coordinator)",
      time: "Just now",
      tone: "blue",
      timestamp: new Date().toISOString()
    });

    notifyChange("EXTERNAL_AUDIT_CREATED", newAudit);

    res.status(201).json({
      success: true,
      message: "External Audit schedule received and logged successfully",
      data: newAudit
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/external-audit/:id/share-schedule - Step 2: QMS Coordinator shares to Course Coordinators, Trust Head, and Internal Auditor
export const shareExternalAuditSchedule = (req, res) => {
  try {
    loadFromDisk();
    const audit = externalAuditData.find((a) => a.id === req.params.id);
    if (!audit) {
      return res.status(404).json({ success: false, message: "External Audit not found" });
    }

    const { noticeSubject, noticeMessage } = req.body;
    const now = formatNow();

    audit.stage = 2;
    audit.status = "Schedule Shared to All Stakeholders";
    audit.shareWithStakeholders = {
      shared: true,
      sharedAt: now,
      sharedBy: "Rahul Kumar (QMS Coordinator)",
      noticeSubject: noticeSubject || `External Audit Schedule Notice: ${audit.title} on ${audit.scheduledDate}`,
      noticeMessage: noticeMessage || `All Course Coordinators, Trust Head, and Internal Auditor: Please be informed that ${audit.externalAgency} has scheduled an ISO 9001:2015 External Audit on ${audit.scheduledDate} at ${audit.scheduledTime}. Please prepare course files, lab records, and compliance manuals.`,
      recipients: [
        { role: "Trust Head", name: "Anita Rao", email: "head@cdac.in" },
        { role: "Course Coordinator", name: "Priya Sharma", email: "coordinator@cdac.in" },
        { role: "Course Coordinator", name: "Dr. Rajesh Verma", email: "rajesh.verma@cdac.in" },
        { role: "Course Coordinator", name: "Sunita Patil", email: "sunita.patil@cdac.in" },
        { role: "Internal Auditor", name: "Suresh Menon", email: "auditor@cdac.in" }
      ]
    };

    audit.timeline.push({
      action: "Schedule & Meeting Details Shared to All Stakeholders",
      actor: "Rahul Kumar (QMS Coordinator)",
      timestamp: now,
      details: `Dispatched received email & meeting schedule to all Course Coordinators, Trust Head Anita Rao, and Internal Auditor Suresh Menon.`
    });

    saveToDisk();

    // Broadcast notifications to all stakeholders
    const roles = ["Head", "owner", "auditor"];
    roles.forEach((r, idx) => {
      notificationsData.unshift({
        id: Date.now() + idx,
        title: "Official External Audit Scheduled",
        text: `QMS Coordinator shared External Audit details for "${audit.title}" on ${audit.scheduledDate} at ${audit.scheduledTime}. Please review the schedule and agenda.`,
        time: "Just now",
        targetRole: r,
        read: false,
        createdAt: new Date().toISOString()
      });
    });

    activitiesData.unshift({
      id: `ACT-${Date.now()}`,
      title: "External Audit Schedule Dispatched",
      detail: audit.title,
      text: `External audit meeting schedule shared to all Course Coordinators, Trust Head, and Internal Auditor.`,
      actor: "Rahul Kumar (QMS Coordinator)",
      time: "Just now",
      tone: "purple",
      timestamp: new Date().toISOString()
    });

    notifyChange("EXTERNAL_AUDIT_SHARED", audit);

    res.json({
      success: true,
      message: "External Audit schedule and received email successfully shared to all Course Coordinators, Trust Head, and Internal Auditor",
      data: audit
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/external-audit/:id/upload-nc - Step 3: QMS Coordinator uploads NC document and shares to Course Coordinators ONLY
export const uploadExternalAuditNCDocs = (req, res) => {
  try {
    loadFromDisk();
    const audit = externalAuditData.find((a) => a.id === req.params.id);
    if (!audit) {
      return res.status(404).json({ success: false, message: "External Audit not found" });
    }

    const {
      fileName,
      fileSize,
      summary,
      targetClosureDate,
      findings
    } = req.body;

    const now = formatNow();

    audit.stage = 3;
    audit.status = "NC Docs Shared with Course Coordinators";
    audit.ncDocument = {
      receivedFromExternalAuditor: true,
      receivedAt: now,
      uploadedAt: now,
      uploadedBy: "Rahul Kumar (QMS Coordinator)",
      sharedWithCourseCoordinatorsOnly: true,
      fileName: fileName || `${audit.id}_External_Audit_NC_Report.pdf`,
      fileSize: fileSize || "2.1 MB",
      fileType: "application/pdf",
      summary: summary || "Non-conformance report issued by External Auditor covering practical curriculum alignment and lab log verifications.",
      targetClosureDate: targetClosureDate || "2026-12-15",
      findings: Array.isArray(findings) && findings.length > 0 ? findings : [
        {
          id: `NC-EXT-${Date.now().toString().slice(-2)}`,
          type: "Minor Non-Conformance",
          clause: "ISO 9001:2015 Clause 8.5.1",
          description: "Course delivery schedules and practical lab exercise counter-signatures require standard digital archiving.",
          assignedTo: "Priya Sharma (Course Coordinator)",
          deadline: targetClosureDate || "2026-12-15",
          status: "Pending Action"
        }
      ]
    };

    audit.timeline.push({
      action: "NC Documents Received & Shared to Course Coordinators Only",
      actor: "Rahul Kumar (QMS Coordinator)",
      timestamp: now,
      details: `NC Report (${audit.ncDocument.fileName}) received from External Auditor via email. Uploaded and shared exclusively to Course Coordinators for corrective action.`
    });

    saveToDisk();

    // Push notification to Course Coordinators ONLY (user requirement)
    notificationsData.unshift({
      id: Date.now(),
      title: "External Audit NC Document Issued",
      text: `External Auditor submitted Non-Conformance report for "${audit.title}". QMS Coordinator uploaded the report for Course Coordinators. Please prepare Corrective Actions.`,
      time: "Just now",
      targetRole: "owner",
      read: false,
      createdAt: new Date().toISOString()
    });

    activitiesData.unshift({
      id: `ACT-${Date.now()}`,
      title: "External NC Report Shared",
      detail: audit.title,
      text: `External audit NC document uploaded and shared to Course Coordinators for corrective action.`,
      actor: "Rahul Kumar (QMS Coordinator)",
      time: "Just now",
      tone: "amber",
      timestamp: new Date().toISOString()
    });

    notifyChange("EXTERNAL_AUDIT_NC_UPLOADED", audit);

    res.json({
      success: true,
      message: "NC document uploaded and shared to Course Coordinators only",
      data: audit
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/external-audit/:id/close - Step 4: Approved by External Auditor & Closed by QMS Coordinator
export const closeExternalAuditProcess = (req, res) => {
  try {
    loadFromDisk();
    const audit = externalAuditData.find((a) => a.id === req.params.id);
    if (!audit) {
      return res.status(404).json({ success: false, message: "External Audit not found" });
    }

    const {
      certificateNumber,
      recommendation,
      remarks,
      approvalDate
    } = req.body;

    const now = formatNow();
    const certNum = certificateNumber || `ISO9001-${audit.externalAgency.slice(0, 3).toUpperCase()}-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

    audit.stage = 4;
    audit.status = "Completed & Closed (ISO 9001 Certified)";
    audit.externalAuditorApproval = {
      approved: true,
      approvedAt: approvalDate || now,
      decision: "Certified & Conformance Endorsed",
      certificateNumber: certNum,
      recommendation: recommendation || "Unconditional recommendation for issuance and continuation of ISO 9001:2015 Quality Management Certificate.",
      remarks: remarks || "External Auditor verified all corrective actions. Audit officially cleared with ISO 9001:2015 compliance endorsed.",
      externalLetterFileName: `${audit.id}_ISO9001_Certification_Clearance.pdf`
    };

    audit.qmsClosure = {
      closed: true,
      closedAt: now,
      closedBy: "Rahul Kumar (QMS Coordinator)",
      remarks: "External Audit lifecycle completed and closed in full conformance with ISO 9001:2015."
    };

    audit.timeline.push({
      action: "Audit Approved by External Auditor",
      actor: `${audit.leadAuditor?.name || "Lead External Auditor"} (${audit.externalAgency})`,
      timestamp: approvalDate || now,
      details: `External Auditor approved resolution and endorsed ISO 9001:2015 Certificate (${certNum}).`
    });

    audit.timeline.push({
      action: "External Audit Process Officially Closed",
      actor: "Rahul Kumar (QMS Coordinator)",
      timestamp: now,
      details: `Full process closed by QMS Coordinator. Quality Management System ISO 9001:2015 certification ratified for all divisions.`
    });

    saveToDisk();

    // Broadcast celebration notification to ALL stakeholders
    ["Head", "owner", "qm", "auditor"].forEach((r, idx) => {
      notificationsData.unshift({
        id: Date.now() + idx,
        title: "External Audit Successfully Closed - ISO 9001 Certified!",
        text: `External Auditor approved "${audit.title}" with Certificate ${certNum}. The entire process is officially closed by QMS Coordinator.`,
        time: "Just now",
        targetRole: r,
        read: false,
        createdAt: new Date().toISOString()
      });
    });

    activitiesData.unshift({
      id: `ACT-${Date.now()}`,
      title: "ISO 9001 External Audit Closed",
      detail: audit.title,
      text: `External audit approved by External Auditor and officially closed with ISO 9001:2015 certification (${certNum}).`,
      actor: "Rahul Kumar (QMS Coordinator)",
      time: "Just now",
      tone: "green",
      timestamp: new Date().toISOString()
    });

    notifyChange("EXTERNAL_AUDIT_CLOSED", audit);

    res.json({
      success: true,
      message: "External Audit process approved by External Auditor and successfully closed by QMS Coordinator",
      data: audit
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
