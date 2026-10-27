import express from "express";
import {
  getAllAudits,
  getAuditById,
  createAudit,
  shareSchedule,
  confirmSchedule,
  submitNoticingSheet,
  shareNCDocs,
  auditeeClose,
  finalCloseAudit,
  downloadAuditDoc
} from "../controllers/auditController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getAllAudits);
router.get("/:id", getAuditById);
router.post("/", authenticateToken, createAudit);

// Stage 1 -> 2: Share Schedule Docs
router.post("/:id/share-schedule", authenticateToken, shareSchedule);

// Stage 2: Trust Head Confirm Schedule
router.post("/:id/confirm-schedule", authenticateToken, confirmSchedule);

// Stage 3: Internal Auditor Submit Noticing Sheet to QMS Coordinator
router.post("/:id/noticing-sheet", authenticateToken, submitNoticingSheet);

// Stage 4: QMS Coordinator Review & Share NC Docs to Auditor & Auditee
router.post("/:id/share-nc-docs", authenticateToken, shareNCDocs);

// Stage 5: Auditee Close NC with Corrective Action & Evidence
router.post("/:id/auditee-close", authenticateToken, auditeeClose);

// Stage 6: QMS Coordinator Final Close Entire Process
router.post("/:id/final-close", authenticateToken, finalCloseAudit);

// Download Audit Documents / Certificate
router.get("/:id/download/:type?", downloadAuditDoc);

export default router;
