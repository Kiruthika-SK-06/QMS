import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Activity } from "../models/Activity.js";
import { dummyUsers, normalizeRole } from "../data/users.js";
import { activitiesData } from "../data/activities.js";
import { broadcastRealtimeEvent } from "../utils/realtime.js";

// Helper to strip passwords from output
const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
};

const logActivity = async (entry) => {
  activitiesData.unshift(entry);
  if (mongoose.connection.readyState === 1) {
    try {
      await Activity.create(entry);
    } catch (err) {
      console.warn("Activity DB log error:", err.message);
    }
  }
};

// GET /api/users - List all users with privileges and details
export const getAllUsers = async (req, res) => {
  try {
    const { role, department, status, search, sort } = req.query;
    let list = [...dummyUsers];

    if (mongoose.connection.readyState === 1) {
      try {
        const dbUsers = await User.find({}).lean();
        if (dbUsers && dbUsers.length > 0) {
          list = dbUsers;
          dummyUsers.length = 0;
          dummyUsers.push(...dbUsers);
        }
      } catch (err) {
        console.warn("MongoDB read error in getAllUsers:", err.message);
      }
    }

    if (role && role !== "All") {
      list = list.filter((u) => u.role === normalizeRole(role));
    }

    if (department) {
      list = list.filter((u) => u.department?.toLowerCase().includes(department.toLowerCase()));
    }

    if (status && status !== "All") {
      list = list.filter((u) => u.status?.toLowerCase() === status.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.username?.toLowerCase().includes(q) ||
          u.department?.toLowerCase().includes(q) ||
          u.roleTitle?.toLowerCase().includes(q) ||
          (Array.isArray(u.privileges) && u.privileges.some((p) => p.toLowerCase().includes(q)))
      );
    }

    // Sorting
    if (sort === "name-asc") {
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sort === "name-desc") {
      list.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
    } else if (sort === "role") {
      list.sort((a, b) => (a.roleTitle || "").localeCompare(b.roleTitle || ""));
    } else if (sort === "status") {
      list.sort((a, b) => (a.status || "").localeCompare(b.status || ""));
    }

    const safeUsers = list.map(sanitizeUser);
    res.json({
      success: true,
      count: safeUsers.length,
      users: safeUsers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/users/:id - Get single user
export const getUserById = async (req, res) => {
  try {
    let user = dummyUsers.find((u) => u.id === req.params.id || u.employeeId === req.params.id);

    if (mongoose.connection.readyState === 1) {
      try {
        const dbUser = await User.findOne({
          $or: [{ id: req.params.id }, { employeeId: req.params.id }]
        }).lean();
        if (dbUser) user = dbUser;
      } catch (err) {
        console.warn("MongoDB query error in getUserById:", err.message);
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/users - QMS Coordinator adds new user / staff and assigns privileges
export const createUser = async (req, res) => {
  try {
    // Only QMS Coordinator can add users
    if (req.user && req.user.role !== "qm") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Only the QMS Coordinator is permitted to create users and assign privileges."
      });
    }

    const { name, email, username, role, designation, department, process, privileges, status } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: "Name and email are required" });
    }

    const cleanRole = normalizeRole(role) || "owner";
    const roleTitleMap = {
      owner: "Course Coordinator",
      qm: "QMS Coordinator",
      Head: "Trust Head",
      auditor: "Internal Auditor"
    };

    const uname = (username || req.body.userName || email.split("@")[0] || name.toLowerCase().replace(/\s+/g, ".")).trim();
    const initials = name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const empId = (req.body.employeeId || req.body.empId || `ID${Math.floor(100 + Math.random() * 900)}`).trim();

    const defaultDept =
      cleanRole === "auditor"
        ? "Internal Quality Audit Division"
        : cleanRole === "Head"
        ? "Trust Governance"
        : cleanRole === "qm"
        ? "Quality Assurance & Compliance"
        : "Academic Division";

    const defaultPrivileges =
      cleanRole === "auditor"
        ? ["Review & Approve MRM Plans", "Verify Audit Compliance", "View All MoM Records", "Audit Trail & Logs"]
        : cleanRole === "Head"
        ? ["Approve MRM", "Review Documents", "View Audit Logs & Reports"]
        : cleanRole === "qm"
        ? ["Manage Documents", "Review Documents", "Plan & Schedule MRM", "Share MRM with Coordinators", "User Management", "Assign & Supervise Tasks", "View Audit Logs & Reports"]
        : ["Manage Documents", "Draft Minutes of Meeting (MoM)", "Assign & Supervise Tasks"];

    const newUser = {
      id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
      username: uname,
      email: email.trim(),
      aliases: [email.trim(), uname],
      password: req.body.password || "1234",
      name: name.trim(),
      role: cleanRole,
      roleTitle: roleTitleMap[cleanRole] || "Course Coordinator",
      initials,
      employeeId: empId,
      department: department || defaultDept,
      process: process || (cleanRole === "owner" ? "Course Management" : "Quality Oversight"),
      designation: designation || roleTitleMap[cleanRole] || "Course Coordinator",
      status: status || "Active",
      joinDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      privileges: Array.isArray(privileges) && privileges.length ? privileges : defaultPrivileges
    };

    if (mongoose.connection.readyState === 1) {
      try {
        await User.create(newUser);
      } catch (err) {
        console.warn("MongoDB createUser error:", err.message);
      }
    }

    dummyUsers.push(newUser);

    await logActivity({
      id: `ACT-${Date.now()}`,
      title: "User Created",
      detail: `${newUser.name} (${newUser.roleTitle})`,
      text: `New user "${newUser.name}" (${newUser.roleTitle}) created by QMS Coordinator`,
      actor: req.user?.name || "QMS Coordinator",
      time: "Just now",
      tone: "green",
      timestamp: new Date().toISOString()
    });

    const safeNewUser = sanitizeUser(newUser);
    broadcastRealtimeEvent("USER_UPDATED", { action: "CREATED", user: safeNewUser });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: safeNewUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/users/:id - QMS Coordinator edits user and updates privileges
export const updateUser = async (req, res) => {
  try {
    if (req.user && req.user.role !== "qm") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Only the QMS Coordinator is permitted to edit users and modify privileges."
      });
    }

    const index = dummyUsers.findIndex((u) => u.id === req.params.id || u.employeeId === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const existing = dummyUsers[index];
    const { name, email, role, designation, department, process, privileges, status } = req.body;
    const empId = req.body.employeeId || req.body.empId;

    const roleTitleMap = {
      owner: "Course Coordinator",
      qm: "QMS Coordinator",
      Head: "Trust Head",
      auditor: "Internal Auditor"
    };

    const updatedRole = role ? normalizeRole(role) : existing.role;

    const updatedUser = {
      ...existing,
      name: name ? name.trim() : existing.name,
      email: email ? email.trim() : existing.email,
      employeeId: empId ? empId.trim() : existing.employeeId,
      role: updatedRole,
      roleTitle: roleTitleMap[updatedRole] || existing.roleTitle,
      designation: designation !== undefined ? designation : existing.designation,
      department: department !== undefined ? department : existing.department,
      process: process !== undefined ? process : existing.process,
      privileges: Array.isArray(privileges) ? privileges : existing.privileges,
      status: status !== undefined ? status : existing.status
    };

    if (mongoose.connection.readyState === 1) {
      try {
        await User.findOneAndUpdate(
          { $or: [{ id: req.params.id }, { employeeId: req.params.id }] },
          updatedUser,
          { new: true, upsert: true }
        );
      } catch (err) {
        console.warn("MongoDB updateUser error:", err.message);
      }
    }

    dummyUsers[index] = updatedUser;

    await logActivity({
      id: `ACT-${Date.now()}`,
      title: "User Updated",
      detail: `${updatedUser.name}`,
      text: `User details & security privileges updated for "${updatedUser.name}"`,
      actor: req.user?.name || "QMS Coordinator",
      time: "Just now",
      tone: "blue",
      timestamp: new Date().toISOString()
    });

    const safeUpdatedUser = sanitizeUser(updatedUser);
    broadcastRealtimeEvent("USER_UPDATED", { action: "UPDATED", user: safeUpdatedUser });

    res.json({
      success: true,
      message: "User updated successfully",
      user: safeUpdatedUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/users/:id/status - Activate or Deactivate user account
export const toggleUserStatus = async (req, res) => {
  try {
    if (req.user && req.user.role !== "qm") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Only the QMS Coordinator is permitted to activate or deactivate accounts."
      });
    }

    const index = dummyUsers.findIndex((u) => u.id === req.params.id || u.employeeId === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = dummyUsers[index];
    const newStatus = user.status === "Active" ? "Inactive" : "Active";
    user.status = newStatus;

    if (mongoose.connection.readyState === 1) {
      try {
        await User.findOneAndUpdate(
          { $or: [{ id: req.params.id }, { employeeId: req.params.id }] },
          { status: newStatus }
        );
      } catch (err) {
        console.warn("MongoDB toggleUserStatus error:", err.message);
      }
    }

    await logActivity({
      id: `ACT-${Date.now()}`,
      title: "Account Status Changed",
      detail: `${user.name} (${newStatus})`,
      text: `User account "${user.name}" status changed to ${newStatus}`,
      actor: req.user?.name || "QMS Coordinator",
      time: "Just now",
      tone: newStatus === "Active" ? "green" : "amber",
      timestamp: new Date().toISOString()
    });

    const safeUser = sanitizeUser(user);
    broadcastRealtimeEvent("USER_UPDATED", { action: "STATUS_TOGGLED", user: safeUser });

    res.json({
      success: true,
      message: `User account marked as ${newStatus}`,
      user: safeUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/users/:id - Deactivate or remove user
export const deleteUser = async (req, res) => {
  try {
    if (req.user && req.user.role !== "qm") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Only the QMS Coordinator is permitted to remove users."
      });
    }

    const index = dummyUsers.findIndex((u) => u.id === req.params.id || u.employeeId === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const removed = dummyUsers.splice(index, 1)[0];

    if (mongoose.connection.readyState === 1) {
      try {
        await User.findOneAndDelete({
          $or: [{ id: req.params.id }, { employeeId: req.params.id }]
        });
      } catch (err) {
        console.warn("MongoDB deleteUser error:", err.message);
      }
    }

    await logActivity({
      id: `ACT-${Date.now()}`,
      title: "User Removed",
      detail: `${removed.name}`,
      text: `User "${removed.name}" removed from workspace directory`,
      actor: req.user?.name || "QMS Coordinator",
      time: "Just now",
      tone: "red",
      timestamp: new Date().toISOString()
    });

    broadcastRealtimeEvent("USER_UPDATED", { action: "DELETED", id: req.params.id });

    res.json({ success: true, message: "User removed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
