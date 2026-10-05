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
      documents: docCount || proc.documents,
      employees: empCount || proc.employees,
      active: activeTasks || proc.active,
      completed: completedTasks || proc.completed
    };
  });
};

// GET /api/processes
export const getAllProcesses = (req, res) => {
  try {
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
export const createProcess = (req, res) => {
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
    processesData.unshift(newProcess);
    res.status(201).json({ success: true, process: newProcess });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/processes/head-overview
export const getHeadOverview = (req, res) => {
  try {
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
