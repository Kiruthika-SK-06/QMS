// Frontend service for Management Review Meeting (MRM) API
import { initialMRMList } from "../data/mockData";

const API_BASE = "/api/mrm";

export const mrmService = {
  async fetchMRMs() {
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error("Failed to load MRM list");
      const data = await res.json();
      return data.data || initialMRMList;
    } catch {
      return initialMRMList;
    }
  },

  async getMRM(id) {
    try {
      const res = await fetch(`${API_BASE}/${id}`);
      if (!res.ok) throw new Error("Failed to load MRM details");
      const data = await res.json();
      return data.data;
    } catch (err) {
      const local = initialMRMList.find((m) => m.id === id);
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
