import express from "express";
import {
  getAllDocuments,
  getDocumentById,
  createDocument,
  uploadDocument,
  createNewVersion,
  uploadDocumentVersion,
  updateDocumentStatus,
  downloadDocument,
  deleteDocument,
  updateDocument
} from "../controllers/documentController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { upload } from "../utils/upload.js";

const router = express.Router();

// Read-only routes
router.get("/", getAllDocuments);
router.get("/:id", getDocumentById);
router.get("/:id/download", downloadDocument);

// Creation and upload routes
router.post("/", authenticateToken, createDocument);
router.post("/upload", authenticateToken, upload.single("file"), uploadDocument);

// Versioning routes
router.post("/:id/versions", authenticateToken, createNewVersion);
router.post("/:id/versions/upload", authenticateToken, upload.single("file"), uploadDocumentVersion);

// Update, status, and delete
router.patch("/:id/status", authenticateToken, updateDocumentStatus);
router.put("/:id", authenticateToken, updateDocument);
router.patch("/:id", authenticateToken, updateDocument);
router.delete("/:id", authenticateToken, deleteDocument);

export default router;
