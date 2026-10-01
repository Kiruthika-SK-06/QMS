import express from "express";
import {
  getAllDocuments,
  getDocumentById,
  createDocument,
  createNewVersion,
  updateDocumentStatus,
  downloadDocument
} from "../controllers/documentController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public/Read-only routes (accessible with or without auth)
router.get("/", getAllDocuments);
router.get("/:id", getDocumentById);
router.get("/:id/download", downloadDocument);

// Protected routes (require valid JWT)
router.post("/", authenticateToken, createDocument);
router.post("/:id/versions", authenticateToken, createNewVersion);
router.patch("/:id/status", authenticateToken, updateDocumentStatus);

export default router;
