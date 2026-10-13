// Frontend service for User Management (Add, Edit, View, Privileges)
import { initialUsersList } from "../data/mockData";

const API_BASE = "/api/users";

export const userService = {
  async fetchUsers() {
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      return data.users || initialUsersList;
    } catch {
      return initialUsersList;
    }
  },

  async getUser(id) {
    try {
      const res = await fetch(`${API_BASE}/${id}`);
      if (!res.ok) throw new Error("Failed to load user details");
      const data = await res.json();
      return data.user;
    } catch (err) {
      const local = initialUsersList.find((u) => u.id === id || u.employeeId === id);
      if (local) return local;
      throw err;
    }
  },

  async createUser(userData, token) {
    try {
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
    } catch (err) {
      if (!err.message?.includes("Failed to create")) throw err;
      // Client-side fallback
      const newUser = {
        ...userData,
        id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
        initials: userData.name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        joinDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        status: userData.status || "Active"
      };
      return newUser;
    }
  },

  async updateUser(id, userData, token) {
    try {
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
    } catch (err) {
      throw err;
    }
  },

  async toggleUserStatus(id, token) {
    try {
      const res = await fetch(`${API_BASE}/${id}/status`, {
        method: "PATCH",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update user status");
      return data.user;
    } catch (err) {
      throw err;
    }
  },

  async deleteUser(id, token) {
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete user");
      return true;
    } catch (err) {
      throw err;
    }
  }
};
