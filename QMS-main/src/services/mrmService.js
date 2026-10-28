// Frontend service for Management Review Meeting (MRM) API with cross-tab real-time sync and localStorage persistence
import { initialMRMList } from "../data/mockData";

const API_BASE = "/api/mrm";

// Helper to read cached MRMs from localStorage
export function getStoredMRMs() {
  try {
    const saved = localStorage.getItem("qms_mrms");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Error reading qms_mrms from localStorage", e);
  }
  return initialMRMList;
}

// Helper to save MRMs and broadcast to other open tabs
export function saveStoredMRMs(mrms) {
  try {
    localStorage.setItem("qms_mrms", JSON.stringify(mrms));
    try {
      const channel = new BroadcastChannel("qms_mrm_channel");
      channel.postMessage({ type: "MRM_UPDATE", mrms });
      channel.close();
    } catch {}
  } catch (e) {
    console.warn("Error saving qms_mrms to localStorage", e);
  }
}

// Helper to reconcile server data with local cache without deleting locally planned MRMs
export function mergeMRMs(serverList, localList) {
  if (!Array.isArray(localList) || localList.length === 0) return Array.isArray(serverList) ? serverList : [];
  if (!Array.isArray(serverList) || serverList.length === 0) return localList;

  const map = new Map();
  for (const item of serverList) {
    if (item && item.id) map.set(item.id, item);
  }

  for (const local of localList) {
    if (!local || !local.id) continue;
    const serverItem = map.get(local.id);
    if (!serverItem) {
      map.set(local.id, local);
    } else {
      const localStage = typeof local.stage === "number" ? local.stage : 1;
      const serverStage = typeof serverItem.stage === "number" ? serverItem.stage : 1;
      if (localStage >= serverStage) {
        map.set(local.id, {
          ...serverItem,
          ...local,
          stage: Math.max(localStage, serverStage)
        });
      }
    }
  }

  return Array.from(map.values());
}

export const mrmService = {
  getStoredMRMs,
  saveStoredMRMs,
  mergeMRMs,

  async fetchMRMs(token) {
    const cached = getStoredMRMs();
    try {
      const res = await fetch(API_BASE, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
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
    try {
      const res = await fetch(`${API_BASE}/${id}`);
      if (!res.ok) throw new Error("Failed to load MRM details");
      const data = await res.json();
      return data.data;
    } catch (err) {
      const local = getStoredMRMs().find((m) => m.id === id);
      if (local) return local;
      throw err;
    }
  },

  async createMRM(payload, token) {
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
      if (!res.ok) throw new Error(data.message || "Failed to create MRM plan");
      return data.data;
    } catch (err) {
      console.error("createMRM API error, fallback to local:", err);
      const isReq = !!payload.requestApprovalImmediately;
      const newMRM = {
        ...payload,
        id: `MRM-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
        version: "1.0",
        versionHistory: [],
        status: isReq ? "Pending Approval" : "Planned",
        stage: isReq ? 2 : 1,
        approvals: {
          teamHead: { status: "Pending", decision: null, approverName: null, approverRole: null, approvedAt: null, remarks: null },
          internalAuditor: { status: "Pending", decision: null, approverName: null, approverRole: null, approvedAt: null, remarks: null }
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
            timestamp: new Date().toLocaleString(),
            version: "1.0",
            details: payload.scheduledDate ? `Planned for ${payload.scheduledDate} at ${payload.scheduledTime || "10:30 AM"}` : "Meeting plan created"
          }
        ]
      };
      return newMRM;
    }
  },

  async scheduleMRM(id, scheduleData, token) {
    try {
      const res = await fetch(`${API_BASE}/${id}/schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(scheduleData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to schedule meeting");
      return data.data;
    } catch (err) {
      throw err;
    }
  },

  async updateMRM(id, payload, token) {
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update MRM");
      return data.data;
    } catch (err) {
      throw err;
    }
  },

  // QMS Coordinator asks for approval from Team Head & Internal Auditor
  async requestApproval(id, token) {
    try {
      const res = await fetch(`${API_BASE}/${id}/request-approval`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to request approval");
      return data.data;
    } catch (err) {
      throw err;
    }
  },

  // Team Head or Internal Auditor approves
  async approveMRM(id, { remarks = "" }, token) {
    try {
      const res = await fetch(`${API_BASE}/${id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ remarks })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to approve MRM");
      return data.data;
    } catch (err) {
      throw err;
    }
  },

  async requestChangesMRM(id, { remarks }, token) {
    try {
      const res = await fetch(`${API_BASE}/${id}/request-changes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ remarks })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to request corrections");
      return data.data;
    } catch (err) {
      throw err;
    }
  },

  async rejectMRM(id, { reason }, token) {
    try {
      const res = await fetch(`${API_BASE}/${id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reject MRM");
      return data.data;
    } catch (err) {
      throw err;
    }
  },

  async resubmitMRM(id, { revisionNotes }, token) {
    try {
      const res = await fetch(`${API_BASE}/${id}/resubmit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ revisionNotes })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to resubmit MRM");
      return data.data;
    } catch (err) {
      throw err;
    }
  },

  // Share meeting notification through email to Course Coordinators, Trust Head, and Internal Auditor
  async shareMeetingEmail(id, token) {
    try {
      const res = await fetch(`${API_BASE}/${id}/share-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to share meeting notification through email");
      return data.data;
    } catch (err) {
      throw err;
    }
  },

  // QMS Coordinator uploads the MoM file (seen by everyone)
  async uploadMoMFile(id, momPayload, token) {
    try {
      const res = await fetch(`${API_BASE}/${id}/upload-mom`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(momPayload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to upload MoM file");
      return data.data;
    } catch (err) {
      throw err;
    }
  },

  // Trigger download of MoM file or text extract
  downloadMoMUrl(id) {
    return `${API_BASE}/${id}/mom-download`;
  },

  // Backward compatibility alias methods
  async submitForApproval(id, token) {
    return this.requestApproval(id, token);
  },

  async saveMoM(id, momData, token) {
    return this.uploadMoMFile(id, momData, token);
  },

  async shareMRM(id, token) {
    return this.shareMeetingEmail(id, token);
  },

  async acknowledgeMRM(id, token) {
    try {
      const res = await fetch(`${API_BASE}/${id}/acknowledge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      return data.data;
    } catch (err) {
      return null;
    }
  },

  async archiveMRM(id, token) {
    try {
      const res = await fetch(`${API_BASE}/${id}/archive`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      return data.data;
    } catch (err) {
      throw err;
    }
  }
};
