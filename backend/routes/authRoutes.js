import express from "express";
import { login, getMe, getDemoUsers, logout } from "../controllers/authController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/login", login);
router.get("/demo-users", getDemoUsers);
router.post("/logout", logout);

// Protected routes
router.get("/me", authenticateToken, getMe);

export default router;
