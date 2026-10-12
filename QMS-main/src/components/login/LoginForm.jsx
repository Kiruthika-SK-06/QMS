import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { authService } from "../../services/authService";
import Logo from "../common/Logo";
import RolePicker from "./RolePicker";
import ForgotPasswordModal from "./ForgotPasswordModal";

export default function LoginForm() {
  const { loginUser } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!email.trim()) {
      setError("Please enter your email ID or username.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (!role) {
      setError("Please select a role from the dropdown to continue.");
      return;
    }

    setLoading(true);

    try {
      // Authenticate with the backend API or resilient fallback
      const res = await authService.login({
        identifier: email.trim(),
        password,
        role
      });

      if (res.success && res.user) {
        // Save user and token in application context and localStorage
        loginUser(res.user, res.token);

        // Determine destination dashboard based on verified user role
        const userRole = res.user.role;
        const path =
          userRole === "employee"
            ? "/employee/dashboard"
            : userRole === "owner"
              ? "/process-owner/dashboard"
              : userRole === "Head"
                ? "/Head/dashboard"
                : "/qm-group/dashboard";

        navigate(path);
      } else {
        setError(res.message || "Failed to sign in. Please check your credentials.");
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError(err.message || "Failed to sign in. Please verify your credentials and selected role.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-panel">
      <div className="login-card">
        <Logo />

        <h1 className="login-heading">Sign in to QMS</h1>
        <p className="login-subheading">
          Enter your email ID, password, and select your role to access the workspace.
        </p>

        {successMessage && (
          <div className="login-success-alert" role="status">
            <CheckCircle2 size={18} className="alert-icon" />
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="login-error-alert" role="alert">
            <AlertCircle size={18} className="alert-icon" />
            <span>{error}</span>
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
                }}
                placeholder="e.g. employee@cdac.in"
                autoComplete="username"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Role Picker (Clean role dropdown, no descriptions, smart flip) */}
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
            className="primary-button full login-submit-btn"
            type="submit"
            disabled={!email.trim() || !password || loading}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            <span>{loading ? "Authenticating..." : "Sign in to Workspace"}</span>
          </button>
        </form>

        <small className="login-footnote">
          Centre for Development of Advanced Computing (C-DAC) &bull; Quality Management System
        </small>
      </div>

      {/* Forgot Password Interactive Modal */}
      {showForgotPassword && (
        <ForgotPasswordModal
          initialIdentifier={email}
          onClose={() => setShowForgotPassword(false)}
          onSuccess={({ identifier, newPassword, role: updatedRole }) => {
            setEmail(identifier);
            setPassword(newPassword);
            if (updatedRole) {
              setRole(updatedRole);
            }
            setShowForgotPassword(false);
            setError("");
            setSuccessMessage(
              `Password reset successfully for "${identifier}"! Click "Sign in to Workspace" to continue.`
            );
          }}
        />
      )}
    </div>
  );
}
