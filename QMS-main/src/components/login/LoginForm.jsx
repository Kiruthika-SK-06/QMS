import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { authService } from "../../services/authService";
import Logo from "../common/Logo";
import RolePicker from "./RolePicker";

const DEMO_LOGINS = [
  { label: "Employee", username: "employee", role: "employee", pass: "1234" },
  { label: "Process Owner", username: "processowner", role: "owner", pass: "1234" },
  { label: "QM Group", username: "qmgroup", role: "qm", pass: "1234" },
  { label: "QM Head", username: "qmhead", role: "Head", pass: "1234" }
];

export default function LoginForm() {
  const { loginUser } = useApp();
  const navigate = useNavigate();

  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleQuickFill = (demo) => {
    setEmail(demo.username);
    setPassword(demo.pass);
    setRole(demo.role);
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Authenticate with the backend API
      const res = await authService.login({
        identifier: email,
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
        setError(res.message || "Failed to sign in. Please verify your credentials.");
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError(err.message || "Unable to connect to authentication server. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-panel">
      <div className="login-card">
        <Logo />

        <h1>Sign in to QMS</h1>
        <p>Enter your credentials to access the Quality Management System.</p>

        {error && (
          <div className="login-error-alert" role="alert">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submit}>
          {/* Email or Username */}
          <label>
            Email or username
            <input
              type="text"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="e.g. employee, processowner, or cdac email"
              autoComplete="username"
              disabled={loading}
              required
            />
          </label>

          {/* Password */}
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password (dummy: 1234)"
              autoComplete="current-password"
              disabled={loading}
              required
            />
          </label>

          {/* Remember Me */}
          <div className="login-options">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                disabled={loading}
              />
              Remember me
            </label>

            <button type="button" className="plain-button" tabIndex={-1}>
              Forgot password?
            </button>
          </div>

          {/* Role */}
          <RolePicker role={role} onChange={setRole} />

          {/* Login Button */}
          <button
            className="primary-button full"
            type="submit"
            disabled={!email || !password || !role || loading}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Signing in..." : "Continue to workspace"}
          </button>
        </form>

        {/* Demo Accounts Quick-Select */}
        <div className="demo-credentials-box">
          <span className="demo-title">Quick Demo Login (Password: 1234)</span>
          <div className="demo-chips">
            {DEMO_LOGINS.map((demo) => (
              <button
                type="button"
                key={demo.username}
                className="demo-chip"
                onClick={() => handleQuickFill(demo)}
                title={`Login as ${demo.label} (${demo.username} / 1234)`}
              >
                {demo.label}
              </button>
            ))}
          </div>
        </div>

        <small className="login-footnote">
          C-DAC Quality Management System
        </small>
      </div>
    </div>
  );
}
