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
  RotateCw,
  ShieldCheck
} from "lucide-react";
import Modal from "../tasks/Modal";
import { authService } from "../../services/authService";

export default function AccountActivationModal({ initialEmail = "", onClose, onSuccess }) {
  // Modes: "verify" (enter 6-digit OTP) | "createPassword" (set new password) | "done" (success)
  const [mode, setMode] = useState("verify");
  const [email, setEmail] = useState(initialEmail);

  // OTP and password state
  const [code, setCode] = useState("");
  const [activationToken, setActivationToken] = useState("");
  const [password, setPassword] = useState("");
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
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  // Step 1: Verify Activation OTP
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    if (!cleanEmail) {
      setError("Please enter your registered official email address.");
      return;
    }

    if (!cleanCode || cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      setError("Please enter the 6-digit numeric activation code.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await authService.verifyActivationOtp({ email: cleanEmail, code: cleanCode });
      setActivationToken(res.activationToken || "");
      setInfoMessage(res.message || "Activation code verified! Please create your password.");
      setMode("createPassword");
    } catch (err) {
      setError(err.message || "Invalid or expired activation code. Please check your email or contact the QMS Coordinator.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Resend Activation OTP with 60-second cooldown
  const handleResend = async () => {
    if (countdown > 0 || resendLoading) return;
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your registered email address to resend the code.");
      return;
    }

    setResendLoading(true);
    setError("");

    try {
      const res = await authService.resendActivationOtp(cleanEmail);
      setInfoMessage(res.message || "A new 6-digit activation code has been dispatched to your email.");
      setCountdown(60);
    } catch (err) {
      setError(err.message || "Failed to resend activation code. Please wait and try again.");
    } finally {
      setResendLoading(false);
    }
  };

  // Step 3: Create and Confirm Password
  const handleCreatePassword = async (e) => {
    e.preventDefault();
    const cleanPass = password.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanPass) {
      setError("Please enter your new password.");
      return;
    }

    if (cleanPass.length < 6) {
      setError("Password must be at least 6 characters in length.");
      return;
    }

    if (cleanPass !== cleanConfirm) {
      setError("Passwords do not match. Please verify.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await authService.activateAccount({
        email: email.trim().toLowerCase(),
        activationToken,
        password: cleanPass,
        confirmPassword: cleanConfirm
      });

      setInfoMessage(res.message || "Account activated successfully!");
      setMode("done");
      if (onSuccess) onSuccess(email.trim().toLowerCase());
    } catch (err) {
      setError(err.message || "Failed to activate account. Please verify your token and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="C-DAC QMS - Account Activation"
      isOpen={true}
      onClose={onClose}
      maxWidth="480px"
    >
      <div style={{ padding: "8px 4px" }}>
        {/* Step Indicator Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "#050B3B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              flexShrink: 0
            }}
          >
            {mode === "done" ? <CheckCircle2 size={20} color="#22c55e" /> : <ShieldCheck size={20} />}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#050B3B" }}>
              {mode === "verify" && "Verify Invitation Code"}
              {mode === "createPassword" && "Create Account Password"}
              {mode === "done" && "Account Activated!"}
            </h3>
            <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>
              {mode === "verify" && "Enter the 6-digit OTP emailed by your QMS Coordinator"}
              {mode === "createPassword" && "Configure your secure personal password"}
              {mode === "done" && "Your account is now active and ready for login"}
            </p>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              padding: "10px 14px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "6px",
              color: "#991b1b",
              fontSize: "13px",
              marginBottom: "16px",
              lineHeight: "1.4"
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
            <span>{error}</span>
          </div>
        )}

        {/* Global Info / Success Banner */}
        {infoMessage && mode !== "done" && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              padding: "10px 14px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "6px",
              color: "#166534",
              fontSize: "13px",
              marginBottom: "16px",
              lineHeight: "1.4"
            }}
          >
            <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* MODE 1: VERIFY ACTIVATION OTP */}
        {mode === "verify" && (
          <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1e293b", marginBottom: "6px" }}>
                Registered Official Email ID
              </label>
              <div style={{ position: "relative" }}>
                <Mail
                  size={16}
                  style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@cdac.in"
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 38px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box"
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1e293b", marginBottom: "6px" }}>
                6-Digit Invitation OTP Code
              </label>
              <div style={{ position: "relative" }}>
                <KeyRound
                  size={16}
                  style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}
                />
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="• • • • • •"
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 38px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    fontSize: "18px",
                    letterSpacing: "4px",
                    fontWeight: "700",
                    boxSizing: "border-box"
                  }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                <span style={{ fontSize: "12px", color: "#64748b" }}>Code valid for 5 minutes</span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={countdown > 0 || resendLoading}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    fontSize: "12px",
                    color: countdown > 0 ? "#94a3b8" : "#384FB8",
                    cursor: countdown > 0 ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    fontWeight: "600"
                  }}
                >
                  {resendLoading ? (
                    <Loader2 size={12} className="spin" />
                  ) : (
                    <RotateCw size={12} />
                  )}
                  {countdown > 0 ? `Resend code in ${countdown}s` : "Resend code"}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !email.trim() || code.length !== 6}
                style={{
                  flex: 2,
                  padding: "10px",
                  borderRadius: "6px",
                  border: "none",
                  background: "#050B3B",
                  color: "#ffffff",
                  fontWeight: "600",
                  cursor: loading || !email.trim() || code.length !== 6 ? "not-allowed" : "pointer",
                  opacity: loading || !email.trim() || code.length !== 6 ? 0.7 : 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
              >
                {loading && <Loader2 size={16} className="spin" />}
                <span>Verify & Proceed</span>
              </button>
            </div>
          </form>
        )}

        {/* MODE 2: CREATE PASSWORD */}
        {mode === "createPassword" && (
          <form onSubmit={handleCreatePassword} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "12px", color: "#64748b", display: "block" }}>Activating account for:</span>
              <strong style={{ fontSize: "14px", color: "#050B3B" }}>{email}</strong>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1e293b", marginBottom: "6px" }}>
                Create Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={16}
                  style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  style={{
                    width: "100%",
                    padding: "10px 38px 10px 38px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box"
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
                    color: "#64748b",
                    cursor: "pointer"
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1e293b", marginBottom: "6px" }}>
                Confirm Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={16}
                  style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}
                />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  style={{
                    width: "100%",
                    padding: "10px 38px 10px 38px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box"
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
                    color: "#64748b",
                    cursor: "pointer"
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button
                type="submit"
                disabled={loading || password.length < 6 || password !== confirmPassword}
                style={{
                  width: "100%",
                  padding: "11px",
                  borderRadius: "6px",
                  border: "none",
                  background: "#050B3B",
                  color: "#ffffff",
                  fontWeight: "700",
                  cursor: loading || password.length < 6 || password !== confirmPassword ? "not-allowed" : "pointer",
                  opacity: loading || password.length < 6 || password !== confirmPassword ? 0.7 : 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
              >
                {loading && <Loader2 size={16} className="spin" />}
                <span>Activate Account & Save Password</span>
              </button>
            </div>
          </form>
        )}

        {/* MODE 3: ACTIVATION COMPLETE */}
        {mode === "done" && (
          <div style={{ textAlign: "center", padding: "16px 8px" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "#dcfce7",
                color: "#16a34a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto"
              }}
            >
              <CheckCircle2 size={32} />
            </div>
            <h4 style={{ margin: "0 0 8px 0", fontSize: "18px", color: "#050B3B" }}>
              Account Successfully Activated!
            </h4>
            <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "#64748b", lineHeight: "1.5" }}>
              Your C-DAC QMS user account has been verified and your personal password has been securely saved in the database.
            </p>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: "100%",
                padding: "11px",
                borderRadius: "6px",
                border: "none",
                background: "#050B3B",
                color: "#ffffff",
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              Proceed to Sign In
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
