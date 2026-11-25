import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { Document } from "../models/Document.js";
import { Notification } from "../models/Notification.js";
import { broadcastRealtimeEvent } from "../utils/realtime.js";
import { documentsData } from "../data/documents.js";
import { saveItem, updateItem, deleteItem, recordActivity } from "../config/storageEngine.js";

// Helper to log notification
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

    if (mongoose.connection.readyState === 1) {
      try {
        const filter = {};
        if (type && type !== "All") filter.type = { $regex: new RegExp(`^${type}$`, "i") };
        if (status && status !== "All") filter.status = { $regex: new RegExp(`^${status}$`, "i") };
        if (process && process !== "All") filter.process = { $regex: new RegExp(`^${process}$`, "i") };
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
        if (documents && documents.length > 0) {
          return res.json({
            success: true,
            count: documents.length,
            documents
          });
        }
      } catch (err) {
        console.warn("getAllDocuments DB query error, using synchronized dataset:", err.message);
      }
    }

    // Dual-mode fallback from persistent documents database
    let filtered = [...documentsData];

    if (type && type !== "All") {
      const typeLower = type.toLowerCase();
      filtered = filtered.filter((d) => d.type && d.type.toLowerCase() === typeLower);
    }

    if (status && status !== "All") {
      const statusLower = status.toLowerCase();
      filtered = filtered.filter((d) => d.status && d.status.toLowerCase() === statusLower);
    }

    if (process && process !== "All") {
      const procLower = process.toLowerCase();
      filtered = filtered.filter((d) => d.process && d.process.toLowerCase() === procLower);
    }

    if (search) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((d) => {
        return (
          (d.name && d.name.toLowerCase().includes(q)) ||
          (d.title && d.title.toLowerCase().includes(q)) ||
          (d.id && d.id.toLowerCase().includes(q)) ||
          (d.process && d.process.toLowerCase().includes(q)) ||
          (d.owner && d.owner.toLowerCase().includes(q))
        );
      });
    }

    res.json({
      success: true,
      count: filtered.length,
      documents: filtered
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/documents/:id
export const getDocumentById = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      try {
        const doc = await Document.findOne({ id: req.params.id }).lean();
        if (doc) return res.json({ success: true, document: doc });
      } catch (err) {}
    }

    const doc = documentsData.find((d) => d.id === req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found in database" });
    }

    res.json({ success: true, document: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/documents (Create controlled document in database & log activity)
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

    const docId = `DOC-${String(documentsData.length + 1).padStart(3, "0")}`;

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

    // Stored in database & persistent file store
    await saveItem("documents", newDocData, Document);

    // Stored in Activity / Audit Trail in database
    await recordActivity({
      title: "Document Control",
      text: `New document '${docName}' (${docId}) submitted for review by ${authorName}`,
      detail: `Type: ${type || "Procedures"} | Process: ${process} | Initial version: v1.0`,
      actor: authorName,
      role: req.user?.role || "owner",
      tone: "blue"
    });

    await logNotification({
      title: `Document Submitted: ${docName}`,
      text: `Version 1.0 submitted for review in process '${process}'`,
      targetRole: "qm"
    });

    broadcastRealtimeEvent("DOCUMENT_CREATED", { action: "CREATED", document: newDocData });

    res.status(201).json({
      success: true,
      message: "Document created and stored in database successfully",
      document: newDocData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/documents/upload (Upload actual file using Multer, store in database & log activity)
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

    const docId = `DOC-${String(documentsData.length + 1).padStart(3, "0")}`;
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

    // Stored in database & persistent file store
    await saveItem("documents", newDocData, Document);

    // Stored in Activity / Audit Trail in database
    await recordActivity({
      title: "Document Control",
      text: `File '${file ? file.originalname : docName}' uploaded for document '${docName}' (${docId}) by ${authorName}`,
      detail: `File size: ${fileSizeStr} | Process: ${process} | Stored at: ${fileUrl || "Database"}`,
      actor: authorName,
      role: req.user?.role || "owner",
      tone: "blue"
    });

    await logNotification({
      title: `Document Uploaded: ${docName}`,
      text: `Uploaded file '${file ? file.originalname : docName}' by ${authorName}`,
      targetRole: "all"
    });

    broadcastRealtimeEvent("DOCUMENT_CREATED", { action: "UPLOADED", document: newDocData });

    return res.status(201).json({
      success: true,
      message: "Document and file uploaded and stored in database successfully",
      document: newDocData
    });
  } catch (error) {
    console.error("uploadDocument error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/documents/:id/versions (Create new version in database)
export const createNewVersion = async (req, res) => {
  try {
    const { notes } = req.body;
    const authorName = req.user?.name || "Course Coordinator";
    const dateStr = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

    const memDoc = documentsData.find((d) => d.id === req.params.id);
    if (!memDoc) {
      return res.status(404).json({ success: false, message: "Document not found in database" });
    }

    const currentVerNum = parseFloat(memDoc.version || "1.0");
    const nextVer = (currentVerNum + 1.0).toFixed(1);

    const updatedVersions = (memDoc.versions || []).map((v) => ({
      ...v,
      status: "Archived"
    }));

    updatedVersions.unshift({
      version: nextVer,
      date: dateStr,
      author: authorName,
      uploadedBy: authorName,
      status: "Current",
      notes: notes || `Version ${nextVer} revision submitted`
    });

    const updates = {
      version: nextVer,
      currentVersion: nextVer,
      updated: dateStr,
      updatedBy: authorName,
      status: "Under Review",
      versions: updatedVersions
    };

    await updateItem("documents", "id", memDoc.id, updates, Document);

    // Stored in Activity / Audit Trail in database
    await recordActivity({
      title: "Document Control",
      text: `New version v${nextVer} created for document '${memDoc.name}' (${memDoc.id}) by ${authorName}`,
      detail: `Revision notes: ${notes || "New controlled version"}`,
      actor: authorName,
      tone: "blue"
    });

    broadcastRealtimeEvent("DOCUMENT_UPDATED", { action: "VERSION_CREATED", document: memDoc });

    res.json({
      success: true,
      message: `Version v${nextVer} created and stored in database successfully`,
      document: memDoc
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

    const memDoc = documentsData.find((d) => d.id === req.params.id);
    if (!memDoc) {
      return res.status(404).json({ success: false, message: "Document not found in database" });
    }

    const currentVerNum = parseFloat(memDoc.version || "1.0");
    const nextVer = (currentVerNum + 1.0).toFixed(1);

    const fileUrl = file ? `/uploads/${file.filename}` : memDoc.fileUrl;
    const fileSizeStr = file ? `${(file.size / 1024).toFixed(1)} KB` : memDoc.fileSize;

    const updatedVersions = (memDoc.versions || []).map((v) => ({
      ...v,
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

    const updates = {
      version: nextVer,
      currentVersion: nextVer,
      updated: dateStr,
      updatedBy: authorName,
      status: "Under Review",
      versions: updatedVersions
    };

    if (file) {
      updates.fileUrl = fileUrl;
      updates.fileName = file.filename;
      updates.originalName = file.originalname;
      updates.fileSize = fileSizeStr;
      updates.mimeType = file.mimetype;
      updates.storagePath = file.path;
    }

    await updateItem("documents", "id", memDoc.id, updates, Document);

    // Stored in Activity / Audit Trail in database
    await recordActivity({
      title: "Document Control",
      text: `New version file v${nextVer} uploaded for document '${memDoc.name}' (${memDoc.id}) by ${authorName}`,
      detail: `File: ${file ? file.originalname : "Digital version"} | File size: ${fileSizeStr}`,
      actor: authorName,
      tone: "blue"
    });

    broadcastRealtimeEvent("DOCUMENT_UPDATED", { action: "VERSION_UPLOADED", document: memDoc });

    return res.json({
      success: true,
      message: `Version v${nextVer} uploaded and stored in database successfully`,
      document: memDoc
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

    const memDoc = documentsData.find((d) => d.id === req.params.id);
    if (!memDoc) {
      return res.status(404).json({ success: false, message: "Document not found in database" });
    }

    const updates = {
      status,
      updated: dateStr,
      updatedBy: reviewerName
    };
    if (comments) updates.reviewComments = comments;

    await updateItem("documents", "id", memDoc.id, updates, Document);

    // Stored in Activity / Audit Trail in database
    await recordActivity({
      title: "Document Control",
      text: `Document '${memDoc.name}' (${memDoc.id}) marked as '${status}' by ${reviewerName}`,
      detail: comments ? `Reviewer Comments: ${comments}` : `Document status moved to ${status}`,
      actor: reviewerName,
      role: req.user?.role || "qm",
      tone: status === "Approved" ? "green" : status === "Changes Requested" ? "amber" : "blue"
    });

    await logNotification({
      title: `Document ${status}: ${memDoc.name}`,
      text: comments ? `${comments}` : `Document status updated to ${status} by ${reviewerName}.`,
      targetRole: "all"
    });

    broadcastRealtimeEvent("DOCUMENT_UPDATED", { action: "STATUS_UPDATED", document: memDoc });

    res.json({
      success: true,
      message: `Document status updated to ${status} in database successfully`,
      document: memDoc
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/documents/:id/download (Download actual file from disk or certificate extract)
export const downloadDocument = async (req, res) => {
  try {
    let doc = null;
    if (mongoose.connection.readyState === 1) {
      try {
        doc = await Document.findOne({ id: req.params.id }).lean();
      } catch (err) {}
    }

    if (!doc) {
      doc = documentsData.find((d) => d.id === req.params.id);
    }

    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found in database" });
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

// PUT or PATCH /api/documents/:id (Edit document metadata in database)
export const updateDocument = async (req, res) => {
  try {
    const { name, process, type, description, content, status } = req.body;
    const editorName = req.user?.name || "QM Group";
    const dateStr = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

    const memDoc = documentsData.find((d) => d.id === req.params.id);
    if (!memDoc) {
      return res.status(404).json({ success: false, message: "Document not found in database" });
    }

    const updates = {
      updated: dateStr,
      updatedBy: editorName
    };
    if (name !== undefined) {
      updates.name = name.trim();
      updates.title = name.trim();
    }
    if (process !== undefined) updates.process = process.trim();
    if (type !== undefined) updates.type = type.trim();
    if (description !== undefined) updates.description = description.trim();
    if (content !== undefined) updates.content = content;
    if (status !== undefined) updates.status = status;

    await updateItem("documents", "id", memDoc.id, updates, Document);

    // Stored in Activity / Audit Trail in database
    await recordActivity({
      title: "Document Control",
      text: `Document '${memDoc.name}' (${memDoc.id}) updated by ${editorName}`,
      detail: `Modified fields: ${Object.keys(updates).join(", ")}`,
      actor: editorName,
      tone: "blue"
    });

    broadcastRealtimeEvent("DOCUMENT_UPDATED", { action: "UPDATED", document: memDoc });

    res.json({
      success: true,
      message: "Document updated in database successfully",
      document: memDoc
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/documents/:id
export const deleteDocument = async (req, res) => {
  try {
    const userName = req.user?.name || "Admin";
    const memDoc = documentsData.find((d) => d.id === req.params.id);
    if (!memDoc) {
      return res.status(404).json({ success: false, message: "Document not found in database" });
    }

    if (memDoc.storagePath && fs.existsSync(memDoc.storagePath)) {
      try { fs.unlinkSync(memDoc.storagePath); } catch (e) {}
    }

    await deleteItem("documents", "id", memDoc.id, Document);

    // Stored in Activity / Audit Trail in database
    await recordActivity({
      title: "Document Control",
      text: `Document '${memDoc.name}' (${memDoc.id}) deleted by ${userName}`,
      actor: userName,
      tone: "red"
    });

    broadcastRealtimeEvent("DOCUMENT_DELETED", { action: "DELETED", id: req.params.id });

    res.json({
      success: true,
      message: "Document deleted from database successfully",
      document: memDoc
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
