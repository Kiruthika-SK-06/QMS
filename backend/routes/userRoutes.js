import express from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser
} from "../controllers/userController.js";
import { authenticateToken, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// Read operations: authenticated users can access directory
router.get("/", authenticateToken, getAllUsers);
router.get("/:id", authenticateToken, getUserById);

// Administrative operations: restricted strictly to QMS Coordinators
router.post("/", authenticateToken, requireRole("qm", "coordinator", "admin"), createUser);
router.put("/:id", authenticateToken, requireRole("qm", "coordinator", "admin"), updateUser);
router.patch("/:id/status", authenticateToken, requireRole("qm", "coordinator", "admin"), toggleUserStatus);
router.delete("/:id", authenticateToken, requireRole("qm", "coordinator", "admin"), deleteUser);

export default router;
