import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { BookOpen, Check, ClipboardList, Clock3, FileCheck2, FileText, Users, Edit, Download, Layers, Trash2, AlertTriangle } from "lucide-react";
import { useApp } from "../../context/AppContext";
import PageIntro from "../common/PageIntro";
import SectionHeader from "../common/SectionHeader";
import StatCard from "../common/StatCard";
import StatusBadge from "../common/StatusBadge";
import TemplateEditModal from "../common/TemplateEditModal";
import Modal from "../tasks/Modal";
import ActivityCard from "./ActivityCard";
import DocumentTable from "../tables/DocumentTable";
import ProcessTable from "../tables/ProcessTable";

export default function QMGroupDashboard() {
  const { tasks, documents, processes, employees, downloadDocument, deleteDocument } = useApp();
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [tplToDelete, setTplToDelete] = useState(null);
  const [deletingTpl, setDeletingTpl] = useState(false);

  const templates = (documents || []).filter((d) => d.type === "Templates");

  const processOwnersCount = employees.filter((e) => e.role === "owner").length;
  const pendingReviews = documents.filter(
    (d) => d.status === "Under Review" || d.status === "Changes Requested"
  ).length;
  const activeTasks = tasks.filter((t) => t.status === "In Progress").length;
  const completedTasks = tasks.filter((t) => t.status === "Completed").length;
  const pendingTasks = tasks.filter((t) => t.status === "Pending").length;

  const totalTasks = tasks.length || 1;
  const completedPct = Math.round((completedTasks / totalTasks) * 100);
  const activePct = Math.round((activeTasks / totalTasks) * 100);
  const pendingPct = Math.round((pendingTasks / totalTasks) * 100);

  return (
    <>
      <PageIntro
        eyebrow="Quality management group"
        title="QMS command view"
        description="Monitor document control, task completion and review activity across the organization."
      />
      <div className="stats-grid seven">
        <StatCard label="Processes" value={processes.length} icon={BookOpen} />
        <StatCard label="Process owners" value={processOwnersCount || 3} icon={Users} tone="teal" />
        <StatCard label="Employees" value={employees.length} icon={Users} />
        <StatCard label="Documents" value={documents.length} icon={FileText} tone="teal" />
        <StatCard label="Pending reviews" value={pendingReviews} icon={FileCheck2} tone="amber" />
        <StatCard label="Active tasks" value={activeTasks} icon={ClipboardList} />
        <StatCard label="Completed tasks" value={completedTasks} icon={Check} tone="green" />
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <SectionHeader title="Task completion" />
          <div className="chart">
            <div className="chart-bar">
              <span style={{ height: `${Math.max(completedPct, 8)}%` }} />
              <small>Completed</small>
              <strong>{completedPct}%</strong>
            </div>
            <div className="chart-bar">
              <span style={{ height: `${Math.max(activePct, 8)}%` }} />
              <small>In progress</small>
              <strong>{activePct}%</strong>
            </div>
            <div className="chart-bar">
              <span style={{ height: `${Math.max(pendingPct, 8)}%` }} />
              <small>Pending</small>
              <strong>{pendingPct}%</strong>
            </div>
          </div>
        </section>
        <ActivityCard />
      </div>

      <section className="panel">
        <SectionHeader
          title="Document review queue"
          action={<NavLink className="text-link" to="/reviews">Open review queue</NavLink>}
        />
        <DocumentTable
          items={documents.filter(
            (document) => document.status === "Under Review" || document.status === "Changes Requested"
          )}
          review
        />
      </section>

      <section className="panel">
        <SectionHeader
          title="Controlled templates & standard formats"
          action={
            <NavLink className="text-link" to="/documents?type=Templates">
              View all in library
            </NavLink>
          }
        />
        {templates.length === 0 ? (
          <div style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>
            <p>No standard templates registered yet.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Template</th>
                  <th>Process</th>
                  <th>Version</th>
                  <th>Last updated</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((tpl) => (
                  <tr key={tpl.id}>
                    <td>
                      <NavLink className="table-link" to={`/documents/${tpl.id}`}>
                        <strong>{tpl.name}</strong>
                        <small>{tpl.id}</small>
                      </NavLink>
                    </td>
                    <td>{tpl.process}</td>
                    <td>
                      <b>v{tpl.version}</b>
                    </td>
                    <td>{tpl.updated}</td>
                    <td>
                      <StatusBadge status={tpl.status} />
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          type="button"
                          className="row-action"
                          onClick={() => setEditingTemplate(tpl)}
                          style={{
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            fontWeight: "600",
                            color: "#0284c7"
                          }}
                        >
                          <Edit size={14} /> Edit template
                        </button>
                        <button
                          type="button"
                          className="row-action"
                          onClick={() => downloadDocument(tpl.id)}
                          style={{
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          <Download size={14} /> View
                        </button>
                        <button
                          type="button"
                          className="row-action"
                          onClick={() => setTplToDelete(tpl)}
                          style={{
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            color: "#ef4444"
                          }}
                          title={`Delete template ${tpl.name}`}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <SectionHeader
          title="Process overview"
          action={<NavLink className="text-link" to="/processes">View all processes</NavLink>}
        />
        <ProcessTable items={processes} />
      </section>

      {editingTemplate && (
        <TemplateEditModal
          template={editingTemplate}
          onClose={() => setEditingTemplate(null)}
          onSave={() => setEditingTemplate(null)}
        />
      )}

      {tplToDelete && (
        <Modal
          title="Delete Controlled Template"
          onClose={() => setTplToDelete(null)}
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
                  Are you sure you want to delete template <strong>{tplToDelete.name}</strong> ({tplToDelete.id})? This will permanently remove it from the system and log an audit trail entry.
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
                onClick={() => setTplToDelete(null)}
                disabled={deletingTpl}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                style={{ background: "#dc2626", borderColor: "#dc2626" }}
                disabled={deletingTpl}
                onClick={async () => {
                  setDeletingTpl(true);
                  try {
                    await deleteDocument(tplToDelete.id);
                    setTplToDelete(null);
                  } catch (err) {
                    alert(err.message || "Failed to delete template");
                  } finally {
                    setDeletingTpl(false);
                  }
                }}
              >
                {deletingTpl ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
