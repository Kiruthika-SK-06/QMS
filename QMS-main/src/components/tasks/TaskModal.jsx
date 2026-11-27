import React, { useState } from "react";
import { Plus, Save } from "lucide-react";
import Modal from "./Modal";
import { useApp } from "../../context/AppContext";
import CustomSelect from "../common/CustomSelect";

export default function TaskModal({ task, onClose, onSave }) {
  const { documents, employees, processes } = useApp();

  const defaultEmployee = employees[0]?.name || "Course Coordinator";
  const defaultProcess = processes[0]?.name || "Course Management";

  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    employee: task?.employee || defaultEmployee,
    process: task?.process || defaultProcess,
    document: task?.document || "",
    due: task?.due || "30 Sep 2026",
    status: task?.status || "Pending",
    priority: task?.priority || "Medium"
  });

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <Modal title={task ? `Edit Task: ${task.title}` : "Assign task"} onClose={onClose}>
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
          Assigned coordinator / member
          <CustomSelect
            value={form.employee}
            onChange={(e) => update("employee", e.target.value)}
            options={employees.map((emp) => ({
              value: emp.name,
              label: `${emp.name} (${emp.process})`
            }))}
          />
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
          <CustomSelect
            value={form.process}
            onChange={(e) => update("process", e.target.value)}
            options={processes.map((proc) => ({
              value: proc.name,
              label: proc.name
            }))}
          />
        </label>

        <label>
          Related document <span className="optional">(optional)</span>
          <CustomSelect
            value={form.document}
            onChange={(e) => update("document", e.target.value)}
            options={[
              { value: "", label: "No related document" },
              ...documents.map((doc) => ({
                value: doc.name,
                label: `${doc.name} (${doc.id})`
              }))
            ]}
          />
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
          className="primary-button btn-blue"
          disabled={!form.title.trim()}
          onClick={() => onSave(form)}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          {task ? <Save size={16} /> : <Plus size={17} />}
          <span>{task ? "Save Changes" : "Assign task"}</span>
        </button>
      </div>
    </Modal>
  );
}
