import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { AlertTriangle, Edit, Trash2 } from "lucide-react";
import StatusBadge from "../common/StatusBadge";
import Modal from "../tasks/Modal";
import TemplateEditModal from "../common/TemplateEditModal";
import { useApp } from "../../context/AppContext";

export default function DocumentTable({ items = [], review = false, onEdit, onDelete }) {
  const { deleteDocument, updateDocumentStatus, currentUser } = useApp();
  const [editingDoc, setEditingDoc] = useState(null);
  const [docToDelete, setDocToDelete] = useState(null);
  const [reviewingDoc, setReviewingDoc] = useState(null);
  const [reviewComments, setReviewComments] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canEdit = currentUser?.role !== "employee" && currentUser?.role !== "auditor" && currentUser?.role !== "Head";
  const canDelete = currentUser?.role === "qm";
  const canReview = currentUser?.role === "qm";

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
            {items.map((document) => {
              const isReviewable =
                document.status === "Under Review" ||
                document.status === "Changes Requested" ||
                document.status === "Draft";

              return (
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
                        to={`/documents/${document.id}`}
                      >
                        View
                      </NavLink>

                      {canEdit && (
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

                      {canDelete && (
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

                      {/* Corner Review Action for QMS Coordinator and Trust Head */}
                      {canReview && isReviewable && (
                        <button
                          type="button"
                          className="row-action"
                          onClick={() => {
                            setReviewingDoc(document);
                            setReviewComments(document.reviewComments || "");
                          }}
                          style={{
                            cursor: "pointer",
                            color: "#0369a1",
                            background: "#e0f2fe",
                            border: "1px solid #bae6fd",
                            borderRadius: "4px",
                            padding: "2px 8px",
                            fontSize: "11.5px",
                            fontWeight: "700",
                            marginLeft: "6px"
                          }}
                          title="Review and record approval decision"
                        >
                          Review
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Review Document Decision Modal */}
      {reviewingDoc && (
        <Modal
          title={`Review Document: ${reviewingDoc.name}`}
          onClose={() => {
            setReviewingDoc(null);
            setReviewComments("");
          }}
        >
          <div style={{ marginBottom: "16px" }}>
            <p style={{ margin: "0 0 6px 0", fontSize: "13.5px", color: "var(--ink-soft)" }}>
              <strong>Document ID:</strong> {reviewingDoc.id} &bull; <strong>Version:</strong> v{reviewingDoc.version}
            </p>
            <p style={{ margin: "0 0 12px 0", fontSize: "13.5px", color: "var(--ink-soft)" }}>
              <strong>Process:</strong> {reviewingDoc.process} &bull; <strong>Owner:</strong> {reviewingDoc.owner}
            </p>
            <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "var(--ink)", marginBottom: "6px" }}>
              Quality Review Comments / Evaluation:
            </label>
            <textarea
              rows={3}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "13px", boxSizing: "border-box" }}
              placeholder="Enter compliance evaluation remarks or change requirements..."
              value={reviewComments}
              onChange={(e) => setReviewComments(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button
              type="button"
              className="secondary-button"
              disabled={submittingReview}
              onClick={async () => {
                if (!reviewComments.trim()) {
                  alert("Please provide comments explaining the requested changes.");
                  return;
                }
                setSubmittingReview(true);
                try {
                  await updateDocumentStatus(reviewingDoc.id, "Changes Requested", reviewComments);
                  setReviewingDoc(null);
                  setReviewComments("");
                } finally {
                  setSubmittingReview(false);
                }
              }}
              style={{ color: "var(--status-red)", borderColor: "var(--status-red-border)" }}
            >
              Request Changes
            </button>
            <button
              type="button"
              className="primary-button btn-green"
              disabled={submittingReview}
              onClick={async () => {
                setSubmittingReview(true);
                try {
                  await updateDocumentStatus(reviewingDoc.id, "Approved", reviewComments || "Document reviewed and approved.");
                  setReviewingDoc(null);
                  setReviewComments("");
                } finally {
                  setSubmittingReview(false);
                }
              }}
            >
              Approve Document
            </button>
          </div>
        </Modal>
      )}

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
