import React, { useState } from "react";
import { Plus } from "lucide-react";
import Modal from "./Modal";
import { useApp } from "../../context/AppContext";

export default function TaskModal({ onClose, onSave }) {
  const { documents, employees, processes } = useApp();

  const defaultEmployee = employees[0]?.name || "Arun Kumar";
  const defaultProcess = processes[0]?.name || "Employee Onboarding";

  const [form, setForm] = useState({
    title: "",
    description: "",
    employee: defaultEmployee,
    process: defaultProcess,
    document: "",
    due: "30 Sep 2026",
    status: "Pending",
    priority: "Medium"
  });

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <Modal title="Assign task" onClose={onClose}>
      <div className="form-grid">
        <label>
          Task title
          <input
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. Audit documentation, Submit quarterly review"
            required
          />
        </label>

        <label>
          Assigned employee
          <select value={form.employee} onChange={(e) => update("employee", e.target.value)}>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.name}>
                {emp.name} ({emp.process})
              </option>
            ))}
          </select>
        </label>

        <label>
          Description
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Describe the expected outcome and deliverable requirements..."
            rows={3}
          />
        </label>

        <label>
          Process
          <select value={form.process} onChange={(e) => update("process", e.target.value)}>
            {processes.map((proc) => (
              <option key={proc.id || proc.name} value={proc.name}>
                {proc.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Related document <span className="optional">(optional)</span>
          <select value={form.document} onChange={(e) => update("document", e.target.value)}>
            <option value="">No related document</option>
            {documents.map((doc) => (
              <option key={doc.id} value={doc.name}>
                {doc.name} ({doc.id})
              </option>
            ))}
          </select>
        </label>

        <label>
          Due date
          <input
            type="date"
            onChange={(e) => {
              if (e.target.value) {
                const date = new Date(e.target.value);
                const formatted = date.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric"
                });
                update("due", formatted);
              }
            }}
          />
        </label>
      </div>

      <div className="modal-actions" style={{ marginTop: "20px" }}>
        <button type="button" className="secondary-button" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="primary-button"
          disabled={!form.title.trim()}
          onClick={() => onSave(form)}
        >
          <Plus size={17} /> Assign task
        </button>
      </div>
    </Modal>
  );
}
