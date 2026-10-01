import React, { useState } from "react";
import { Check, Clock, PlayCircle, FileText } from "lucide-react";
import StatusBadge from "../common/StatusBadge";
import Modal from "../tasks/Modal";
import Detail from "../common/Detail";
import { useApp } from "../../context/AppContext";

export default function TaskTable({ items = [] }) {
  const { updateTaskStatus } = useApp();
  const [selectedTask, setSelectedTask] = useState(null);
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (newStatus) => {
    if (!selectedTask) return;
    setUpdating(true);
    try {
      await updateTaskStatus(selectedTask.id, newStatus);
      setSelectedTask((prev) => (prev ? { ...prev, status: newStatus } : null));
    } catch (err) {
      console.error("Error updating task status:", err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Task</th>
              <th>Process</th>
              <th>Assigned date</th>
              <th>Due date</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((task) => (
              <tr key={task.id}>
                <td>
                  <strong>{task.title}</strong>
                  <small>{task.id}</small>
                </td>
                <td>{task.process}</td>
                <td>{task.assigned}</td>
                <td>{task.due}</td>
                <td>
                  <StatusBadge status={task.status} />
                </td>
                <td>
                  <button
                    className="row-action"
                    onClick={() => setSelectedTask(task)}
                    style={{ cursor: "pointer" }}
                  >
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedTask && (
        <Modal title={`Task: ${selectedTask.id}`} onClose={() => setSelectedTask(null)}>
          <div className="review-summary">
            <Detail label="Title" value={selectedTask.title} />
            <Detail label="Process" value={selectedTask.process} />
            <Detail label="Assigned to" value={selectedTask.employee} />
            <Detail label="Assigned date" value={selectedTask.assigned} />
            <Detail label="Due date" value={selectedTask.due} />
            <Detail label="Status" value={<StatusBadge status={selectedTask.status} />} />
            {selectedTask.document && (
              <Detail label="Related document" value={selectedTask.document} />
            )}
          </div>

          {selectedTask.description && (
            <div style={{ margin: "16px 0", padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <strong style={{ display: "block", fontSize: "12px", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>
                Task Instructions
              </strong>
              <p style={{ margin: 0, fontSize: "14px", color: "#334155" }}>
                {selectedTask.description}
              </p>
            </div>
          )}

          <div className="modal-actions" style={{ marginTop: "20px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            {selectedTask.status === "Pending" && (
              <button
                type="button"
                className="secondary-button"
                disabled={updating}
                onClick={() => handleStatusChange("In Progress")}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <PlayCircle size={16} /> Start Task
              </button>
            )}

            {selectedTask.status !== "Completed" ? (
              <button
                type="button"
                className="primary-button"
                disabled={updating}
                onClick={() => handleStatusChange("Completed")}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Check size={16} /> Mark as Completed
              </button>
            ) : (
              <button
                type="button"
                className="secondary-button"
                disabled={updating}
                onClick={() => handleStatusChange("In Progress")}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Clock size={16} /> Reopen Task
              </button>
            )}

            <button
              type="button"
              className="plain-button"
              onClick={() => setSelectedTask(null)}
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
