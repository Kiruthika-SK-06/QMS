import express from "express";
import {
  getAllExternalAudits,
  syncExternalAudits,
  logIncomingExternalAuditSchedule,
  shareExternalAuditSchedule,
  uploadExternalAuditNCDocs,
  closeCourseCoordinatorNC,
  closeExternalAuditProcess
} from "../controllers/externalAuditController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { upload } from "../utils/upload.js";

const router = express.Router();

router.get("/", getAllExternalAudits);
router.post("/sync", syncExternalAudits);
router.post("/", authenticateToken, logIncomingExternalAuditSchedule);
router.post("/:id/share-schedule", authenticateToken, shareExternalAuditSchedule);
router.post("/:id/upload-nc", authenticateToken, upload.single("file"), uploadExternalAuditNCDocs);
router.post("/:id/close-nc", authenticateToken, closeCourseCoordinatorNC);
router.post("/:id/resolve-nc", authenticateToken, closeCourseCoordinatorNC);
router.post("/:id/close", authenticateToken, closeExternalAuditProcess);

export default router;
