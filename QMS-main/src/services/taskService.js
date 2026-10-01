// Task service for QMS Backend API
const API_BASE = "/api/tasks";

export const taskService = {
  /**
   * Fetch all tasks
   */
  async fetchTasks(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}?${query}` : API_BASE;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load tasks");
    const data = await res.json();
    return data.tasks || [];
  },

  /**
   * Assign a new task
   */
  async createTask(taskData, token) {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(taskData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to create task");
    return data.task;
  },

  /**
   * Update task status (Pending, In Progress, Completed)
   */
  async updateTaskStatus(id, status, token) {
    const res = await fetch(`${API_BASE}/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update task status");
    return data.task;
  },

  /**
   * Delete task
   */
  async deleteTask(id, token) {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "DELETE",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to delete task");
    return data.task;
  }
};
