// Authentication service communicating directly with QMS Express Backend APIs (MongoDB)
const API_BASE = "/api/auth";
const DIRECT_API_BASE = "http://127.0.0.1:5000/api/auth";

const getAuthHeaders = () => {
  const token = localStorage.getItem("qms_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

/**
 * Robust fetch wrapper that queries the local proxy first and seamlessly
 * falls back to direct backend API port 5000 if proxy returns non-JSON or fails.
 */
const safeFetchAuth = async (endpoint, options = {}) => {
  // 1. Try relative URL via Vite dev server proxy
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, options);
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await res.json();
      return { ok: res.ok, status: res.status, data };
    }
  } catch {
    // If proxy connection fails, try direct backend URL
  }

  // 2. Direct fallback to local backend server (only on localhost)
  const isLocal = typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  if (isLocal) {
    try {
      const res = await fetch(`${DIRECT_API_BASE}${endpoint}`, options);
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        return { ok: res.ok, status: res.status, data };
      }
    } catch {
      // Local fallback failed
    }
  }

  throw new Error("Unable to connect to QMS authentication server. Please ensure MongoDB and backend server are running.");
};

export const authService = {
  /**
   * Authenticate user against MongoDB via Express API
   */
  async login({ identifier, password, role }) {
    const cleanId = (identifier || "").trim().toLowerCase();
    const cleanPass = (password || "").trim();
    const cleanRole = (role || "").trim();

    const { ok, data } = await safeFetchAuth("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ identifier: cleanId, password: cleanPass, role: cleanRole })
    });

    if (!ok || !data?.success) {
      const error = new Error(data?.message || "Authentication failed. Please verify your credentials.");
      error.code = data?.code;
      error.email = data?.email || cleanId;
      throw error;
    }

    return data;
  },

  /**
   * Verify token and fetch current user profile from MongoDB
   */
  async getMe(token) {
    const activeToken = token || localStorage.getItem("qms_token");
    const { ok, data } = await safeFetchAuth("/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${activeToken}`
      }
    });

    if (!ok) {
      throw new Error(data?.message || "Session expired");
    }

    return data;
  },

  /**
   * Verify 6-digit OTP code for Account Activation
   */
  async verifyActivationOtp({ email, code }) {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanCode = (code || "").trim();

    const { ok, data } = await safeFetchAuth("/verify-activation-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanEmail, code: cleanCode, otp: cleanCode })
    });

    if (!ok) {
      throw new Error(data?.message || "Invalid or expired activation code.");
    }

    return data;
  },

  /**
   * Activate account and set initial user password in MongoDB
   */
  async activateAccount({ email, activationToken, password, confirmPassword }) {
    const cleanEmail = (email || "").trim().toLowerCase();

    const { ok, data } = await safeFetchAuth("/activate-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: cleanEmail,
        activationToken,
        password,
        confirmPassword
      })
    });

    if (!ok) {
      throw new Error(data?.message || "Failed to activate account.");
    }

    return data;
  },

  /**
   * Resend activation OTP code with cooldown
   */
  async resendActivationOtp(email) {
    const cleanEmail = (email || "").trim().toLowerCase();

    const { ok, data } = await safeFetchAuth("/resend-activation-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanEmail })
    });

    if (!ok) {
      throw new Error(data?.message || "Failed to resend activation code.");
    }

    return data;
  },

  /**
   * Request 6-digit OTP verification email for Password Reset
   */
  async forgotPassword(email) {
    const cleanEmail = (email || "").trim().toLowerCase();

    const { ok, data } = await safeFetchAuth("/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanEmail, identifier: cleanEmail })
    });

    if (!ok) {
      throw new Error(data?.message || "Failed to process forgot password request.");
    }

    return data;
  },

  /**
   * Verify 6-digit OTP code for Password Reset
   */
  async verifyOtp({ email, code }) {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanCode = (code || "").trim();

    const { ok, data } = await safeFetchAuth("/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanEmail, code: cleanCode, otp: cleanCode })
    });

    if (!ok) {
      throw new Error(data?.message || "Invalid or expired verification code.");
    }

    return data;
  },

  /**
   * Resend password reset OTP code (with cooldown)
   */
  async resendOtp(email) {
    const cleanEmail = (email || "").trim().toLowerCase();

    const { ok, data } = await safeFetchAuth("/resend-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanEmail })
    });

    if (!ok) {
      throw new Error(data?.message || "Failed to resend code.");
    }

    return data;
  },

  /**
   * Reset password in MongoDB
   */
  async resetPassword({ email, verificationToken, newPassword, confirmPassword }) {
    const cleanEmail = (email || "").trim().toLowerCase();

    const { ok, data } = await safeFetchAuth("/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: cleanEmail,
        identifier: cleanEmail,
        verificationToken,
        newPassword,
        confirmPassword
      })
    });

    if (!ok) {
      throw new Error(data?.message || "Failed to reset password.");
    }

    return data;
  },

  /**
   * Change password for authenticated user
   */
  async changePassword({ currentPassword, newPassword, confirmPassword }) {
    const { ok, data } = await safeFetchAuth("/change-password", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmPassword
      })
    });

    if (!ok) {
      throw new Error(data?.message || "Failed to change password.");
    }

    return data;
  },

  /**
   * Sign out and clear session
   */
  async logout() {
    try {
      await safeFetchAuth("/logout", { method: "POST", headers: getAuthHeaders() });
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem("qms_token");
      localStorage.removeItem("qms_user");
    }
  }
};

export default authService;
