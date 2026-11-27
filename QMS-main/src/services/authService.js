// Authentication service communicating directly with QMS Express Backend APIs (MongoDB)
const API_BASE = "/api/auth";

const getAuthHeaders = () => {
  const token = localStorage.getItem("qms_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const authService = {
  /**
   * Authenticate user against MongoDB via Express API
   */
  async login({ identifier, password, role }) {
    const cleanId = (identifier || "").trim().toLowerCase();
    const cleanPass = (password || "").trim();
    const cleanRole = (role || "").trim();

    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ identifier: cleanId, password: cleanPass, role: cleanRole })
    });

    let data = null;
    try {
      data = await res.json();
    } catch {
      throw new Error("Invalid response from authentication server");
    }

    if (!res.ok || !data?.success) {
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
    const res = await fetch(`${API_BASE}/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${activeToken}`
      }
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Session expired");
    }

    return data;
  },

  /**
   * Verify 6-digit OTP code for Account Activation
   */
  async verifyActivationOtp({ email, code }) {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanCode = (code || "").trim();

    const res = await fetch(`${API_BASE}/verify-activation-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanEmail, code: cleanCode, otp: cleanCode })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Invalid or expired activation code.");
    }

    return data;
  },

  /**
   * Activate account and set initial user password in MongoDB
   */
  async activateAccount({ email, activationToken, password, confirmPassword }) {
    const cleanEmail = (email || "").trim().toLowerCase();

    const res = await fetch(`${API_BASE}/activate-account`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: cleanEmail,
        activationToken,
        password,
        confirmPassword
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to activate account.");
    }

    return data;
  },

  /**
   * Resend activation OTP code with cooldown
   */
  async resendActivationOtp(email) {
    const cleanEmail = (email || "").trim().toLowerCase();

    const res = await fetch(`${API_BASE}/resend-activation-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanEmail })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to resend activation code.");
    }

    return data;
  },

  /**
   * Request 6-digit OTP verification email for Password Reset
   */
  async forgotPassword(email) {
    const cleanEmail = (email || "").trim().toLowerCase();

    const res = await fetch(`${API_BASE}/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanEmail, identifier: cleanEmail })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to process forgot password request.");
    }

    return data;
  },

  /**
   * Verify 6-digit OTP code for Password Reset
   */
  async verifyOtp({ email, code }) {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanCode = (code || "").trim();

    const res = await fetch(`${API_BASE}/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanEmail, code: cleanCode, otp: cleanCode })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Invalid or expired verification code.");
    }

    return data;
  },

  /**
   * Resend password reset OTP code (with cooldown)
   */
  async resendOtp(email) {
    const cleanEmail = (email || "").trim().toLowerCase();

    const res = await fetch(`${API_BASE}/resend-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanEmail })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to resend code.");
    }

    return data;
  },

  /**
   * Reset password in MongoDB
   */
  async resetPassword({ email, verificationToken, newPassword, confirmPassword }) {
    const cleanEmail = (email || "").trim().toLowerCase();

    const res = await fetch(`${API_BASE}/reset-password`, {
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

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to reset password.");
    }

    return data;
  },

  /**
   * Change password for authenticated user
   */
  async changePassword({ currentPassword, newPassword, confirmPassword }) {
    const res = await fetch(`${API_BASE}/change-password`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmPassword
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to change password.");
    }

    return data;
  },

  /**
   * Sign out and clear session
   */
  async logout() {
    try {
      await fetch(`${API_BASE}/logout`, { method: "POST", headers: getAuthHeaders() });
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem("qms_token");
      localStorage.removeItem("qms_user");
    }
  }
};

export default authService;
