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
      if (!res.ok) throw new Error(data.message || "Failed to schedule MRM");
      return data.data;
    } catch (err) {
      if (!err.message?.includes("Failed to schedule")) throw err;
      const newMRM = {
        ...payload,
        id: `MRM-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
        version: "1.0",
        versionHistory: [],
        status: payload.scheduledDate ? "Scheduled" : "Planned",
        mom: null,
        trustHeadApproval: null,
        sharedWithAll: false,
        acknowledgements: [],
        timeline: [
          {
            action: payload.scheduledDate ? "Meeting Planned & Scheduled" : "Meeting Planned",
            actor: payload.plannedBy || "QMS Coordinator",
            timestamp: new Date().toLocaleString(),
            version: "1.0",
            details: payload.scheduledDate ? `Scheduled for ${payload.scheduledDate}` : "Meeting Planned"
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

  async saveMoM(id, momData, token) {
    try {
      const res = await fetch(`${API_BASE}/${id}/mom`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(momData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save MoM");
      return data.data;
    } catch (err) {
      throw err;
    }
  },

  async uploadMoMDocument(id, payload, token) {
    try {
      const res = await fetch(`${API_BASE}/${id}/upload-mom`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to upload MoM document");
      return data.data;
    } catch (err) {
      throw err;
    }
  },

  async submitForApproval(id, token) {
    try {
      const res = await fetch(`${API_BASE}/${id}/submit-approval`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit MRM for approval");
      return data.data;
    } catch (err) {
      throw err;
    }
  },

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

  async resubmitMRM(id, { mom, revisionNotes }, token) {
    try {
      const res = await fetch(`${API_BASE}/${id}/resubmit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ mom, revisionNotes })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to resubmit MRM");
      return data.data;
    } catch (err) {
      throw err;
    }
  },

  async shareMRM(id, token) {
    try {
      const res = await fetch(`${API_BASE}/${id}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to distribute MRM");
      return data.data;
    } catch (err) {
      throw err;
    }
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
      if (!res.ok) throw new Error(data.message || "Failed to acknowledge MRM");
      return data.data;
    } catch (err) {
      throw err;
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
      if (!res.ok) throw new Error(data.message || "Failed to archive MRM");
      return data.data;
    } catch (err) {
      throw err;
    }
  }
};
