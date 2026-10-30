// Frontend service for Management Review Meeting (MRM) API with cross-tab real-time sync and localStorage persistence
import { initialMRMList } from "../data/mockData";

const API_BASE = "/api/mrm";

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

// Deterministic sort: Newly scheduled MRMs ALWAYS placed first, prebuilt dummy data below
export function sortMRMs(list) {
  if (!Array.isArray(list)) return [];
  const dummyIds = new Set(["MRM-2026-001", "MRM-2026-002", "MRM-2026-003", "MRM-2026-004"]);

  return [...list].sort((a, b) => {
    const aIsNew = a.isNew === true || (!dummyIds.has(a.id) && !a.id?.endsWith("-001") && !a.id?.endsWith("-002") && !a.id?.endsWith("-003") && !a.id?.endsWith("-004"));
    const bIsNew = b.isNew === true || (!dummyIds.has(b.id) && !b.id?.endsWith("-001") && !b.id?.endsWith("-002") && !b.id?.endsWith("-003") && !b.id?.endsWith("-004"));

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

// Helper to read cached MRMs from localStorage
export function getStoredMRMs() {
  try {
    const saved = localStorage.getItem("qms_mrms");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return sortMRMs(parsed);
    }
  } catch (e) {
    console.warn("Error reading qms_mrms from localStorage", e);
  }
  return sortMRMs(initialMRMList);
}

// Helper to save MRMs and broadcast to other open tabs
export function saveStoredMRMs(mrms) {
  try {
    const sorted = sortMRMs(mrms);
    localStorage.setItem("qms_mrms", JSON.stringify(sorted));
    try {
      const channel = new BroadcastChannel("qms_mrm_channel");
      channel.postMessage({ type: "MRM_UPDATE", mrms: sorted });
      channel.close();
    } catch {}

    // Cross-tab and server sync so other user accounts / tabs immediately receive new MRMs
    syncBackground(`${API_BASE}/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mrms: sorted })
    });
  } catch (e) {
    console.warn("Error saving qms_mrms to localStorage", e);
  }
}

// Helper to reconcile server data with local cache without deleting locally planned MRMs
export function mergeMRMs(serverList, localList) {
  if (!Array.isArray(localList) || localList.length === 0) return sortMRMs(Array.isArray(serverList) ? serverList : []);
  if (!Array.isArray(serverList) || serverList.length === 0) return sortMRMs(localList);

  const map = new Map();
  // 1. Populate map with localList first to preserve local optimistic updates and order
  for (const local of localList) {
    if (local && local.id) map.set(local.id, local);
  }

  // 2. Reconcile with serverList
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

  return sortMRMs(Array.from(map.values()));
}

export const mrmService = {
  getStoredMRMs,
  saveStoredMRMs,
  mergeMRMs,

  async fetchMRMs(token) {
    const cached = getStoredMRMs();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 800);
      const res = await fetch(API_BASE, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: controller.signal
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error("Failed to load MRM list");
      const data = await res.json();
      if (Array.isArray(data.data) && data.data.length > 0) {
        const merged = mergeMRMs(data.data, cached);
        saveStoredMRMs(merged);
        return merged;
      }
      return cached;
    } catch {
      return cached;
    }
  },

  async getMRM(id) {
    const local = getStoredMRMs().find((m) => m.id === id);
    if (local) return local;
    try {
      const res = await fetch(`${API_BASE}/${id}`);
      if (!res.ok) throw new Error("Failed to load MRM details");
      const data = await res.json();
      return data.data;
    } catch (err) {
      if (local) return local;
      throw err;
    }
  },

  // 1. QMS Coordinator Schedules Meeting -> Saved immediately, passes to Trust Head for Approval
  async createMRM(payload, token) {
    const currentList = getStoredMRMs();
    const year = new Date().getFullYear();
    const id = `MRM-${year}-${String(Date.now()).slice(-3)}`;
    const isReq = payload.requestApprovalImmediately !== false;

    const newMRM = {
      ...payload,
      id,
      isNew: true,
      createdAt: Date.now(),
      version: "1.0",
      versionHistory: [],
      status: isReq ? "Pending Approval" : "Planned",
      stage: isReq ? 2 : 1,
      targetMonth: payload.targetMonth || "November 2026",
      scheduledDate: payload.scheduledDate || new Date().toISOString().split("T")[0],
      scheduledTime: payload.scheduledTime || "10:30 AM",
      venue: payload.venue || "Main Boardroom / Webex Video Conference (Room 402)",
      plannedBy: payload.plannedBy || "Rahul Kumar",
      plannedByRole: payload.plannedByRole || "QMS Coordinator",
      department: payload.department || "Academic Quality & Compliance",
      process: payload.process || "All Processes (Comprehensive Academic Quality Review)",
      agenda: Array.isArray(payload.agenda) && payload.agenda.length > 0 ? payload.agenda : [
        "Review of previous MRM action items & closure status",
        "Analysis of student semester feedback & satisfaction index",
        "Course delivery milestones and practical lab examination results",
        "Resource allocation, software licenses & computing server capacity",
        "Recommendations for continual curriculum modernization"
      ],
      attendees: Array.isArray(payload.attendees) && payload.attendees.length > 0 ? payload.attendees : [
        "Rahul Kumar (QMS Coordinator)",
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
      acknowledgements: [],
      timeline: [
        {
          action: "Meeting Planned by QMS Coordinator",
          actor: payload.plannedBy || "Rahul Kumar (QMS Coordinator)",
          timestamp: formatNow(),
          version: "1.0",
          details: `Meeting scheduled for ${payload.scheduledDate || "upcoming date"} at ${payload.scheduledTime || "10:30 AM"}. Submitted to Trust Head for formal approval.`
        }
      ]
    };

    const updatedList = sortMRMs([newMRM, ...currentList.filter((m) => m.id !== id)]);
    saveStoredMRMs(updatedList);

    // Sync in background without blocking UI
    syncBackground(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "qm",
        "x-demo-role": "qm",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ ...payload, id, process: newMRM.process, isNew: true, createdAt: newMRM.createdAt })
    });

    return newMRM;
  },

  // 2. Trust Head Confirms / Approves Schedule
  async approveMRM(id, { remarks = "" } = {}, token) {
    const currentList = getStoredMRMs();
    const existing = currentList.find((m) => m.id === id);
    if (!existing) return null;

    const approverName = "Anita Rao";
    const approverRole = "Trust Head";
    const approvalTimestamp = formatNow();

    const updated = {
      ...existing,
      status: "Approved by Trust Head",
      stage: 2.5,
      approvals: {
        ...(existing.approvals || {}),
        teamHead: {
          status: "Approved",
          decision: "Approved",
          approverName,
          approverRole,
          approvedAt: approvalTimestamp,
          remarks: remarks || "Meeting objectives, agenda, and participant list fully ratified."
        }
      },
      trustHeadApproval: {
        decision: "Approved",
        approved: true,
        approvedBy: approverName,
        approvedAt: approvalTimestamp,
        remarks: remarks || "Meeting objectives ratified."
      },
      timeline: [
        ...(existing.timeline || []),
        {
          action: "Approved by Trust Head",
          actor: `${approverName} (${approverRole})`,
          timestamp: approvalTimestamp,
          version: existing.version || "1.0",
          details: remarks || "Meeting schedule and agenda ratified by Trust Head Anita Rao. Ready for email notification."
        }
      ]
    };

    const updatedList = currentList.map((m) => (m.id === id ? updated : m));
    saveStoredMRMs(updatedList);

    syncBackground(`${API_BASE}/${id}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ remarks })
    });

    return updated;
  },

  // 3. QMS Coordinator Shares Email Notification to Stakeholders
  async shareMeetingEmail(id, token) {
    const currentList = getStoredMRMs();
    const existing = currentList.find((m) => m.id === id);
    if (!existing) return null;

    const senderName = "Rahul Kumar";
    const senderRole = "QMS Coordinator";
    const dispatchTimestamp = formatNow();

    const recipients = [
      { role: "Course Coordinator", name: "Priya Sharma", email: "coordinator@cdac.in" },
      { role: "Course Coordinator", name: "Dr. Rajesh Verma", email: "rajesh.verma@cdac.in" },
      { role: "Course Coordinator", name: "Sunita Patil", email: "sunita.patil@cdac.in" },
      { role: "Trust Head", name: "Anita Rao", email: "head@cdac.in" },
      { role: "Internal Auditor", name: "Suresh Menon", email: "auditor@cdac.in" }
    ];

    const updated = {
      ...existing,
      status: "Notification Sent",
      stage: 3,
      sharedWithAll: true,
      sharedAt: dispatchTimestamp,
      sharedBy: `${senderName} (${senderRole})`,
      emailNotification: {
        sent: true,
        sentAt: dispatchTimestamp,
        sentBy: `${senderName} (${senderRole})`,
        subject: `Official Notice: ${existing.title} Scheduled for ${existing.scheduledDate} at ${existing.scheduledTime}`,
        status: "Delivered",
        recipients,
        emailBodyHtml: `<p>Formal meeting invitation emailed to all Course Coordinators, Trust Head, and Internal Auditor.</p>`
      },
      timeline: [
        ...(existing.timeline || []),
        {
          action: "Meeting Notification Sent via Email",
          actor: `${senderName} (${senderRole})`,
          timestamp: dispatchTimestamp,
          version: existing.version || "1.0",
          details: `Official invitation emailed to all Course Coordinators, Trust Head, and Internal Auditor. Meeting active.`
        }
      ]
    };

    const updatedList = currentList.map((m) => (m.id === id ? updated : m));
    saveStoredMRMs(updatedList);

    syncBackground(`${API_BASE}/${id}/share-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    return updated;
  },

  // 4. QMS Coordinator Uploads MoM as Document -> Marks Whole Process as Completed
  async uploadMoMFile(id, momPayload, token) {
    const currentList = getStoredMRMs();
    const existing = currentList.find((m) => m.id === id);
    if (!existing) return null;

    const uploaderName = "Rahul Kumar";
    const uploaderRole = "QMS Coordinator";
    const uploadTimestamp = formatNow();
    const fileName = momPayload.fileName || `MRM_${existing.id}_Minutes_Of_Meeting.pdf`;

    const momRecord = {
      fileName,
      fileSize: momPayload.fileSize || "2.4 MB",
      fileType: momPayload.fileType || "application/pdf",
      fileData: momPayload.fileData || null,
      uploadedBy: uploaderName,
      uploadedByRole: uploaderRole,
      uploadedAt: uploadTimestamp,
      downloadUrl: `/api/mrm/${existing.id}/mom-download`,
      summary: momPayload.summary || "Official Minutes of Meeting recorded and signed by the Quality Office.",
      discussionPoints: Array.isArray(momPayload.discussionPoints) && momPayload.discussionPoints.length ? momPayload.discussionPoints : [
        "Course delivery milestones and practical lab examination results evaluated.",
        "Internal audit observations reviewed and corrective action verified.",
        "Student feedback ratings analyzed with 94.2% satisfaction index."
      ],
      actionItems: Array.isArray(momPayload.actionItems) && momPayload.actionItems.length ? momPayload.actionItems : [
        {
          id: "ACT-01",
          task: "Integrate updated course delivery modules into syllabus",
          assignee: "Priya Sharma (Course Coordinator)",
          deadline: "2026-11-30",
          status: "In Progress"
        }
      ],
      decisions: Array.isArray(momPayload.decisions) && momPayload.decisions.length ? momPayload.decisions : [
        "Ratified curriculum enhancements for current semester.",
        "Approved student industrial mentorship workshops for Q4."
      ]
    };

    const updated = {
      ...existing,
      status: "Completed",
      stage: 4,
      momFile: momRecord,
      mom: momRecord,
      timeline: [
        ...(existing.timeline || []),
        {
          action: "MoM Document Uploaded & Published",
          actor: `${uploaderName} (${uploaderRole})`,
          timestamp: uploadTimestamp,
          version: existing.version || "1.0",
          details: `Minutes of Meeting document (${fileName}) uploaded and published. Process completed and accessible for download.`
        }
      ]
    };

    const updatedList = currentList.map((m) => (m.id === id ? updated : m));
    saveStoredMRMs(updatedList);

    syncBackground(`${API_BASE}/${id}/upload-mom`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(momPayload)
    });

    return updated;
  },

  async requestApproval(id, token) {
    const currentList = getStoredMRMs();
    const existing = currentList.find((m) => m.id === id);
    if (!existing) return null;

    const updated = {
      ...existing,
      status: "Pending Approval",
      stage: 2,
      timeline: [
        ...(existing.timeline || []),
        {
          action: "Approval Requested from Trust Head",
          actor: "Rahul Kumar (QMS Coordinator)",
          timestamp: formatNow(),
          version: existing.version || "1.0",
          details: "Proposal submitted to Trust Head Anita Rao for formal authorization."
        }
      ]
    };

    const updatedList = currentList.map((m) => (m.id === id ? updated : m));
    saveStoredMRMs(updatedList);

    syncBackground(`${API_BASE}/${id}/request-approval`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    return updated;
  },

  async requestChangesMRM(id, { remarks }, token) {
    const currentList = getStoredMRMs();
    const existing = currentList.find((m) => m.id === id);
    if (!existing) return null;

    const updated = {
      ...existing,
      status: "Changes Requested",
      stage: 1.5,
      trustHeadApproval: {
        decision: "Changes Requested",
        approved: false,
        approvedBy: "Anita Rao (Trust Head)",
        approvedAt: formatNow(),
        remarks
      },
      timeline: [
        ...(existing.timeline || []),
        {
          action: "Revisions Requested by Trust Head",
          actor: "Anita Rao (Trust Head)",
          timestamp: formatNow(),
          version: existing.version || "1.0",
          details: `Requested revisions: ${remarks}`
        }
      ]
    };

    const updatedList = currentList.map((m) => (m.id === id ? updated : m));
    saveStoredMRMs(updatedList);

    syncBackground(`${API_BASE}/${id}/request-changes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ remarks })
    });

    return updated;
  },

  // Backward-compatibility aliases
  async submitForApproval(id, token) {
    return this.requestApproval(id, token);
  },

  async saveMoM(id, momData, token) {
    return this.uploadMoMFile(id, momData, token);
  },

  async shareMRM(id, token) {
    return this.shareMeetingEmail(id, token);
  },

  downloadMoMUrl(id) {
    return `${API_BASE}/${id}/mom-download`;
  }
};
