import mongoose from "mongoose";
import { Process } from "../models/Process.js";
import { processesData } from "../data/processes.js";
import { timelineData } from "../data/timeline.js";
import { documentsData } from "../data/documents.js";
import { tasksData } from "../data/tasks.js";
import { employeesData } from "../data/employees.js";

// Helper for dynamic recalculation of process document and employee counts
export const getEnrichedProcesses = () => {
  return processesData.map((proc) => {
    const docCount = documentsData.filter((d) => d.process === proc.name).length;
    const empCount = employeesData.filter((e) => e.process === proc.name).length;
    const activeTasks = tasksData.filter((t) => t.process === proc.name && t.status !== "Completed").length;
    const completedTasks = tasksData.filter((t) => t.process === proc.name && t.status === "Completed").length;
    return {
      ...proc,
      documents: docCount || proc.documents || 0,
      employees: empCount || proc.employees || 0,
      active: activeTasks !== undefined ? activeTasks : proc.active || 0,
      completed: completedTasks !== undefined ? completedTasks : proc.completed || 0
    };
  });
};

// GET /api/processes
export const getAllProcesses = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      try {
        const dbProcs = await Process.find({}).lean();
        if (dbProcs && dbProcs.length > 0) {
          processesData.length = 0;
          processesData.push(...dbProcs);
        }
      } catch (err) {
        console.warn("MongoDB read error in getAllProcesses:", err.message);
      }
    }

    const enriched = getEnrichedProcesses();
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
    const newProcess = {
      id: `PROC-${String(processesData.length + 1).padStart(3, "0")}`,
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

    if (mongoose.connection.readyState === 1) {
      try {
        await Process.create(newProcess);
      } catch (err) {
        console.warn("MongoDB createProcess error:", err.message);
      }
    }

    processesData.unshift(newProcess);
    res.status(201).json({ success: true, process: newProcess });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/processes/head-overview
export const getHeadOverview = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      try {
        const dbProcs = await Process.find({}).lean();
        if (dbProcs && dbProcs.length > 0) {
          processesData.length = 0;
          processesData.push(...dbProcs);
        }
      } catch (err) {
        console.warn("MongoDB read error in getHeadOverview:", err.message);
      }
    }

    const enriched = getEnrichedProcesses();
    const totalProcesses = enriched.length;
    const completedProcesses = enriched.filter((p) => p.status === "Completed").length;
    const inProgressProcesses = enriched.filter((p) => p.status === "In Progress" || p.status === "Active").length;
    const pendingProcesses = enriched.filter((p) => p.status === "Pending").length;

    const overallProgress = Math.round(
      enriched.reduce((total, p) => total + (p.progress || 0), 0) / (totalProcesses || 1)
    );

    const stats = {
      totalProcesses,
      completedProcesses,
      inProgressProcesses,
      pendingProcesses,
      overallProgress,
      totalDocuments: documentsData.length,
      totalTasks: tasksData.length,
      totalEmployees: employeesData.length
    };

    res.json({
      success: true,
      stats,
      processData: enriched,
      timelineData: timelineData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
