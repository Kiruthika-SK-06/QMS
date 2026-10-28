// Frontend service for Internal Quality Audit (IQA) API with cross-tab real-time sync and localStorage persistence
import { initialAuditList } from "../data/mockData";

const API_BASE = "/api/audit";

const formatNow = () => {
  const d = new Date();
  return d.toISOString().replace("T", " ").substring(0, 19);
};

// Helper to read cached audits from localStorage
export function getStoredAudits() {
  try {
    const saved = localStorage.getItem("qms_audits");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Error reading qms_audits from localStorage", e);
  }
  return initialAuditList;
}

// Helper to save audits and broadcast to other open tabs
export function saveStoredAudits(audits) {
  try {
    localStorage.setItem("qms_audits", JSON.stringify(audits));
    // BroadcastChannel sends instant event to other tabs on same origin
    try {
      const channel = new BroadcastChannel("qms_audit_channel");
      channel.postMessage({ type: "AUDIT_UPDATE", audits });
      channel.close();
    } catch {
      // Fallback: localStorage automatically triggers window 'storage' event across tabs
    }
  } catch (e) {
    console.warn("Error saving qms_audits to localStorage", e);
  }
}

export const auditService = {
  getStoredAudits,
  saveStoredAudits,
  async fetchAudits() {
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error("Failed to load audit list");
      const data = await res.json();
      if (Array.isArray(data.data) && data.data.length > 0) {
        saveStoredAudits(data.data);
        return data.data;
      }
      return getStoredAudits();
    } catch {
      return getStoredAudits();
    }
  },

  async getAudit(id) {
    try {
      const res = await fetch(`${API_BASE}/${id}`);
      if (!res.ok) throw new Error("Failed to load audit details");
      const data = await res.json();
      return data.data;
    } catch (err) {
      const local = getStoredAudits().find((a) => a.id === id);
      if (local) return local;
      throw err;
    }
  },

  async createAudit(payload, token) {
    let created = null;
    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.data) {
        created = data.data;
      }
    } catch (err) {
      console.warn("createAudit API offline, creating in localStorage:", err);
    }

    if (!created) {
      const year = new Date().getFullYear();
      const id = `IA-${year}-${String(Math.floor(100 + Math.random() * 900))}`;
      const startDate = payload.startDate || new Date().toISOString().split("T")[0];
      const endDate = payload.endDate || startDate;
      const scheduledDateStr = startDate === endDate ? startDate : `${startDate} to ${endDate}`;

      created = {
        ...payload,
        id,
        scheduledDate: scheduledDateStr,
        auditDates: { startDate, endDate },
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
            actor: payload.scheduledBy?.name || "Rahul Kumar (QMS Coordinator)",
            timestamp: formatNow(),
            details: `Scheduled ${payload.process} audit for ${scheduledDateStr}. Automatically submitted to Trust Head for formal ratification & approval.`
          }
        ]
      };
    }

    // Persist to localStorage and broadcast across all browser tabs
    const currentList = getStoredAudits();
    const updatedList = [created, ...currentList.filter((a) => a.id !== created.id)];
    saveStoredAudits(updatedList);

    return created;
  },

  async confirmSchedule(id, remarks, token) {
    let updated = null;
    try {
      const res = await fetch(`${API_BASE}/${id}/confirm-schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ remarks })
      });
      const data = await res.json();
      if (res.ok && data.data) {
        updated = data.data;
      }
    } catch (err) {
      console.warn("confirmSchedule API offline, updating locally:", err);
    }

    const currentList = getStoredAudits();
    const existing = currentList.find((a) => a.id === id);

    if (!updated && existing) {
      updated = {
        ...existing,
        status: "Approved by Trust Head",
        stage: 2.5,
        stageLabel: "Approved by Trust Head (Pending QMS Distribution)",
        trustHeadConfirmation: {
          confirmed: true,
          confirmedBy: "Anita Rao",
          confirmedRole: "Trust Head",
          confirmedAt: formatNow(),
          remarks: remarks || "Audit schedule ratified and authorized."
        },
        timeline: [
          ...(existing.timeline || []),
          {
            action: "Schedule Approved by Trust Head",
            actor: "Anita Rao (Trust Head)",
            timestamp: formatNow(),
            details: `Trust Head ratified the audit schedule. Automated approval notification dispatched to QMS Coordinator.`
          }
        ]
      };
    }

    if (updated) {
      const nextList = currentList.map((a) => (a.id === id ? updated : a));
      saveStoredAudits(nextList);
    }

    return updated;
  },

  async shareSchedule(id, token) {
    let updated = null;
    try {
      const res = await fetch(`${API_BASE}/${id}/share-schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (res.ok && data.data) {
        updated = data.data;
      }
    } catch (err) {
      console.warn("shareSchedule API offline, updating locally:", err);
    }

    const currentList = getStoredAudits();
    const existing = currentList.find((a) => a.id === id);

    if (!updated && existing) {
      updated = {
        ...existing,
        status: "Schedule Dispatched",
        stage: 3,
        stageLabel: "Schedule Dispatched (Audit in Progress)",
        scheduleShared: {
          shared: true,
          sharedAt: formatNow(),
          sharedBy: "Rahul Kumar (QMS Coordinator)",
          docTitle: `Internal_Audit_Schedule_${id}.pdf`,
          recipients: [
            { role: "Course Coordinator", name: existing.internalAuditee?.name, email: existing.internalAuditee?.email },
            { role: "Trust Head", name: "Anita Rao", email: "trusthead@cdac.in" },
            { role: "Internal Auditor", name: existing.internalAuditor?.name, email: existing.internalAuditor?.email }
          ]
        },
        timeline: [
          ...(existing.timeline || []),
          {
            action: "Schedule Dispatched to All Stakeholders",
            actor: "Rahul Kumar (QMS Coordinator)",
            timestamp: formatNow(),
            details: `QMS Coordinator officially dispatched confirmed audit schedule to Course Coordinator (${existing.internalAuditee?.name}), Trust Head, and Internal Auditor (${existing.internalAuditor?.name}).`
          }
        ]
      };
    }

    if (updated) {
      const nextList = currentList.map((a) => (a.id === id ? updated : a));
      saveStoredAudits(nextList);
    }

    return updated;
  },

  async submitNoticingSheet(id, payload, token) {
    let updated = null;
    try {
      const res = await fetch(`${API_BASE}/${id}/noticing-sheet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.data) {
        updated = data.data;
      }
    } catch (err) {
      console.warn("submitNoticingSheet API offline, updating locally:", err);
    }

    const currentList = getStoredAudits();
    const existing = currentList.find((a) => a.id === id);

    if (!updated && existing) {
      updated = {
        ...existing,
        status: "Noticing Sheet Submitted",
        stage: 4,
        stageLabel: "Noticing Sheet Submitted (Under QMS Review)",
        noticingSheet: {
          submitted: true,
          sheetNo: payload.sheetNo || `NS-${new Date().getFullYear()}-088`,
          submittedBy: payload.submittedBy || "Vikas Deshmukh (Internal Auditor)",
          submittedAt: formatNow(),
          fileName: payload.fileName || `Noticing_Sheet_${id}.pdf`,
          summary: payload.summary || "Audit concluded. Non-conformance items documented.",
          findings: payload.findings || []
        },
        timeline: [
          ...(existing.timeline || []),
          {
            action: "Noticing Sheet Submitted",
            actor: payload.submittedBy || "Internal Auditor",
            timestamp: formatNow(),
            details: `Internal Auditor submitted Noticing Sheet to QMS Coordinator only.`
          }
        ]
      };
    }

    if (updated) {
      const nextList = currentList.map((a) => (a.id === id ? updated : a));
      saveStoredAudits(nextList);
    }

    return updated;
  },

  async shareNCDocs(id, payload, token) {
    let updated = null;
    try {
      const res = await fetch(`${API_BASE}/${id}/share-nc-docs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.data) {
        updated = data.data;
      }
    } catch (err) {
      console.warn("shareNCDocs API offline, updating locally:", err);
    }

    const currentList = getStoredAudits();
    const existing = currentList.find((a) => a.id === id);

    if (!updated && existing) {
      updated = {
        ...existing,
        status: "NC Docs Shared",
        stage: 5,
        stageLabel: "NC Docs Shared (Action Required: Auditee CAPA)",
        ncDocs: {
          shared: true,
          sharedBy: "Rahul Kumar (QMS Coordinator)",
          sharedAt: formatNow(),
          fileName: payload.fileName || `NC_Formal_Notice_${id}.pdf`,
          remarks: payload.remarks || "NC notice validated and issued to Auditee.",
          sharedWith: [
            { role: "Internal Auditor", name: existing.internalAuditor?.name },
            { role: "Internal Auditee", name: existing.internalAuditee?.name }
          ]
        },
        timeline: [
          ...(existing.timeline || []),
          {
            action: "NC Docs Shared",
            actor: "Rahul Kumar (QMS Coordinator)",
            timestamp: formatNow(),
            details: `QMS Coordinator reviewed Noticing Sheet and shared official NC Docs with Auditee and Auditor.`
          }
        ]
      };
    }

    if (updated) {
      const nextList = currentList.map((a) => (a.id === id ? updated : a));
      saveStoredAudits(nextList);
    }

    return updated;
  },

  async auditeeClose(id, payload, token) {
    let updated = null;
    try {
      const res = await fetch(`${API_BASE}/${id}/auditee-close`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.data) {
        updated = data.data;
      }
    } catch (err) {
      console.warn("auditeeClose API offline, updating locally:", err);
    }

    const currentList = getStoredAudits();
    const existing = currentList.find((a) => a.id === id);

    if (!updated && existing) {
      updated = {
        ...existing,
        status: "Closed by Auditee",
        stage: 6,
        stageLabel: "Closed by Auditee (Pending QMS Final Sign-off)",
        auditeeClosure: {
          closed: true,
          closedBy: payload.closedBy || "Course Coordinator",
          closedAt: formatNow(),
          rootCause: payload.rootCause,
          correctiveAction: payload.correctiveAction,
          evidenceFileName: payload.evidenceFileName || `CAPA_Evidence_${id}.pdf`,
          remarks: payload.remarks || "Corrective actions completed."
        },
        timeline: [
          ...(existing.timeline || []),
          {
            action: "Auditee Closure Submitted",
            actor: payload.closedBy || "Course Coordinator",
            timestamp: formatNow(),
            details: `Auditee submitted Corrective Action Plan & Evidence. Passed to QMS Coordinator for final close.`
          }
        ]
      };
    }

    if (updated) {
      const nextList = currentList.map((a) => (a.id === id ? updated : a));
      saveStoredAudits(nextList);
    }

    return updated;
  },

  async finalCloseAudit(id, remarks, token) {
    let updated = null;
    try {
      const res = await fetch(`${API_BASE}/${id}/final-close`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ remarks })
      });
      const data = await res.json();
      if (res.ok && data.data) {
        updated = data.data;
      }
    } catch (err) {
      console.warn("finalCloseAudit API offline, updating locally:", err);
    }

    const currentList = getStoredAudits();
    const existing = currentList.find((a) => a.id === id);

    if (!updated && existing) {
      updated = {
        ...existing,
        status: "Completed",
        stage: 7,
        stageLabel: "Completed / Closed",
        qmsFinalClosure: {
          closed: true,
          closedBy: "Rahul Kumar (QMS Coordinator)",
          closedAt: formatNow(),
          remarks: remarks || "Audit verification completed successfully. All items closed.",
          completedAt: formatNow()
        },
        timeline: [
          ...(existing.timeline || []),
          {
            action: "Final Audit Closed",
            actor: "Rahul Kumar (QMS Coordinator)",
            timestamp: formatNow(),
            details: `QMS Coordinator verified CAPA effectiveness and closed the entire audit process.`
          }
        ]
      };
    }

    if (updated) {
      const nextList = currentList.map((a) => (a.id === id ? updated : a));
      saveStoredAudits(nextList);
    }

    return updated;
  }
};
