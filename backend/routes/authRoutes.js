import express from "express";
import {
  login,
  verifyActivationOtp,
  activateAccount,
  resendActivationOtp,
  forgotPassword,
  verifyOtp,
  resendOtp,
  resetPassword,
  changePassword,
  logout,
  getMe,
  bootstrapFirstAdmin
} from "../controllers/authController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public Authentication Endpoints
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/reset-password", resetPassword);

// User Invitation & Account Activation Endpoints
router.post("/verify-activation-otp", verifyActivationOtp);
router.post("/activate-account", activateAccount);
router.post("/resend-activation-otp", resendActivationOtp);

// Initial One-Time Bootstrap Setup (Protected by BOOTSTRAP_SECRET)
router.post("/bootstrap", bootstrapFirstAdmin);

// Session Endpoints
router.post("/logout", logout);

// Authenticated Endpoints
router.get("/me", authenticateToken, getMe);
router.post("/change-password", authenticateToken, changePassword);

export default router;
