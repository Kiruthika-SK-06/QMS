import { processesData } from "../data/processes.js";
import { timelineData } from "../data/timeline.js";
import { documentsData } from "../data/documents.js";
import { tasksData } from "../data/tasks.js";
import { employeesData } from "../data/employees.js";

// GET /api/processes
export const getAllProcesses = (req, res) => {
  try {
    // Dynamic recalculation of process document and employee counts
    const enriched = processesData.map((proc) => {
      const docCount = documentsData.filter((d) => d.process === proc.name).length;
      const empCount = employeesData.filter((e) => e.process === proc.name).length;
      return {
        ...proc,
        documents: docCount || proc.documents,
        employees: empCount || proc.employees
      };
    });

    res.json({
      success: true,
      count: enriched.length,
      processes: enriched
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/processes/head-overview
export const getHeadOverview = (req, res) => {
  try {
    const totalProcesses = processesData.length;
    const completedProcesses = processesData.filter((p) => p.status === "Completed").length;
    const inProgressProcesses = processesData.filter((p) => p.status === "In Progress" || p.status === "Active").length;
    const pendingProcesses = processesData.filter((p) => p.status === "Pending").length;

    const overallProgress = Math.round(
      processesData.reduce((total, p) => total + (p.progress || 0), 0) / (totalProcesses || 1)
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
      processData: processesData,
      timelineData: timelineData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
