import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, Search, Upload, Plus } from "lucide-react";
import { useApp } from "../context/AppContext";
import PageIntro from "../components/common/PageIntro";
import DocumentTable from "../components/tables/DocumentTable";
import Modal from "../components/tasks/Modal";
import TemplateEditModal from "../components/common/TemplateEditModal";

export default function Documents() {
  const { documents, currentUser, createDocument, processes } = useApp();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("search") || "");
  const [type, setType] = useState("All");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);

  useEffect(() => {
    const urlQuery = searchParams.get("search");
    if (urlQuery !== null) {
      setQuery(urlQuery);
    }
  }, [searchParams]);

  const [uploadForm, setUploadForm] = useState({
    name: "",
    type: "Forms",
    process: "Employee Onboarding",
    description: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isReviewer = currentUser?.role === "qm" || currentUser?.role === "Head";
  const tabs = isReviewer
    ? ["All", "Under Review", "Forms", "Templates", "Procedures"]
    : ["All", "Forms", "Templates", "Procedures"];

  const filtered = (documents || []).filter((document) => {
    const matchesType =
      type === "All" ||
      (type === "Under Review"
        ? document.status === "Under Review" || document.status === "Changes Requested" || document.status === "Draft"
        : document.type === type);

    const matchesQuery =
      document.name.toLowerCase().includes(query.toLowerCase()) ||
      document.id.toLowerCase().includes(query.toLowerCase()) ||
      document.process.toLowerCase().includes(query.toLowerCase());

    return matchesType && matchesQuery;
  });

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadForm.name.trim()) return;
    setIsSubmitting(true);
    try {
      await createDocument(uploadForm);
      setShowUploadModal(false);
      setUploadForm({
        name: "",
        type: "Forms",
        process: processes[0]?.name || "Employee Onboarding",
        description: ""
      });
    } catch (err) {
      alert(err.message || "Failed to upload document");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageIntro
        eyebrow="Document control"
        title="Document library"
        description="A single controlled view of Forms, Templates and Procedures. Review and manage lifecycle states directly."
        action={
          currentUser && currentUser.role !== "Head" && currentUser.role !== "auditor" && (
            <button className="primary-button btn-blue" onClick={() => setShowUploadModal(true)}>
              <Upload size={17} />
              <span>Upload document</span>
            </button>
          )
        }
      />

      <div className="filter-bar">
        <label className="search-field">
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents by title, ID, or process..."
          />
        </label>
        <div className="tabs">
          {tabs.map((item) => (
            <button
              className={type === item ? "tab active" : "tab"}
              onClick={() => setType(item)}
              key={item}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <section className="panel">
        <DocumentTable
          items={filtered}
          onEdit={currentUser ? (doc) => setEditingDoc(doc) : undefined}
        />
      </section>

      {editingDoc && (
        <TemplateEditModal
          template={editingDoc}
          onClose={() => setEditingDoc(null)}
          onSave={() => setEditingDoc(null)}
        />
      )}

      {showUploadModal && (
        <Modal title="Upload Controlled Document" onClose={() => setShowUploadModal(false)}>
          <form onSubmit={handleUploadSubmit}>
            <div className="form-grid">
              <label>
                Document Title
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Audit Plan, Joining Checklist"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                />
              </label>

              <label>
                Document Type
                <select
                  value={uploadForm.type}
                  onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
                >
                  <option value="Forms">Forms</option>
                  <option value="Templates">Templates</option>
                  <option value="Procedures">Procedures</option>
                </select>
              </label>

              <label>
                Associated Process
                <select
                  value={uploadForm.process}
                  onChange={(e) => setUploadForm({ ...uploadForm, process: e.target.value })}
                >
                  {processes.map((proc) => (
                    <option key={proc.name} value={proc.name}>
                      {proc.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Description / Purpose
                <textarea
                  placeholder="Describe scope, revision requirements, or ISO standards mapping..."
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  rows={3}
                />
              </label>
            </div>

            <div className="modal-actions" style={{ marginTop: "20px" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowUploadModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary-button btn-blue"
                disabled={!uploadForm.name || isSubmitting}
              >
                <Upload size={16} />
                <span>{isSubmitting ? "Uploading..." : "Register Document"}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
