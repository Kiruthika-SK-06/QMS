// Authentication service communicating directly with QMS Express Backend APIs (MongoDB)
const API_BASE = "/api/auth";

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
      throw new Error("Invalid response from server");
    }

    if (!res.ok || !data?.success) {
      throw new Error(data?.message || "Authentication failed. Please verify your credentials.");
    }

    return data;
  },

  /**
   * Verify token and fetch current user profile
   */
  async getMe(token) {
    const res = await fetch(`${API_BASE}/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Session expired");
    }

    return data;
  },

  /**
   * Fetch demo/controlled users list from database
   */
  async getDemoUsers() {
    try {
      const res = await fetch(`${API_BASE}/demo-users`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.users || [];
    } catch {
      return [];
    }
  },

  /**
   * Request 6-digit OTP verification email
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
   * Verify 6-digit OTP code against backend
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
   * Resend verification OTP code (with cooldown)
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
  async resetPassword({ email, verificationToken, code, newPassword, confirmPassword }) {
    const cleanEmail = (email || "").trim().toLowerCase();

    const res = await fetch(`${API_BASE}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: cleanEmail,
        identifier: cleanEmail,
        verificationToken,
        code,
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
   * Sign out
   */
  async logout() {
    try {
      await fetch(`${API_BASE}/logout`, { method: "POST" });
    } catch {
      // Ignore network errors on logout
    }
  }
};

export default authService;
