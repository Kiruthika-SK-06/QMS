import mongoose from "mongoose";
import { Employee } from "../models/Employee.js";
import { Task } from "../models/Task.js";
import { employeesData } from "../data/employees.js";
import { tasksData } from "../data/tasks.js";

// Helper for dynamic enrichment of task counts
const enrichEmployees = async (list) => {
  if (!Array.isArray(list)) return [];

  if (mongoose.connection.readyState === 1) {
    try {
      return await Promise.all(
        list.map(async (emp) => {
          const empTasks = await Task.find({
            $or: [
              { employee: { $regex: emp.name, $options: "i" } },
              { assignedTo: { $regex: emp.name, $options: "i" } }
            ]
          }).lean();

          const completed = empTasks.filter((t) => t.status === "Completed").length;
          const pending = empTasks.filter((t) => t.status !== "Completed").length;

          return {
            ...emp,
            assigned: empTasks.length,
            completed,
            pending
          };
        })
      );
    } catch (err) {
      console.warn("enrichEmployees DB error:", err.message);
    }
  }

  // Dual-mode fallback from controlled tasks data
  return list.map((emp) => {
    const empName = (emp.name || "").toLowerCase();
    const empTasks = tasksData.filter(
      (t) =>
        (t.employee && t.employee.toLowerCase().includes(empName)) ||
        (t.assignedTo && t.assignedTo.toLowerCase().includes(empName))
    );
    const completed = empTasks.filter((t) => t.status === "Completed").length;
    const pending = empTasks.filter((t) => t.status !== "Completed").length;
    return {
      ...emp,
      assigned: empTasks.length || emp.assigned || 0,
      completed: completed || emp.completed || 0,
      pending: pending || emp.pending || 0
    };
  });
};

// GET /api/employees
export const getAllEmployees = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      try {
        const dbEmps = await Employee.find({}).lean();
        if (dbEmps && dbEmps.length > 0) {
          const enriched = await enrichEmployees(dbEmps);
          return res.json({
            success: true,
            count: enriched.length,
            employees: enriched
          });
        }
      } catch (err) {
        console.warn("getAllEmployees DB error, using synchronized dataset:", err.message);
      }
    }

    const enriched = await enrichEmployees(employeesData);
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
export const getEmployeeById = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      try {
        const emp = await Employee.findOne({ $or: [{ id: req.params.id }, { employeeId: req.params.id }] }).lean();
        if (emp) return res.json({ success: true, employee: emp });
      } catch (err) {}
    }

    const emp = employeesData.find((e) => e.id === req.params.id || e.employeeId === req.params.id);
    if (!emp) return res.status(404).json({ success: false, message: "Employee not found" });

    res.json({ success: true, employee: emp });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/employees
export const createEmployee = async (req, res) => {
  try {
    const { name, email, role, department, designation, employeeId, phone, process } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: "Name and email are required" });
    }

    const count = employeesData.length;
    const newEmpData = {
      id: `EMP-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role || "employee",
      department: department || "Operations",
      designation: designation || "Staff",
      employeeId: employeeId || `CDAC-${String(count + 1).padStart(3, "0")}`,
      phone: phone || "",
      process: process || "General Operations",
      status: "Active",
      joinDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      assigned: 0,
      completed: 0,
      pending: 0
    };

    let newEmp = newEmpData;
    if (mongoose.connection.readyState === 1) {
      try {
        newEmp = await Employee.create(newEmpData);
      } catch (err) {
        console.warn("createEmployee DB error:", err.message);
      }
    }
    employeesData.push(newEmpData);

    res.status(201).json({ success: true, employee: newEmp });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getAllEmployees,
  getEmployeeById,
  createEmployee
};
