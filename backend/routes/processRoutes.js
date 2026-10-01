import express from "express";
import { getAllProcesses, getHeadOverview } from "../controllers/processController.js";

const router = express.Router();

router.get("/", getAllProcesses);
router.get("/head-overview", getHeadOverview);

export default router;
