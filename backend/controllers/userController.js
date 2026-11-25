import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { broadcastRealtimeEvent } from "../utils/realtime.js";
import { dummyUsers } from "../data/users.js";
import { saveItem, updateItem, deleteItem, recordActivity } from "../config/storageEngine.js";

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

    // Dual-mode fallback from persistent users dataset
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

// POST /api/users (Create user in database & log activity)
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

    // Check duplicate email/username
    const memDup = dummyUsers.find(
      (u) => (u.email && u.email.toLowerCase() === cleanEmail) || (u.username && u.username.toLowerCase() === cleanUser)
    );
    if (memDup) {
      return res.status(409).json({
        success: false,
        message: "A user with this email or username already exists in database"
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

    // Stored in database & persistent file store
    await saveItem("users", newUserData, User);

    // Stored in Activity / Audit Trail in database
    await recordActivity({
      title: "User Management",
      text: `User account '${name}' (${userId}) created with role ${roleTitles[normalized]}`,
      detail: `Email: ${cleanEmail} | Username: ${cleanUser} | Department: ${department || "Operations"}`,
      actor: req.user?.name || "Admin",
      role: req.user?.role || "qm",
      tone: "green"
    });

    broadcastRealtimeEvent("USER_CREATED", { action: "CREATED", user: sanitizeUser(newUserData) });

    res.status(201).json({
      success: true,
      message: "User account created and stored in database successfully",
      user: sanitizeUser(newUserData)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/users/:id
export const updateUser = async (req, res) => {
  try {
    const memUser = dummyUsers.find((u) => u.id === req.params.id || u.employeeId === req.params.id);
    if (!memUser) {
      return res.status(404).json({ success: false, message: "User not found in database" });
    }

    const { name, email, role, department, designation, status, phone, password } = req.body;

    const roleTitles = {
      Head: "Trust Head",
      qm: "QMS Coordinator",
      owner: "Course Coordinator",
      auditor: "Internal Auditor",
      employee: "Employee"
    };

    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (email !== undefined) updates.email = email.trim().toLowerCase();
    if (role !== undefined) {
      updates.role = normalizeRole(role);
      updates.roleTitle = roleTitles[updates.role] || updates.role;
    }
    if (department !== undefined) updates.department = department.trim();
    if (designation !== undefined) updates.designation = designation.trim();
    if (status !== undefined) updates.status = status;
    if (phone !== undefined) updates.phone = phone;
    if (password && password.trim()) {
      updates.password = await bcrypt.hash(password.trim(), 10);
    }

    // Update in database & persistent store
    const updatedUser = await updateItem("users", "id", memUser.id, updates, User);

    // Stored in Activity / Audit Trail in database
    await recordActivity({
      title: "User Management",
      text: `User account '${updatedUser.name}' updated by ${req.user?.name || "Admin"}`,
      detail: `Updated fields: ${Object.keys(updates).join(", ")}`,
      actor: req.user?.name || "Admin",
      tone: "blue"
    });

    broadcastRealtimeEvent("USER_UPDATED", { action: "UPDATED", user: sanitizeUser(updatedUser) });

    res.json({
      success: true,
      message: "User updated successfully in database",
      user: sanitizeUser(updatedUser)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/users/:id/status
export const toggleUserStatus = async (req, res) => {
  try {
    const memUser = dummyUsers.find((u) => u.id === req.params.id || u.employeeId === req.params.id);
    if (!memUser) {
      return res.status(404).json({ success: false, message: "User not found in database" });
    }

    const requestedStatus = req.body.status;
    const newStatus = requestedStatus || (memUser.status === "Active" ? "Inactive" : "Active");

    await updateItem("users", "id", memUser.id, { status: newStatus }, User);

    // Stored in Activity / Audit Trail in database
    await recordActivity({
      title: "User Management",
      text: `User account '${memUser.name}' status changed to '${newStatus}' by ${req.user?.name || "Admin"}`,
      actor: req.user?.name || "Admin",
      tone: newStatus === "Active" ? "green" : "amber"
    });

    broadcastRealtimeEvent("USER_UPDATED", { action: "STATUS_TOGGLED", user: sanitizeUser(memUser) });

    res.json({
      success: true,
      message: `User status changed to ${newStatus} in database`,
      user: sanitizeUser(memUser)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/users/:id
export const deleteUser = async (req, res) => {
  try {
    const memUser = dummyUsers.find((u) => u.id === req.params.id || u.employeeId === req.params.id);
    if (!memUser) {
      return res.status(404).json({ success: false, message: "User not found in database" });
    }

    await deleteItem("users", "id", memUser.id, User);

    // Stored in Activity / Audit Trail in database
    await recordActivity({
      title: "User Management",
      text: `User account '${memUser.name}' (${memUser.id}) deleted by ${req.user?.name || "Admin"}`,
      actor: req.user?.name || "Admin",
      tone: "red"
    });

    broadcastRealtimeEvent("USER_DELETED", { action: "DELETED", id: req.params.id });

    res.json({
      success: true,
      message: "User account deleted from database successfully"
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
