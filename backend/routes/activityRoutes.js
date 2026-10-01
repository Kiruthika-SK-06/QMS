import express from "express";
import { getAllActivities, addActivity } from "../controllers/activityController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getAllActivities);
router.post("/", authenticateToken, addActivity);

export default router;
