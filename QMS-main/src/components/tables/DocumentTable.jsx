import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { AlertTriangle, Edit, Trash2 } from "lucide-react";
import StatusBadge from "../common/StatusBadge";
import Modal from "../tasks/Modal";
import TemplateEditModal from "../common/TemplateEditModal";
import { useApp } from "../../context/AppContext";

export default function DocumentTable({ items = [], review = false, onEdit, onDelete }) {
  const { deleteDocument, currentUser } = useApp();
  const [editingDoc, setEditingDoc] = useState(null);
  const [docToDelete, setDocToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const canManage = currentUser?.role !== "employee";

  const handleConfirmDelete = async () => {
    if (!docToDelete) return;
    setDeleting(true);
    try {
      if (onDelete) {
        await onDelete(docToDelete);
      } else {
        await deleteDocument(docToDelete.id);
      }
      setDocToDelete(null);
    } catch (err) {
      console.error("Failed to delete document:", err);
      alert(err.message || "Failed to delete document");
    } finally {
      setDeleting(false);
    }
  };

  if (!items || items.length === 0) {
    return (
      <div style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>
        <p>No documents found matching your criteria.</p>
      </div>
    );
  }

  return (
    <>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Document</th>
              <th>Type</th>
              <th>Process</th>
              <th>Version</th>
              <th>Last updated</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((document) => (
              <tr key={document.id}>
                <td>
                  <NavLink className="table-link" to={`/documents/${document.id}`}>
                    <strong>{document.name}</strong>
                    <small>{document.id}</small>
                  </NavLink>
                </td>
                <td>{document.type}</td>
                <td>{document.process}</td>
                <td>
                  <b>v{document.version}</b>
                </td>
                <td>{document.updated}</td>
                <td>
                  <StatusBadge status={document.status} />
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <div style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                    <NavLink
                      className="row-action"
                      to={review ? `/reviews?document=${document.id}` : `/documents/${document.id}`}
                    >
                      {review ? "Review" : "View"}
                    </NavLink>

                    {canManage && (
                      <button
                        type="button"
                        className="row-action"
                        onClick={() => (onEdit ? onEdit(document) : setEditingDoc(document))}
                        style={{ cursor: "pointer", color: "var(--navy)", fontWeight: "600" }}
                        title="Edit specification & checklist"
                      >
                        Edit
                      </button>
                    )}

                    {canManage && (
                      <button
                        type="button"
                        className="row-action"
                        onClick={() => setDocToDelete(document)}
                        style={{ cursor: "pointer", color: "#ef4444" }}
                        title={`Delete ${document.name}`}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Built-in fallback Edit Modal if onEdit wasn't provided by parent */}
      {!onEdit && editingDoc && (
        <TemplateEditModal
          template={editingDoc}
          onClose={() => setEditingDoc(null)}
          onSave={() => setEditingDoc(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {docToDelete && (
        <Modal
          title={`Delete ${docToDelete.type === "Templates" ? "Template" : "Document"}`}
          onClose={() => setDocToDelete(null)}
        >
          <div style={{ padding: "6px 0" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "16px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "#fee2e2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#dc2626",
                  flexShrink: 0
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <div>
                <h4 style={{ margin: "0 0 6px 0", fontSize: "15px", color: "#0f172a" }}>
                  Confirm Permanent Deletion
                </h4>
                <p style={{ margin: 0, fontSize: "14px", color: "#475569", lineHeight: "1.5" }}>
                  Are you sure you want to delete <strong>{docToDelete.name}</strong> ({docToDelete.id})? This will remove the controlled record from the library and log an audit trail entry.
                </p>
              </div>
            </div>

            <div
              className="modal-actions"
              style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end", gap: "10px" }}
            >
              <button
                type="button"
                className="secondary-button"
                onClick={() => setDocToDelete(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                style={{ background: "#dc2626", borderColor: "#dc2626" }}
                disabled={deleting}
                onClick={handleConfirmDelete}
              >
                {deleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
