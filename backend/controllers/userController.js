import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { Activity } from "../models/Activity.js";
import { broadcastRealtimeEvent } from "../utils/realtime.js";
import { dummyUsers } from "../data/users.js";

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

    if (mongoose.connection.readyState === 1) {
      try {
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
        if (users && users.length > 0) {
          return res.json({
            success: true,
            count: users.length,
            users
          });
        }
      } catch (err) {
        console.warn("getAllUsers DB error, using synchronized dataset:", err.message);
      }
    }

    // Dual-mode fallback from controlled users dataset
    let filtered = dummyUsers.map((u) => sanitizeUser(u));

    if (role && role !== "All") {
      const normRole = normalizeRole(role);
      filtered = filtered.filter((u) => u.role === normRole);
    }
    if (department && department !== "All") {
      const depLower = department.toLowerCase();
      filtered = filtered.filter((u) => u.department && u.department.toLowerCase().includes(depLower));
    }
    if (status && status !== "All") {
      const stLower = status.toLowerCase();
      filtered = filtered.filter((u) => u.status && u.status.toLowerCase() === stLower);
    }
    if (search) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((u) => {
        return (
          (u.name && u.name.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.username && u.username.toLowerCase().includes(q)) ||
          (u.employeeId && u.employeeId.toLowerCase().includes(q))
        );
      });
    }

    if (sort === "name") filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    else if (sort === "role") filtered.sort((a, b) => (a.role || "").localeCompare(b.role || ""));

    res.json({
      success: true,
      count: filtered.length,
      users: filtered
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/users/:id
export const getUserById = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      try {
        const user = await User.findOne(
          { $or: [{ id: req.params.id }, { employeeId: req.params.id }] },
          { password: 0 }
        ).lean();
        if (user) return res.json({ success: true, user });
      } catch (err) {}
    }

    const user = dummyUsers.find((u) => u.id === req.params.id || u.employeeId === req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user: sanitizeUser(user) });
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

    const cleanEmail = email.trim().toLowerCase();
    const cleanUser = (username || cleanEmail.split("@")[0]).trim().toLowerCase();

    // Check duplicate email/username in memory or DB
    const memDup = dummyUsers.find(
      (u) => (u.email && u.email.toLowerCase() === cleanEmail) || (u.username && u.username.toLowerCase() === cleanUser)
    );
    if (memDup) {
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

    const newUserData = {
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      username: cleanUser,
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
    };

    let createdUser = newUserData;
    if (mongoose.connection.readyState === 1) {
      try {
        createdUser = await User.create(newUserData);
      } catch (err) {
        console.warn("createUser DB error:", err.message);
      }
    }
    dummyUsers.push(newUserData);

    await logActivity({
      text: `User account '${name}' (${userId}) created with role ${roleTitles[normalized]}`,
      actor: req.user?.name || "Admin",
      tone: "green"
    });

    broadcastRealtimeEvent("USER_CREATED", { action: "CREATED", user: sanitizeUser(createdUser) });

    res.status(201).json({
      success: true,
      message: "User account created successfully",
      user: sanitizeUser(createdUser)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/users/:id
export const updateUser = async (req, res) => {
  try {
    let dbUser = null;
    if (mongoose.connection.readyState === 1) {
      try {
        dbUser = await User.findOne({ $or: [{ id: req.params.id }, { employeeId: req.params.id }] });
      } catch (err) {}
    }

    const memUser = dummyUsers.find((u) => u.id === req.params.id || u.employeeId === req.params.id);
    const targetUser = dbUser || memUser;

    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { name, email, role, department, designation, status, phone, password } = req.body;

    const roleTitles = {
      Head: "Trust Head",
      qm: "QMS Coordinator",
      owner: "Course Coordinator",
      auditor: "Internal Auditor",
      employee: "Employee"
    };

    let hashedPass = null;
    if (password && password.trim()) {
      hashedPass = await bcrypt.hash(password.trim(), 10);
    }

    if (dbUser) {
      if (name !== undefined) dbUser.name = name.trim();
      if (email !== undefined) dbUser.email = email.trim().toLowerCase();
      if (role !== undefined) {
        dbUser.role = normalizeRole(role);
        dbUser.roleTitle = roleTitles[dbUser.role] || dbUser.role;
      }
      if (department !== undefined) dbUser.department = department.trim();
      if (designation !== undefined) dbUser.designation = designation.trim();
      if (status !== undefined) dbUser.status = status;
      if (phone !== undefined) dbUser.phone = phone;
      if (hashedPass) dbUser.password = hashedPass;
      await dbUser.save();
    }

    if (memUser) {
      if (name !== undefined) memUser.name = name.trim();
      if (email !== undefined) memUser.email = email.trim().toLowerCase();
      if (role !== undefined) {
        memUser.role = normalizeRole(role);
        memUser.roleTitle = roleTitles[memUser.role] || memUser.role;
      }
      if (department !== undefined) memUser.department = department.trim();
      if (designation !== undefined) memUser.designation = designation.trim();
      if (status !== undefined) memUser.status = status;
      if (phone !== undefined) memUser.phone = phone;
      if (hashedPass) memUser.password = hashedPass;
    }

    const resultUser = dbUser || memUser;

    await logActivity({
      text: `User account '${resultUser.name}' updated by ${req.user?.name || "Admin"}`,
      actor: req.user?.name || "Admin",
      tone: "blue"
    });

    broadcastRealtimeEvent("USER_UPDATED", { action: "UPDATED", user: sanitizeUser(resultUser) });

    res.json({
      success: true,
      message: "User updated successfully",
      user: sanitizeUser(resultUser)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/users/:id/status
export const toggleUserStatus = async (req, res) => {
  try {
    let dbUser = null;
    if (mongoose.connection.readyState === 1) {
      try {
        dbUser = await User.findOne({ $or: [{ id: req.params.id }, { employeeId: req.params.id }] });
      } catch (err) {}
    }

    const memUser = dummyUsers.find((u) => u.id === req.params.id || u.employeeId === req.params.id);
    const targetUser = dbUser || memUser;

    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const requestedStatus = req.body.status;
    const newStatus = requestedStatus || (targetUser.status === "Active" ? "Inactive" : "Active");

    if (dbUser) {
      dbUser.status = newStatus;
      await dbUser.save();
    }
    if (memUser) {
      memUser.status = newStatus;
    }

    const resultUser = dbUser || memUser;

    await logActivity({
      text: `User account '${resultUser.name}' status changed to '${newStatus}' by ${req.user?.name || "Admin"}`,
      actor: req.user?.name || "Admin",
      tone: newStatus === "Active" ? "green" : "amber"
    });

    broadcastRealtimeEvent("USER_UPDATED", { action: "STATUS_TOGGLED", user: sanitizeUser(resultUser) });

    res.json({
      success: true,
      message: `User status changed to ${newStatus}`,
      user: sanitizeUser(resultUser)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/users/:id
export const deleteUser = async (req, res) => {
  try {
    let dbUser = null;
    if (mongoose.connection.readyState === 1) {
      try {
        dbUser = await User.findOneAndDelete({ $or: [{ id: req.params.id }, { employeeId: req.params.id }] });
      } catch (err) {}
    }

    const index = dummyUsers.findIndex((u) => u.id === req.params.id || u.employeeId === req.params.id);
    if (index !== -1) {
      if (!dbUser) dbUser = dummyUsers[index];
      dummyUsers.splice(index, 1);
    }

    if (!dbUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await logActivity({
      text: `User account '${dbUser.name}' deleted by ${req.user?.name || "Admin"}`,
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
