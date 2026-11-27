import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AlertCircle, CheckCircle2, Loader2, Mail, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { authService } from "../../services/authService";
import Logo from "../common/Logo";
import RolePicker from "./RolePicker";
import ForgotPasswordModal from "./ForgotPasswordModal";
import AccountActivationModal from "./AccountActivationModal";

export default function LoginForm() {
  const app = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [pendingActivationEmail, setPendingActivationEmail] = useState("");

  // Check URL query parameters or direct paths (e.g. /activate, /verify-otp, ?mode=activate&email=user@cdac.in)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");
    const paramEmail = params.get("email");

    if (paramEmail) {
      setEmail(paramEmail);
    }

    if (mode === "activate" || location.pathname === "/activate" || location.pathname === "/verify-otp") {
      setPendingActivationEmail(paramEmail || "");
      setShowActivationModal(true);
    } else if (mode === "forgot" || location.pathname === "/forgot-password") {
      setShowForgotPassword(true);
    }
  }, [location.search, location.pathname]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    setPendingActivationEmail("");

    if (!email.trim()) {
      setError("Please enter your official email ID or username.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      // Authenticate with the backend API against MongoDB single source of truth
      const res = await authService.login({
        identifier: email.trim(),
        password,
        role: role || undefined
      });

      if (res && res.success && res.user) {
        const sessionUser = {
          ...res.user,
          loginIdentifier: email.trim(),
          email: res.user.email || email.trim()
        };

        // Guarantee immediate synchronous persistence to localStorage
        if (res.token) localStorage.setItem("qms_token", res.token);
        localStorage.setItem("qms_user", JSON.stringify(sessionUser));

        // Save user and token in application context
        if (app && typeof app.loginUser === "function") {
          app.loginUser(sessionUser, res.token);
        } else if (app && typeof app.login === "function") {
          app.login(sessionUser.role || role);
        }

        // Determine destination dashboard based on verified MongoDB user role
        const userRole = sessionUser.role;
        const path =
          userRole === "owner"
            ? "/process-owner/dashboard"
            : userRole === "Head" || userRole === "auditor"
              ? "/Head/dashboard"
              : "/qm-group/dashboard";

        navigate(path, { replace: true });
      } else {
        setError(res?.message || "Failed to sign in. Please check your credentials.");
      }
    } catch (err) {
      console.error("Login failed:", err);
      if (err.code === "PENDING_VERIFICATION") {
        setPendingActivationEmail(err.email || email.trim());
        setError("Your account is pending verification. Please verify your OTP to set your password and activate your account.");
      } else {
        setError(err.message || "Failed to sign in. Please verify your credentials and selected role.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-panel">
      <div className="login-card">
        <Logo />

        <h1 className="login-heading">Sign in to QMS</h1>

        {successMessage && (
          <div className="login-success-alert" role="status">
            <CheckCircle2 size={18} className="alert-icon" />
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="login-error-alert" role="alert">
            <AlertCircle size={18} className="alert-icon" />
            <div style={{ flex: 1 }}>
              <div>{error}</div>
              {pendingActivationEmail && (
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setShowActivationModal(true);
                  }}
                  style={{
                    marginTop: "8px",
                    background: "#050B3B",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "4px",
                    padding: "6px 12px",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px"
                  }}
                >
                  <ShieldCheck size={14} />
                  <span>Activate Account Now</span>
                </button>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Work Email ID */}
          <div className="login-field-group">
            <label htmlFor="login-email">
              Work Email ID or Username
            </label>
            <div className="login-input-wrapper">
              <Mail size={16} className="login-input-icon" />
              <input
                id="login-email"
                name="email"
                type="text"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                  setSuccessMessage("");
                  setPendingActivationEmail("");
                }}
                placeholder="e.g. coordinator@cdac.in"
                autoComplete="username"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Role Picker (Dropdown matching C-DAC design) */}
          <RolePicker role={role} onChange={(newRole) => {
            setRole(newRole);
            setError("");
          }} disabled={loading} />

          {/* Password */}
          <div className="login-field-group">
            <label htmlFor="login-password">
              Password
            </label>
            <div className="login-input-wrapper">
              <Lock size={16} className="login-input-icon" />
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                  setSuccessMessage("");
                }}
                placeholder="Enter password"
                autoComplete="current-password"
                disabled={loading}
                required
              />
              <button
                type="button"
                className="password-toggle-button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
                tabIndex={0}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember Me and Forgot Password */}
          <div className="login-options">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                disabled={loading}
              />
              <span>Remember me</span>
            </label>

            <button
              type="button"
              className="plain-button"
              onClick={() => {
                setError("");
                setSuccessMessage("");
                setShowForgotPassword(true);
              }}
              disabled={loading}
            >
              Forgot password?
            </button>
          </div>

          {/* Sign In Button */}
          <button
            className="primary-button btn-blue full login-submit-btn"
            type="submit"
            disabled={!email.trim() || !password || loading}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            <span>{loading ? "Authenticating..." : "Sign in to Workspace"}</span>
          </button>

          {/* Account Activation Link for newly invited users */}
          <div style={{ textAlign: "center", marginTop: "16px" }}>
            <button
              type="button"
              onClick={() => {
                setError("");
                setSuccessMessage("");
                setShowActivationModal(true);
              }}
              style={{
                background: "none",
                border: "none",
                color: "#384FB8",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                padding: "4px 8px"
              }}
            >
              Invited to QMS? Activate your account
            </button>
          </div>
        </form>

        <small className="login-footnote">
          Centre for Development of Advanced Computing &bull; Quality Management System
        </small>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <ForgotPasswordModal
          initialIdentifier={email}
          onClose={() => setShowForgotPassword(false)}
          onSuccess={(result) => {
            setShowForgotPassword(false);
            setError("");
            setSuccessMessage("Password reset successfully! You can now sign in with your new password.");
          }}
        />
      )}

      {/* Account Activation Modal */}
      {showActivationModal && (
        <AccountActivationModal
          initialEmail={pendingActivationEmail || email}
          onClose={() => setShowActivationModal(false)}
          onSuccess={(activatedEmail) => {
            setShowActivationModal(false);
            setError("");
            setEmail(activatedEmail);
            setSuccessMessage(`Account activated successfully for "${activatedEmail}". You may now log in.`);
          }}
        />
      )}
    </div>
  );
}
