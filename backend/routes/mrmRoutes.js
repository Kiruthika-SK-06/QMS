import express from "express";
import {
  getAllMRMs,
  syncMRMs,
  getMRMById,
  createMRM,
  scheduleMRM,
  updateMRM,
  saveMoM,
  uploadMoMFile,
  downloadMoMFile,
  requestApproval,
  submitForApproval,
  approveMRM,
  requestChangesMRM,
  rejectMRM,
  resubmitMRM,
  shareMeetingEmail,
  shareMRM,
  acknowledgeMRM,
  archiveMRM,
  deleteMRM
} from "../controllers/mrmController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getAllMRMs);
router.post("/sync", syncMRMs);
router.get("/:id", getMRMById);
router.post("/", authenticateToken, createMRM);

// Approval request endpoints
router.post("/:id/request-approval", authenticateToken, requestApproval);
router.post("/:id/submit-approval", authenticateToken, requestApproval);
router.put("/:id/submit-approval", authenticateToken, requestApproval);

// Decision endpoints (Team Head or Internal Auditor)
router.post("/:id/approve", authenticateToken, approveMRM);
router.post("/:id/request-changes", authenticateToken, requestChangesMRM);
router.post("/:id/reject", authenticateToken, rejectMRM);
router.post("/:id/resubmit", authenticateToken, resubmitMRM);

// Email notification sharing endpoint
router.post("/:id/share-email", authenticateToken, shareMeetingEmail);
router.post("/:id/share", authenticateToken, shareMeetingEmail);

// Minutes of Meeting (MoM) file upload & download
router.post("/:id/upload-mom", authenticateToken, uploadMoMFile);
router.post("/:id/mom", authenticateToken, uploadMoMFile);
router.put("/:id/mom", authenticateToken, uploadMoMFile);
router.get("/:id/mom-download", downloadMoMFile);

// Utility endpoints
router.post("/:id/schedule", authenticateToken, scheduleMRM);
router.put("/:id/schedule", authenticateToken, scheduleMRM);
router.put("/:id", authenticateToken, updateMRM);
router.post("/:id/acknowledge", authenticateToken, acknowledgeMRM);
router.post("/:id/archive", authenticateToken, archiveMRM);
router.delete("/:id", authenticateToken, deleteMRM);

export default router;
