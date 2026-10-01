import React, { useState } from "react";
import { Plus } from "lucide-react";
import { useApp } from "../context/AppContext";
import PageIntro from "../components/common/PageIntro";
import TaskTable from "../components/tables/TaskTable";
import TaskModal from "../components/tasks/TaskModal";

export default function Tasks() {
  const { tasks, currentUser, addTask } = useApp();
  const [showModal, setShowModal] = useState(false);
  const items = currentUser.role === "employee" ? tasks.filter((task) => task.employee === currentUser.name) : tasks;
  return <><PageIntro eyebrow="Work management" title="Tasks" description="Track assignments and completion without relying on email threads." action={currentUser.role !== "employee" && <button className="primary-button" onClick={() => setShowModal(true)}><Plus size={17} /> Assign task</button>} /><section className="panel"><TaskTable items={items} /></section>{showModal && <TaskModal onClose={() => setShowModal(false)} onSave={(task) => { addTask(task); setShowModal(false); }} />}</>;
}
