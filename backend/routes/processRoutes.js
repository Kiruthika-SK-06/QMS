import express from "express";
import { getAllProcesses, getHeadOverview, createProcess } from "../controllers/processController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getAllProcesses);
router.post("/", authenticateToken, createProcess);
router.get("/head-overview", getHeadOverview);

export default router;
