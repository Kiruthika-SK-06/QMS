import mongoose from "mongoose";
import { Task } from "../models/Task.js";
import { Activity } from "../models/Activity.js";
import { Notification } from "../models/Notification.js";
import { Process } from "../models/Process.js";
import { tasksData } from "../data/tasks.js";
import { activitiesData } from "../data/activities.js";
import { notificationsData } from "../data/notifications.js";
import { processesData } from "../data/processes.js";
import { broadcastRealtimeEvent } from "../utils/realtime.js";

const logActivity = async (entry) => {
  activitiesData.unshift(entry);
  if (mongoose.connection.readyState === 1) {
    try {
      await Activity.create(entry);
    } catch (err) {
      console.warn("Activity DB log error:", err.message);
    }
  }
};

const logNotification = async (entry) => {
  notificationsData.unshift(entry);
  if (mongoose.connection.readyState === 1) {
    try {
      await Notification.create(entry);
    } catch (err) {
      console.warn("Notification DB log error:", err.message);
    }
  }
};

// GET /api/tasks
export const getAllTasks = async (req, res) => {
  try {
    const { employee, process, status } = req.query;
    let list = [...tasksData];

    if (mongoose.connection.readyState === 1) {
      try {
        const dbTasks = await Task.find({}).lean();
        if (dbTasks && dbTasks.length > 0) {
          list = dbTasks;
          tasksData.length = 0;
          tasksData.push(...dbTasks);
        }
      } catch (err) {
        console.warn("MongoDB read error in getAllTasks:", err.message);
      }
    }

    if (employee) {
      list = list.filter((t) => (t.employee || t.assignedTo || "").toLowerCase() === employee.toLowerCase());
    }

    if (process && process !== "All") {
      list = list.filter((t) => (t.process || "").toLowerCase() === process.toLowerCase());
    }

    if (status && status !== "All") {
      list = list.filter((t) => (t.status || "").toLowerCase() === status.toLowerCase());
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
export const getTaskById = async (req, res) => {
  try {
    let task = tasksData.find((t) => t.id === req.params.id);

    if (mongoose.connection.readyState === 1) {
      try {
        const dbTask = await Task.findOne({ id: req.params.id }).lean();
        if (dbTask) task = dbTask;
      } catch (err) {
        console.warn("MongoDB query error in getTaskById:", err.message);
      }
    }

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/tasks
export const createTask = async (req, res) => {
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
    const assignerName = req.user?.name || "Course Coordinator";
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
      assignedTo: employee.trim(),
      assignedBy: assignerName,
      process: process || "Employee Onboarding",
      document: document || "",
      assigned: dateStr,
      due: due || "30 Sep 2026",
      dueDate: due || "30 Sep 2026",
      status: "Pending",
      priority: priority || "Medium"
    };

    if (mongoose.connection.readyState === 1) {
      try {
        await Task.create(newTask);
      } catch (err) {
        console.warn("MongoDB createTask error:", err.message);
      }
    }

    tasksData.unshift(newTask);

    // Update process stats if matching process
    const proc = processesData.find((p) => p.name === newTask.process);
    if (proc) {
      proc.active = (proc.active || 0) + 1;
      if (mongoose.connection.readyState === 1) {
        try {
          await Process.findOneAndUpdate({ name: newTask.process }, { $inc: { active: 1 } });
        } catch {}
      }
    }

    // Audit log
    await logActivity({
      id: `ACT-${Date.now()}`,
      title: "Task Assigned",
      detail: `${newTask.title} (${newTask.employee})`,
      text: `Task assigned to ${newTask.employee}: ${newTask.title}`,
      actor: assignerName,
      time: "Just now",
      tone: "green",
      timestamp: new Date().toISOString()
    });

    // Notification
    await logNotification({
      id: Date.now(),
      title: "New task assigned",
      text: `${newTask.title} (Due: ${newTask.due}) assigned by ${assignerName}.`,
      time: "Just now",
      targetRole: "employee",
      read: false,
      createdAt: new Date().toISOString()
    });

    broadcastRealtimeEvent("TASK_UPDATED", { action: "CREATED", task: newTask });

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
export const updateTaskStatus = async (req, res) => {
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

    if (mongoose.connection.readyState === 1) {
      try {
        await Task.findOneAndUpdate({ id: req.params.id }, { status }, { new: true, upsert: true });
      } catch (err) {
        console.warn("MongoDB updateTaskStatus error:", err.message);
      }
    }

    const actorName = req.user?.name || task.employee;

    // Update process stats
    const proc = processesData.find((p) => p.name === task.process);
    if (proc && prevStatus !== "Completed" && status === "Completed") {
      proc.completed = (proc.completed || 0) + 1;
      if (proc.active > 0) proc.active -= 1;
      if (mongoose.connection.readyState === 1) {
        try {
          await Process.findOneAndUpdate(
            { name: task.process },
            { $inc: { completed: 1, active: proc.active > 0 ? -1 : 0 } }
          );
        } catch {}
      }
    }

    // Audit log
    await logActivity({
      id: `ACT-${Date.now()}`,
      title: "Task Status Updated",
      detail: `${task.title} (${status})`,
      text: `${actorName} marked task as ${status}: ${task.title}`,
      actor: actorName,
      time: "Just now",
      tone: status === "Completed" ? "green" : "blue",
      timestamp: new Date().toISOString()
    });

    // Notification if completed
    if (status === "Completed") {
      await logNotification({
        id: Date.now(),
        title: "Task completed",
        text: `${task.employee} completed task "${task.title}".`,
        time: "Just now",
        targetRole: "owner",
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    broadcastRealtimeEvent("TASK_UPDATED", { action: "STATUS_UPDATED", task });

    res.json({
      success: true,
      message: `Task updated to ${status}`,
      task
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT or PATCH /api/tasks/:id (Edit task details)
export const updateTask = async (req, res) => {
  try {
    const taskIndex = tasksData.findIndex((t) => t.id === req.params.id);
    if (taskIndex === -1) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const { title, description, employee, process, document, due, priority, status } = req.body;
    const task = tasksData[taskIndex];
    const actorName = req.user?.name || "Course Coordinator";

    const updatedTask = {
      ...task,
      title: title !== undefined ? title.trim() : task.title,
      description: description !== undefined ? description : task.description,
      employee: employee !== undefined ? employee.trim() : task.employee,
      assignedTo: employee !== undefined ? employee.trim() : task.employee,
      process: process !== undefined ? process : task.process,
      document: document !== undefined ? document : task.document,
      due: due !== undefined ? due : task.due,
      dueDate: due !== undefined ? due : task.due,
      priority: priority !== undefined ? priority : task.priority,
      status: status !== undefined ? status : task.status
    };

    if (mongoose.connection.readyState === 1) {
      try {
        await Task.findOneAndUpdate({ id: req.params.id }, updatedTask, { new: true, upsert: true });
      } catch (err) {
        console.warn("MongoDB updateTask error:", err.message);
      }
    }

    tasksData[taskIndex] = updatedTask;

    // Audit log
    await logActivity({
      id: `ACT-${Date.now()}`,
      title: "Task Updated",
      detail: `${updatedTask.title} (${updatedTask.id})`,
      text: `Task updated: ${updatedTask.title} (${updatedTask.id})`,
      actor: actorName,
      time: "Just now",
      tone: "blue",
      timestamp: new Date().toISOString()
    });

    broadcastRealtimeEvent("TASK_UPDATED", { action: "UPDATED", task: updatedTask });

    res.json({
      success: true,
      message: "Task updated successfully",
      task: updatedTask
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/tasks/:id
export const deleteTask = async (req, res) => {
  try {
    const index = tasksData.findIndex((t) => t.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const [deleted] = tasksData.splice(index, 1);

    if (mongoose.connection.readyState === 1) {
      try {
        await Task.findOneAndDelete({ id: req.params.id });
      } catch (err) {
        console.warn("MongoDB deleteTask error:", err.message);
      }
    }

    broadcastRealtimeEvent("TASK_UPDATED", { action: "DELETED", id: req.params.id });
    res.json({ success: true, message: "Task deleted", task: deleted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
