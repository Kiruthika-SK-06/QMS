import mongoose from "mongoose";
import { Process } from "../models/Process.js";
import { Document } from "../models/Document.js";
import { Task } from "../models/Task.js";
import { Employee } from "../models/Employee.js";

// Dynamic recalculation of process document, employee and task counts from MongoDB
export const getEnrichedProcesses = async () => {
  if (mongoose.connection.readyState !== 1) {
    return [];
  }

  const processes = await Process.find({}).lean();
  if (!processes || processes.length === 0) return [];

  const enriched = await Promise.all(
    processes.map(async (proc) => {
      const [docCount, empCount, activeTasks, completedTasks] = await Promise.all([
        Document.countDocuments({ process: proc.name }),
        Employee.countDocuments({ process: proc.name }),
        Task.countDocuments({ process: proc.name, status: { $ne: "Completed" } }),
        Task.countDocuments({ process: proc.name, status: "Completed" })
      ]);

      const totalTasks = activeTasks + completedTasks;
      const calculatedProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : (proc.progress || 0);

      return {
        ...proc,
        documents: docCount,
        employees: empCount,
        active: activeTasks,
        completed: completedTasks,
        progress: calculatedProgress
      };
    })
  );

  return enriched;
};

// GET /api/processes
export const getAllProcesses = async (req, res) => {
  try {
    const enriched = await getEnrichedProcesses();
    res.json({
      success: true,
      count: enriched.length,
      processes: enriched
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/processes
export const createProcess = async (req, res) => {
  try {
    const { name, owner, description, target } = req.body;
    if (!name || !owner) {
      return res.status(400).json({ success: false, message: "Process name and owner are required" });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: "Database not connected" });
    }

    const count = await Process.countDocuments();
    const newProcessData = {
      id: `PROC-${String(count + 1).padStart(3, "0")}`,
      name: name.trim(),
      owner: owner.trim(),
      employees: 0,
      active: 0,
      completed: 0,
      pending: 0,
      documents: 0,
      status: "Active",
      progress: 0,
      target: target || "30 Nov 2026",
      description: description || "Controlled QMS business process"
    };

    const created = await Process.create(newProcessData);
    res.status(201).json({ success: true, process: created });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/processes/head-overview
export const getHeadOverview = async (req, res) => {
  try {
    const enriched = await getEnrichedProcesses();
    const totalProcesses = enriched.length;
    const completedProcesses = enriched.filter((p) => p.status === "Completed").length;
    const inProgressProcesses = enriched.filter((p) => p.status === "In Progress" || p.status === "Active").length;
    const pendingProcesses = enriched.filter((p) => p.status === "Pending").length;

    const overallProgress = totalProcesses > 0
      ? Math.round(enriched.reduce((total, p) => total + (p.progress || 0), 0) / totalProcesses)
      : 0;

    let totalDocuments = 0;
    let totalTasks = 0;
    let totalEmployees = 0;

    if (mongoose.connection.readyState === 1) {
      [totalDocuments, totalTasks, totalEmployees] = await Promise.all([
        Document.countDocuments(),
        Task.countDocuments(),
        Employee.countDocuments()
      ]);
    }

    const stats = {
      totalProcesses,
      completedProcesses,
      inProgressProcesses,
      pendingProcesses,
      overallProgress,
      totalDocuments,
      totalTasks,
      totalEmployees
    };

    // Timeline data generated from actual processes
    const timelineData = enriched.map((p, idx) => ({
      date: `P${idx + 1}`,
      title: p.name,
      description: `Process owned by ${p.owner} - ${p.status}`,
      status: p.status === "Completed" ? "completed" : p.status === "Active" || p.status === "In Progress" ? "active" : "upcoming"
    }));

    res.json({
      success: true,
      stats,
      processData: enriched,
      timelineData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getAllProcesses,
  createProcess,
  getHeadOverview,
  getEnrichedProcesses
};
