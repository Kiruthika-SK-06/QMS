import express from "express";
import {
  getAllExternalAudits,
  syncExternalAudits,
  logIncomingExternalAuditSchedule,
  shareExternalAuditSchedule,
  uploadExternalAuditNCDocs,
  closeExternalAuditProcess
} from "../controllers/externalAuditController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getAllExternalAudits);
router.post("/sync", syncExternalAudits);
router.post("/", authenticateToken, logIncomingExternalAuditSchedule);
router.post("/:id/share-schedule", authenticateToken, shareExternalAuditSchedule);
router.post("/:id/upload-nc", authenticateToken, uploadExternalAuditNCDocs);
router.post("/:id/close", authenticateToken, closeExternalAuditProcess);

export default router;
