import mongoose from "mongoose";
import { Employee } from "../models/Employee.js";
import { Task } from "../models/Task.js";

// Helper for dynamic enrichment of task counts from MongoDB
const enrichEmployees = async (list) => {
  if (mongoose.connection.readyState !== 1 || !Array.isArray(list)) return [];

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
};

// GET /api/employees
export const getAllEmployees = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ success: true, count: 0, employees: [] });
    }

    const dbEmps = await Employee.find({}).lean();
    const enriched = await enrichEmployees(dbEmps);

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
    if (mongoose.connection.readyState !== 1) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const emp = await Employee.findOne({ $or: [{ id: req.params.id }, { employeeId: req.params.id }] }).lean();
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

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: "Database not connected" });
    }

    const count = await Employee.countDocuments();
    const newEmp = await Employee.create({
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
      joinDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    });

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
