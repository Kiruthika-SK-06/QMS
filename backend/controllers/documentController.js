import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { Document } from "../models/Document.js";
import { Activity } from "../models/Activity.js";
import { Notification } from "../models/Notification.js";
import { broadcastRealtimeEvent } from "../utils/realtime.js";

// Helper to log activity strictly to MongoDB
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

// Helper to log notification strictly to MongoDB
const logNotification = async (entry) => {
  if (mongoose.connection.readyState === 1) {
    try {
      await Notification.create({
        ...entry,
        id: entry.id || `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        createdAt: entry.createdAt || new Date().toISOString()
      });
    } catch (err) {
      console.warn("Notification DB log error:", err.message);
    }
  }
};

// GET /api/documents
export const getAllDocuments = async (req, res) => {
  try {
    const { search, type, status, process } = req.query;

    if (mongoose.connection.readyState !== 1) {
      return res.json({ success: true, count: 0, documents: [] });
    }

    const filter = {};

    if (type && type !== "All") {
      filter.type = { $regex: new RegExp(`^${type}$`, "i") };
    }

    if (status && status !== "All") {
      filter.status = { $regex: new RegExp(`^${status}$`, "i") };
    }

    if (process && process !== "All") {
      filter.process = { $regex: new RegExp(`^${process}$`, "i") };
    }

    if (search) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { title: { $regex: q, $options: "i" } },
        { id: { $regex: q, $options: "i" } },
        { process: { $regex: q, $options: "i" } },
        { owner: { $regex: q, $options: "i" } }
      ];
    }

    const documents = await Document.find(filter).sort({ updatedAt: -1 }).lean();

    res.json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/documents/:id
export const getDocumentById = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const doc = await Document.findOne({ id: req.params.id }).lean();
    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    res.json({
      success: true,
      document: doc
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/documents (Create controlled document metadata)
export const createDocument = async (req, res) => {
  try {
    const { name, title, type, process, description, content, owner } = req.body;
    const docName = (name || title || "").trim();

    if (!docName || !process) {
      return res.status(400).json({
        success: false,
        message: "Document title/name and associated process are required"
      });
    }

    const authorName = req.user?.name || owner || "Course Coordinator";
    const dateStr = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

    const docId = `DOC-${Date.now().toString().slice(-6)}`;

    const newDocData = {
      id: docId,
      name: docName,
      title: docName,
      type: type || "Procedures",
      process,
      owner: authorName,
      version: "1.0",
      currentVersion: "1.0",
      updated: dateStr,
      updatedBy: authorName,
      status: "Under Review",
      submittedBy: authorName,
      description: description || "",
      content: content || "",
      versions: [
        {
          version: "1.0",
          date: dateStr,
          author: authorName,
          uploadedBy: authorName,
          status: "Current",
          notes: "Initial controlled version uploaded"
        }
      ]
    };

    let savedDoc = newDocData;
    if (mongoose.connection.readyState === 1) {
      savedDoc = await Document.create(newDocData);
    }

    await logActivity({
      text: `New document '${docName}' (${docId}) submitted for review by ${authorName}`,
      actor: authorName,
      tone: "blue"
    });

    await logNotification({
      title: `Document Submitted: ${docName}`,
      text: `Version 1.0 submitted for review in process '${process}'`,
      targetRole: "qm"
    });

    broadcastRealtimeEvent("DOCUMENT_CREATED", { action: "CREATED", document: savedDoc });

    res.status(201).json({
      success: true,
      message: "Document created successfully",
      document: savedDoc
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/documents/upload (Upload actual file using Multer)
export const uploadDocument = async (req, res) => {
  try {
    const file = req.file;
    const { name, title, type, process, description, owner } = req.body;
    const docName = (name || title || (file ? file.originalname.replace(/\.[^/.]+$/, "") : "")).trim();

    if (!docName || !process) {
      return res.status(400).json({
        success: false,
        message: "Document name and process are required."
      });
    }

    const authorName = req.user?.name || owner || "Course Coordinator";
    const dateStr = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

    const docId = `DOC-${Date.now().toString().slice(-6)}`;
    const fileUrl = file ? `/uploads/${file.filename}` : "";
    const fileSizeStr = file ? `${(file.size / 1024).toFixed(1)} KB` : "0 KB";

    const newDocData = {
      id: docId,
      name: docName,
      title: docName,
      type: type || "Procedures",
      process,
      owner: authorName,
      version: "1.0",
      currentVersion: "1.0",
      updated: dateStr,
      updatedBy: authorName,
      status: "Under Review",
      submittedBy: authorName,
      description: description || "",
      fileUrl,
      fileName: file ? file.filename : "",
      originalName: file ? file.originalname : "",
      fileSize: fileSizeStr,
      mimeType: file ? file.mimetype : "",
      storagePath: file ? file.path : "",
      versions: [
        {
          version: "1.0",
          date: dateStr,
          author: authorName,
          uploadedBy: authorName,
          status: "Current",
          notes: file ? `Uploaded file: ${file.originalname}` : "Initial controlled version",
          fileUrl,
          fileName: file ? file.filename : "",
          fileSize: fileSizeStr
        }
      ]
    };

    let savedDoc = newDocData;
    if (mongoose.connection.readyState === 1) {
      savedDoc = await Document.create(newDocData);
    }

    await logActivity({
      text: `File '${file ? file.originalname : docName}' uploaded for document '${docName}' (${docId}) by ${authorName}`,
      actor: authorName,
      tone: "blue"
    });

    await logNotification({
      title: `Document Uploaded: ${docName}`,
      text: `Uploaded file '${file ? file.originalname : docName}' by ${authorName}`,
      targetRole: "all"
    });

    broadcastRealtimeEvent("DOCUMENT_CREATED", { action: "UPLOADED", document: savedDoc });

    return res.status(201).json({
      success: true,
      message: "Document and file uploaded successfully",
      document: savedDoc
    });
  } catch (error) {
    console.error("uploadDocument error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/documents/:id/versions (Create new version)
export const createNewVersion = async (req, res) => {
  try {
    const { notes } = req.body;
    const authorName = req.user?.name || "Course Coordinator";
    const dateStr = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

    if (mongoose.connection.readyState !== 1) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const doc = await Document.findOne({ id: req.params.id });
    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const currentVerNum = parseFloat(doc.version || "1.0");
    const nextVer = (currentVerNum + 1.0).toFixed(1);

    // Archive old versions
    const updatedVersions = (doc.versions || []).map((v) => ({
      ...v.toObject ? v.toObject() : v,
      status: "Archived"
    }));

    // Prepend new current version
    updatedVersions.unshift({
      version: nextVer,
      date: dateStr,
      author: authorName,
      uploadedBy: authorName,
      status: "Current",
      notes: notes || `Version ${nextVer} revision submitted`
    });

    doc.version = nextVer;
    doc.currentVersion = nextVer;
    doc.updated = dateStr;
    doc.updatedBy = authorName;
    doc.status = "Under Review";
    doc.versions = updatedVersions;

    await doc.save();

    await logActivity({
      text: `New version v${nextVer} created for document '${doc.name}' (${doc.id}) by ${authorName}`,
      actor: authorName,
      tone: "blue"
    });

    broadcastRealtimeEvent("DOCUMENT_UPDATED", { action: "VERSION_CREATED", document: doc });

    res.json({
      success: true,
      message: `Version v${nextVer} created successfully`,
      document: doc
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/documents/:id/versions/upload (Upload new version file)
export const uploadDocumentVersion = async (req, res) => {
  try {
    const file = req.file;
    const { notes } = req.body;
    const authorName = req.user?.name || "Course Coordinator";
    const dateStr = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

    if (mongoose.connection.readyState !== 1) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const doc = await Document.findOne({ id: req.params.id });
    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const currentVerNum = parseFloat(doc.version || "1.0");
    const nextVer = (currentVerNum + 1.0).toFixed(1);

    const fileUrl = file ? `/uploads/${file.filename}` : doc.fileUrl;
    const fileSizeStr = file ? `${(file.size / 1024).toFixed(1)} KB` : doc.fileSize;

    // Archive previous versions
    const updatedVersions = (doc.versions || []).map((v) => ({
      ...v.toObject ? v.toObject() : v,
      status: "Archived"
    }));

    updatedVersions.unshift({
      version: nextVer,
      date: dateStr,
      author: authorName,
      uploadedBy: authorName,
      status: "Current",
      notes: notes || (file ? `Uploaded ${file.originalname}` : `Version ${nextVer} revision`),
      fileUrl,
      fileName: file ? file.filename : "",
      fileSize: fileSizeStr
    });

    doc.version = nextVer;
    doc.currentVersion = nextVer;
    doc.updated = dateStr;
    doc.updatedBy = authorName;
    doc.status = "Under Review";
    if (file) {
      doc.fileUrl = fileUrl;
      doc.fileName = file.filename;
      doc.originalName = file.originalname;
      doc.fileSize = fileSizeStr;
      doc.mimeType = file.mimetype;
      doc.storagePath = file.path;
    }
    doc.versions = updatedVersions;

    await doc.save();

    await logActivity({
      text: `New version file v${nextVer} uploaded for document '${doc.name}' (${doc.id}) by ${authorName}`,
      actor: authorName,
      tone: "blue"
    });

    broadcastRealtimeEvent("DOCUMENT_UPDATED", { action: "VERSION_UPLOADED", document: doc });

    return res.json({
      success: true,
      message: `Version v${nextVer} uploaded successfully`,
      document: doc
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/documents/:id/status (Review approval, changes requested, rejection)
export const updateDocumentStatus = async (req, res) => {
  try {
    const { status, comments } = req.body;
    const reviewerName = req.user?.name || "QM Group";
    const dateStr = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

    if (mongoose.connection.readyState !== 1) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const doc = await Document.findOne({ id: req.params.id });
    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    doc.status = status;
    doc.updated = dateStr;
    doc.updatedBy = reviewerName;
    if (comments) doc.reviewComments = comments;

    await doc.save();

    await logActivity({
      text: `Document '${doc.name}' (${doc.id}) marked as '${status}' by ${reviewerName}`,
      actor: reviewerName,
      tone: status === "Approved" ? "green" : status === "Changes Requested" ? "amber" : "blue"
    });

    await logNotification({
      title: `Document ${status}: ${doc.name}`,
      text: comments ? `${comments}` : `Document status updated to ${status} by ${reviewerName}.`,
      targetRole: "all"
    });

    broadcastRealtimeEvent("DOCUMENT_UPDATED", { action: "STATUS_UPDATED", document: doc });

    res.json({
      success: true,
      message: `Document status updated to ${status}`,
      document: doc
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/documents/:id/download (Download actual file from disk or certificate extract)
export const downloadDocument = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const doc = await Document.findOne({ id: req.params.id }).lean();
    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    // If actual uploaded file exists on disk, serve it directly
    if (doc.storagePath && fs.existsSync(doc.storagePath)) {
      const downloadFilename = doc.originalName || doc.fileName || `${doc.id}_document${path.extname(doc.storagePath)}`;
      return res.download(doc.storagePath, downloadFilename);
    }

    // Fallback: Generate official controlled document text extract
    const fileContent = `=====================================================
C-DAC QUALITY MANAGEMENT SYSTEM (QMS)
CONTROLLED DOCUMENT RECORD
=====================================================
Document ID:     ${doc.id}
Title:           ${doc.name || doc.title}
Type:            ${doc.type}
Process:         ${doc.process}
Course Coord.:   ${doc.owner}
Current Version: v${doc.version}
Status:          ${doc.status}
Last Updated:    ${doc.updated} by ${doc.updatedBy}

SUMMARY & PURPOSE:
${doc.description || "Official QMS document specification."}
${doc.content ? `\nTEMPLATE SPECIFICATION & CONTENT:\n${doc.content}\n` : ""}
VERSION HISTORY:
${(doc.versions || []).map((v) => ` - v${v.version} (${v.date}) by ${v.author} [${v.status}]: ${v.notes || "No notes"}`).join("\n")}

=====================================================
This is a computer-generated controlled document extract.
Quality Assurance & Compliance Division - C-DAC
=====================================================`;

    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Content-Disposition", `attachment; filename="${doc.id}_${(doc.name || "document").replace(/\s+/g, "_")}.txt"`);
    res.send(fileContent);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT or PATCH /api/documents/:id (Edit document metadata)
export const updateDocument = async (req, res) => {
  try {
    const { name, process, type, description, content, status } = req.body;
    const editorName = req.user?.name || "QM Group";
    const dateStr = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

    if (mongoose.connection.readyState !== 1) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const doc = await Document.findOne({ id: req.params.id });
    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    if (name !== undefined) {
      doc.name = name.trim();
      doc.title = name.trim();
    }
    if (process !== undefined) doc.process = process.trim();
    if (type !== undefined) doc.type = type.trim();
    if (description !== undefined) doc.description = description.trim();
    if (content !== undefined) doc.content = content;
    if (status !== undefined) doc.status = status;
    doc.updated = dateStr;
    doc.updatedBy = editorName;

    await doc.save();

    await logActivity({
      text: `Document '${doc.name}' (${doc.id}) updated by ${editorName}`,
      actor: editorName,
      tone: "blue"
    });

    broadcastRealtimeEvent("DOCUMENT_UPDATED", { action: "UPDATED", document: doc });

    res.json({
      success: true,
      message: "Document updated successfully",
      document: doc
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/documents/:id
export const deleteDocument = async (req, res) => {
  try {
    const userName = req.user?.name || "Admin";

    if (mongoose.connection.readyState !== 1) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const doc = await Document.findOne({ id: req.params.id });
    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    // If storage file exists on disk, clean it up
    if (doc.storagePath && fs.existsSync(doc.storagePath)) {
      try {
        fs.unlinkSync(doc.storagePath);
      } catch (e) {
        console.warn("Failed to unlink deleted file:", e.message);
      }
    }

    await Document.deleteOne({ id: req.params.id });

    await logActivity({
      text: `Document '${doc.name}' (${doc.id}) deleted by ${userName}`,
      actor: userName,
      tone: "red"
    });

    broadcastRealtimeEvent("DOCUMENT_DELETED", { action: "DELETED", id: req.params.id });

    res.json({
      success: true,
      message: "Document deleted successfully",
      document: doc
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getAllDocuments,
  getDocumentById,
  createDocument,
  uploadDocument,
  createNewVersion,
  uploadDocumentVersion,
  updateDocumentStatus,
  downloadDocument,
  updateDocument,
  deleteDocument
};
