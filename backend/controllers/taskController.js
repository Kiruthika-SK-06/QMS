import mongoose from "mongoose";
import { Task } from "../models/Task.js";
import { Notification } from "../models/Notification.js";
import { broadcastRealtimeEvent } from "../utils/realtime.js";
import { tasksData } from "../data/tasks.js";
import { saveItem, updateItem, deleteItem, recordActivity } from "../config/storageEngine.js";

const logNotification = async (entry) => {
  if (mongoose.connection.readyState === 1) {
    try {
      await Notification.create({
        ...entry,
        id: entry.id || `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        createdAt: entry.createdAt || new Date().toISOString()
      });
    } catch (err) {
      console.warn("Notification DB log error:", err.message);
    }
  }
};

// GET /api/tasks
export const getAllTasks = async (req, res) => {
  try {
    const { employee, process, status } = req.query;

    if (mongoose.connection.readyState === 1) {
      try {
        const filter = {};
        if (employee) {
          filter.$or = [
            { employee: { $regex: employee, $options: "i" } },
            { assignedTo: { $regex: employee, $options: "i" } }
          ];
        }
        if (process && process !== "All") filter.process = { $regex: `^${process}$`, $options: "i" };
        if (status && status !== "All") filter.status = { $regex: `^${status}$`, $options: "i" };

        const tasks = await Task.find(filter).sort({ createdAt: -1 }).lean();
        if (tasks && tasks.length > 0) {
          return res.json({
            success: true,
            count: tasks.length,
            tasks
          });
        }
      } catch (err) {
        console.warn("getAllTasks DB error, using synchronized tasks:", err.message);
      }
    }

    // Dual-mode fallback from persistent tasks dataset
    let filtered = [...tasksData];
    if (employee) {
      const empLower = employee.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          (t.employee && t.employee.toLowerCase().includes(empLower)) ||
          (t.assignedTo && t.assignedTo.toLowerCase().includes(empLower))
      );
    }
    if (process && process !== "All") {
      const procLower = process.toLowerCase();
      filtered = filtered.filter((t) => t.process && t.process.toLowerCase() === procLower);
    }
    if (status && status !== "All") {
      const stLower = status.toLowerCase();
      filtered = filtered.filter((t) => t.status && t.status.toLowerCase() === stLower);
    }

    res.json({
      success: true,
      count: filtered.length,
      tasks: filtered
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/tasks/:id
export const getTaskById = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      try {
        const task = await Task.findOne({ id: req.params.id }).lean();
        if (task) return res.json({ success: true, task });
      } catch (err) {}
    }

    const task = tasksData.find((t) => t.id === req.params.id);
    if (!task) return res.status(404).json({ success: false, message: "Task not found in database" });

    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/tasks (Create task in database & log activity)
export const createTask = async (req, res) => {
  try {
    const { title, name, process, employee, assignedTo, dueDate, deadline, priority, description, stage } = req.body;
    const taskTitle = (title || name || "").trim();

    if (!taskTitle || !process) {
      return res.status(400).json({ success: false, message: "Task title and process are required" });
    }

    const creatorName = req.user?.name || "Admin";
    const taskId = `TASK-${String(tasksData.length + 1).padStart(3, "0")}`;
    const assignee = employee || assignedTo || "Unassigned";

    const newTaskData = {
      id: taskId,
      title: taskTitle,
      name: taskTitle,
      process,
      employee: assignee,
      assignedTo: assignee,
      dueDate: dueDate || deadline || "30 Nov 2026",
      assigned: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      due: dueDate || deadline || "30 Nov 2026",
      priority: priority || "Medium",
      status: "In Progress",
      stage: stage || 1,
      description: description || ""
    };

    // Stored in database & persistent file store
    await saveItem("tasks", newTaskData, Task);

    // Stored in Activity / Audit Trail in database
    await recordActivity({
      title: "Task Management",
      text: `Task '${taskTitle}' (${taskId}) created and assigned to ${assignee} in process '${process}'`,
      detail: `Priority: ${priority || "Medium"} | Due: ${newTaskData.due}`,
      actor: creatorName,
      role: req.user?.role || "user",
      tone: "blue"
    });

    await logNotification({
      title: `Task Assigned: ${taskTitle}`,
      text: `You have been assigned task '${taskTitle}' in process '${process}'`,
      targetRole: "all"
    });

    broadcastRealtimeEvent("TASK_CREATED", { action: "CREATED", task: newTaskData });

    res.status(201).json({ success: true, message: "Task created and stored in database successfully", task: newTaskData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/tasks/:id/status (Update task status in database & log activity)
export const updateTaskStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const memTask = tasksData.find((t) => t.id === req.params.id);
    if (!memTask) {
      return res.status(404).json({ success: false, message: "Task not found in database" });
    }

    const updates = { status };
    if (remarks) updates.remarks = remarks;

    // Stored in database & persistent file store
    await updateItem("tasks", "id", memTask.id, updates, Task);

    // Stored in Activity / Audit Trail in database
    await recordActivity({
      title: "Task Management",
      text: `Task '${memTask.title || memTask.name}' status updated to '${status}'`,
      detail: remarks ? `Remarks: ${remarks}` : `Status transition to ${status}`,
      actor: req.user?.name || "User",
      role: req.user?.role || "user",
      tone: status === "Completed" ? "green" : "blue"
    });

    broadcastRealtimeEvent("TASK_UPDATED", { action: "STATUS_UPDATED", task: memTask });

    res.json({ success: true, message: "Task status updated in database successfully", task: memTask });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/tasks/:id
export const updateTask = async (req, res) => {
  try {
    const { title, name, process, employee, assignedTo, dueDate, deadline, priority, status, description } = req.body;
    const memTask = tasksData.find((t) => t.id === req.params.id);
    if (!memTask) {
      return res.status(404).json({ success: false, message: "Task not found in database" });
    }

    const updates = {};
    if (title || name) {
      updates.title = (title || name).trim();
      updates.name = updates.title;
    }
    if (process) updates.process = process.trim();
    if (employee || assignedTo) {
      updates.employee = employee || assignedTo;
      updates.assignedTo = employee || assignedTo;
    }
    if (dueDate || deadline) {
      updates.dueDate = dueDate || deadline;
      updates.due = updates.dueDate;
    }
    if (priority) updates.priority = priority;
    if (status) updates.status = status;
    if (description !== undefined) updates.description = description;

    // Update in database & persistent file store
    await updateItem("tasks", "id", memTask.id, updates, Task);

    // Stored in Activity / Audit Trail in database
    await recordActivity({
      title: "Task Management",
      text: `Task '${memTask.title || memTask.name}' updated by ${req.user?.name || "User"}`,
      detail: `Updated attributes: ${Object.keys(updates).join(", ")}`,
      actor: req.user?.name || "User",
      tone: "blue"
    });

    broadcastRealtimeEvent("TASK_UPDATED", { action: "UPDATED", task: memTask });

    res.json({ success: true, message: "Task updated in database successfully", task: memTask });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/tasks/:id
export const deleteTask = async (req, res) => {
  try {
    const memTask = tasksData.find((t) => t.id === req.params.id);
    if (!memTask) {
      return res.status(404).json({ success: false, message: "Task not found in database" });
    }

    await deleteItem("tasks", "id", memTask.id, Task);

    // Stored in Activity / Audit Trail in database
    await recordActivity({
      title: "Task Management",
      text: `Task '${memTask.title || memTask.name}' (${memTask.id}) was deleted from database`,
      actor: req.user?.name || "Admin",
      tone: "red"
    });

    broadcastRealtimeEvent("TASK_DELETED", { action: "DELETED", id: req.params.id });

    res.json({ success: true, message: "Task deleted from database successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getAllTasks,
  getTaskById,
  createTask,
  updateTaskStatus,
  updateTask,
  deleteTask
};
