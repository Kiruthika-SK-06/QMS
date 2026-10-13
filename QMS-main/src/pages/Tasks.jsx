import React, { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useApp } from "../context/AppContext";
import PageIntro from "../components/common/PageIntro";
import TaskTable from "../components/tables/TaskTable";
import TaskModal from "../components/tasks/TaskModal";

export default function Tasks() {
  const { tasks, currentUser, addTask } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [query, setQuery] = useState("");

  const items = (tasks || []).filter((task) => {
    const matchesStatus = statusFilter === "All" || task.status === statusFilter;
    const q = query.toLowerCase();
    const matchesQuery =
      task.title?.toLowerCase().includes(q) ||
      task.id?.toLowerCase().includes(q) ||
      task.process?.toLowerCase().includes(q) ||
      task.employee?.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  return (
    <>
      <PageIntro
        eyebrow="Work management"
        title="Tasks"
        description="Track assignments and completion across coordinators without relying on email threads."
        action={
          <button className="primary-button btn-blue" onClick={() => setShowModal(true)}>
            <Plus size={17} />
            <span>Assign task</span>
          </button>
        }
      />

      <div className="filter-bar">
        <label className="search-field">
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks by title, ID, process, or assignee..."
          />
        </label>
        <div className="tabs">
          {["All", "Pending", "In Progress", "Completed"].map((tab) => (
            <button
              key={tab}
              className={statusFilter === tab ? "tab active" : "tab"}
              onClick={() => setStatusFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <section className="panel">
        <TaskTable items={items} />
      </section>

      {showModal && (
        <TaskModal
          onClose={() => setShowModal(false)}
          onSave={(task) => {
            addTask(task);
            setShowModal(false);
          }}
        />
      )}
    </>
  );
}
