import express from "express";
import {
  getAllMRMs,
  getMRMById,
  createMRM,
  scheduleMRM,
  updateMRM,
  saveMoM,
  submitForApproval,
  approveMRM,
  requestChangesMRM,
  rejectMRM,
  resubmitMRM,
  shareMRM,
  acknowledgeMRM,
  archiveMRM,
  deleteMRM,
  uploadMoMDocument
} from "../controllers/mrmController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getAllMRMs);
router.get("/:id", getMRMById);
router.post("/", authenticateToken, createMRM);
router.post("/:id/schedule", authenticateToken, scheduleMRM);
router.put("/:id/schedule", authenticateToken, scheduleMRM);
router.put("/:id", authenticateToken, updateMRM);
router.post("/:id/mom", authenticateToken, saveMoM);
router.put("/:id/mom", authenticateToken, saveMoM);
router.post("/:id/upload-mom", authenticateToken, uploadMoMDocument);
router.put("/:id/upload-mom", authenticateToken, uploadMoMDocument);
router.post("/:id/submit-approval", authenticateToken, submitForApproval);
router.put("/:id/submit-approval", authenticateToken, submitForApproval);
router.post("/:id/approve", authenticateToken, approveMRM);
router.post("/:id/request-changes", authenticateToken, requestChangesMRM);
router.post("/:id/reject", authenticateToken, rejectMRM);
router.post("/:id/resubmit", authenticateToken, resubmitMRM);
router.post("/:id/share", authenticateToken, shareMRM);
router.post("/:id/acknowledge", authenticateToken, acknowledgeMRM);
router.post("/:id/archive", authenticateToken, archiveMRM);
router.delete("/:id", authenticateToken, deleteMRM);

export default router;
