import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  users,
  initialDocuments,
  initialTasks,
  initialNotifications,
  processes as initialProcesses,
  employees as initialEmployees,
  activities as initialActivities
} from "../data/mockData";
import { authService } from "../services/authService";
import { documentService } from "../services/documentService";
import { taskService } from "../services/taskService";
import { notificationService } from "../services/notificationService";
import { processService } from "../services/processService";

const AppContext = createContext(null);

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("qms_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem("qms_token") || null);
  const [documents, setDocuments] = useState(initialDocuments);
  const [tasks, setTasks] = useState(initialTasks);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [processes, setProcesses] = useState(initialProcesses);
  const [employees, setEmployees] = useState(initialEmployees);
  const [activities, setActivities] = useState(initialActivities);
  const [headOverview, setHeadOverview] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch all live data from backend APIs
  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [docs, tsks, notifs, procs, emps, acts, headData] = await Promise.allSettled([
        documentService.fetchDocuments(),
        taskService.fetchTasks(),
        notificationService.fetchNotifications(token),
        processService.fetchProcesses(),
        processService.fetchEmployees(),
        processService.fetchActivities(),
        processService.fetchHeadOverview()
      ]);

      if (docs.status === "fulfilled" && Array.isArray(docs.value)) {
        setDocuments(docs.value);
      }
      if (tsks.status === "fulfilled" && Array.isArray(tsks.value)) {
        setTasks(tsks.value);
      }
      if (notifs.status === "fulfilled" && Array.isArray(notifs.value?.notifications)) {
        setNotifications(notifs.value.notifications);
      }
      if (procs.status === "fulfilled" && Array.isArray(procs.value)) {
        setProcesses(procs.value);
      }
      if (emps.status === "fulfilled" && Array.isArray(emps.value)) {
        setEmployees(emps.value);
      }
      if (acts.status === "fulfilled" && Array.isArray(acts.value)) {
        setActivities(acts.value);
      }
      if (headData.status === "fulfilled" && headData.value) {
        setHeadOverview(headData.value);
      }
    } catch (err) {
      console.warn("Could not sync with backend, using cached state:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Synchronize session and load data on mount or token change
  useEffect(() => {
    if (token) {
      if (!currentUser) {
        authService
          .getMe(token)
          .then((res) => {
            if (res?.user) {
              setCurrentUser(res.user);
              localStorage.setItem("qms_user", JSON.stringify(res.user));
            }
          })
          .catch(() => {
            logout();
          });
      }
      refreshData();
    } else {
      // Even without login, load public demo data from backend
      refreshData();
    }
  }, [token]);

  // Login handler accepting user object and token from backend
  const loginUser = (user, authToken) => {
    setCurrentUser(user);
    if (authToken) {
      setToken(authToken);
      localStorage.setItem("qms_token", authToken);
    }
    localStorage.setItem("qms_user", JSON.stringify(user));
  };

  // Legacy fallback login handler by role
  const login = (role) => {
    const user = users[role];
    if (user) {
      loginUser(user, null);
    }
  };

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem("qms_user");
    localStorage.removeItem("qms_token");
  };

  // Create new task via backend API
  const addTask = async (taskData) => {
    try {
      const created = await taskService.createTask(taskData, token);
      setTasks((items) => [created, ...items]);
      // Refresh activities & notifications
      refreshData();
      return created;
    } catch (err) {
      console.error("addTask failed, falling back to local:", err);
      const fallbackTask = {
        ...taskData,
        id: `TASK-${String(tasks.length + 1).padStart(3, "0")}`,
        assigned: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        status: "Pending"
      };
      setTasks((items) => [fallbackTask, ...items]);
      return fallbackTask;
    }
  };

  // Update task status (Pending, In Progress, Completed)
  const updateTaskStatus = async (id, status) => {
    try {
      const updated = await taskService.updateTaskStatus(id, status, token);
      setTasks((items) => items.map((t) => (t.id === id ? updated : t)));
      refreshData();
      return updated;
    } catch (err) {
      console.error("updateTaskStatus failed, falling back to local:", err);
      setTasks((items) => items.map((t) => (t.id === id ? { ...t, status } : t)));
    }
  };

  // Update task details (title, description, employee, process, due date, etc.)
  const updateTask = async (id, taskData) => {
    try {
      const updated = await taskService.updateTask(id, taskData, token);
      setTasks((items) => items.map((t) => (t.id === id ? updated : t)));
      refreshData();
      return updated;
    } catch (err) {
      console.error("updateTask failed, falling back to local:", err);
      setTasks((items) => items.map((t) => (t.id === id ? { ...t, ...taskData } : t)));
    }
  };

  // Delete task
  const deleteTask = async (id) => {
    try {
      await taskService.deleteTask(id, token);
      setTasks((items) => items.filter((t) => t.id !== id));
      refreshData();
    } catch (err) {
      console.error("deleteTask failed:", err);
      setTasks((items) => items.filter((t) => t.id !== id));
    }
  };

  // Create / upload new document
  const createDocument = async (docData) => {
    try {
      const created = await documentService.createDocument(docData, token);
      setDocuments((items) => [created, ...items]);
      refreshData();
      return created;
    } catch (err) {
      console.error("createDocument failed:", err);
      throw err;
    }
  };

  // Create new document version
  const addVersion = async (id, notes = "") => {
    try {
      const updated = await documentService.createVersion(id, notes, token);
      setDocuments((items) => items.map((doc) => (doc.id === id ? updated : doc)));
      refreshData();
      return updated;
    } catch (err) {
      console.error("addVersion failed, falling back to local:", err);
      setDocuments((items) =>
        items.map((document) => {
          if (document.id !== id) return document;
          const nextVersion = `${(parseFloat(document.version) + 1.0).toFixed(1)}`;
          const dateStr = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
          return {
            ...document,
            version: nextVersion,
            updated: dateStr,
            updatedBy: currentUser?.name || "Process Owner",
            status: "Draft",
            versions: [
              {
                version: nextVersion,
                date: dateStr,
                author: currentUser?.name || "Process Owner",
                status: "Current"
              },
              ...document.versions.map((v) => ({ ...v, status: "Archived" }))
            ]
          };
        })
      );
    }
  };

  // Update document review status (Under Review, Approved, Changes Requested)
  const updateDocumentStatus = async (id, status, comments = "") => {
    try {
      const updated = await documentService.updateDocumentStatus(id, status, comments, token);
      setDocuments((items) => items.map((doc) => (doc.id === id ? updated : doc)));
      refreshData();
      return updated;
    } catch (err) {
      console.error("updateDocumentStatus failed, falling back to local:", err);
      setDocuments((items) =>
        items.map((document) => (document.id === id ? { ...document, status, reviewComments: comments } : document))
      );
    }
  };

  // Download document extract
  const downloadDocument = (id) => {
    documentService.downloadDocument(id);
  };

  // Delete controlled document
  const deleteDocument = async (id) => {
    try {
      await documentService.deleteDocument(id, token);
      setDocuments((items) => items.filter((d) => d.id !== id));
      refreshData();
    } catch (err) {
      console.error("deleteDocument failed:", err);
      setDocuments((items) => items.filter((d) => d.id !== id));
    }
  };

  // Update / edit controlled document or template
  const updateDocument = async (id, docData) => {
    try {
      const updated = await documentService.updateDocument(id, docData, token);
      setDocuments((items) => items.map((doc) => (doc.id === id ? updated : doc)));
      refreshData();
      return updated;
    } catch (err) {
      console.error("updateDocument failed, falling back to local:", err);
      setDocuments((items) =>
        items.map((doc) => (doc.id === id ? { ...doc, ...docData } : doc))
      );
    }
  };

  // Mark single notification read
  const markNotificationRead = async (id) => {
    try {
      await notificationService.markRead(id);
      setNotifications((items) =>
        items.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      setNotifications((items) =>
        items.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    }
  };

  // Mark all notifications read
  const markAllNotificationsRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((items) => items.map((n) => ({ ...n, read: true })));
    } catch {
      setNotifications((items) => items.map((n) => ({ ...n, read: true })));
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        token,
        documents,
        tasks,
        notifications,
        processes,
        employees,
        activities,
        headOverview,
        loading,
        login,
        loginUser,
        logout,
        addTask,
        updateTask,
        updateTaskStatus,
        deleteTask,
        createDocument,
        deleteDocument,
        updateDocument,
        addVersion,
        updateDocumentStatus,
        downloadDocument,
        markNotificationRead,
        markAllNotificationsRead,
        refreshData
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
