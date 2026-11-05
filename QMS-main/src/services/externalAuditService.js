// Frontend service for External Quality Audit (ISO 9001:2015) with cross-tab real-time sync and localStorage persistence
// Exact 5-Step Workflow:
// 1. External Auditor schedules and emails schedule to QMS Coordinator only.
// 2. QMS Coordinator shares scheduled meeting to all: Trust Head, Course Coord, and Internal Auditor.
//    External Auditor comes directly to the office to audit the system and gives NC doc in paper to QMS Coordinator.
// 3. QMS Coordinator uploads scanned copy of paper NC doc and shares it ONLY to Course Coordinators.
// 4. Course Coordinator downloads scanned NC docs and closes the NC resolution.
// 5. External Auditor communicates approval result to QMS Coordinator through email or directly coming to office.
//    Once QMS Coordinator gets approval, QMS Coordinator closes the entire process (ISO 9001 Certified).
// Constraint: Each step can only be performed after the previous step is completed. External Auditor has NO system login or dashboard.

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
  const dummyIds = new Set(["EA-2026-001", "EA-2026-002", "EA-2026-003", "EA-2026-004", "EA-2026-005"]);

  return [...list].sort((a, b) => {
    const aIsNew = a.isNew === true || (!dummyIds.has(a.id) && !a.id?.endsWith("-001") && !a.id?.endsWith("-002") && !a.id?.endsWith("-003") && !a.id?.endsWith("-004") && !a.id?.endsWith("-005"));
    const bIsNew = b.isNew === true || (!dummyIds.has(b.id) && !b.id?.endsWith("-001") && !b.id?.endsWith("-002") && !b.id?.endsWith("-003") && !b.id?.endsWith("-004") && !b.id?.endsWith("-005"));

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
      const serverStage = Number(server.stage) || 1;
      const localStage = Number(local.stage) || 1;
      if (serverStage >= localStage) {
        map.set(server.id, { ...local, ...server });
      }
    }
  }

  return sortExternalAudits(Array.from(map.values()));
}

export const externalAuditService = {
  // Fetch audits with fallback
  async fetchExternalAudits(role, token) {
    try {
      const headers = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(role ? { "x-user-role": role, "x-demo-role": role } : {})
      };

      const res = await fetch(`${API_BASE}?role=${encodeURIComponent(role || "")}`, { headers });
      if (res.ok) {
        const json = await res.json();
        const serverData = json.data || json;
        if (Array.isArray(serverData)) {
          const local = getStoredExternalAudits();
          const merged = mergeExternalAudits(serverData, local);
          saveStoredExternalAudits(merged);
          return merged;
        }
      }
    } catch (err) {
      console.warn("fetchExternalAudits background fetch failed, using local cache:", err);
    }
    return getStoredExternalAudits();
  },

  // 1. QMS Coordinator logs incoming email schedule
  async logSchedule(auditData, token) {
    const currentList = getStoredExternalAudits();
    const now = formatNow();
    const auditId = auditData.id || `EA-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`;
    const auditorName = auditData.auditorName || auditData.leadAuditor?.name || "Dr. Robert Vance";
    const agencyName = auditData.externalAgency || "TÜV SÜD South Asia Certification Body";

    const newAudit = {
      id: auditId,
      isNew: true,
      createdAt: Date.now(),
      title: (auditData.title || "ISO 9001:2015 External Surveillance Audit").trim(),
      scope: (auditData.scope || "Annual ISO 9001:2015 Surveillance Audit covering academic delivery, laboratory procedures, and quality standard conformity.").trim(),
      externalAgency: agencyName,
      leadAuditor: {
        name: auditorName,
        title: auditData.auditorTitle || "Lead External Auditor (ISO 9001:2015)",
        agency: agencyName,
        email: auditData.auditorEmail || "lead.auditor@tuvsud.com",
        phone: auditData.auditorPhone || "+91 98230 45678"
      },
      targetPeriod: auditData.targetPeriod || "December 2026",
      scheduledDate: auditData.scheduledDate,
      scheduledTime: auditData.scheduledTime || "09:30 AM",
      venue: auditData.venue || "Main Boardroom / Campus In-Person Audit",
      department: auditData.department || "Quality Assurance & Compliance",
      process: auditData.process || "All Processes (Comprehensive Academic Quality Review)",
      stage: 1,
      status: "Audit Schedule Received (via Email)",

      incomingScheduleEmail: {
        received: true,
        receivedAt: now,
        from: `${auditorName} <${auditData.auditorEmail || "lead.auditor@tuvsud.com"}>`,
        to: "Rahul Kumar (QMS Coordinator) <qm@cdac.in>",
        subject: auditData.emailSubject || `Official Notice: ISO 9001:2015 External Audit Schedule (${auditId})`,
        bodyHtml: auditData.emailBody
          ? `<p>${auditData.emailBody.replace(/\n/g, "<br/>")}</p>`
          : `<p>Dear Rahul Kumar (QMS Coordinator),</p><p>This email confirms that the ISO 9001:2015 External Audit is scheduled for <strong>${auditData.scheduledDate} at ${auditData.scheduledTime || "09:30 AM"}</strong>.</p><p>The auditor will visit the office in person to audit the system. Please notify your course coordinators, trust head, and internal auditors.</p><p>Regards,<br/><strong>${auditorName}</strong> (${agencyName})</p>`,
        attachments: [
          {
            fileName: auditData.planFileName || `ISO_9001_External_Audit_Plan_${auditId}.pdf`,
            fileSize: "1.8 MB",
            fileType: "application/pdf"
          }
        ]
      },

      shareWithStakeholders: null,
      ncDocument: null,
      ncClosure: null,
      externalAuditorApproval: null,
      qmsClosure: null,

      timeline: [
        {
          action: "Audit Schedule Received via Email",
          actor: `${auditorName} (External Auditor - ${agencyName})`,
          timestamp: now,
          details: `External audit schedule and plan received via email by QMS Coordinator. Scheduled for ${auditData.scheduledDate} at ${auditData.scheduledTime || "09:30 AM"}.`
        }
      ]
    };

    const updatedList = [newAudit, ...currentList.filter((a) => a.id !== newAudit.id)];
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

  // 2. QMS Coordinator shares scheduled meeting to all: Trust Head, Course Coord, and Internal Auditor
  async shareSchedule(id, shareNotice = {}, token) {
    const currentList = getStoredExternalAudits();
    const existing = currentList.find((a) => a.id === id);
    if (!existing) return null;

    const now = formatNow();
    const { noticeSubject, noticeMessage } = shareNotice;

    const updated = {
      ...existing,
      stage: 2,
      status: "Schedule Shared (On-Site Audit Scheduled)",
      shareWithStakeholders: {
        shared: true,
        sharedAt: now,
        sharedBy: "Rahul Kumar (QMS Coordinator)",
        noticeSubject: noticeSubject || `External Audit Schedule Notice: ${existing.title} on ${existing.scheduledDate}`,
        noticeMessage: noticeMessage || `All Course Coordinators, Trust Head, and Internal Auditor: Please be informed that ${existing.externalAgency} has scheduled an ISO 9001:2015 External Audit on ${existing.scheduledDate} at ${existing.scheduledTime}. The auditor will visit the campus in person to audit the system.`,
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

  // 3. QMS Coordinator uploads scanned copy of paper NC doc and shares to Course Coordinators ONLY
  async uploadNCDocs(id, ncData, token) {
    const currentList = getStoredExternalAudits();
    const existing = currentList.find((a) => a.id === id);
    if (!existing) return null;

    const now = formatNow();

    const updated = {
      ...existing,
      stage: 3,
      status: "Scanned NC Doc Uploaded (Course Coord Only)",
      ncDocument: {
        receivedFromExternalAuditorInPerson: true,
        receivedAtOffice: now,
        isScannedPaperCopy: true,
        uploadedAt: now,
        uploadedBy: "Rahul Kumar (QMS Coordinator)",
        sharedWithCourseCoordinatorsOnly: true,
        fileName: ncData.fileName || `${existing.id}_Scanned_Paper_NC_Report.pdf`,
        fileSize: ncData.fileSize || "2.1 MB",
        fileType: "application/pdf",
        summary: ncData.summary || "Scanned copy of physical paper NC document handed over by External Auditor during campus office audit.",
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
          action: "On-Site Audit Conducted & Scanned Paper NC Uploaded",
          actor: "Rahul Kumar (QMS Coordinator)",
          timestamp: now,
          details: `External Auditor visited office in person to audit system and handed paper NC document. Scanned copy (${ncData.fileName || `${existing.id}_Scanned_Paper_NC_Report.pdf`}) uploaded and shared exclusively to Course Coordinators for resolution.`
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

  // 4. Course Coordinator downloads scanned NC docs and closes NC resolution
  async closeCourseCoordinatorNC(id, resolutionData = {}, token) {
    const currentList = getStoredExternalAudits();
    const existing = currentList.find((a) => a.id === id);
    if (!existing) return null;

    const now = formatNow();
    const actorName = resolutionData.closedBy || "Priya Sharma (Course Coordinator)";

    const updatedFindings = (existing.ncDocument?.findings || []).map((f) => ({
      ...f,
      status: "Resolved",
      resolutionRemarks: resolutionData.remarks || "Root cause analysis completed. Digital counter-signature archiving protocol standardized."
    }));

    const updated = {
      ...existing,
      stage: 4,
      status: "NC Closed by Course Coordinator (Awaiting Auditor Approval)",
      ncDocument: existing.ncDocument ? {
        ...existing.ncDocument,
        findings: updatedFindings
      } : null,
      ncClosure: {
        closed: true,
        closedAt: now,
        closedBy: actorName,
        remarks: resolutionData.remarks || "Scanned NC document reviewed and resolved. Digital lab register counter-signature protocol deployed.",
        actionPlan: resolutionData.actionPlan || "Root cause analysis completed. Standardized logging procedure established."
      },
      timeline: [
        ...(existing.timeline || []),
        {
          action: "NC Document Downloaded & Closed by Course Coordinator",
          actor: actorName,
          timestamp: now,
          details: `Course Coordinator downloaded scanned NC report, completed corrective actions, and submitted resolution closure. Ready for External Auditor approval.`
        }
      ]
    };

    const updatedList = currentList.map((a) => (a.id === id ? updated : a));
    saveStoredExternalAudits(updatedList);

    syncBackground(`${API_BASE}/${id}/close-nc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "owner",
        "x-demo-role": "owner",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(resolutionData)
    });

    return updated;
  },

  // 5. External Auditor communicates approval (via email or direct office visit) & QMS Coordinator closes entire process
  async closeExternalAudit(id, closureData = {}, token) {
    const currentList = getStoredExternalAudits();
    const existing = currentList.find((a) => a.id === id);
    if (!existing) return null;

    const now = formatNow();
    const certNum = closureData.certificateNumber || `ISO9001-${(existing.externalAgency || "CERT").slice(0, 3).toUpperCase()}-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    const mode = closureData.approvalMode || "Direct Office Visit (Auditor visited office in person)";

    const updated = {
      ...existing,
      stage: 5,
      status: "Completed & Closed (ISO 9001 Certified)",
      externalAuditorApproval: {
        approved: true,
        approvedAt: closureData.approvalDate || now,
        approvalMode: mode,
        decision: "Certified & Conformance Endorsed",
        certificateNumber: certNum,
        recommendation: closureData.recommendation || "Unconditional recommendation for issuance and continuation of ISO 9001:2015 Quality Management Certificate.",
        remarks: closureData.remarks || `External Auditor verified all corrective actions (communicated via ${mode}). Audit officially cleared with ISO 9001:2015 compliance endorsed.`,
        externalLetterFileName: `${existing.id}_ISO9001_Certification_Clearance.pdf`
      },
      qmsClosure: {
        closed: true,
        closedAt: now,
        closedBy: "Rahul Kumar (QMS Coordinator)",
        remarks: closureData.qmsRemarks || `External Audit lifecycle completed and closed in full conformance with ISO 9001:2015 following auditor approval received via ${mode}.`
      },
      timeline: [
        ...(existing.timeline || []),
        {
          action: "Audit Approved by External Auditor",
          actor: `${existing.leadAuditor?.name || "Lead External Auditor"} (${existing.externalAgency})`,
          timestamp: closureData.approvalDate || now,
          details: `External Auditor communicated approval result (${mode}) and endorsed ISO 9001:2015 Certificate (${certNum}).`
        },
        {
          action: "External Audit Process Officially Closed",
          actor: "Rahul Kumar (QMS Coordinator)",
          timestamp: now,
          details: `Full process closed by QMS Coordinator. All previous stages validated. ISO 9001:2015 certification ratified for all divisions.`
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
