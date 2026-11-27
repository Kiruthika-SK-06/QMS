import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { User } from "../models/User.js";
import { Otp } from "../models/Otp.js";
import { AuthAudit } from "../models/AuthAudit.js";
import { Activity } from "../models/Activity.js";
import { sendInvitationOtpEmail } from "../utils/emailService.js";
import { normalizeRole } from "../middleware/authMiddleware.js";

const ROLE_METADATA = {
  owner: {
    roleTitle: "Course Coordinator",
    designation: "Course Coordinator",
    department: "Academic Division",
    process: "Course Management",
    privileges: ["Manage Documents", "Draft Minutes of Meeting (MoM)", "Assign & Supervise Tasks"]
  },
  qm: {
    roleTitle: "QMS Coordinator",
    designation: "QMS Coordinator",
    department: "Quality Assurance & Compliance",
    process: "Quality Management & MRM",
    privileges: [
      "Manage Documents",
      "Review Documents",
      "Plan & Schedule MRM",
      "Share MRM with Coordinators",
      "User Management",
      "Assign & Supervise Tasks",
      "View Audit Logs & Reports"
    ]
  },
  Head: {
    roleTitle: "Trust Head",
    designation: "Trust Head",
    department: "Trust Governance",
    process: "Governance & Approvals",
    privileges: ["Approve MRM", "Review Documents", "View Audit Logs & Reports"]
  },
  auditor: {
    roleTitle: "Internal Auditor",
    designation: "Internal Auditor",
    department: "Internal Quality Audit Division",
    process: "Quality & Compliance Audit",
    privileges: ["Review Documents", "Approve MRM", "View Audit Logs & Reports"]
  }
};

const sanitizeUser = (user) => {
  if (!user) return null;
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.__v;
  return obj;
};

const ensureDB = (res) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      success: false,
      message: "Database service unavailable. Please ensure MongoDB is running."
    });
    return false;
  }
  return true;
};

/**
 * GET /api/users
 * Retrieves users strictly from MongoDB with filtering, searching, and sorting.
 */
export const getAllUsers = async (req, res) => {
  try {
    if (!ensureDB(res)) return;

    const { role, department, status, search, sort } = req.query;
    const filter = {};

    if (role && role !== "All") {
      filter.role = normalizeRole(role);
    }
    if (department && department !== "All") {
      filter.department = { $regex: department, $options: "i" };
    }
    if (status && status !== "All") {
      filter.status = status;
    }
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

    return res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error("getAllUsers error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/users/:id
 */
export const getUserById = async (req, res) => {
  try {
    if (!ensureDB(res)) return;

    const user = await User.findOne(
      { $or: [{ id: req.params.id }, { employeeId: req.params.id }] },
      { password: 0 }
    ).lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found in database." });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("getUserById error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/users
 * User Invitation Workflow:
 * 1. QMS Coordinator enters name, official email, employee ID and role.
 * 2. Backend validates details and checks for duplicates.
 * 3. Account is created in MongoDB with 'Pending Verification' status.
 * 4. System generates secure 6-digit OTP and emails to registered email.
 */
export const createUser = async (req, res) => {
  try {
    if (!ensureDB(res)) return;

    const { name, email, employeeId, role, department, designation } = req.body;

    if (!name || !email || !employeeId || !role) {
      return res.status(400).json({
        success: false,
        message: "Full name, official email address, employee ID, and assigned role are required."
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanEmpId = employeeId.trim().toUpperCase();
    const cleanRole = normalizeRole(role);
    const cleanUsername = cleanEmail.split("@")[0].toLowerCase();

    // Check for duplicate account in MongoDB
    const duplicate = await User.findOne({
      $or: [
        { email: cleanEmail },
        { employeeId: cleanEmpId },
        { username: cleanUsername }
      ]
    });

    if (duplicate) {
      const field = duplicate.email === cleanEmail
        ? "email address"
        : duplicate.employeeId === cleanEmpId
          ? "employee ID"
          : "username";
      return res.status(409).json({
        success: false,
        message: `An account with this ${field} already exists in MongoDB.`
      });
    }

    const meta = ROLE_METADATA[cleanRole] || ROLE_METADATA.owner;
    const userId = `USR-${Date.now().toString().slice(-6)}`;

    const initials = cleanName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    // Create user with 'Pending Verification' status in MongoDB
    const newUser = await User.create({
      id: userId,
      name: cleanName,
      email: cleanEmail,
      username: cleanUsername,
      employeeId: cleanEmpId,
      role: cleanRole,
      roleTitle: meta.roleTitle,
      department: department || meta.department,
      designation: designation || meta.designation,
      process: meta.process,
      initials,
      status: "Pending Verification",
      emailVerified: false,
      invitedBy: req.user?.name || req.user?.email || "QMS Coordinator",
      invitedAt: new Date(),
      privileges: meta.privileges,
      joinDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    });

    // Invalidate any lingering activation OTPs for this email
    await Otp.deleteMany({ email: cleanEmail, purpose: "ACCOUNT_ACTIVATION" });

    // Generate cryptographically secure 6-digit OTP
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(rawOtp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5-minute expiry

    await Otp.create({
      email: cleanEmail,
      otpHash,
      purpose: "ACCOUNT_ACTIVATION",
      attempts: 0,
      maxAttempts: 5,
      lastResentAt: new Date(),
      expiresAt
    });

    // Send invitation email via real SMTP
    let emailDispatched = true;
    let emailError = null;
    try {
      await sendInvitationOtpEmail({
        to: cleanEmail,
        otp: rawOtp,
        userName: cleanName,
        roleTitle: meta.roleTitle
      });
    } catch (err) {
      emailDispatched = false;
      emailError = err.message;
      console.error("Failed to send invitation email via SMTP:", err.message);
    }

    // Log to AuthAudit in MongoDB
    await AuthAudit.create({
      id: `AUDIT-INVITE-${Date.now()}`,
      action: "ACCOUNT_INVITED",
      actor: req.user?.name || "QMS Coordinator",
      targetEmail: cleanEmail,
      targetRole: cleanRole,
      details: `User account '${cleanName}' invited as ${meta.roleTitle} (Status: Pending Verification). ${emailDispatched ? "Activation OTP emailed." : "Email error: " + emailError}`,
      status: emailDispatched ? "SUCCESS" : "FAILURE"
    });

    await Activity.create({
      id: `ACT-${Date.now()}`,
      title: "User Management",
      text: `User '${cleanName}' invited as ${meta.roleTitle} (Status: Pending Verification)`,
      actor: req.user?.name || "QMS Coordinator",
      tone: "blue",
      timestamp: new Date().toISOString()
    }).catch(() => { });

    if (!emailDispatched) {
      return res.status(201).json({
        success: true,
        message: `User created with 'Pending Verification' status, but email delivery failed: ${emailError}. Please check SMTP configuration.`,
        user: sanitizeUser(newUser),
        emailWarning: emailError
      });
    }

    return res.status(201).json({
      success: true,
      message: `User '${cleanName}' invited successfully. An activation code has been dispatched to ${cleanEmail}.`,
      user: sanitizeUser(newUser)
    });
  } catch (error) {
    console.error("createUser error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/users/:id
 */
export const updateUser = async (req, res) => {
  try {
    if (!ensureDB(res)) return;

    const user = await User.findOne({
      $or: [{ id: req.params.id }, { employeeId: req.params.id }]
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found in database." });
    }

    const { name, email, role, department, designation, status, phone } = req.body;

    if (name !== undefined) user.name = name.trim();
    if (email !== undefined) user.email = email.trim().toLowerCase();
    if (role !== undefined) {
      user.role = normalizeRole(role);
      const meta = ROLE_METADATA[user.role] || ROLE_METADATA.owner;
      user.roleTitle = meta.roleTitle;
      user.privileges = meta.privileges;
    }
    if (department !== undefined) user.department = department.trim();
    if (designation !== undefined) user.designation = designation.trim();
    if (status !== undefined) user.status = status;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    await AuthAudit.create({
      id: `AUDIT-UPDATE-${Date.now()}`,
      action: "STATUS_TOGGLED",
      actor: req.user?.name || "QMS Coordinator",
      targetEmail: user.email,
      targetRole: user.role,
      details: `Profile/Role updated for ${user.name} (${user.email})`,
      status: "SUCCESS"
    }).catch(() => { });

    return res.status(200).json({
      success: true,
      message: "User updated successfully.",
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error("updateUser error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/users/:id/status
 */
export const toggleUserStatus = async (req, res) => {
  try {
    if (!ensureDB(res)) return;

    const user = await User.findOne({
      $or: [{ id: req.params.id }, { employeeId: req.params.id }]
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found in database." });
    }

    // Prevent deactivating own account
    if (req.user && (req.user.id === user.id || req.user.email === user.email)) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own administrative account."
      });
    }

    const newStatus = user.status === "Active" ? "Inactive" : "Active";
    user.status = newStatus;
    await user.save();

    await AuthAudit.create({
      id: `AUDIT-STATUS-${Date.now()}`,
      action: "STATUS_TOGGLED",
      actor: req.user?.name || "QMS Coordinator",
      targetEmail: user.email,
      targetRole: user.role,
      details: `Account status for '${user.name}' updated to ${newStatus}`,
      status: "SUCCESS"
    });

    return res.status(200).json({
      success: true,
      message: `User status changed to ${newStatus}`,
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error("toggleUserStatus error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/users/:id
 */
export const deleteUser = async (req, res) => {
  try {
    if (!ensureDB(res)) return;

    const user = await User.findOne({
      $or: [{ id: req.params.id }, { employeeId: req.params.id }]
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found in database." });
    }

    // Prevent deleting own account
    if (req.user && (req.user.id === user.id || req.user.email === user.email)) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own administrative account."
      });
    }

    await User.deleteOne({ _id: user._id });
    await Otp.deleteMany({ email: user.email });

    await AuthAudit.create({
      id: `AUDIT-DELETE-${Date.now()}`,
      action: "STATUS_TOGGLED",
      actor: req.user?.name || "QMS Coordinator",
      targetEmail: user.email,
      targetRole: user.role,
      details: `User account '${user.name}' (${user.email}) permanently removed from MongoDB`,
      status: "SUCCESS"
    });

    return res.status(200).json({
      success: true,
      message: `User account '${user.name}' has been deleted.`
    });
  } catch (error) {
    console.error("deleteUser error:", error);
    return res.status(500).json({ success: false, message: error.message });
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
