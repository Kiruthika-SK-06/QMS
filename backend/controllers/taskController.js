import { tasksData } from "../data/tasks.js";
import { activitiesData } from "../data/activities.js";
import { notificationsData } from "../data/notifications.js";
import { processesData } from "../data/processes.js";

// GET /api/tasks
export const getAllTasks = (req, res) => {
  try {
    const { employee, process, status } = req.query;
    let list = [...tasksData];

    if (employee) {
      list = list.filter((t) => t.employee.toLowerCase() === employee.toLowerCase());
    }

    if (process && process !== "All") {
      list = list.filter((t) => t.process.toLowerCase() === process.toLowerCase());
    }

    if (status && status !== "All") {
      list = list.filter((t) => t.status.toLowerCase() === status.toLowerCase());
    }

    res.json({
      success: true,
      count: list.length,
      tasks: list
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/tasks/:id
export const getTaskById = (req, res) => {
  try {
    const task = tasksData.find((t) => t.id === req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/tasks
export const createTask = (req, res) => {
  try {
    const { title, description, employee, process, document, due, priority } = req.body;
    if (!title || !employee) {
      return res.status(400).json({
        success: false,
        message: "Task title and assigned employee are required"
      });
    }

    const nextIdNumber = tasksData.length + 1;
    const newId = `TASK-${String(nextIdNumber).padStart(3, "0")}`;
    const assignerName = req.user?.name || "Process Owner";
    const dateStr = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

    const newTask = {
      id: newId,
      title: title.trim(),
      description: description || "",
      employee: employee.trim(),
      process: process || "Employee Onboarding",
      document: document || "",
      assigned: dateStr,
      due: due || "30 Sep 2026",
      status: "Pending",
      priority: priority || "Medium"
    };

    tasksData.unshift(newTask);

    // Update process stats if matching process
    const proc = processesData.find((p) => p.name === newTask.process);
    if (proc) {
      proc.active += 1;
    }

    // Audit log
    activitiesData.unshift({
      id: `ACT-${Date.now()}`,
      text: `Task assigned to ${newTask.employee}: ${newTask.title}`,
      actor: assignerName,
      time: "Just now",
      tone: "green",
      timestamp: new Date().toISOString()
    });

    // Notification
    notificationsData.unshift({
      id: Date.now(),
      title: "New task assigned",
      text: `${newTask.title} (Due: ${newTask.due}) assigned by ${assignerName}.`,
      time: "Just now",
      targetRole: "employee",
      read: false,
      createdAt: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      message: "Task assigned successfully",
      task: newTask
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/tasks/:id/status
export const updateTaskStatus = (req, res) => {
  try {
    const taskIndex = tasksData.findIndex((t) => t.id === req.params.id);
    if (taskIndex === -1) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: "Task status is required" });
    }

    const task = tasksData[taskIndex];
    const prevStatus = task.status;
    task.status = status;

    const actorName = req.user?.name || task.employee;

    // Update process stats
    const proc = processesData.find((p) => p.name === task.process);
    if (proc && prevStatus !== "Completed" && status === "Completed") {
      proc.completed += 1;
      if (proc.active > 0) proc.active -= 1;
    }

    // Audit log
    activitiesData.unshift({
      id: `ACT-${Date.now()}`,
      text: `${actorName} marked task as ${status}: ${task.title}`,
      actor: actorName,
      time: "Just now",
      tone: status === "Completed" ? "green" : "blue",
      timestamp: new Date().toISOString()
    });

    // Notification if completed
    if (status === "Completed") {
      notificationsData.unshift({
        id: Date.now(),
        title: "Task completed",
        text: `${task.employee} completed task "${task.title}".`,
        time: "Just now",
        targetRole: "owner",
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: `Task updated to ${status}`,
      task
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/tasks/:id
export const deleteTask = (req, res) => {
  try {
    const index = tasksData.findIndex((t) => t.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    const [deleted] = tasksData.splice(index, 1);
    res.json({ success: true, message: "Task deleted", task: deleted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
