import React, { useState } from "react";
import {
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Copy,
  Check,
  UserCheck
} from "lucide-react";
import Modal from "../tasks/Modal";
import { authService } from "../../services/authService";

const QUICK_ACCOUNTS = [
  { label: "Employee", username: "employee", role: "employee" },
  { label: "Process Owner", username: "processowner", role: "owner" },
  { label: "QM Group", username: "qmgroup", role: "qm" },
  { label: "QM Head", username: "qmhead", role: "Head" }
];

export default function ForgotPasswordModal({ initialIdentifier = "", onClose, onSuccess }) {
  // Step 1: Request Code | Step 2: Enter Code & New Password | Step 3: Success
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [userInfo, setUserInfo] = useState(null); // { name, email, username, role, demoCode }

  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  // Step 1: Request Code
  const handleRequestCode = async (e) => {
    if (e) e.preventDefault();
    if (!identifier.trim()) {
      setError("Please enter your username or registered email address");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await authService.forgotPassword(identifier.trim());
      setUserInfo(res);
      // Pre-fill the verification code if demoCode is returned for convenience
      if (res.demoCode) {
        setCode(res.demoCode);
      }
      setStep(2);
    } catch (err) {
      console.error("Forgot password request failed:", err);
      setError(err.message || "Failed to generate verification code. Please check your username.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (!code.trim()) {
      setError("Please enter the 6-digit verification code");
      return;
    }

    if (!newPassword) {
      setError("Please enter a new password");
      return;
    }

    if (newPassword.length < 3) {
      setError("Password must be at least 3 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);

    try {
      const res = await authService.resetPassword({
        identifier: identifier.trim(),
        code: code.trim(),
        newPassword
      });

      setStep(3);
    } catch (err) {
      console.error("Reset password failed:", err);
      setError(err.message || "Failed to reset password. Please verify the code and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (userInfo?.demoCode) {
      navigator.clipboard?.writeText(userInfo.demoCode);
      setCode(userInfo.demoCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCompleteAndSignIn = () => {
    if (onSuccess) {
      onSuccess({
        identifier: userInfo?.username || identifier,
        newPassword,
        role: userInfo?.role
      });
    } else {
      onClose();
    }
  };

  return (
    <Modal
      title={
        step === 3
          ? "Password Reset Complete"
          : step === 2
          ? "Set New Password"
          : "Forgot Password Recovery"
      }
      onClose={onClose}
    >
      <div style={{ padding: "4px 0" }}>
        {/* Step Progress Indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            marginBottom: "20px",
            paddingBottom: "14px",
            borderBottom: "1px solid #e2e8f0"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: step >= 1 ? "600" : "400",
              color: step >= 1 ? "#0284c7" : "#94a3b8"
            }}
          >
            <span
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                background: step >= 1 ? "#0284c7" : "#e2e8f0",
                color: step >= 1 ? "#fff" : "#64748b",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px"
              }}
            >
              1
            </span>
            <span>Identify</span>
          </div>

          <div
            style={{
              width: "32px",
              height: "2px",
              background: step >= 2 ? "#0284c7" : "#e2e8f0"
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: step >= 2 ? "600" : "400",
              color: step >= 2 ? "#0284c7" : "#94a3b8"
            }}
          >
            <span
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                background: step >= 2 ? "#0284c7" : "#e2e8f0",
                color: step >= 2 ? "#fff" : "#64748b",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px"
              }}
            >
              2
            </span>
            <span>Verify & Reset</span>
          </div>

          <div
            style={{
              width: "32px",
              height: "2px",
              background: step >= 3 ? "#10b981" : "#e2e8f0"
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: step === 3 ? "600" : "400",
              color: step === 3 ? "#10b981" : "#94a3b8"
            }}
          >
            <span
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                background: step === 3 ? "#10b981" : "#e2e8f0",
                color: step === 3 ? "#fff" : "#64748b",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px"
              }}
            >
              3
            </span>
            <span>Done</span>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div
            style={{
              padding: "10px 14px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              borderRadius: "8px",
              marginBottom: "16px",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Enter Username / Email */}
        {step === 1 && (
          <form onSubmit={handleRequestCode}>
            <p style={{ fontSize: "14px", color: "#475569", marginBottom: "16px", lineHeight: "1.5" }}>
              Enter your C-DAC Quality Management System username or registered email address. We will verify your account and issue an OTP security code.
            </p>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1e293b", marginBottom: "6px" }}>
                Username or Registered Email
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. employee, processowner, or cdac email"
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 38px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box"
                  }}
                  autoFocus
                  disabled={loading}
                  required
                />
                <Mail
                  size={18}
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

            {/* Quick Demo Selector */}
            <div
              style={{
                marginBottom: "20px",
                padding: "12px",
                background: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0"
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#0369a1",
                  marginBottom: "8px"
                }}
              >
                <Sparkles size={14} />
                <span>Select Demo Account to Test:</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {QUICK_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.username}
                    type="button"
                    onClick={() => {
                      setIdentifier(acc.username);
                      setError("");
                    }}
                    style={{
                      padding: "4px 10px",
                      background: identifier === acc.username ? "#0284c7" : "#ffffff",
                      color: identifier === acc.username ? "#ffffff" : "#334155",
                      border: `1px solid ${identifier === acc.username ? "#0284c7" : "#cbd5e1"}`,
                      borderRadius: "16px",
                      fontSize: "12px",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                  >
                    {acc.label} ({acc.username})
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
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
                className="primary-button"
                disabled={!identifier.trim() || loading}
                style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Reset Code</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Enter OTP & Set New Password */}
        {step === 2 && (
          <form onSubmit={handleResetPassword}>
            {/* Account Information Card */}
            {userInfo && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: "8px",
                  marginBottom: "16px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "#dbeafe",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#1d4ed8"
                    }}
                  >
                    <UserCheck size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#1e3a8a" }}>
                      {userInfo.name || userInfo.username}
                    </div>
                    <div style={{ fontSize: "11px", color: "#3b82f6" }}>
                      {userInfo.email} • Role: {userInfo.role}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setStep(1);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#2563eb",
                    fontSize: "12px",
                    fontWeight: "500",
                    cursor: "pointer",
                    textDecoration: "underline"
                  }}
                >
                  Change Account
                </button>
              </div>
            )}

            {/* Demo OTP Banner with 1-Click Autofill */}
            {userInfo?.demoCode && (
              <div
                style={{
                  marginBottom: "16px",
                  padding: "12px 14px",
                  background: "#f0fdf4",
                  border: "1px dashed #86efac",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "700", color: "#15803d" }}>
                    Security Code Issued:
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: "700", color: "#166534", letterSpacing: "3px", fontFamily: "monospace" }}>
                    {userInfo.demoCode}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    background: copiedCode ? "#22c55e" : "#dcfce7",
                    color: copiedCode ? "#ffffff" : "#166534",
                    border: "1px solid #86efac",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedCode ? "Applied!" : "Autofill Code"}</span>
                </button>
              </div>
            )}

            {/* Verification Code Input */}
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1e293b", marginBottom: "6px" }}>
                6-Digit Verification Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter 6-digit code (e.g. 123456)"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  fontSize: "15px",
                  letterSpacing: "2px",
                  fontWeight: "600",
                  fontFamily: "monospace",
                  boxSizing: "border-box"
                }}
                disabled={loading}
                required
              />
              <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>
                Universal master demo code <code>123456</code> is also accepted.
              </span>
            </div>

            {/* New Password */}
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1e293b", marginBottom: "6px" }}>
                New Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  style={{
                    width: "100%",
                    padding: "10px 36px 10px 12px",
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

            {/* Confirm New Password */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1e293b", marginBottom: "6px" }}>
                Confirm New Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  style={{
                    width: "100%",
                    padding: "10px 36px 10px 12px",
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
                <span style={{ fontSize: "11px", color: "#dc2626", marginTop: "4px", display: "block" }}>
                  Passwords do not match
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setStep(1)}
                disabled={loading}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={
                  !code.trim() ||
                  !newPassword ||
                  newPassword.length < 3 ||
                  newPassword !== confirmPassword ||
                  loading
                }
                style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Success Confirmation */}
        {step === 3 && (
          <div style={{ textAlign: "center", padding: "16px 8px" }}>
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "#dcfce7",
                color: "#16a34a",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px"
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: "0 0 8px 0" }}>
              Password Reset Successfully!
            </h3>

            <p style={{ fontSize: "14px", color: "#475569", margin: "0 0 20px 0", lineHeight: "1.5" }}>
              Your account password has been updated in the QMS system. You can now log in immediately with your new credentials.
            </p>

            <div
              style={{
                padding: "12px 16px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                marginBottom: "24px",
                textAlign: "left",
                fontSize: "13px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ color: "#64748b" }}>Account:</span>
                <span style={{ fontWeight: "600", color: "#1e293b" }}>{userInfo?.username || identifier}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>New Password:</span>
                <span style={{ fontFamily: "monospace", fontWeight: "600", color: "#0284c7" }}>
                  {"•".repeat(newPassword.length)} ({newPassword})
                </span>
              </div>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={handleCompleteAndSignIn}
              style={{
                width: "100%",
                padding: "12px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontSize: "14px"
              }}
            >
              <Lock size={16} />
              <span>Back to Login & Pre-fill Credentials</span>
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
