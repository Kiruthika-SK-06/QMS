import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  users,
  initialDocuments,
  initialTasks,
  initialNotifications,
  processes as initialProcesses,
  employees as initialEmployees,
  initialUsersList,
  initialMRMList,
  activities as initialActivities
} from "../data/mockData";
import { authService } from "../services/authService";
import { documentService } from "../services/documentService";
import { taskService } from "../services/taskService";
import { notificationService } from "../services/notificationService";
import { processService } from "../services/processService";
import { userService } from "../services/userService";
import { mrmService } from "../services/mrmService";

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
  const [usersList, setUsersList] = useState(initialUsersList);
  const [mrmList, setMrmList] = useState(initialMRMList);
  const [activities, setActivities] = useState(initialActivities);
  const [headOverview, setHeadOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(() => new Date());

  // Silent background fetch that updates live data without full-page loading indicators
  const silentRefresh = useCallback(async () => {
    try {
      const [docs, tsks, notifs, procs, emps, acts, headData, liveUsers, liveMRMs] = await Promise.allSettled([
        documentService.fetchDocuments(),
        taskService.fetchTasks(),
        notificationService.fetchNotifications(token),
        processService.fetchProcesses(),
        processService.fetchEmployees(),
        processService.fetchActivities(),
        processService.fetchHeadOverview(),
        userService.fetchUsers(),
        mrmService.fetchMRMs()
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
      if (liveUsers.status === "fulfilled" && Array.isArray(liveUsers.value)) {
        setUsersList(liveUsers.value);
      }
      if (liveMRMs.status === "fulfilled" && Array.isArray(liveMRMs.value)) {
        setMrmList(liveMRMs.value);
      }
      setLastSyncTime(new Date());
    } catch (err) {
      console.warn("Silent sync notice:", err);
    }
  }, [token]);

  // Initial and manual refresh with loading indicator
  const refreshData = useCallback(async () => {
    setLoading(true);
    await silentRefresh();
    setLoading(false);
  }, [silentRefresh]);

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
      refreshData();
    }
  }, [token]);

  // Real-Time EventSource (SSE) Subscription & Live Polling Heartbeat
  useEffect(() => {
    let sse = null;
    let heartbeat = null;

    try {
      sse = new EventSource("/api/realtime/stream");

      sse.onopen = () => {
        setIsRealtimeConnected(true);
      };

      sse.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type !== "HEARTBEAT") {
            silentRefresh();
          }
        } catch {
          silentRefresh();
        }
      };

      sse.onerror = () => {
        setIsRealtimeConnected(false);
      };
    } catch {
      setIsRealtimeConnected(false);
    }

    // High-performance real-time 4-second sync heartbeat backup
    heartbeat = setInterval(() => {
      silentRefresh();
    }, 4000);

    const handleFocus = () => silentRefresh();
    window.addEventListener("focus", handleFocus);

    return () => {
      if (sse) sse.close();
      if (heartbeat) clearInterval(heartbeat);
      window.removeEventListener("focus", handleFocus);
    };
  }, [silentRefresh]);

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

  // ==================== USER MANAGEMENT ACTIONS ====================
  const addUser = async (userData) => {
    try {
      const created = await userService.createUser(userData, token);
      setUsersList((prev) => [created, ...prev]);
      refreshData();
      return created;
    } catch (err) {
      console.error("addUser failed, fallback to local:", err);
      const fallbackUser = {
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
      setUsersList((prev) => [fallbackUser, ...prev]);
      return fallbackUser;
    }
  };

  const updateUser = async (id, userData) => {
    try {
      const updated = await userService.updateUser(id, userData, token);
      setUsersList((prev) => prev.map((u) => (u.id === id || u.employeeId === id ? updated : u)));
      refreshData();
      return updated;
    } catch (err) {
      console.error("updateUser failed, fallback to local:", err);
      setUsersList((prev) =>
        prev.map((u) => (u.id === id || u.employeeId === id ? { ...u, ...userData } : u))
      );
    }
  };

  const toggleUserStatus = async (id) => {
    try {
      const updated = await userService.toggleUserStatus(id, token);
      setUsersList((prev) => prev.map((u) => (u.id === id || u.employeeId === id ? updated : u)));
      refreshData();
      return updated;
    } catch (err) {
      console.error("toggleUserStatus failed, fallback to local:", err);
      setUsersList((prev) =>
        prev.map((u) => {
          if (u.id === id || u.employeeId === id) {
            return { ...u, status: u.status === "Active" ? "Inactive" : "Active" };
          }
          return u;
        })
      );
    }
  };

  const deleteUser = async (id) => {
    try {
      await userService.deleteUser(id, token);
      setUsersList((prev) => prev.filter((u) => u.id !== id && u.employeeId !== id));
      refreshData();
    } catch (err) {
      console.error("deleteUser failed:", err);
      setUsersList((prev) => prev.filter((u) => u.id !== id && u.employeeId !== id));
    }
  };

  // ==================== MRM (MANAGEMENT REVIEW MEETING) ACTIONS ====================
  const addMRM = async (mrmData) => {
    try {
      const created = await mrmService.createMRM(mrmData, token);
      setMrmList((prev) => [created, ...prev]);
      refreshData();
      return created;
    } catch (err) {
      console.error("addMRM failed, fallback to local:", err);
      const isSched = !!mrmData.scheduledDate;
      const fallbackMRM = {
        ...mrmData,
        id: `MRM-${new Date().getFullYear()}-${String(mrmList.length + 1).padStart(3, "0")}`,
        version: "1.0",
        versionHistory: [],
        status: isSched ? "Scheduled" : "Planned",
        mom: null,
        trustHeadApproval: null,
        sharedWithAll: false,
        acknowledgements: [],
        timeline: [
          {
            action: isSched ? "Meeting Planned & Scheduled" : "Meeting Planned",
            actor: mrmData.plannedBy || currentUser?.name || "QMS Coordinator",
            timestamp: new Date().toLocaleString(),
            version: "1.0",
            details: isSched ? `Scheduled for ${mrmData.scheduledDate}` : "Meeting plan created"
          }
        ]
      };
      setMrmList((prev) => [fallbackMRM, ...prev]);
      return fallbackMRM;
    }
  };

  const scheduleMRM = async (id, scheduleData) => {
    try {
      const updated = await mrmService.scheduleMRM(id, scheduleData, token);
      setMrmList((prev) => prev.map((m) => (m.id === id ? updated : m)));
      refreshData();
      return updated;
    } catch (err) {
      console.error("scheduleMRM failed, fallback to local:", err);
      let localUpdated = null;
      setMrmList((prev) =>
        prev.map((m) => {
          if (m.id !== id) return m;
          localUpdated = {
            ...m,
            ...scheduleData,
            status: "Scheduled",
            timeline: [
              ...(m.timeline || []),
              {
                action: "Meeting Scheduled",
                actor: currentUser?.name || "QMS Coordinator",
                timestamp: new Date().toLocaleString(),
                version: m.version || "1.0",
                details: `Scheduled for ${scheduleData.scheduledDate} at ${scheduleData.scheduledTime || "10:00 AM"}`
              }
            ]
          };
          return localUpdated;
        })
      );
      return localUpdated;
    }
  };

  const updateMRM = async (id, data) => {
    try {
      const updated = await mrmService.updateMRM(id, data, token);
      setMrmList((prev) => prev.map((m) => (m.id === id ? updated : m)));
      refreshData();
      return updated;
    } catch (err) {
      console.error("updateMRM failed:", err);
      let localUpdated = null;
      setMrmList((prev) =>
        prev.map((m) => {
          if (m.id === id) {
            localUpdated = { ...m, ...data };
            return localUpdated;
          }
          return m;
        })
      );
      return localUpdated;
    }
  };

  const saveMoM = async (id, momData) => {
    try {
      const updated = await mrmService.saveMoM(id, momData, token);
      setMrmList((prev) => prev.map((m) => (m.id === id ? updated : m)));
      refreshData();
      return updated;
    } catch (err) {
      console.error("saveMoM failed, fallback to local:", err);
      let localUpdated = null;
      setMrmList((prev) =>
        prev.map((m) => {
          if (m.id === id) {
            localUpdated = {
              ...m,
              mom: {
                ...momData,
                recordedBy: currentUser?.name || "QMS Coordinator",
                recordedDate: new Date().toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric"
                })
              },
              status: "MoM Recorded"
            };
            return localUpdated;
          }
          return m;
        })
      );
      return localUpdated;
    }
  };

  const uploadMoMDocument = async (id, payload) => {
    try {
      const updated = await mrmService.uploadMoMDocument(id, payload, token);
      setMrmList((prev) => prev.map((m) => (m.id === id ? updated : m)));
      refreshData();
      return updated;
    } catch (err) {
      console.error("uploadMoMDocument failed, fallback to local:", err);
      let localUpdated = null;
      setMrmList((prev) =>
        prev.map((m) => {
          if (m.id === id) {
            const author = currentUser?.name || "QMS Coordinator";
            localUpdated = {
              ...m,
              mom: {
                recordedBy: author,
                recordedDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
                summary: payload.summary || "Meeting conducted successfully. MoM uploaded.",
                discussionPoints: payload.discussionPoints || [],
                actionItems: payload.actionItems || [],
                decisions: payload.decisions || []
              },
              momDocument: {
                documentId: `DOC-MOM-${new Date().getFullYear()}-001`,
                documentName: payload.documentName || `Minutes of Meeting - ${m.title}`,
                fileName: payload.fileName || `${m.id}_Minutes_of_Meeting.pdf`,
                fileSize: payload.fileSize || "1.4 MB",
                uploadedBy: author,
                uploadedAt: new Date().toLocaleString()
              },
              status: "MoM Document Uploaded",
              meetingDone: true
            };
            return localUpdated;
          }
          return m;
        })
      );
      return localUpdated;
    }
  };

  const submitMRMForApproval = async (id) => {
    try {
      const updated = await mrmService.submitForApproval(id, token);
      setMrmList((prev) => prev.map((m) => (m.id === id ? updated : m)));
      refreshData();
      return updated;
    } catch (err) {
      console.error("submitMRMForApproval failed, fallback to local:", err);
      let localUpdated = null;
      setMrmList((prev) =>
        prev.map((m) => {
          if (m.id === id) {
            localUpdated = {
              ...m,
              status: "Submitted for Approval",
              submittedForApprovalAt: new Date().toLocaleString()
            };
            return localUpdated;
          }
          return m;
        })
      );
      return localUpdated;
    }
  };

  const approveMRM = async (id, remarks = "") => {
    try {
      const updated = await mrmService.approveMRM(id, { remarks }, token);
      setMrmList((prev) => prev.map((m) => (m.id === id ? updated : m)));
      refreshData();
      return updated;
    } catch (err) {
      console.error("approveMRM failed, fallback to local:", err);
      setMrmList((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                status: "Approved",
                trustHeadApproval: {
                  decision: "Approved",
                  approved: true,
                  approvedBy: currentUser?.name || "Anita Rao (Trust Head)",
                  approvedAt: new Date().toLocaleString(),
                  remarks: remarks || "Approved without modifications.",
                  versionReviewed: m.version || "1.0"
                }
              }
            : m
        )
      );
    }
  };

  const requestChangesMRM = async (id, remarks) => {
    try {
      const updated = await mrmService.requestChangesMRM(id, { remarks }, token);
      setMrmList((prev) => prev.map((m) => (m.id === id ? updated : m)));
      refreshData();
      return updated;
    } catch (err) {
      console.error("requestChangesMRM failed, fallback to local:", err);
      setMrmList((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                status: "Changes Requested",
                trustHeadApproval: {
                  decision: "Changes Requested",
                  approved: false,
                  approvedBy: currentUser?.name || "Anita Rao (Trust Head)",
                  approvedAt: new Date().toLocaleString(),
                  remarks,
                  versionReviewed: m.version || "1.0"
                }
              }
            : m
        )
      );
    }
  };

  const rejectMRM = async (id, reason) => {
    try {
      const updated = await mrmService.rejectMRM(id, { reason }, token);
      setMrmList((prev) => prev.map((m) => (m.id === id ? updated : m)));
      refreshData();
      return updated;
    } catch (err) {
      console.error("rejectMRM failed, fallback to local:", err);
      setMrmList((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                status: "Rejected",
                trustHeadApproval: {
                  decision: "Rejected",
                  approved: false,
                  rejected: true,
                  approvedBy: currentUser?.name || "Anita Rao (Trust Head)",
                  approvedAt: new Date().toLocaleString(),
                  remarks: reason,
                  versionReviewed: m.version || "1.0"
                }
              }
            : m
        )
      );
    }
  };

  const resubmitMRM = async (id, mom, revisionNotes) => {
    try {
      const updated = await mrmService.resubmitMRM(id, { mom, revisionNotes }, token);
      setMrmList((prev) => prev.map((m) => (m.id === id ? updated : m)));
      refreshData();
      return updated;
    } catch (err) {
      console.error("resubmitMRM failed, fallback to local:", err);
      setMrmList((prev) =>
        prev.map((m) => {
          if (m.id !== id) return m;
          const nextVer = (parseFloat(m.version || "1.0") + 0.1).toFixed(1);
          const history = m.versionHistory || [];
          return {
            ...m,
            version: nextVer,
            versionHistory: [
              ...history,
              {
                version: m.version || "1.0",
                mom: m.mom,
                trustHeadApproval: m.trustHeadApproval,
                submittedAt: m.submittedForApprovalAt,
                archivedAt: new Date().toLocaleString(),
                revisionNotes
              }
            ],
            mom: mom ? { ...m.mom, ...mom } : m.mom,
            status: "Submitted for Approval",
            submittedForApprovalAt: new Date().toLocaleString(),
            trustHeadApproval: null
          };
        })
      );
    }
  };

  const shareMRM = async (id) => {
    try {
      const updated = await mrmService.shareMRM(id, token);
      setMrmList((prev) => prev.map((m) => (m.id === id ? updated : m)));
      refreshData();
      return updated;
    } catch (err) {
      console.error("shareMRM failed, fallback to local:", err);
      setMrmList((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                status: "Shared",
                sharedWithAll: true,
                sharedAt: new Date().toLocaleString(),
                sharedBy: currentUser?.name || "Rahul Kumar (QMS Coordinator)",
                sharedVersion: m.version || "1.0",
                acknowledgements: m.acknowledgements || []
              }
            : m
        )
      );
    }
  };

  const acknowledgeMRM = async (id) => {
    try {
      const updated = await mrmService.acknowledgeMRM(id, token);
      setMrmList((prev) => prev.map((m) => (m.id === id ? updated : m)));
      refreshData();
      return updated;
    } catch (err) {
      console.error("acknowledgeMRM failed, fallback to local:", err);
      setMrmList((prev) =>
        prev.map((m) => {
          if (m.id !== id) return m;
          const acks = m.acknowledgements || [];
          if (acks.some((a) => a.userId === currentUser?.id || a.name === currentUser?.name)) {
            return m;
          }
          return {
            ...m,
            acknowledgements: [
              ...acks,
              {
                userId: currentUser?.id || "CC-208",
                name: currentUser?.name || "Course Coordinator",
                role: currentUser?.roleTitle || "Course Coordinator",
                department: currentUser?.department || "Academic Division",
                acknowledgedAt: new Date().toLocaleString()
              }
            ]
          };
        })
      );
    }
  };

  // ==================== TASK & DOCUMENT ACTIONS ====================
  const addTask = async (taskData) => {
    try {
      const created = await taskService.createTask(taskData, token);
      setTasks((items) => [created, ...items]);
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
            updatedBy: currentUser?.name || "Course Coordinator",
            status: "Draft",
            versions: [
              {
                version: nextVersion,
                date: dateStr,
                author: currentUser?.name || "Course Coordinator",
                status: "Current"
              },
              ...document.versions.map((v) => ({ ...v, status: "Archived" }))
            ]
          };
        })
      );
    }
  };

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

  const downloadDocument = (id) => {
    documentService.downloadDocument(id);
  };

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
        usersList,
        mrmList,
        activities,
        headOverview,
        loading,
        login,
        loginUser,
        logout,
        addUser,
        updateUser,
        toggleUserStatus,
        deleteUser,
        addMRM,
        scheduleMRM,
        updateMRM,
        saveMoM,
        uploadMoMDocument,
        submitMRMForApproval,
        approveMRM,
        requestChangesMRM,
        rejectMRM,
        resubmitMRM,
        shareMRM,
        acknowledgeMRM,
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
        refreshData,
        silentRefresh,
        isRealtimeConnected,
        lastSyncTime
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
