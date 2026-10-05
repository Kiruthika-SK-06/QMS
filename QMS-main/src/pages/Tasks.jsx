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

  const baseTasks =
    currentUser?.role === "employee"
      ? (tasks || []).filter(
          (task) =>
            task.employee?.toLowerCase() === currentUser?.name?.toLowerCase() ||
            task.employee?.toLowerCase() === currentUser?.username?.toLowerCase()
        )
      : tasks || [];

  const items = baseTasks.filter((task) => {
    const matchesStatus = statusFilter === "All" || task.status === statusFilter;
    const matchesQuery =
      task.title?.toLowerCase().includes(query.toLowerCase()) ||
      task.id?.toLowerCase().includes(query.toLowerCase()) ||
      task.process?.toLowerCase().includes(query.toLowerCase()) ||
      task.employee?.toLowerCase().includes(query.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  return (
    <>
      <PageIntro
        eyebrow="Work management"
        title="Tasks"
        description="Track assignments and completion without relying on email threads."
        action={
          currentUser?.role !== "employee" && (
            <button className="primary-button" onClick={() => setShowModal(true)}>
              <Plus size={17} /> Assign task
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
            placeholder="Search tasks by title, ID, process, or employee..."
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

