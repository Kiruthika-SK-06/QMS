import React, { useState } from "react";
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  KeyRound
} from "lucide-react";
import Modal from "../tasks/Modal";
import { authService } from "../../services/authService";

export default function ForgotPasswordModal({ initialIdentifier = "", onClose, onSuccess }) {
  // Modes: "request" (enter email) | "sent" (check your email) | "code" (enter code & new password) | "done"
  const [mode, setMode] = useState("request");
  const [email, setEmail] = useState(initialIdentifier);

  // For code reset mode
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState("");

  // Handler: Request password reset link
  const handleSendResetLink = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("Please enter your registered email address.");
      return;
    }

    // Basic email format check if an @ is expected
    if (cleanEmail.includes("@") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await authService.forgotPassword(cleanEmail);
      setMode("sent");
    } catch (err) {
      // In production / real-time enterprise systems, if the email isn't found,
      // some show the sent confirmation anyway (OWASP user enumeration prevention),
      // but if a specific error is returned, show a clean message.
      if (err.message && err.message.toLowerCase().includes("not found")) {
        setError(err.message);
      } else {
        // Default to clean transition or friendly notice
        setMode("sent");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handler: Resend email
  const handleResend = async () => {
    if (resendLoading || resendSuccess) return;
    setResendLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 4000);
    } catch {
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 4000);
    } finally {
      setResendLoading(false);
    }
  };

  // Handler: Reset password using verification code
  const handleResetWithCode = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }

    if (!code.trim()) {
      setError("Please enter the verification code.");
      return;
    }

    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);

    try {
      const res = await authService.resetPassword({
        identifier: email.trim(),
        code: code.trim(),
        newPassword
      });

      setMode("done");
    } catch (err) {
      console.error("Reset password failed:", err);
      setError(err.message || "Failed to reset password. Please check your verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToLogin = () => {
    if (mode === "done" && onSuccess) {
      onSuccess({
        identifier: email.trim(),
        newPassword
      });
    } else if (mode === "sent" && onSuccess) {
      onSuccess(email.trim());
    } else {
      onClose();
    }
  };

  const getModalTitle = () => {
    switch (mode) {
      case "sent":
        return "Check your email";
      case "code":
        return "Set new password";
      case "done":
        return "Password updated";
      default:
        return "Reset password";
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

        {/* 1. Standard Initial View: Enter Email */}
        {mode === "request" && (
          <form onSubmit={handleSendResetLink}>
            <p
              style={{
                fontSize: "14px",
                color: "#475569",
                marginBottom: "20px",
                lineHeight: "1.5"
              }}
            >
              Enter the email address associated with your account, and we will send you instructions to reset your password.
            </p>

            <div style={{ marginBottom: "22px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#1e293b",
                  marginBottom: "6px"
                }}
              >
                Email address
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="name@cdac.in"
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 38px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    outline: "none"
                  }}
                  autoFocus
                  disabled={loading}
                  required
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

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                alignItems: "center"
              }}
            >
              <button
                type="button"
                className="secondary-button"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary-button btn-blue"
                disabled={!email.trim() || loading}
                style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                <span>{loading ? "Sending link..." : "Send reset link"}</span>
              </button>
            </div>

            {/* Subtle Link for Code-based Reset */}
            <div
              style={{
                marginTop: "18px",
                paddingTop: "14px",
                borderTop: "1px solid #f1f5f9",
                textAlign: "center"
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setMode("code");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--navy)",
                  fontSize: "12px",
                  fontWeight: "500",
                  cursor: "pointer",
                  textDecoration: "underline"
                }}
              >
                Have a verification code? Reset here
              </button>
            </div>
          </form>
        )}

        {/* 2. Standard Real-Time Sent Confirmation View */}
        {mode === "sent" && (
          <div style={{ textAlign: "center", padding: "12px 6px" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#16a34a",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "4px auto 16px auto"
              }}
            >
              <CheckCircle2 size={32} />
            </div>

            <h3
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "#0f172a",
                margin: "0 0 8px 0"
              }}
            >
              Instructions sent
            </h3>

            <p
              style={{
                fontSize: "14px",
                color: "#475569",
                margin: "0 0 16px 0",
                lineHeight: "1.5"
              }}
            >
              We have sent password reset instructions to:
            </p>

            <div
              style={{
                display: "inline-block",
                padding: "6px 14px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                fontWeight: "600",
                fontSize: "14px",
                color: "#1e293b",
                marginBottom: "20px",
                wordBreak: "break-all"
              }}
            >
              {email}
            </div>

            <p
              style={{
                fontSize: "12px",
                color: "#64748b",
                margin: "0 0 24px 0",
                lineHeight: "1.5"
              }}
            >
              Please check your inbox. If you do not see the email within a few minutes, check your spam or junk folder.
            </p>

            <button
              type="button"
              className="primary-button btn-blue"
              onClick={handleReturnToLogin}
              style={{
                width: "100%",
                padding: "11px",
                fontSize: "14px",
                justifyContent: "center"
              }}
            >
              Return to sign in
            </button>

            <div style={{ marginTop: "16px", textAlign: "center" }}>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--navy)",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                {resendLoading
                  ? "Resending..."
                  : resendSuccess
                  ? "✓ Email resent!"
                  : "Didn't receive the email? Resend link"}
              </button>
            </div>
          </div>
        )}

        {/* 3. Verification Code Entry (Clean, no unwanted demo text) */}
        {mode === "code" && (
          <form onSubmit={handleResetWithCode}>
            <p
              style={{
                fontSize: "14px",
                color: "#475569",
                marginBottom: "16px",
                lineHeight: "1.5"
              }}
            >
              Enter the verification code sent to your email and your new password.
            </p>

            {/* Email Address */}
            <div style={{ marginBottom: "14px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#1e293b",
                  marginBottom: "6px"
                }}
              >
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@cdac.in"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box"
                }}
                disabled={loading}
                required
              />
            </div>

            {/* 6-Digit Code */}
            <div style={{ marginBottom: "14px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#1e293b",
                  marginBottom: "6px"
                }}
              >
                Verification code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter 6-digit code"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  fontSize: "15px",
                  letterSpacing: "2px",
                  fontFamily: "'Roboto Mono', monospace",
                  fontWeight: "600",
                  boxSizing: "border-box"
                }}
                disabled={loading}
                required
              />
            </div>

            {/* New Password */}
            <div style={{ marginBottom: "14px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#1e293b",
                  marginBottom: "6px"
                }}
              >
                New password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  style={{
                    width: "100%",
                    padding: "9px 36px 9px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box"
                  }}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#64748b",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex"
                  }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: "22px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#1e293b",
                  marginBottom: "6px"
                }}
              >
                Confirm new password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  style={{
                    width: "100%",
                    padding: "9px 36px 9px 12px",
                    border: `1px solid ${
                      confirmPassword && newPassword !== confirmPassword
                        ? "#f87171"
                        : confirmPassword && newPassword === confirmPassword
                        ? "#4ade80"
                        : "#cbd5e1"
                    }`,
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box"
                  }}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#64748b",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex"
                  }}
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <span
                  style={{
                    fontSize: "11px",
                    color: "#dc2626",
                    marginTop: "4px",
                    display: "block"
                  }}
                >
                  Passwords do not match
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setError("");
                  setMode("request");
                }}
                disabled={loading}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>

              <button
                type="submit"
                className="primary-button btn-blue"
                disabled={
                  !code.trim() ||
                  !newPassword ||
                  newPassword.length < 6 ||
                  newPassword !== confirmPassword ||
                  loading
                }
                style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                <span>{loading ? "Updating..." : "Reset password"}</span>
              </button>
            </div>
          </form>
        )}

        {/* 4. Password Updated Successfully Confirmation */}
        {mode === "done" && (
          <div style={{ textAlign: "center", padding: "16px 8px" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#16a34a",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "4px auto 16px auto"
              }}
            >
              <CheckCircle2 size={32} />
            </div>

            <h3
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "#0f172a",
                margin: "0 0 8px 0"
              }}
            >
              Password updated
            </h3>

            <p
              style={{
                fontSize: "14px",
                color: "#475569",
                margin: "0 0 24px 0",
                lineHeight: "1.5"
              }}
            >
              Your password has been changed successfully. You can now use your new password to sign in.
            </p>

            <button
              type="button"
              className="primary-button btn-blue"
              onClick={handleReturnToLogin}
              style={{
                width: "100%",
                padding: "11px",
                fontSize: "14px",
                justifyContent: "center"
              }}
            >
              Return to sign in
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
