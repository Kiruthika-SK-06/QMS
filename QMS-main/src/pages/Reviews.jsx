import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, AlertTriangle, FileText, Send, Edit } from "lucide-react";
import { useApp } from "../context/AppContext";
import PageIntro from "../components/common/PageIntro";
import DocumentTable from "../components/tables/DocumentTable";
import Modal from "../components/tasks/Modal";
import Detail from "../components/common/Detail";
import StatusBadge from "../components/common/StatusBadge";
import TemplateEditModal from "../components/common/TemplateEditModal";

export default function Reviews() {
  const { documents, updateDocumentStatus, downloadDocument } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selected, setSelected] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const queue = documents.filter(
    (document) => document.status === "Under Review" || document.status === "Changes Requested"
  );

  // If URL has ?document=DOC-XXX, automatically select it for review
  useEffect(() => {
    const docId = searchParams.get("document");
    if (docId) {
      const match = documents.find((d) => d.id === docId);
      if (match) {
        setSelected(match);
        setComments(match.reviewComments || "");
      }
    }
  }, [searchParams, documents]);

  const handleOpenReview = (doc) => {
    setSelected(doc);
    setComments(doc.reviewComments || "");
    setSearchParams({ document: doc.id });
  };

  const handleClose = () => {
    setSelected(null);
    setComments("");
    setSearchParams({});
  };

  const handleDecision = async (status) => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await updateDocumentStatus(selected.id, status, comments);
      handleClose();
    } catch (err) {
      console.error("Review decision failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageIntro
        eyebrow="Quality review"
        title="Document review queue"
        description="Scrutinize submitted drafts and templates. Record approvals or request changes in the official audit trail."
      />

      <section className="panel">
        {queue.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
            <p style={{ fontSize: "16px", fontWeight: "600", color: "#0f172a", marginBottom: "6px" }}>
              Review Queue is Clear
            </p>
            <p>No documents are currently awaiting quality review.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Type</th>
                  <th>Process</th>
                  <th>Version</th>
                  <th>Submitted by</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <strong>{doc.name}</strong>
                      <small>{doc.id}</small>
                    </td>
                    <td>{doc.type}</td>
                    <td>{doc.process}</td>
                    <td><b>v{doc.version}</b></td>
                    <td>{doc.submittedBy || doc.owner}</td>
                    <td><StatusBadge status={doc.status} /></td>
                    <td>
                      <button
                        className="row-action"
                        style={{ cursor: "pointer", fontWeight: "600" }}
                        onClick={() => handleOpenReview(doc)}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected && (
        <Modal title={`Review ${selected.name}`} onClose={handleClose}>
          <div className="review-summary">
            <Detail label="Document ID" value={selected.id} />
            <Detail label="Document name" value={selected.name} />
            <Detail label="Current version" value={`v${selected.version}`} />
            <Detail label="Process" value={selected.process} />
            <Detail label="Submitted by" value={selected.submittedBy || selected.owner} />
            <Detail label="Submitted date" value={selected.updated} />
            <Detail label="Current status" value={<StatusBadge status={selected.status} />} />
          </div>

          <div style={{ margin: "16px 0", display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="secondary-button"
              onClick={() => downloadDocument(selected.id)}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <FileText size={16} /> View controlled extract
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setShowEditModal(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Edit size={16} /> Edit {selected.type === "Templates" ? "template" : "document"}
            </button>
          </div>

          {selected.content && (
            <div style={{ marginBottom: "16px", padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <strong style={{ display: "block", fontSize: "12px", color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>
                Template Content Preview
              </strong>
              <pre style={{ margin: 0, fontSize: "12px", whiteSpace: "pre-wrap", fontFamily: "'Roboto Mono', monospace", color: "#334155" }}>
                {selected.content}
              </pre>
            </div>
          )}

          <label className="comment-field">
            Review comments & findings
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Provide specific feedback, ISO clause references, or revision requirements..."
              rows={4}
            />
          </label>

          <div className="modal-actions" style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button
              className="primary-button btn-amber"
              type="button"
              disabled={submitting}
              onClick={() => handleDecision("Changes Requested")}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <AlertTriangle size={16} />
              <span>Request changes</span>
            </button>
            <button
              className="primary-button btn-green"
              type="button"
              disabled={submitting}
              onClick={() => handleDecision("Approved")}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Check size={17} />
              <span>Approve document</span>
            </button>
          </div>
        </Modal>
      )}

      {showEditModal && selected && (
        <TemplateEditModal
          template={selected}
          onClose={() => setShowEditModal(false)}
          onSave={(updated) => {
            setSelected(updated);
            setShowEditModal(false);
          }}
        />
      )}
    </>
  );
}
