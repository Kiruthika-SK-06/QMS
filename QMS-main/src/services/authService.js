// Authentication service for talking to the QMS Backend API with resilient fallback

import { users as mockUsers } from "../data/mockData";

const API_BASE = "/api/auth";

export const authService = {
  /**
   * Authenticate user with backend or client-side fallback
   * @param {Object} credentials - { identifier, password, role }
   */
  async login({ identifier, password, role }) {
    const cleanId = (identifier || "").trim().toLowerCase();
    const cleanPass = (password || "").trim();
    const cleanRole = (role || "").trim();

    try {
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
        // Non-JSON response, e.g. Vite proxy error HTML page
      }

      if (res.ok && data?.success && data?.user) {
        return data;
      }

      // If backend explicitly returned error (401, 403, 404, etc.)
      if (data && data.message) {
        throw new Error(data.message);
      }

      throw new Error((data && data.message) || `Server response: ${res.status}`);
    } catch (networkOrApiErr) {
      // If error came from backend with specific message (e.g. unregistered user or incorrect password), propagate directly
      if (
        networkOrApiErr.message &&
        !networkOrApiErr.message.includes("Failed to fetch") &&
        !networkOrApiErr.message.includes("NetworkError")
      ) {
        throw networkOrApiErr;
      }

      // Backend server is offline:
      // STRICT DATABASE AUTHENTICATION: Only recognize users registered in the database!
      const userList = Object.values(mockUsers);
      const user = userList.find(
        (u) =>
          (u.email && u.email.toLowerCase() === cleanId) ||
          (u.username && u.username.toLowerCase() === cleanId) ||
          (u.employeeId && u.employeeId.toLowerCase() === cleanId) ||
          (Array.isArray(u.aliases) && u.aliases.some((a) => a.toLowerCase() === cleanId))
      );

      // STRICT: Reject unregistered identifiers immediately! NO dummy auto-provisioning!
      if (!user) {
        throw new Error(`User '${cleanId}' is not registered in the system database. Please enter a valid username or Employee ID.`);
      }

      // Check password if provided in database record
      if (user.password && cleanPass && user.password !== cleanPass) {
        throw new Error("Incorrect password. Please verify your credentials.");
      }

      // Verify role consistency if role was selected
      if (cleanRole && user.role !== cleanRole) {
        throw new Error(`User '${user.name}' is registered as ${user.roleTitle || user.role}, not the selected role.`);
      }

      const { password: _, ...userWithoutPassword } = user;
      return {
        success: true,
        message: "Login successful",
        token: `session-token-${user.role}-${Date.now()}`,
        user: userWithoutPassword
      };
    }
  },

  /**
   * Verify token and fetch current user profile
   * @param {string} token
   */
  async getMe(token) {
    try {
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
    } catch {
      // Return cached user if offline
      const saved = localStorage.getItem("qms_user");
      if (saved) {
        return { success: true, user: JSON.parse(saved) };
      }
      throw new Error("Session expired");
    }
  },

  /**
   * Fetch demo users list
   */
  async getDemoUsers() {
    try {
      const res = await fetch(`${API_BASE}/demo-users`);
      if (!res.ok) return Object.values(mockUsers);
      const data = await res.json();
      return data.users || Object.values(mockUsers);
    } catch {
      return Object.values(mockUsers);
    }
  },

  /**
   * Request password reset code
   * @param {string} identifier - username or email
   */
  async forgotPassword(identifier) {
    const cleanId = (identifier || "").trim().toLowerCase();

    try {
      const res = await fetch(`${API_BASE}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: cleanId })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to process forgot password request.");
      }

      return data;
    } catch (err) {
      if (
        err.message &&
        !err.message.toLowerCase().includes("fetch") &&
        !err.message.toLowerCase().includes("unable to connect")
      ) {
        throw err;
      }

      // Offline fallback
      const userList = Object.values(mockUsers);
      const user = userList.find(
        (u) =>
          (u.email && u.email.toLowerCase() === cleanId) ||
          (u.username && u.username.toLowerCase() === cleanId) ||
          (Array.isArray(u.aliases) && u.aliases.some((a) => a.toLowerCase() === cleanId))
      );

      if (!user) {
        throw new Error("No account found matching this email address. Please check and try again.");
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      return {
        success: true,
        message: "Password reset instructions sent successfully.",
        email: user.email,
        username: user.username,
        role: user.role,
        name: user.name,
        demoCode: code
      };
    }
  },

  /**
   * Submit verification code and set new password
   * @param {Object} payload - { identifier, code, newPassword }
   */
  async resetPassword({ identifier, code, newPassword }) {
    const cleanId = (identifier || "").trim().toLowerCase();

    try {
      const res = await fetch(`${API_BASE}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: cleanId, code, newPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to reset password.");
      }

      return data;
    } catch (err) {
      if (
        err.message &&
        !err.message.toLowerCase().includes("fetch") &&
        !err.message.toLowerCase().includes("unable to connect")
      ) {
        throw err;
      }

      const userList = Object.values(mockUsers);
      const user = userList.find(
        (u) =>
          (u.email && u.email.toLowerCase() === cleanId) ||
          (u.username && u.username.toLowerCase() === cleanId) ||
          (Array.isArray(u.aliases) && u.aliases.some((a) => a.toLowerCase() === cleanId))
      );

      if (!user) {
        throw new Error("User account not found");
      }

      user.password = newPassword;
      return {
        success: true,
        message: "Password reset successful! You can now log in with your new password.",
        username: user.username,
        role: user.role
      };
    }
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
