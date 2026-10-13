import express from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser
} from "../controllers/userController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.post("/", authenticateToken, createUser);
router.put("/:id", authenticateToken, updateUser);
router.patch("/:id/status", authenticateToken, toggleUserStatus);
router.delete("/:id", authenticateToken, deleteUser);

export default router;
