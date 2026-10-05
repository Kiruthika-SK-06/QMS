// Document service for QMS Backend API
const API_BASE = "/api/documents";

export const documentService = {
  /**
   * Fetch all documents with optional filters
   */
  async fetchDocuments(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}?${query}` : API_BASE;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load documents");
    const data = await res.json();
    return data.documents || [];
  },

  /**
   * Fetch single document with version history and related tasks
   */
  async getDocumentById(id) {
    const res = await fetch(`${API_BASE}/${id}`);
    if (!res.ok) throw new Error("Failed to load document");
    return await res.json();
  },

  /**
   * Create / upload a new controlled document
   */
  async createDocument(docData, token) {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(docData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to create document");
    return data.document;
  },

  /**
   * Create a new document version
   */
  async createVersion(id, notes = "", token) {
    const res = await fetch(`${API_BASE}/${id}/versions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ notes })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to create new version");
    return data.document;
  },

  /**
   * Update document status (review approval, requested changes, etc.)
   */
  async updateDocumentStatus(id, status, comments = "", token) {
    const res = await fetch(`${API_BASE}/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ status, comments })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update status");
    return data.document;
  },

  /**
   * Delete controlled document
   */
  async deleteDocument(id, token) {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "DELETE",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to delete document");
    return data.document;
  },

  /**
   * Update / edit controlled document or template
   */
  async updateDocument(id, docData, token) {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(docData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update document");
    return data.document;
  },

  /**
   * Download controlled document text extract
   */
  downloadDocument(id) {
    window.open(`${API_BASE}/${id}/download`, "_blank");
  }
};
