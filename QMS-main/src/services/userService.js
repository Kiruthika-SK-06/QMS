// Frontend service for User Management (MongoDB via Express API)
const API_BASE = "/api/users";

const getHeaders = (token) => {
  const activeToken = token || localStorage.getItem("qms_token");
  return {
    "Content-Type": "application/json",
    ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {})
  };
};

export const userService = {
  async fetchUsers(token) {
    const res = await fetch(API_BASE, {
      headers: getHeaders(token)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to load users from database");
    return data.users || [];
  },

  async getUser(id, token) {
    const res = await fetch(`${API_BASE}/${id}`, {
      headers: getHeaders(token)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to load user details");
    return data.user;
  },

  async createUser(userData, token) {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to invite user");
    return data;
  },

  async updateUser(id, userData, token) {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "PUT",
      headers: getHeaders(token),
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update user");
    return data.user;
  },

  async toggleUserStatus(id, token) {
    const res = await fetch(`${API_BASE}/${id}/status`, {
      method: "PATCH",
      headers: getHeaders(token)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update user status");
    return data.user;
  },

  async deleteUser(id, token) {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "DELETE",
      headers: getHeaders(token)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to delete user");
    return true;
  }
};

export default userService;
