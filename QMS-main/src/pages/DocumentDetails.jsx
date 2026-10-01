import React, { useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { Download, Plus } from "lucide-react";
import { useApp } from "../context/AppContext";
import PageIntro from "../components/common/PageIntro";
import SectionHeader from "../components/common/SectionHeader";
import Detail from "../components/common/Detail";
import EmptyState from "../components/common/EmptyState";
import StatusBadge from "../components/common/StatusBadge";
import VersionHistory from "../components/tables/VersionHistory";
import TaskTable from "../components/tables/TaskTable";

export default function DocumentDetails() {
  const { id } = useParams();
  const { documents, tasks, currentUser, addVersion, downloadDocument } = useApp();
  const document = documents.find((item) => item.id === id);

  if (!document) return <EmptyState title="Document not found" />;

  const relatedTasks = tasks.filter((task) => task.document === document.name);

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
              <button className="primary-button" onClick={() => addVersion(document.id)}>
                <Plus size={16} /> Create new version
              </button>
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
        <SectionHeader title="Version history" action={<NavLink className="text-link" to="/version-history">Open full history</NavLink>} />
        <VersionHistory versions={document.versions} />
      </section>

      {relatedTasks.length > 0 && (
        <section className="panel">
          <SectionHeader title="Related tasks" action={<NavLink className="text-link" to="/tasks">Open task board</NavLink>} />
          <TaskTable items={relatedTasks} />
        </section>
      )}
    </>
  );
}
