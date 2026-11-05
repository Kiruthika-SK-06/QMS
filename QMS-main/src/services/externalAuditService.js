// Frontend service for External Quality Audit (ISO 9001:2015) with cross-tab real-time sync and localStorage persistence
// Constraint: External Auditor has no system login or dashboard.
// External Auditor communicates strictly via external email with QMS Coordinator.
// QMS Coordinator initiates, shares, uploads NC docs to course coordinators only, and closes process.

import { initialExternalAuditList } from "../data/mockData";

const API_BASE = "/api/external-audit";

const formatNow = () => {
  const d = new Date();
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

function syncBackground(url, options = {}) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    fetch(url, { ...options, signal: controller.signal })
      .catch(() => {})
      .finally(() => clearTimeout(timeoutId));
  } catch {
    // Ignore offline errors
  }
}

// Deterministic sort: Newly logged/scheduled External Audits ALWAYS placed first, prebuilt dummy data below
export function sortExternalAudits(list) {
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
}

export function getStoredExternalAudits() {
  try {
    const saved = localStorage.getItem("qms_external_audits");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return sortExternalAudits(parsed);
    }
  } catch (e) {
    console.warn("Error reading qms_external_audits from localStorage", e);
  }
  return sortExternalAudits(initialExternalAuditList);
}

export function saveStoredExternalAudits(audits) {
  try {
    const sorted = sortExternalAudits(audits);
    localStorage.setItem("qms_external_audits", JSON.stringify(sorted));
    try {
      const channel = new BroadcastChannel("qms_external_audit_channel");
      channel.postMessage({ type: "EXTERNAL_AUDIT_UPDATE", audits: sorted });
      channel.close();
    } catch {}

    syncBackground(`${API_BASE}/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audits: sorted })
    });
  } catch (e) {
    console.warn("Error saving qms_external_audits to localStorage", e);
  }
}

export function mergeExternalAudits(serverList, localList) {
  if (!Array.isArray(localList) || localList.length === 0) return sortExternalAudits(Array.isArray(serverList) ? serverList : []);
  if (!Array.isArray(serverList) || serverList.length === 0) return sortExternalAudits(localList);

  const map = new Map();
  for (const local of localList) {
    if (local && local.id) map.set(local.id, local);
  }

  for (const server of serverList) {
    if (!server || !server.id) continue;
    const local = map.get(server.id);
    if (!local) {
      map.set(server.id, server);
    } else {
      const localStage = typeof local.stage === "number" ? local.stage : 1;
      const serverStage = typeof server.stage === "number" ? server.stage : 1;
      if (serverStage >= localStage) {
        map.set(server.id, { ...local, ...server, stage: serverStage });
      } else {
        map.set(server.id, { ...server, ...local, stage: localStage });
      }
    }
  }

  return sortExternalAudits(Array.from(map.values()));
}

export const externalAuditService = {
  getStoredExternalAudits,
  saveStoredExternalAudits,
  mergeExternalAudits,

  async fetchExternalAudits(token, role) {
    const cached = getStoredExternalAudits();
    let currentRole = role;
    if (!currentRole) {
      try {
        const u = JSON.parse(localStorage.getItem("qms_user") || "null");
        if (u?.role) currentRole = u.role;
      } catch {}
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(API_BASE, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(currentRole ? { "x-user-role": currentRole, "x-demo-role": currentRole } : {})
        },
        signal: controller.signal
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error("Failed to load External Audits list");
      const data = await res.json();
      if (Array.isArray(data.data) && data.data.length > 0) {
        const merged = mergeExternalAudits(data.data, cached);
        saveStoredExternalAudits(merged);
        return merged;
      }
      return cached;
    } catch {
      return cached;
    }
  },

  // 1. QMS Coordinator logs incoming External Audit schedule received via email
  async logReceivedSchedule(payload, token) {
    const currentList = getStoredExternalAudits();
    const year = new Date().getFullYear();
    const id = payload.id || `EA-${year}-${String(Date.now()).slice(-3)}`;
    const auditorName = payload.leadAuditor?.name || payload.auditorName || "Dr. Robert Vance";
    const agencyName = payload.externalAgency || "TÜV SÜD South Asia Certification Body";
    const scheduledDate = payload.scheduledDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const scheduledTime = payload.scheduledTime || "09:30 AM";
    const now = formatNow();

    const newAudit = {
      ...payload,
      id,
      isNew: true,
      createdAt: Date.now(),
      title: payload.title || `ISO 9001:2015 Annual External Surveillance Audit (${year})`,
      scope: payload.scope || "Comprehensive audit of academic course delivery, practical laboratory training, syllabus coverage, and ISO 9001:2015 Clauses 4-10 conformity.",
      externalAgency: agencyName,
      leadAuditor: {
        name: auditorName,
        title: payload.leadAuditor?.title || "Lead External Auditor (ISO 9001:2015)",
        agency: agencyName,
        email: payload.leadAuditor?.email || payload.auditorEmail || "lead.auditor@certification-agency.org",
        phone: payload.leadAuditor?.phone || "+91 98230 45678"
      },
      targetPeriod: payload.targetPeriod || "November 2026",
      scheduledDate,
      scheduledTime,
      venue: payload.venue || "Main Boardroom / Hybrid Video Conference",
      department: payload.department || "Quality Assurance & Compliance",
      process: payload.process || "All Processes (Comprehensive Academic Quality Review)",
      stage: 1,
      status: "Audit Schedule Received (from External Auditor)",

      incomingScheduleEmail: {
        received: true,
        receivedAt: now,
        from: `${auditorName} <${payload.leadAuditor?.email || payload.auditorEmail || "lead.auditor@certification-agency.org"}>`,
        to: "Rahul Kumar (QMS Coordinator) <qm@cdac.in>",
        subject: payload.emailSubject || `Official Notice: ISO 9001:2015 External Audit Schedule (${id})`,
        bodyHtml: payload.emailBody || `<p>Dear Rahul Kumar (QMS Coordinator),</p><p>This email serves as official confirmation that the ISO 9001:2015 External Audit for "${payload.title}" is scheduled on <strong>${scheduledDate} starting at ${scheduledTime}</strong>.</p><p>Please notify your course coordinators, trust head, and internal auditors. The detailed audit plan is attached.</p><p>Regards,<br/><strong>${auditorName}</strong> (${agencyName})</p>`,
        attachments: [
          {
            fileName: payload.planFileName || `ISO_9001_External_Audit_Plan_${id}.pdf`,
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
          timestamp: now,
          details: `External audit schedule received via email by QMS Coordinator. Scheduled for ${scheduledDate} at ${scheduledTime}.`
        }
      ]
    };

    const updatedList = sortExternalAudits([newAudit, ...currentList.filter((a) => a.id !== id)]);
    saveStoredExternalAudits(updatedList);

    syncBackground(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "qm",
        "x-demo-role": "qm",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(newAudit)
    });

    return newAudit;
  },

  // 2. QMS Coordinator shares received email & schedule to Course Coordinators, Trust Head, and Internal Auditor
  async shareScheduleToAll(id, { noticeSubject = "", noticeMessage = "" } = {}, token) {
    const currentList = getStoredExternalAudits();
    const existing = currentList.find((a) => a.id === id);
    if (!existing) return null;

    const now = formatNow();

    const updated = {
      ...existing,
      stage: 2,
      status: "Schedule Shared to All Stakeholders",
      shareWithStakeholders: {
        shared: true,
        sharedAt: now,
        sharedBy: "Rahul Kumar (QMS Coordinator)",
        noticeSubject: noticeSubject || `External Audit Schedule Notice: ${existing.title} on ${existing.scheduledDate}`,
        noticeMessage: noticeMessage || `All Course Coordinators, Trust Head, and Internal Auditor: Please be informed that ${existing.externalAgency} has scheduled an ISO 9001:2015 External Audit on ${existing.scheduledDate} at ${existing.scheduledTime}. Please prepare course files, lab records, and compliance manuals.`,
        recipients: [
          { role: "Trust Head", name: "Anita Rao", email: "head@cdac.in" },
          { role: "Course Coordinator", name: "Priya Sharma", email: "coordinator@cdac.in" },
          { role: "Course Coordinator", name: "Dr. Rajesh Verma", email: "rajesh.verma@cdac.in" },
          { role: "Course Coordinator", name: "Sunita Patil", email: "sunita.patil@cdac.in" },
          { role: "Internal Auditor", name: "Suresh Menon", email: "auditor@cdac.in" }
        ]
      },
      timeline: [
        ...(existing.timeline || []),
        {
          action: "Schedule & Meeting Details Shared to All Stakeholders",
          actor: "Rahul Kumar (QMS Coordinator)",
          timestamp: now,
          details: `Dispatched received email & meeting schedule to all Course Coordinators, Trust Head Anita Rao, and Internal Auditor Suresh Menon.`
        }
      ]
    };

    const updatedList = currentList.map((a) => (a.id === id ? updated : a));
    saveStoredExternalAudits(updatedList);

    syncBackground(`${API_BASE}/${id}/share-schedule`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "qm",
        "x-demo-role": "qm",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ noticeSubject, noticeMessage })
    });

    return updated;
  },

  // 3. QMS Coordinator uploads NC document and shares to Course Coordinators ONLY
  async uploadNCDocs(id, ncData, token) {
    const currentList = getStoredExternalAudits();
    const existing = currentList.find((a) => a.id === id);
    if (!existing) return null;

    const now = formatNow();

    const updated = {
      ...existing,
      stage: 3,
      status: "NC Docs Shared with Course Coordinators",
      ncDocument: {
        receivedFromExternalAuditor: true,
        receivedAt: now,
        uploadedAt: now,
        uploadedBy: "Rahul Kumar (QMS Coordinator)",
        sharedWithCourseCoordinatorsOnly: true,
        fileName: ncData.fileName || `${existing.id}_External_Audit_NC_Report.pdf`,
        fileSize: ncData.fileSize || "2.1 MB",
        fileType: "application/pdf",
        summary: ncData.summary || "Non-conformance report issued by External Auditor covering practical curriculum alignment and lab log verifications.",
        targetClosureDate: ncData.targetClosureDate || "2026-12-15",
        findings: Array.isArray(ncData.findings) && ncData.findings.length > 0 ? ncData.findings : [
          {
            id: `NC-EXT-${Date.now().toString().slice(-2)}`,
            type: "Minor Non-Conformance",
            clause: "ISO 9001:2015 Clause 8.5.1",
            description: "Course delivery schedules and practical lab exercise counter-signatures require standard digital archiving.",
            assignedTo: "Priya Sharma (Course Coordinator)",
            deadline: ncData.targetClosureDate || "2026-12-15",
            status: "Pending Action"
          }
        ]
      },
      timeline: [
        ...(existing.timeline || []),
        {
          action: "NC Documents Received & Shared to Course Coordinators Only",
          actor: "Rahul Kumar (QMS Coordinator)",
          timestamp: now,
          details: `NC Report (${ncData.fileName || `${existing.id}_External_Audit_NC_Report.pdf`}) received from External Auditor via email. Uploaded and shared exclusively to Course Coordinators for corrective action.`
        }
      ]
    };

    const updatedList = currentList.map((a) => (a.id === id ? updated : a));
    saveStoredExternalAudits(updatedList);

    syncBackground(`${API_BASE}/${id}/upload-nc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "qm",
        "x-demo-role": "qm",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(ncData)
    });

    return updated;
  },

  // 4. External Auditor approves & QMS Coordinator closes entire process
  async closeExternalAudit(id, closureData = {}, token) {
    const currentList = getStoredExternalAudits();
    const existing = currentList.find((a) => a.id === id);
    if (!existing) return null;

    const now = formatNow();
    const certNum = closureData.certificateNumber || `ISO9001-${(existing.externalAgency || "CERT").slice(0, 3).toUpperCase()}-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

    const updated = {
      ...existing,
      stage: 4,
      status: "Completed & Closed (ISO 9001 Certified)",
      externalAuditorApproval: {
        approved: true,
        approvedAt: closureData.approvalDate || now,
        decision: "Certified & Conformance Endorsed",
        certificateNumber: certNum,
        recommendation: closureData.recommendation || "Unconditional recommendation for issuance and continuation of ISO 9001:2015 Quality Management Certificate.",
        remarks: closureData.remarks || "External Auditor verified all corrective actions. Audit officially cleared with ISO 9001:2015 compliance endorsed.",
        externalLetterFileName: `${existing.id}_ISO9001_Certification_Clearance.pdf`
      },
      qmsClosure: {
        closed: true,
        closedAt: now,
        closedBy: "Rahul Kumar (QMS Coordinator)",
        remarks: closureData.qmsRemarks || "External Audit lifecycle completed and closed in full conformance with ISO 9001:2015."
      },
      timeline: [
        ...(existing.timeline || []),
        {
          action: "Audit Approved by External Auditor",
          actor: `${existing.leadAuditor?.name || "Lead External Auditor"} (${existing.externalAgency})`,
          timestamp: closureData.approvalDate || now,
          details: `External Auditor approved resolution and endorsed ISO 9001:2015 Certificate (${certNum}).`
        },
        {
          action: "External Audit Process Officially Closed",
          actor: "Rahul Kumar (QMS Coordinator)",
          timestamp: now,
          details: `Full process closed by QMS Coordinator. Quality Management System ISO 9001:2015 certification ratified for all divisions.`
        }
      ]
    };

    const updatedList = currentList.map((a) => (a.id === id ? updated : a));
    saveStoredExternalAudits(updatedList);

    syncBackground(`${API_BASE}/${id}/close`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "qm",
        "x-demo-role": "qm",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(closureData)
    });

    return updated;
  }
};
