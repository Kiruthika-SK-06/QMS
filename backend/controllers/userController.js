import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { Activity } from "../models/Activity.js";
import { broadcastRealtimeEvent } from "../utils/realtime.js";

export const normalizeRole = (role) => {
  if (!role) return "owner";
  const r = role.trim().toLowerCase();
  if (r === "head" || r === "trust head") return "Head";
  if (r === "qm" || r === "qms coordinator") return "qm";
  if (r === "owner" || r === "course coordinator") return "owner";
  if (r === "auditor" || r === "internal auditor") return "auditor";
  return role;
};

const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
};

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

// GET /api/users
export const getAllUsers = async (req, res) => {
  try {
    const { role, department, status, search, sort } = req.query;

    if (mongoose.connection.readyState !== 1) {
      return res.json({ success: true, count: 0, users: [] });
    }

    const filter = {};
    if (role && role !== "All") filter.role = normalizeRole(role);
    if (department && department !== "All") filter.department = { $regex: department, $options: "i" };
    if (status && status !== "All") filter.status = { $regex: `^${status}$`, $options: "i" };
    if (search) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { username: { $regex: q, $options: "i" } },
        { employeeId: { $regex: q, $options: "i" } }
      ];
    }

    let query = User.find(filter, { password: 0 });
    if (sort === "name") query = query.sort({ name: 1 });
    else if (sort === "role") query = query.sort({ role: 1 });
    else query = query.sort({ createdAt: -1 });

    const users = await query.lean();

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/users/:id
export const getUserById = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = await User.findOne(
      { $or: [{ id: req.params.id }, { employeeId: req.params.id }] },
      { password: 0 }
    ).lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/users
export const createUser = async (req, res) => {
  try {
    const { name, email, username, role, department, designation, employeeId, password, status, phone } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: "Full name, email address, and institutional role are required"
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: "Database not connected" });
    }

    // Check duplicate email/username
    const existing = await User.findOne({
      $or: [
        { email: email.trim().toLowerCase() },
        { username: (username || email).trim().toLowerCase() }
      ]
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A user with this email or username already exists"
      });
    }

    const rawPassword = (password || "1234").trim();
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const normalized = normalizeRole(role);
    const userId = `USR-${Date.now().toString().slice(-6)}`;
    const empId = employeeId || `EMP-${Date.now().toString().slice(-4)}`;

    const initials = name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const roleTitles = {
      Head: "Trust Head",
      qm: "QMS Coordinator",
      owner: "Course Coordinator",
      auditor: "Internal Auditor",
      employee: "Employee"
    };

    const newUser = await User.create({
      id: userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      username: (username || email.split("@")[0]).trim().toLowerCase(),
      password: hashedPassword,
      role: normalized,
      roleTitle: roleTitles[normalized] || normalized,
      department: department || "Operations",
      designation: designation || roleTitles[normalized] || "Staff",
      employeeId: empId,
      initials,
      phone: phone || "",
      status: status || "Active",
      joinDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    });

    await logActivity({
      text: `User account '${name}' (${userId}) created with role ${roleTitles[normalized]}`,
      actor: req.user?.name || "Admin",
      tone: "green"
    });

    broadcastRealtimeEvent("USER_CREATED", { action: "CREATED", user: sanitizeUser(newUser.toObject()) });

    res.status(201).json({
      success: true,
      message: "User account created successfully",
      user: sanitizeUser(newUser.toObject())
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/users/:id
export const updateUser = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: "Database not connected" });
    }

    const user = await User.findOne({ $or: [{ id: req.params.id }, { employeeId: req.params.id }] });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { name, email, role, department, designation, status, phone, password } = req.body;

    if (name !== undefined) user.name = name.trim();
    if (email !== undefined) user.email = email.trim().toLowerCase();
    if (role !== undefined) {
      user.role = normalizeRole(role);
      const roleTitles = {
        Head: "Trust Head",
        qm: "QMS Coordinator",
        owner: "Course Coordinator",
        auditor: "Internal Auditor",
        employee: "Employee"
      };
      user.roleTitle = roleTitles[user.role] || user.role;
    }
    if (department !== undefined) user.department = department.trim();
    if (designation !== undefined) user.designation = designation.trim();
    if (status !== undefined) user.status = status;
    if (phone !== undefined) user.phone = phone;

    if (password && password.trim()) {
      user.password = await bcrypt.hash(password.trim(), 10);
    }

    await user.save();

    await logActivity({
      text: `User account '${user.name}' updated by ${req.user?.name || "Admin"}`,
      actor: req.user?.name || "Admin",
      tone: "blue"
    });

    broadcastRealtimeEvent("USER_UPDATED", { action: "UPDATED", user: sanitizeUser(user.toObject()) });

    res.json({
      success: true,
      message: "User updated successfully",
      user: sanitizeUser(user.toObject())
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/users/:id/status
export const toggleUserStatus = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: "Database not connected" });
    }

    const user = await User.findOne({ $or: [{ id: req.params.id }, { employeeId: req.params.id }] });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const requestedStatus = req.body.status;
    if (requestedStatus) {
      user.status = requestedStatus;
    } else {
      user.status = user.status === "Active" ? "Inactive" : "Active";
    }

    await user.save();

    await logActivity({
      text: `User account '${user.name}' status changed to '${user.status}' by ${req.user?.name || "Admin"}`,
      actor: req.user?.name || "Admin",
      tone: user.status === "Active" ? "green" : "amber"
    });

    broadcastRealtimeEvent("USER_UPDATED", { action: "STATUS_TOGGLED", user: sanitizeUser(user.toObject()) });

    res.json({
      success: true,
      message: `User status changed to ${user.status}`,
      user: sanitizeUser(user.toObject())
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/users/:id
export const deleteUser = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: "Database not connected" });
    }

    const user = await User.findOne({ $or: [{ id: req.params.id }, { employeeId: req.params.id }] });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await User.deleteOne({ _id: user._id });

    await logActivity({
      text: `User account '${user.name}' deleted by ${req.user?.name || "Admin"}`,
      actor: req.user?.name || "Admin",
      tone: "red"
    });

    broadcastRealtimeEvent("USER_DELETED", { action: "DELETED", id: req.params.id });

    res.json({
      success: true,
      message: "User account deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser
};
