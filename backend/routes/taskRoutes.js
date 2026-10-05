import express from "express";
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTaskStatus,
  updateTask,
  deleteTask
} from "../controllers/taskController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getAllTasks);
router.get("/:id", getTaskById);
router.post("/", authenticateToken, createTask);
router.patch("/:id/status", authenticateToken, updateTaskStatus);
router.put("/:id", authenticateToken, updateTask);
router.patch("/:id", authenticateToken, updateTask);
router.delete("/:id", authenticateToken, deleteTask);

export default router;
