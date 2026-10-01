import { employeesData } from "../data/employees.js";
import { tasksData } from "../data/tasks.js";

// GET /api/employees
export const getAllEmployees = (req, res) => {
  try {
    // Dynamic recalculation of task counts
    const enriched = employeesData.map((emp) => {
      const empTasks = tasksData.filter((t) => t.employee.toLowerCase() === emp.name.toLowerCase());
      const completed = empTasks.filter((t) => t.status === "Completed").length;
      const pending = empTasks.filter((t) => t.status !== "Completed").length;
      return {
        ...emp,
        assigned: empTasks.length || emp.assigned,
        completed: completed || emp.completed,
        pending: pending !== undefined ? pending : emp.pending
      };
    });

    res.json({
      success: true,
      count: enriched.length,
      employees: enriched
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/employees/:id
export const getEmployeeById = (req, res) => {
  try {
    const emp = employeesData.find((e) => e.id === req.params.id);
    if (!emp) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }
    const empTasks = tasksData.filter((t) => t.employee.toLowerCase() === emp.name.toLowerCase());
    res.json({
      success: true,
      employee: emp,
      tasks: empTasks
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
