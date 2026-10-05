import React, { useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { Download, Plus, Edit, Trash2, AlertTriangle } from "lucide-react";
import { useApp } from "../context/AppContext";
import PageIntro from "../components/common/PageIntro";
import SectionHeader from "../components/common/SectionHeader";
import Detail from "../components/common/Detail";
import EmptyState from "../components/common/EmptyState";
import StatusBadge from "../components/common/StatusBadge";
import VersionHistory from "../components/tables/VersionHistory";
import TaskTable from "../components/tables/TaskTable";
import TemplateEditModal from "../components/common/TemplateEditModal";
import Modal from "../components/tasks/Modal";

export default function DocumentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { documents, tasks, currentUser, addVersion, downloadDocument, deleteDocument } = useApp();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const document = documents.find((item) => item.id === id);

  if (!document) return <EmptyState title="Document not found" />;

  const relatedTasks = tasks.filter((task) => task.document === document.name);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteDocument(document.id);
      navigate("/documents");
    } catch (err) {
      alert(err.message || "Failed to delete document");
      setDeleting(false);
    }
  };

  return (
    <>
      <PageIntro
        eyebrow="Document details"
        title={document.name}
        description={`${document.type} · ${document.process} · Owned by ${document.owner}`}
        action={
          <div className="button-group">
            <button className="secondary-button" onClick={() => downloadDocument(document.id)}>
              <Download size={16} /> View file
            </button>
            {currentUser?.role !== "employee" && (
              <>
                <button
                  className="secondary-button"
                  onClick={() => setShowEditModal(true)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <Edit size={16} /> Edit {document.type === "Templates" ? "template" : "document"}
                </button>
                <button className="primary-button" onClick={() => addVersion(document.id)}>
                  <Plus size={16} /> Create new version
                </button>
                <button
                  className="secondary-button"
                  onClick={() => setShowDeleteModal(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "#ef4444",
                    borderColor: "#fca5a5"
                  }}
                >
                  <Trash2 size={16} /> Delete
                </button>
              </>
            )}
          </div>
        }
      />

      <div className="detail-grid">
        <section className="panel">
          <SectionHeader title="Document information" />
          <div className="detail-list">
            <Detail label="Document name" value={document.name} />
            <Detail label="Document type" value={document.type} />
            <Detail label="Process" value={document.process} />
            <Detail label="Process owner" value={document.owner} />
            <Detail label="Current version" value={`Version ${document.version}`} />
            <Detail label="Last updated" value={document.updated} />
            <Detail label="Updated by" value={document.updatedBy} />
            <Detail label="Status" value={<StatusBadge status={document.status} />} />
          </div>
        </section>
        <section className="panel">
          <SectionHeader title="Lifecycle" />
          <div className="workflow">
            {["Draft", "Submitted", "Under Review", "Approved"].map((step, index) => (
              <div
                className={`workflow-step ${document.status === step || (index === 0 && document.status === "Changes Requested") ? "current" : ""}`}
                key={step}
              >
                <span>{index + 1}</span>
                <strong>{step}</strong>
                {index < 3 && <i />}
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="panel">
        <SectionHeader
          title="Template specification & checklist format"
          action={
            currentUser?.role !== "employee" && (
              <button
                type="button"
                className="text-link"
                onClick={() => setShowEditModal(true)}
                style={{ cursor: "pointer", background: "none", border: "none", font: "inherit" }}
              >
                Edit template content
              </button>
            )
          }
        />
        <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          {document.content ? (
            <pre
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: "13px",
                lineHeight: "1.6",
                color: "#1e293b"
              }}
            >
              {document.content}
            </pre>
          ) : (
            <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
              {document.description || "No custom template structure defined yet."}
            </p>
          )}
        </div>
      </section>

      <section className="panel">
        <SectionHeader title="Version history" action={<NavLink className="text-link" to="/version-history">Open full history</NavLink>} />
        <VersionHistory versions={document.versions} docId={document.id} />
      </section>

      {relatedTasks.length > 0 && (
        <section className="panel">
          <SectionHeader title="Related tasks" action={<NavLink className="text-link" to="/tasks">Open task board</NavLink>} />
          <TaskTable items={relatedTasks} />
        </section>
      )}

      {showEditModal && (
        <TemplateEditModal
          template={document}
          onClose={() => setShowEditModal(false)}
          onSave={() => setShowEditModal(false)}
        />
      )}

      {showDeleteModal && (
        <Modal
          title={`Delete ${document.type === "Templates" ? "Template" : "Document"}`}
          onClose={() => setShowDeleteModal(false)}
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
                  Are you sure you want to permanently delete <strong>{document.name}</strong> ({document.id})? This will remove the controlled record from the library and log an audit trail entry.
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
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                style={{ background: "#dc2626", borderColor: "#dc2626" }}
                disabled={deleting}
                onClick={handleDelete}
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
