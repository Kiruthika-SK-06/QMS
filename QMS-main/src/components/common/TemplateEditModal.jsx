import React, { useState } from "react";
import { Save, FileText, Check, AlertCircle } from "lucide-react";
import Modal from "../tasks/Modal";
import { useApp } from "../../context/AppContext";

export default function TemplateEditModal({ template, onClose, onSave }) {
  const { processes, updateDocument, addVersion } = useApp();

  const [form, setForm] = useState({
    name: template?.name || "",
    process: template?.process || processes[0]?.name || "Quality Management",
    type: template?.type || "Templates",
    description: template?.description || "",
    content:
      template?.content ||
      `1. SCOPE & OBJECTIVES:
[ ] State specific quality compliance objectives
[ ] Reference applicable ISO 9001:2026 requirements

2. AUDIT / EVALUATION CHECKLIST:
[ ] Checklist Item 1: Verification of documented criteria
[ ] Checklist Item 2: Process efficiency observation
[ ] Checklist Item 3: Corrective actions registry inspection

3. FINDINGS & SIGN-OFF:
- Observed Non-Conformities:
- Auditor / Reviewer Recommendation:`
  });

  const [bumpVersion, setBumpVersion] = useState(false);
  const [versionNotes, setVersionNotes] = useState("Updated template format and checklist criteria");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Template name cannot be empty");
      return;
    }

    setSaving(true);
    setError("");

    try {
      // If user opted to bump version, create next revision first
      if (bumpVersion) {
        await addVersion(template.id, versionNotes);
      }

      // Update the document / template content
      const updated = await updateDocument(template.id, {
        name: form.name,
        process: form.process,
        type: form.type,
        description: form.description,
        content: form.content
      });

      if (onSave) {
        onSave(updated);
      }
      onClose();
    } catch (err) {
      console.error("Failed to update template:", err);
      setError(err.message || "Failed to save template changes");
    } finally {
      setSaving(false);
    }
  };

  const docTypeLabel = template?.type === "Templates" ? "Template" : "Document";

  return (
    <Modal title={`Edit ${docTypeLabel}: ${template?.name || "Controlled Record"}`} onClose={onClose}>
      <form onSubmit={handleSave}>
        {error && (
          <div
            style={{
              padding: "10px 14px",
              background: "#fee2e2",
              color: "#991b1b",
              borderRadius: "8px",
              marginBottom: "16px",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <AlertCircle size={17} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <div className="form-grid">
          <label>
            {docTypeLabel} Title
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Internal Audit Checklist, Training Feedback Template"
              required
            />
          </label>

          <label>
            Document Type
            <select value={form.type} onChange={(e) => update("type", e.target.value)}>
              <option value="Templates">Templates</option>
              <option value="Forms">Forms</option>
              <option value="Procedures">Procedures</option>
            </select>
          </label>

          <label>
            Associated Process
            <select value={form.process} onChange={(e) => update("process", e.target.value)}>
              {processes.map((p) => (
                <option key={p.id || p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Description / Purpose
            <input
              type="text"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Summarize the scope and statutory applicability..."
            />
          </label>
        </div>

        <div style={{ marginTop: "16px" }}>
          <label style={{ display: "block", fontWeight: "600", fontSize: "14px", marginBottom: "6px" }}>
            Template Structure, Checklist & Content
          </label>
          <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 8px 0" }}>
            Customize the questionnaire, inspection items, or standard form layout used across the organization.
          </p>
          <textarea
            value={form.content}
            onChange={(e) => update("content", e.target.value)}
            rows={10}
            style={{
              width: "100%",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: "13px",
              lineHeight: "1.5",
              padding: "10px",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              boxSizing: "border-box"
            }}
            placeholder="Define template sections, questions, and checklist format..."
          />
        </div>

        <div
          style={{
            marginTop: "16px",
            padding: "12px",
            background: "#f8fafc",
            borderRadius: "8px",
            border: "1px solid #e2e8f0"
          }}
        >
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}>
            <input
              type="checkbox"
              checked={bumpVersion}
              onChange={(e) => setBumpVersion(e.target.checked)}
            />
            Bump revision version (e.g. create v{(parseFloat(template?.version || "1.0") + 1.0).toFixed(1)})
          </label>

          {bumpVersion && (
            <div style={{ marginTop: "10px" }}>
              <label style={{ fontSize: "13px", color: "#475569" }}>
                Revision Notes
                <input
                  type="text"
                  value={versionNotes}
                  onChange={(e) => setVersionNotes(e.target.value)}
                  placeholder="Reason for revision..."
                  style={{ marginTop: "4px", width: "100%" }}
                />
              </label>
            </div>
          )}
        </div>

        <div
          className="modal-actions"
          style={{
            marginTop: "20px",
            display: "flex",
            gap: "10px",
            justifyContent: "flex-end"
          }}
        >
          <button type="button" className="secondary-button" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="submit"
            className="primary-button"
            disabled={saving || !form.name.trim()}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Save size={16} />
            {saving ? "Saving changes..." : `Save ${docTypeLabel} Changes`}
          </button>
        </div>
      </form>
    </Modal>
  );
}
