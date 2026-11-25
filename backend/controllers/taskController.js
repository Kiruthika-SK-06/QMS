import mongoose from "mongoose";
import { Task } from "../models/Task.js";
import { Activity } from "../models/Activity.js";
import { Notification } from "../models/Notification.js";
import { broadcastRealtimeEvent } from "../utils/realtime.js";

const logActivity = async (entry) => {
  if (mongoose.connection.readyState === 1) {
    try {
      await Activity.create({
        ...entry,
        id: entry.id || `ACT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: entry.timestamp || new Date().toISOString()
      });
    } catch (err) {
      console.warn("Activity DB log error:", err.message);
    }
  }
};

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

    if (mongoose.connection.readyState !== 1) {
      return res.json({ success: true, count: 0, tasks: [] });
    }

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

    res.json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/tasks/:id
export const getTaskById = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const task = await Task.findOne({ id: req.params.id }).lean();
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/tasks
export const createTask = async (req, res) => {
  try {
    const { title, name, process, employee, assignedTo, dueDate, deadline, priority, description, stage } = req.body;
    const taskTitle = (title || name || "").trim();

    if (!taskTitle || !process) {
      return res.status(400).json({ success: false, message: "Task title and process are required" });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: "Database not connected" });
    }

    const creatorName = req.user?.name || "Admin";
    const taskId = `TSK-${Date.now().toString().slice(-6)}`;
    const assignee = employee || assignedTo || "Unassigned";

    const newTask = await Task.create({
      id: taskId,
      title: taskTitle,
      name: taskTitle,
      process,
      employee: assignee,
      assignedTo: assignee,
      dueDate: dueDate || deadline || "30 Nov 2026",
      priority: priority || "Medium",
      status: "In Progress",
      stage: stage || 1,
      description: description || ""
    });

    await logActivity({
      text: `Task '${taskTitle}' (${taskId}) created for ${assignee} in process '${process}'`,
      actor: creatorName,
      tone: "blue"
    });

    await logNotification({
      title: `Task Assigned: ${taskTitle}`,
      text: `You have been assigned task '${taskTitle}' in process '${process}'`,
      targetRole: "all"
    });

    broadcastRealtimeEvent("TASK_CREATED", { action: "CREATED", task: newTask });

    res.status(201).json({ success: true, message: "Task created successfully", task: newTask });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/tasks/:id/status
export const updateTaskStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: "Database not connected" });
    }

    const task = await Task.findOne({ id: req.params.id });
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    task.status = status;
    if (remarks) task.remarks = remarks;
    await task.save();

    await logActivity({
      text: `Task '${task.title || task.name}' status updated to '${status}'`,
      actor: req.user?.name || "User",
      tone: status === "Completed" ? "green" : "blue"
    });

    broadcastRealtimeEvent("TASK_UPDATED", { action: "STATUS_UPDATED", task });

    res.json({ success: true, message: "Task status updated", task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/tasks/:id
export const updateTask = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: "Database not connected" });
    }

    const task = await Task.findOne({ id: req.params.id });
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    const { title, name, process, employee, assignedTo, dueDate, deadline, priority, status, description } = req.body;
    if (title || name) task.title = (title || name).trim();
    if (process) task.process = process.trim();
    if (employee || assignedTo) {
      task.employee = employee || assignedTo;
      task.assignedTo = employee || assignedTo;
    }
    if (dueDate || deadline) task.dueDate = dueDate || deadline;
    if (priority) task.priority = priority;
    if (status) task.status = status;
    if (description !== undefined) task.description = description;

    await task.save();

    broadcastRealtimeEvent("TASK_UPDATED", { action: "UPDATED", task });

    res.json({ success: true, message: "Task updated successfully", task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/tasks/:id
export const deleteTask = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: "Database not connected" });
    }

    const task = await Task.findOneAndDelete({ id: req.params.id });
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    await logActivity({
      text: `Task '${task.title || task.name}' (${task.id}) was deleted`,
      actor: req.user?.name || "Admin",
      tone: "red"
    });

    broadcastRealtimeEvent("TASK_DELETED", { action: "DELETED", id: req.params.id });

    res.json({ success: true, message: "Task deleted successfully" });
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
