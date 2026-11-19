import mongoose from "mongoose";
import { Employee } from "../models/Employee.js";
import { employeesData } from "../data/employees.js";
import { tasksData } from "../data/tasks.js";

// Helper for dynamic enrichment of task counts
const enrichEmployees = (list) => {
  return list.map((emp) => {
    const empTasks = tasksData.filter((t) => (t.employee || t.assignedTo || "").toLowerCase() === (emp.name || "").toLowerCase());
    const completed = empTasks.filter((t) => t.status === "Completed").length;
    const pending = empTasks.filter((t) => t.status !== "Completed").length;
    return {
      ...emp,
      assigned: empTasks.length || emp.assigned || 0,
      completed: completed !== undefined ? completed : emp.completed || 0,
      pending: pending !== undefined ? pending : emp.pending || 0
    };
  });
};

// GET /api/employees
export const getAllEmployees = async (req, res) => {
  try {
    let list = [...employeesData];

    if (mongoose.connection.readyState === 1) {
      try {
        const dbEmps = await Employee.find({}).lean();
        if (dbEmps && dbEmps.length > 0) {
          list = dbEmps;
          employeesData.length = 0;
          employeesData.push(...dbEmps);
        }
      } catch (err) {
        console.warn("MongoDB read error in getAllEmployees:", err.message);
      }
    }

    const enriched = enrichEmployees(list);

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
    let emp = employeesData.find((e) => e.id === req.params.id);

    if (mongoose.connection.readyState === 1) {
      try {
        const dbEmp = await Employee.findOne({ id: req.params.id }).lean();
        if (dbEmp) emp = dbEmp;
      } catch (err) {
        console.warn("MongoDB query error in getEmployeeById:", err.message);
      }
    }

    if (!emp) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const empTasks = tasksData.filter((t) => (t.employee || t.assignedTo || "").toLowerCase() === (emp.name || "").toLowerCase());
    res.json({
      success: true,
      employee: emp,
      tasks: empTasks
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/employees
export const createEmployee = async (req, res) => {
  try {
    const { name, email, process, designation, department } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: "Name and email are required" });
    }
    const newEmp = {
      id: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      name: name.trim(),
      email: email.trim(),
      process: process || "Employee Onboarding",
      role: "employee",
      assigned: 0,
      completed: 0,
      pending: 0,
      status: "Active",
      designation: designation || "Project Engineer",
      department: department || "Operations"
    };

    if (mongoose.connection.readyState === 1) {
      try {
        await Employee.create(newEmp);
      } catch (err) {
        console.warn("MongoDB createEmployee error:", err.message);
      }
    }

    employeesData.push(newEmp);
    res.status(201).json({ success: true, employee: newEmp });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
