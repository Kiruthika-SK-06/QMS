import { documentsData } from "../data/documents.js";
import { tasksData } from "../data/tasks.js";
import { activitiesData } from "../data/activities.js";
import { notificationsData } from "../data/notifications.js";

// GET /api/documents
export const getAllDocuments = (req, res) => {
  try {
    const { search, type, status, process } = req.query;
    let list = [...documentsData];

    if (type && type !== "All") {
      list = list.filter((doc) => doc.type.toLowerCase() === type.toLowerCase());
    }

    if (status && status !== "All") {
      list = list.filter((doc) => doc.status.toLowerCase() === status.toLowerCase());
    }

    if (process && process !== "All") {
      list = list.filter((doc) => doc.process.toLowerCase() === process.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (doc) =>
          doc.name.toLowerCase().includes(q) ||
          doc.id.toLowerCase().includes(q) ||
          doc.process.toLowerCase().includes(q) ||
          doc.owner.toLowerCase().includes(q)
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
export const getDocumentById = (req, res) => {
  try {
    const doc = documentsData.find((d) => d.id === req.params.id);
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
export const createDocument = (req, res) => {
  try {
    const { name, type, process, description } = req.body;
    if (!name || !type || !process) {
      return res.status(400).json({
        success: false,
        message: "Document name, type, and process are required"
      });
    }

    const nextIdNumber = documentsData.length + 1;
    const newId = `DOC-${String(nextIdNumber).padStart(3, "0")}`;
    const authorName = req.user?.name || "Process Owner";
    const dateStr = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

    const newDoc = {
      id: newId,
      name: name.trim(),
      type: type.trim(),
      process: process.trim(),
      owner: authorName,
      version: "1.0",
      updated: dateStr,
      updatedBy: authorName,
      status: "Under Review",
      submittedBy: authorName,
      description: description || "Controlled QMS document",
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

    documentsData.unshift(newDoc);

    // Audit log
    activitiesData.unshift({
      id: `ACT-${Date.now()}`,
      text: `Document uploaded and submitted: ${newDoc.name} (v1.0)`,
      actor: authorName,
      time: "Just now",
      tone: "blue",
      timestamp: new Date().toISOString()
    });

    // Notification
    notificationsData.unshift({
      id: Date.now(),
      title: "New document registered",
      text: `${newDoc.name} (${newDoc.id}) uploaded and submitted for QM review.`,
      time: "Just now",
      targetRole: "qm",
      read: false,
      createdAt: new Date().toISOString()
    });

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
export const createNewVersion = (req, res) => {
  try {
    const docIndex = documentsData.findIndex((d) => d.id === req.params.id);
    if (docIndex === -1) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const doc = documentsData[docIndex];
    const authorName = req.user?.name || "Process Owner";
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
        ...doc.versions.map((v) => ({ ...v, status: "Archived" }))
      ]
    };

    documentsData[docIndex] = updatedDoc;

    // Audit log
    activitiesData.unshift({
      id: `ACT-${Date.now()}`,
      text: `Version ${nextVer} created for ${doc.name}`,
      actor: authorName,
      time: "Just now",
      tone: "blue",
      timestamp: new Date().toISOString()
    });

    // Notification
    notificationsData.unshift({
      id: Date.now(),
      title: `${doc.name} updated to v${nextVer}`,
      text: `New draft version ${nextVer} initiated by ${authorName}.`,
      time: "Just now",
      targetRole: "all",
      read: false,
      createdAt: new Date().toISOString()
    });

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
export const updateDocumentStatus = (req, res) => {
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

    documentsData[docIndex] = updatedDoc;

    const tone = status === "Approved" ? "green" : status === "Changes Requested" ? "red" : "amber";

    // Activity audit
    activitiesData.unshift({
      id: `ACT-${Date.now()}`,
      text: `${status === "Approved" ? "Document approved" : status === "Changes Requested" ? "QM requested changes for" : "Status changed to " + status + " for"}: ${doc.name} (v${doc.version})`,
      actor: reviewerName,
      time: "Just now",
      tone,
      timestamp: new Date().toISOString()
    });

    // Notification
    notificationsData.unshift({
      id: Date.now(),
      title: `Document ${status}: ${doc.name}`,
      text: comments ? `${comments}` : `Document status updated to ${status} by ${reviewerName}.`,
      time: "Just now",
      targetRole: "all",
      read: false,
      createdAt: new Date().toISOString()
    });

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
Process Owner:   ${doc.owner}
Current Version: v${doc.version}
Status:          ${doc.status}
Last Updated:    ${doc.updated} by ${doc.updatedBy}

SUMMARY & PURPOSE:
${doc.description || "Official QMS document specification."}

VERSION HISTORY:
${doc.versions.map((v) => ` - v${v.version} (${v.date}) by ${v.author} [${v.status}]: ${v.notes || "No notes"}`).join("\n")}

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
