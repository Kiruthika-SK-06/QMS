import mongoose from "mongoose";
import { Document } from "../models/Document.js";
import { Activity } from "../models/Activity.js";
import { Notification } from "../models/Notification.js";
import { documentsData } from "../data/documents.js";
import { tasksData } from "../data/tasks.js";
import { activitiesData } from "../data/activities.js";
import { notificationsData } from "../data/notifications.js";
import { broadcastRealtimeEvent } from "../utils/realtime.js";

// Helper to log activity to both DB and memory
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

// Helper to log notification to both DB and memory
const logNotification = async (entry) => {
  notificationsData.unshift(entry);
  if (mongoose.connection.readyState === 1) {
    try {
      await Notification.create(entry);
    } catch (err) {
      console.warn("Notification DB log error:", err.message);
    }
  }
};

// GET /api/documents
export const getAllDocuments = async (req, res) => {
  try {
    const { search, type, status, process } = req.query;

    let list = [...documentsData];

    // If MongoDB is connected and has records, use fresh DB records
    if (mongoose.connection.readyState === 1) {
      try {
        const dbDocs = await Document.find({}).lean();
        if (dbDocs && dbDocs.length > 0) {
          list = dbDocs;
          documentsData.length = 0;
          documentsData.push(...dbDocs);
        }
      } catch (err) {
        console.warn("MongoDB read error in getAllDocuments:", err.message);
      }
    }

    if (type && type !== "All") {
      list = list.filter((doc) => (doc.type || "").toLowerCase() === type.toLowerCase());
    }

    if (status && status !== "All") {
      list = list.filter((doc) => (doc.status || "").toLowerCase() === status.toLowerCase());
    }

    if (process && process !== "All") {
      list = list.filter((doc) => (doc.process || "").toLowerCase() === process.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (doc) =>
          (doc.name || "").toLowerCase().includes(q) ||
          (doc.id || "").toLowerCase().includes(q) ||
          (doc.process || "").toLowerCase().includes(q) ||
          (doc.owner || "").toLowerCase().includes(q)
      );
    }

    res.json({
      success: true,
      count: list.length,
      documents: list
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/documents/:id
export const getDocumentById = async (req, res) => {
  try {
    let doc = documentsData.find((d) => d.id === req.params.id);

    if (mongoose.connection.readyState === 1) {
      try {
        const dbDoc = await Document.findOne({ id: req.params.id }).lean();
        if (dbDoc) doc = dbDoc;
      } catch (err) {
        console.warn("MongoDB query error in getDocumentById:", err.message);
      }
    }

    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const relatedTasks = tasksData.filter((t) => t.document === doc.name);

    res.json({
      success: true,
      document: doc,
      relatedTasks
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/documents
export const createDocument = async (req, res) => {
  try {
    const { name, type, process, description, content } = req.body;
    if (!name || !type || !process) {
      return res.status(400).json({
        success: false,
        message: "Document name, type, and process are required"
      });
    }

    const nextIdNumber = documentsData.length + 1;
    const newId = `DOC-${String(nextIdNumber).padStart(3, "0")}`;
    const authorName = req.user?.name || "Course Coordinator";
    const dateStr = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

    const newDoc = {
      id: newId,
      name: name.trim(),
      title: name.trim(),
      type: type.trim(),
      process: process.trim(),
      owner: authorName,
      version: "1.0",
      currentVersion: "1.0",
      updated: dateStr,
      updatedBy: authorName,
      status: "Under Review",
      submittedBy: authorName,
      description: description || "Controlled QMS document",
      content: content || "",
      versions: [
        {
          version: "1.0",
          date: dateStr,
          author: authorName,
          status: "Current",
          notes: "Initial document upload and registration"
        }
      ]
    };

    // Save to MongoDB if connected
    if (mongoose.connection.readyState === 1) {
      try {
        await Document.create(newDoc);
      } catch (err) {
        console.warn("MongoDB createDocument error:", err.message);
      }
    }

    documentsData.unshift(newDoc);

    // Audit log
    await logActivity({
      id: `ACT-${Date.now()}`,
      title: "Document Uploaded",
      detail: `${newDoc.name} (v1.0)`,
      text: `Document uploaded and submitted: ${newDoc.name} (v1.0)`,
      actor: authorName,
      time: "Just now",
      tone: "blue",
      timestamp: new Date().toISOString()
    });

    // Notification
    await logNotification({
      id: Date.now(),
      title: "New document registered",
      text: `${newDoc.name} (${newDoc.id}) uploaded and submitted for QM review.`,
      time: "Just now",
      targetRole: "qm",
      read: false,
      createdAt: new Date().toISOString()
    });

    broadcastRealtimeEvent("DOCUMENT_UPDATED", { action: "CREATED", document: newDoc });

    res.status(201).json({
      success: true,
      message: "Document created successfully",
      document: newDoc
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/documents/:id/versions
export const createNewVersion = async (req, res) => {
  try {
    const docIndex = documentsData.findIndex((d) => d.id === req.params.id);
    if (docIndex === -1) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const doc = documentsData[docIndex];
    const authorName = req.user?.name || "Course Coordinator";
    const dateStr = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

    const currentVerNum = parseFloat(doc.version) || 1.0;
    const nextVer = (currentVerNum + 1.0).toFixed(1);

    const updatedDoc = {
      ...doc,
      version: nextVer,
      currentVersion: nextVer,
      updated: dateStr,
      updatedBy: authorName,
      status: "Draft",
      versions: [
        {
          version: nextVer,
          date: dateStr,
          author: authorName,
          status: "Current",
          notes: req.body.notes || `Version ${nextVer} revisions`
        },
        ...(doc.versions || []).map((v) => ({ ...v, status: "Archived" }))
      ]
    };

    if (mongoose.connection.readyState === 1) {
      try {
        await Document.findOneAndUpdate({ id: req.params.id }, updatedDoc, { new: true, upsert: true });
      } catch (err) {
        console.warn("MongoDB createNewVersion error:", err.message);
      }
    }

    documentsData[docIndex] = updatedDoc;

    // Audit log
    await logActivity({
      id: `ACT-${Date.now()}`,
      title: "Version Created",
      detail: `${doc.name} (v${nextVer})`,
      text: `Version ${nextVer} created for ${doc.name}`,
      actor: authorName,
      time: "Just now",
      tone: "blue",
      timestamp: new Date().toISOString()
    });

    // Notification
    await logNotification({
      id: Date.now(),
      title: `${doc.name} updated to v${nextVer}`,
      text: `New draft version ${nextVer} initiated by ${authorName}.`,
      time: "Just now",
      targetRole: "all",
      read: false,
      createdAt: new Date().toISOString()
    });

    broadcastRealtimeEvent("DOCUMENT_UPDATED", { action: "VERSION_CREATED", document: updatedDoc });

    res.json({
      success: true,
      message: `Version ${nextVer} created successfully`,
      document: updatedDoc
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/documents/:id/status
export const updateDocumentStatus = async (req, res) => {
  try {
    const docIndex = documentsData.findIndex((d) => d.id === req.params.id);
    if (docIndex === -1) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const { status, comments } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }

    const doc = documentsData[docIndex];
    const reviewerName = req.user?.name || "QM Group";
    const dateStr = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

    const updatedDoc = {
      ...doc,
      status,
      reviewComments: comments !== undefined ? comments : doc.reviewComments,
      updated: dateStr,
      updatedBy: reviewerName
    };

    if (mongoose.connection.readyState === 1) {
      try {
        await Document.findOneAndUpdate({ id: req.params.id }, updatedDoc, { new: true, upsert: true });
      } catch (err) {
        console.warn("MongoDB updateDocumentStatus error:", err.message);
      }
    }

    documentsData[docIndex] = updatedDoc;

    const tone = status === "Approved" ? "green" : status === "Changes Requested" ? "red" : "amber";

    // Activity audit
    await logActivity({
      id: `ACT-${Date.now()}`,
      title: status === "Approved" ? "Document Approved" : "Status Changed",
      detail: `${doc.name} (v${doc.version})`,
      text: `${status === "Approved" ? "Document approved" : status === "Changes Requested" ? "QM requested changes for" : "Status changed to " + status + " for"}: ${doc.name} (v${doc.version})`,
      actor: reviewerName,
      time: "Just now",
      tone,
      timestamp: new Date().toISOString()
    });

    // Notification
    await logNotification({
      id: Date.now(),
      title: `Document ${status}: ${doc.name}`,
      text: comments ? `${comments}` : `Document status updated to ${status} by ${reviewerName}.`,
      time: "Just now",
      targetRole: "all",
      read: false,
      createdAt: new Date().toISOString()
    });

    broadcastRealtimeEvent("DOCUMENT_UPDATED", { action: "STATUS_UPDATED", document: updatedDoc });

    res.json({
      success: true,
      message: `Document status updated to ${status}`,
      document: updatedDoc
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/documents/:id/download
export const downloadDocument = (req, res) => {
  try {
    const doc = documentsData.find((d) => d.id === req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const fileContent = `=====================================================
C-DAC QUALITY MANAGEMENT SYSTEM (QMS)
CONTROLLED DOCUMENT RECORD
=====================================================
Document ID:     ${doc.id}
Title:           ${doc.name}
Type:            ${doc.type}
Process:         ${doc.process}
Course Coord.:   ${doc.owner}
Current Version: v${doc.version}
Status:          ${doc.status}
Last Updated:    ${doc.updated} by ${doc.updatedBy}

SUMMARY & PURPOSE:
${doc.description || "Official QMS document specification."}
${doc.content ? `\nTEMPLATE SPECIFICATION & CHECKLIST:\n${doc.content}\n` : ""}
VERSION HISTORY:
${(doc.versions || []).map((v) => ` - v${v.version} (${v.date}) by ${v.author} [${v.status}]: ${v.notes || "No notes"}`).join("\n")}

=====================================================
This is a computer-generated controlled document extract.
=====================================================`;

    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Content-Disposition", `attachment; filename="${doc.id}_${doc.name.replace(/\\s+/g, "_")}.txt"`);
    res.send(fileContent);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT or PATCH /api/documents/:id (Edit template / document)
export const updateDocument = async (req, res) => {
  try {
    const docIndex = documentsData.findIndex((d) => d.id === req.params.id);
    if (docIndex === -1) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const { name, process, type, description, content, status } = req.body;
    const doc = documentsData[docIndex];
    const editorName = req.user?.name || "QM Group";
    const dateStr = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

    const updatedDoc = {
      ...doc,
      name: name !== undefined ? name.trim() : doc.name,
      title: name !== undefined ? name.trim() : doc.name,
      process: process !== undefined ? process.trim() : doc.process,
      type: type !== undefined ? type.trim() : doc.type,
      description: description !== undefined ? description.trim() : doc.description,
      content: content !== undefined ? content : doc.content,
      status: status !== undefined ? status : doc.status,
      updated: dateStr,
      updatedBy: editorName
    };

    if (mongoose.connection.readyState === 1) {
      try {
        await Document.findOneAndUpdate({ id: req.params.id }, updatedDoc, { new: true, upsert: true });
      } catch (err) {
        console.warn("MongoDB updateDocument error:", err.message);
      }
    }

    documentsData[docIndex] = updatedDoc;

    // Audit log entry
    await logActivity({
      id: `ACT-${Date.now()}`,
      title: "Document Updated",
      detail: `${updatedDoc.name} (${updatedDoc.id})`,
      text: `${updatedDoc.type === "Templates" ? "Template" : "Document"} updated: ${updatedDoc.name} (${updatedDoc.id})`,
      actor: editorName,
      time: "Just now",
      tone: "blue",
      timestamp: new Date().toISOString()
    });

    // Notification
    await logNotification({
      id: Date.now(),
      title: `${updatedDoc.type === "Templates" ? "Template" : "Document"} updated: ${updatedDoc.name}`,
      text: `${editorName} updated the specification for ${updatedDoc.name}.`,
      time: "Just now",
      targetRole: "all",
      read: false,
      createdAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: `${updatedDoc.type === "Templates" ? "Template" : "Document"} updated successfully`,
      document: updatedDoc
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/documents/:id
export const deleteDocument = async (req, res) => {
  try {
    const docIndex = documentsData.findIndex((d) => d.id === req.params.id);
    if (docIndex === -1) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const [deleted] = documentsData.splice(docIndex, 1);
    const actorName = req.user?.name || "QM Group";

    if (mongoose.connection.readyState === 1) {
      try {
        await Document.findOneAndDelete({ id: req.params.id });
      } catch (err) {
        console.warn("MongoDB deleteDocument error:", err.message);
      }
    }

    // Audit log
    await logActivity({
      id: `ACT-${Date.now()}`,
      title: "Document Removed",
      detail: `${deleted.name} (${deleted.id})`,
      text: `Document removed: ${deleted.name} (${deleted.id})`,
      actor: actorName,
      time: "Just now",
      tone: "red",
      timestamp: new Date().toISOString()
    });

    broadcastRealtimeEvent("DOCUMENT_UPDATED", { action: "DELETED", id: req.params.id });

    res.json({
      success: true,
      message: "Document deleted successfully",
      document: deleted
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
