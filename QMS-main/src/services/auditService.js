// Frontend service for Internal Quality Audit (IQA) API with cross-tab real-time sync and localStorage persistence
import { initialAuditList } from "../data/mockData";

const API_BASE = "/api/audit";

const formatNow = () => {
  const d = new Date();
  return d.toISOString().replace("T", " ").substring(0, 19);
};

// Fire-and-forget background sync to backend without blocking UI thread
function syncBackground(url, options = {}) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    fetch(url, { ...options, signal: controller.signal })
      .catch(() => {})
      .finally(() => clearTimeout(timeoutId));
  } catch {
    // Ignore offline errors
  }
}

// Deterministic sort: Newly scheduled audits ALWAYS placed first, prebuilt dummy data below
export function sortAudits(list) {
  if (!Array.isArray(list)) return [];
  const dummyIds = new Set(["IA-2026-001", "IA-2026-002", "IA-2026-003"]);

  return [...list].sort((a, b) => {
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
}

// Helper to read cached audits from localStorage
export function getStoredAudits() {
  try {
    const saved = localStorage.getItem("qms_audits");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const cleaned = parsed.map((a) => {
          const rawSched = a.scheduledDate || "";
          const startDate = rawSched.includes(" to ")
            ? rawSched.split(" to ")[0].trim()
            : a.date || a.startDate || a.auditDates?.startDate || rawSched;
          const status = (a.id === "IA-2026-002" && a.stage === 6 && a.status === "Closed by Auditee")
            ? "Pending QMS Sign-off"
            : a.status;
          return {
            ...a,
            status,
            scheduledDate: startDate,
            date: startDate,
            startDate,
            endDate: startDate,
            auditDates: {
              startDate,
              endDate: startDate
            }
          };
        });
        return sortAudits(cleaned);
      }
    }
  } catch (e) {
    console.warn("Error reading qms_audits from localStorage", e);
  }
  return sortAudits(initialAuditList);
}

// Helper to save audits and broadcast to other open tabs
export function saveStoredAudits(audits) {
  try {
    const sorted = sortAudits(audits);
    localStorage.setItem("qms_audits", JSON.stringify(sorted));
    // BroadcastChannel sends instant event to other tabs on same origin
    try {
      const channel = new BroadcastChannel("qms_audit_channel");
      channel.postMessage({ type: "AUDIT_UPDATE", audits: sorted });
      channel.close();
    } catch {
      // Fallback: localStorage automatically triggers window 'storage' event across tabs
    }
  } catch (e) {
    console.warn("Error saving qms_audits to localStorage", e);
  }
}

export function mergeAudits(serverList, localList) {
  if (!Array.isArray(localList) || localList.length === 0) return sortAudits(Array.isArray(serverList) ? serverList : []);
  if (!Array.isArray(serverList) || serverList.length === 0) return sortAudits(localList);

  const map = new Map();
  // 1. First populate map with localList to preserve local optimistic actions and sorting
  for (const local of localList) {
    if (local && local.id) map.set(local.id, local);
  }

  // 2. Reconcile with serverList without downgrading local stage
  for (const server of serverList) {
    if (!server || !server.id) continue;
    const local = map.get(server.id);
    if (!local) {
      map.set(server.id, server);
    } else {
      const localStage = typeof local.stage === "number" ? local.stage : 1;
      const serverStage = typeof server.stage === "number" ? server.stage : 1;
      if (serverStage > localStage) {
        map.set(server.id, { ...local, ...server, stage: serverStage });
      } else {
        map.set(server.id, { ...server, ...local, stage: localStage });
      }
    }
  }

  return sortAudits(Array.from(map.values()));
}

export const auditService = {
  async syncAuditsToServer(audits, token) {
    if (!Array.isArray(audits) || audits.length === 0) return;
    syncBackground(`${API_BASE}/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ audits })
    });
  },

  async fetchAudits(token) {
    const cached = getStoredAudits();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 800);
      const res = await fetch(API_BASE, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: controller.signal
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error("Failed to load audit list");
      const data = await res.json();
      if (Array.isArray(data.data) && data.data.length > 0) {
        const merged = mergeAudits(data.data, cached);
        saveStoredAudits(merged);
        return merged;
      }
      return cached;
    } catch {
      return cached;
    }
  },

  async getAudit(id) {
    const local = getStoredAudits().find((a) => a.id === id);
    if (local) return local;
    try {
      const res = await fetch(`${API_BASE}/${id}`);
      if (!res.ok) throw new Error("Failed to load audit details");
      const data = await res.json();
      return data.data;
    } catch (err) {
      if (local) return local;
      throw err;
    }
  },

  async createAudit(payload, token) {
    const year = new Date().getFullYear();
    const currentList = getStoredAudits();
    const id = payload.id || `IA-${year}-${String(Date.now()).slice(-3)}`;
    const auditDate = payload.date || payload.startDate || new Date().toISOString().split("T")[0];
    const startDate = payload.startDate || auditDate;
    const endDate = startDate;
    const scheduledDateStr = auditDate;

    const created = {
      ...payload,
      id,
      isNew: true,
      createdAt: Date.now(),
      date: auditDate,
      startDate,
      endDate,
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

    // Instant local save and broadcast
    const updatedList = sortAudits([created, ...currentList.filter((a) => a.id !== created.id)]);
    saveStoredAudits(updatedList);

    // Sync in background without blocking UI
    syncBackground(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(created)
    });

    return created;
  },

  async confirmSchedule(id, remarks, token) {
    const currentList = getStoredAudits();
    const existing = currentList.find((a) => a.id === id);
    if (!existing) return null;

    const updated = {
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

    const nextList = currentList.map((a) => (a.id === id ? updated : a));
    saveStoredAudits(nextList);

    syncBackground(`${API_BASE}/${id}/confirm-schedule`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ remarks })
    });

    return updated;
  },

  async shareSchedule(id, token) {
    const currentList = getStoredAudits();
    const existing = currentList.find((a) => a.id === id);
    if (!existing) return null;

    const updated = {
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

    const nextList = currentList.map((a) => (a.id === id ? updated : a));
    saveStoredAudits(nextList);

    syncBackground(`${API_BASE}/${id}/share-schedule`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    return updated;
  },

  async submitNoticingSheet(id, payload, token) {
    const currentList = getStoredAudits();
    const existing = currentList.find((a) => a.id === id);
    if (!existing) return null;

    const updated = {
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

    const nextList = currentList.map((a) => (a.id === id ? updated : a));
    saveStoredAudits(nextList);

    syncBackground(`${API_BASE}/${id}/noticing-sheet`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    });

    return updated;
  },

  async shareNCDocs(id, payload, token) {
    const currentList = getStoredAudits();
    const existing = currentList.find((a) => a.id === id);
    if (!existing) return null;

    const updated = {
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

    const nextList = currentList.map((a) => (a.id === id ? updated : a));
    saveStoredAudits(nextList);

    syncBackground(`${API_BASE}/${id}/share-nc-docs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    });

    return updated;
  },

  async auditeeClose(id, payload, token) {
    const currentList = getStoredAudits();
    const existing = currentList.find((a) => a.id === id);
    if (!existing) return null;

    const updated = {
      ...existing,
      status: "Pending QMS Sign-off",
      stage: 6,
      stageLabel: "Process Closed by Auditee (Pending QMS Sign-off)",
      auditeeClosure: {
        closed: true,
        closedBy: payload.closedBy || "Course Coordinator",
        closedAt: formatNow(),
        rootCause: payload.rootCause,
        correctiveAction: payload.correctiveAction,
        evidenceFileName: payload.evidenceFileName || `CAPA_Evidence_${id}.pdf`,
        remarks: payload.remarks || "Corrective actions completed. Passed to QMS Coordinator for final review."
      },
      timeline: [
        ...(existing.timeline || []),
        {
          action: "Audit Process Closed by Auditee",
          actor: payload.closedBy || "Course Coordinator",
          timestamp: formatNow(),
          details: `Corrective Action Plan & Evidence submitted by Course Coordinator. Passed to QMS Coordinator for final sign-off.`
        }
      ]
    };

    const nextList = currentList.map((a) => (a.id === id ? updated : a));
    saveStoredAudits(nextList);

    syncBackground(`${API_BASE}/${id}/auditee-close`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    });

    return updated;
  },

  async finalCloseAudit(id, remarks, token) {
    const currentList = getStoredAudits();
    const existing = currentList.find((a) => a.id === id);
    if (!existing) return null;

    const updated = {
      ...existing,
      status: "Closed",
      stage: 7,
      stageLabel: "Closed & Conforming",
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
          action: "Final Audit Sign-off Completed",
          actor: "Rahul Kumar (QMS Coordinator)",
          timestamp: formatNow(),
          details: `QMS Coordinator verified CAPA effectiveness and officially signed off and completed the audit process.`
        }
      ]
    };

    const nextList = currentList.map((a) => (a.id === id ? updated : a));
    saveStoredAudits(nextList);

    syncBackground(`${API_BASE}/${id}/final-close`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ remarks })
    });

    return updated;
  }
};
