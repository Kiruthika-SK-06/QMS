// Frontend service for User Management (MongoDB via Express API)
const API_BASE = "/api/users";

export const userService = {
  async fetchUsers() {
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      return data.users || [];
    } catch (err) {
      console.warn("userService.fetchUsers error:", err.message);
      return [];
    }
  },

  async getUser(id) {
    const res = await fetch(`${API_BASE}/${id}`);
    if (!res.ok) throw new Error("Failed to load user details");
    const data = await res.json();
    return data.user;
  },

  async createUser(userData, token) {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to create user");
    return data.user;
  },

  async updateUser(id, userData, token) {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update user");
    return data.user;
  },

  async deleteUser(id, token) {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "DELETE",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to delete user");
    return true;
  }
};

export default userService;
