import React, { useState, useEffect } from "react";
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  KeyRound,
  RotateCw
} from "lucide-react";
import Modal from "../tasks/Modal";
import { authService } from "../../services/authService";

export default function ForgotPasswordModal({ initialIdentifier = "", onClose, onSuccess }) {
  // Modes: "request" (enter email) | "verify" (enter 6-digit OTP) | "reset" (set new password) | "done" (success)
  const [mode, setMode] = useState("request");
  const [email, setEmail] = useState(initialIdentifier);

  // OTP and password state
  const [code, setCode] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & countdown timer
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  // 60-second countdown timer for resend OTP
  useEffect(() => {
    let timer = null;
    if (mode === "verify" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [mode, countdown]);

  // Step 1: Send verification code to email
  const handleSendResetLink = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("Please enter your registered email address.");
      return;
    }

    if (cleanEmail.includes("@") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await authService.forgotPassword(cleanEmail);
      setInfoMessage(res.message || "A 6-digit verification code has been dispatched to your email address.");
      setCountdown(60);
      setMode("verify");
    } catch (err) {
      setError(err.message || "No registered account found matching that email. Please verify your email.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Resend code with 60-second cooldown
  const handleResend = async () => {
    if (countdown > 0 || resendLoading) return;
    setResendLoading(true);
    setError("");

    try {
      const res = await authService.resendOtp(email.trim());
      setInfoMessage(res.message || "A new 6-digit verification code has been sent.");
      setCountdown(60);
    } catch (err) {
      setError(err.message || "Failed to resend verification code. Please wait and try again.");
    } finally {
      setResendLoading(false);
    }
  };

  // Step 3: Verify the 6-digit OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const cleanCode = code.trim();

    if (!cleanCode) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      setError("Verification code must be exactly 6 numeric digits.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await authService.verifyOtp({ email: email.trim(), code: cleanCode });
      setVerificationToken(res.verificationToken || "");
      setMode("reset");
    } catch (err) {
      setError(err.message || "Invalid verification code. Please check and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }

    if (newPassword.length < 4) {
      setError("Password must be at least 4 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword({
        email: email.trim(),
        verificationToken,
        code: code.trim(),
        newPassword,
        confirmPassword
      });
      setMode("done");
    } catch (err) {
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToLogin = () => {
    if (mode === "done" && onSuccess) {
      onSuccess({ identifier: email.trim(), newPassword });
    } else {
      onClose();
    }
  };

  const getModalTitle = () => {
    switch (mode) {
      case "verify":
        return "Verify Email OTP";
      case "reset":
        return "Set New Password";
      case "done":
        return "Password Reset Complete";
      default:
        return "Forgot Password";
    }
  };

  return (
    <Modal title={getModalTitle()} onClose={onClose} maxWidth="460px">
      <div style={{ padding: "4px 0" }}>
        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: "10px 14px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              borderRadius: "6px",
              marginBottom: "16px",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
            role="alert"
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Request OTP View: Enter Email */}
        {mode === "request" && (
          <form onSubmit={handleSendResetLink}>
            <p style={{ fontSize: "14px", color: "#475569", marginBottom: "20px", lineHeight: "1.5" }}>
              Enter your registered institutional email address. We will verify your account in the system database and send a secure 6-digit verification code.
            </p>

            <div style={{ marginBottom: "22px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1e293b", marginBottom: "6px" }}>
                Registered Email Address
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="e.g. coursecoordinator@cdac.in"
                  style={{
                    width: "100%",
                    padding: "10px 14px 10px 38px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box"
                  }}
                />
                <Mail
                  size={16}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8"
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "24px" }}>
              <button type="button" className="secondary-button" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button
                type="submit"
                className="primary-button btn-blue"
                disabled={loading || !email.trim()}
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                {loading && <Loader2 size={16} className="spin" />}
                <span>{loading ? "Verifying..." : "Send Verification Code"}</span>
              </button>
            </div>
          </form>
        )}

        {/* 2. Verify OTP View */}
        {mode === "verify" && (
          <form onSubmit={handleVerifyOtp}>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px auto"
                }}
              >
                <KeyRound size={24} />
              </div>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#050B3B", margin: "0 0 6px 0" }}>
                Enter Verification Code
              </h3>
              <p style={{ fontSize: "13px", color: "#475569", margin: 0, lineHeight: "1.4" }}>
                {infoMessage || `A 6-digit code was sent to ${email}. Valid for 5 minutes.`}
              </p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1e293b", marginBottom: "8px", textAlign: "center" }}>
                6-Digit Security Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                  if (error) setError("");
                }}
                placeholder="123456"
                autoFocus
                style={{
                  width: "100%",
                  textAlign: "center",
                  letterSpacing: "8px",
                  fontSize: "24px",
                  fontWeight: "700",
                  padding: "12px",
                  border: "2px solid #384FB8",
                  borderRadius: "8px",
                  color: "#0C1979",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", fontSize: "13px" }}>
              <button
                type="button"
                onClick={() => setMode("request")}
                style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
              >
                <ArrowLeft size={14} /> Change Email
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0 || resendLoading}
                style={{
                  background: "none",
                  border: "none",
                  color: countdown > 0 ? "#94a3b8" : "#2563eb",
                  cursor: countdown > 0 ? "not-allowed" : "pointer",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <RotateCw size={14} className={resendLoading ? "spin" : ""} />
                {countdown > 0 ? `Resend OTP in ${countdown}s` : "Resend OTP"}
              </button>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button type="button" className="secondary-button" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button
                type="submit"
                className="primary-button btn-blue"
                disabled={loading || code.trim().length !== 6}
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                {loading && <Loader2 size={16} className="spin" />}
                <span>{loading ? "Verifying..." : "Verify Code"}</span>
              </button>
            </div>
          </form>
        )}

        {/* 3. Reset Password View */}
        {mode === "reset" && (
          <form onSubmit={handleResetPassword}>
            <p style={{ fontSize: "14px", color: "#475569", marginBottom: "20px" }}>
              Code verified successfully. Enter your new password for account <strong>{email}</strong>:
            </p>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1e293b", marginBottom: "6px" }}>
                New Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Enter at least 4 characters"
                  style={{
                    width: "100%",
                    padding: "10px 40px 10px 38px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box"
                  }}
                />
                <Lock
                  size={16}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#94a3b8"
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: "22px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1e293b", marginBottom: "6px" }}>
                Confirm New Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Re-enter password"
                  style={{
                    width: "100%",
                    padding: "10px 40px 10px 38px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box"
                  }}
                />
                <Lock
                  size={16}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#94a3b8"
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button type="button" className="secondary-button" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button
                type="submit"
                className="primary-button btn-blue"
                disabled={loading || !newPassword || !confirmPassword}
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                {loading && <Loader2 size={16} className="spin" />}
                <span>{loading ? "Updating..." : "Reset Password"}</span>
              </button>
            </div>
          </form>
        )}

        {/* 4. Done View */}
        {mode === "done" && (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                background: "#f0fdf4",
                color: "#16a34a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto"
              }}
            >
              <CheckCircle2 size={30} />
            </div>
            <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#1e293b", margin: "0 0 8px 0" }}>
              Password Reset Successfully
            </h3>
            <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 24px 0", lineHeight: "1.5" }}>
              Your account password has been updated in the database. You can now log in using your new credentials.
            </p>
            <button
              type="button"
              className="primary-button btn-blue"
              onClick={handleReturnToLogin}
              style={{ width: "100%", padding: "12px", justifyContent: "center" }}
            >
              Return to Login
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
