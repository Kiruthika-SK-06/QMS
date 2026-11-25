import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, Search, Upload, Plus, FileText } from "lucide-react";
import { useApp } from "../context/AppContext";
import PageIntro from "../components/common/PageIntro";
import DocumentTable from "../components/tables/DocumentTable";
import Modal from "../components/tasks/Modal";
import TemplateEditModal from "../components/common/TemplateEditModal";

export default function Documents() {
  const { documents = [], currentUser, createDocument, uploadDocumentWithFile, processes = [] } = useApp();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("search") || "");
  const [type, setType] = useState("All");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

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
    if (!uploadForm.name.trim() && !selectedFile) return;
    setIsSubmitting(true);
    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("name", uploadForm.name || selectedFile.name.replace(/\.[^/.]+$/, ""));
        formData.append("type", uploadForm.type);
        formData.append("process", uploadForm.process);
        formData.append("description", uploadForm.description);
        await uploadDocumentWithFile(formData);
      } else {
        await createDocument(uploadForm);
      }
      setShowUploadModal(false);
      setSelectedFile(null);
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
        {filtered.length > 0 ? (
          <DocumentTable
            items={filtered}
            onEdit={currentUser ? (doc) => setEditingDoc(doc) : undefined}
          />
        ) : (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#64748b" }}>
            <FileText size={48} style={{ margin: "0 auto 12px", opacity: 0.35, color: "#384FB8" }} />
            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", marginBottom: "6px" }}>
              No Controlled Documents Found
            </h3>
            <p style={{ fontSize: "13px", maxWidth: "440px", margin: "0 auto" }}>
              No documents match your filter criteria. Authorized coordinators can upload and register new controlled documents using the button above.
            </p>
          </div>
        )}
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
                Attach Document File (PDF, Word, Excel)
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files[0] || null;
                    setSelectedFile(file);
                    if (file && !uploadForm.name) {
                      setUploadForm({ ...uploadForm, name: file.name.replace(/\.[^/.]+$/, "") });
                    }
                  }}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg"
                  style={{ padding: "8px 0" }}
                />
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
