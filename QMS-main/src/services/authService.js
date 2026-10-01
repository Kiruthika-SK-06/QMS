// Authentication service for talking to the QMS Backend API

const API_BASE = "/api/auth";

export const authService = {
  /**
   * Authenticate user with backend
   * @param {Object} credentials - { identifier, password, role }
   */
  async login({ identifier, password, role }) {
    let res;
    try {
      res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ identifier, password, role })
      });
    } catch (networkErr) {
      throw new Error("Unable to connect to backend server. Make sure the backend is running on port 5000.");
    }

    let data;
    try {
      data = await res.json();
    } catch (parseErr) {
      if (!res.ok) {
        throw new Error(
          `Backend server is not responding (HTTP ${res.status}). Please make sure the backend server is running in a separate terminal: npm run dev:backend`
        );
      }
      throw new Error("Unexpected response from server.");
    }

    if (!res.ok) {
      throw new Error(data.message || "Failed to sign in. Please check your credentials.");
    }

    return data;
  },

  /**
   * Verify token and fetch current user profile
   * @param {string} token
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
   * Fetch demo users list
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
