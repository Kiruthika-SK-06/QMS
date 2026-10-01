import express from "express";
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTaskStatus,
  deleteTask
} from "../controllers/taskController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getAllTasks);
router.get("/:id", getTaskById);
router.post("/", authenticateToken, createTask);
router.patch("/:id/status", authenticateToken, updateTaskStatus);
router.delete("/:id", authenticateToken, deleteTask);

export default router;
