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
  initialAuditList,
  activities as initialActivities
} from "../data/mockData";
import { authService } from "../services/authService";
import { documentService } from "../services/documentService";
import { taskService } from "../services/taskService";
import { notificationService } from "../services/notificationService";
import { processService } from "../services/processService";
import { userService } from "../services/userService";
import { mrmService, getStoredMRMs, saveStoredMRMs, sortMRMs } from "../services/mrmService";
import { auditService, getStoredAudits, saveStoredAudits, sortAudits } from "../services/auditService";

const AppContext = createContext(null);

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    return {};
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
  const [mrmList, setMrmList] = useState(() => sortMRMs(getStoredMRMs()));
  const [auditList, setAuditList] = useState(() => sortAudits(getStoredAudits()));
  const [activities, setActivities] = useState(initialActivities);
  const [headOverview, setHeadOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(() => new Date());

  // Silent background fetch that updates live data without full-page loading indicators
  const silentRefresh = useCallback(async () => {
    try {
      const [docs, tsks, notifs, procs, emps, acts, headData, liveUsers, liveMRMs, liveAudits] = await Promise.allSettled([
        documentService.fetchDocuments(),
        taskService.fetchTasks(),
        notificationService.fetchNotifications(token),
        processService.fetchProcesses(),
        processService.fetchEmployees(),
        processService.fetchActivities(),
        processService.fetchHeadOverview(),
        userService.fetchUsers(),
        mrmService.fetchMRMs(token),
        auditService.fetchAudits(token)
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
        setMrmList(sortMRMs(liveMRMs.value));
      }
      if (liveAudits.status === "fulfilled" && Array.isArray(liveAudits.value)) {
        setAuditList(sortAudits(liveAudits.value));
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
    let sseDebounceTimer = null;

    const debouncedSilentRefresh = () => {
      if (sseDebounceTimer) clearTimeout(sseDebounceTimer);
      sseDebounceTimer = setTimeout(() => {
        silentRefresh();
      }, 1500);
    };

    try {
      sse = new EventSource("/api/realtime/stream");

      sse.onopen = () => {
        setIsRealtimeConnected(true);
      };

      sse.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type !== "HEARTBEAT") {
            debouncedSilentRefresh();
          }
        } catch {
          debouncedSilentRefresh();
        }
      };

      sse.onerror = () => {
        setIsRealtimeConnected(false);
      };
    } catch {
      setIsRealtimeConnected(false);
    }

    // Real-time sync heartbeat backup (throttled to 15s to preserve serverless state)
    heartbeat = setInterval(() => {
      if (!document.hidden) {
        silentRefresh();
      }
    }, 30000);

    const handleFocus = () => silentRefresh();
    window.addEventListener("focus", handleFocus);

    return () => {
      if (sse) sse.close();
      if (heartbeat) clearInterval(heartbeat);
      if (sseDebounceTimer) clearTimeout(sseDebounceTimer);
      window.removeEventListener("focus", handleFocus);
    };
  }, [silentRefresh]);

  // Instant Cross-Tab Audit & MRM Synchronizer (BroadcastChannel + LocalStorage Event)
  useEffect(() => {
    let auditChannel = null;
    let mrmChannel = null;
    try {
      if (typeof BroadcastChannel !== "undefined") {
        auditChannel = new BroadcastChannel("qms_audit_channel");
        auditChannel.onmessage = (event) => {
          if (event.data?.type === "AUDIT_UPDATE" && Array.isArray(event.data.audits)) {
            setAuditList(sortAudits(event.data.audits));
          }
        };

        mrmChannel = new BroadcastChannel("qms_mrm_channel");
        mrmChannel.onmessage = (event) => {
          if (event.data?.type === "MRM_UPDATE" && Array.isArray(event.data.mrms)) {
            setMrmList(sortMRMs(event.data.mrms));
          }
        };
      }
    } catch (e) {
      console.warn("BroadcastChannel initialization notice:", e);
    }

    const handleStorageChange = (e) => {
      if (e.key === "qms_audits" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAuditList(sortAudits(parsed));
          }
        } catch {}
      } else if (e.key === "qms_mrms" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMrmList(sortMRMs(parsed));
          }
        } catch {}
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      if (auditChannel) auditChannel.close();
      if (mrmChannel) mrmChannel.close();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

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
  // 1. QMS Coordinator plans and schedules meeting -> Immediately visible, passes to Trust Head for Approval
  const addMRM = async (mrmData) => {
    try {
      const created = await mrmService.createMRM(mrmData, token);
      setMrmList((prev) => sortMRMs([created, ...prev.filter((m) => m.id !== created.id)]));

      // Associate and update process register for Quality Review & MRM
      setProcesses((prevProcs) =>
        prevProcs.map((p) => {
          if (p.name?.includes("Quality Review") || p.id === "PROC-006") {
            return { ...p, active: (p.active || 0) + 1 };
          }
          return p;
        })
      );

      pushNotification(
        "New MRM Scheduled - Approval Required",
        `Meeting (${created.id}) for "${created.title}" scheduled for ${created.scheduledDate}. Please review and approve.`,
        "Head"
      );
      pushNotification(
        "MRM Meeting Scheduled",
        `Meeting (${created.id}) scheduled and submitted to Trust Head Anita Rao for formal authorization.`,
        "qm"
      );
      return created;
    } catch (err) {
      console.error("addMRM failed:", err);
      throw err;
    }
  };

  const scheduleMRM = async (id, scheduleData) => {
    return addMRM({ ...scheduleData, id });
  };

  const updateMRM = async (id, data) => {
    try {
      const updated = await mrmService.updateMRM(id, data, token);
      setMrmList((prev) => sortMRMs(prev.map((m) => (m.id === id ? updated : m))));
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

  const requestMRMApproval = async (id) => {
    try {
      const updated = await mrmService.requestApproval(id, token);
      setMrmList((prev) => sortMRMs(prev.map((m) => (m.id === id ? updated : m))));
      pushNotification(
        "New MRM Scheduled - Approval Required",
        `Approval requested for "${updated.title}". Please review and confirm schedule.`,
        "Head"
      );
      return updated;
    } catch (err) {
      console.error("requestMRMApproval failed:", err);
      throw err;
    }
  };

  // 2. Trust Head Confirms / Approves Schedule -> Passes to QMS Coordinator to dispatch emails
  const approveMRM = async (id, { remarks = "" } = {}) => {
    try {
      const updated = await mrmService.approveMRM(id, { remarks }, token);
      if (updated) {
        setMrmList((prev) => sortMRMs(prev.map((m) => (m.id === id ? updated : m))));
        pushNotification(
          "MRM Approved by Trust Head",
          `Trust Head Anita Rao approved the schedule for "${updated.title}". You can now dispatch meeting notifications via email to all stakeholders.`,
          "qm"
        );
        pushNotification(
          "MRM Schedule Ratified",
          `Meeting "${updated.title}" approved. Notification dispatched to QMS Coordinator.`,
          "Head"
        );
      }
      return updated;
    } catch (err) {
      console.error("approveMRM failed:", err);
      throw err;
    }
  };

  const requestChangesMRM = async (id, remarks) => {
    try {
      const updated = await mrmService.requestChangesMRM(id, { remarks }, token);
      if (updated) {
        setMrmList((prev) => sortMRMs(prev.map((m) => (m.id === id ? updated : m))));
        pushNotification(
          "MRM Changes Requested",
          `Trust Head requested revisions for "${updated.title}": ${remarks}`,
          "qm"
        );
      }
      return updated;
    } catch (err) {
      console.error("requestChangesMRM failed:", err);
      throw err;
    }
  };

  const rejectMRM = async (id, reason) => {
    try {
      const updated = await mrmService.rejectMRM(id, { reason }, token);
      if (updated) {
        setMrmList((prev) => sortMRMs(prev.map((m) => (m.id === id ? updated : m))));
      }
      return updated;
    } catch (err) {
      console.error("rejectMRM failed:", err);
      throw err;
    }
  };

  const resubmitMRM = async (id, mom, revisionNotes) => {
    try {
      const updated = await mrmService.resubmitMRM(id, { mom, revisionNotes }, token);
      if (updated) {
        setMrmList((prev) => sortMRMs(prev.map((m) => (m.id === id ? updated : m))));
      }
      return updated;
    } catch (err) {
      console.error("resubmitMRM failed:", err);
      throw err;
    }
  };

  // 3. QMS Coordinator Shares Email Notification to Course Coordinators, Trust Head & Internal Auditor
  const shareMeetingEmail = async (id) => {
    try {
      const updated = await mrmService.shareMeetingEmail(id, token);
      if (updated) {
        setMrmList((prev) => sortMRMs(prev.map((m) => (m.id === id ? updated : m))));
        pushNotification(
          "Management Review Meeting Notice",
          `MRM "${updated.title}" scheduled on ${updated.scheduledDate} at ${updated.scheduledTime}. You are cordially invited.`,
          "owner"
        );
        pushNotification(
          "Management Review Meeting Scheduled",
          `MRM "${updated.title}" scheduled on ${updated.scheduledDate}. Agenda available for audit review.`,
          "auditor"
        );
        pushNotification(
          "MRM Notification Dispatched",
          `Meeting notice for "${updated.title}" emailed to all Course Coordinators, Trust Head, and Internal Auditor.`,
          "qm"
        );
        pushNotification(
          "MRM Invitation Dispatched",
          `Meeting notice for "${updated.title}" sent to all stakeholders.`,
          "Head"
        );
      }
      return updated;
    } catch (err) {
      console.error("shareMeetingEmail failed:", err);
      throw err;
    }
  };

  const shareMRM = async (id) => {
    return shareMeetingEmail(id);
  };

  // 4. QMS Coordinator Uploads MoM File -> Stored as official Document & Whole Process Completed
  const uploadMoMFile = async (id, momPayload) => {
    try {
      const updated = await mrmService.uploadMoMFile(id, momPayload, token);
      if (updated) {
        setMrmList((prev) => sortMRMs(prev.map((m) => (m.id === id ? updated : m))));

        // Upload and store as official Document in Document Management
        const docId = `DOC-MOM-${updated.id.replace(/[^a-zA-Z0-9]/g, "")}`;
        const newDoc = {
          id: docId,
          title: `Minutes of Meeting: ${updated.title}`,
          process: updated.process || "Quality Review & MRM",
          category: "Quality Governance & MRM",
          type: "Meeting Minutes",
          version: "1.0",
          author: currentUser?.name || "Rahul Kumar (QMS Coordinator)",
          authorRole: "QMS Coordinator",
          updated: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
          updatedBy: currentUser?.name || "Rahul Kumar",
          status: "Approved",
          securityClassification: "Internal Controlled",
          fileSize: momPayload.fileSize || "2.4 MB",
          downloadCount: 0,
          versions: [
            {
              version: "1.0",
              date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
              author: currentUser?.name || "Rahul Kumar",
              status: "Approved",
              notes: "Official published Minutes of Management Review Meeting."
            }
          ]
        };
        setDocuments((prevDocs) => [newDoc, ...prevDocs.filter((d) => d.id !== docId)]);

        // Update Quality Review & MRM process in Process Register
        setProcesses((prevProcs) =>
          prevProcs.map((p) => {
            if (p.name?.includes("Quality Review") || p.id === "PROC-006") {
              return {
                ...p,
                completed: (p.completed || 0) + 1,
                active: Math.max(0, (p.active || 1) - 1)
              };
            }
            return p;
          })
        );

        pushNotification(
          "MRM Completed & MoM Document Published",
          `Minutes of Meeting for "${updated.title}" has been published and uploaded as an official document. Open for download by all Course Coordinators and Auditors.`,
          "all"
        );
      }
      return updated;
    } catch (err) {
      console.error("uploadMoMFile failed:", err);
      throw err;
    }
  };

  const saveMoM = async (id, momData) => {
    return uploadMoMFile(id, momData);
  };

  const submitMRMForApproval = async (id) => {
    return requestMRMApproval(id);
  };

  const acknowledgeMRM = async (id) => {
    try {
      const updated = await mrmService.acknowledgeMRM(id, token);
      if (updated) {
        setMrmList((prev) => sortMRMs(prev.map((m) => (m.id === id ? updated : m))));
      }
      return updated;
    } catch (err) {
      console.error("acknowledgeMRM failed:", err);
      return null;
    }
  };

  // ==================== INTERNAL QUALITY AUDIT ACTIONS ====================
  const scheduleAudit = async (payload) => {
    try {
      const created = await auditService.createAudit(payload, token);
      setAuditList((prev) => {
        const next = sortAudits([created, ...prev.filter((a) => a.id !== created.id)]);
        saveStoredAudits(next);
        return next;
      });
      return created;
    } catch (err) {
      console.error("scheduleAudit error:", err);
      throw err;
    }
  };

  const shareAuditSchedule = async (id) => {
    try {
      const updated = await auditService.shareSchedule(id, token);
      setAuditList((prev) => {
        const next = sortAudits(prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
        saveStoredAudits(next);
        return next;
      });
      return updated;
    } catch (err) {
      console.error("shareAuditSchedule error:", err);
      throw err;
    }
  };

  const confirmAuditSchedule = async (id, remarks) => {
    try {
      const updated = await auditService.confirmSchedule(id, remarks, token);
      setAuditList((prev) => {
        const next = sortAudits(prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
        saveStoredAudits(next);
        return next;
      });
      return updated;
    } catch (err) {
      console.error("confirmAuditSchedule error:", err);
      throw err;
    }
  };

  const submitNoticingSheet = async (id, payload) => {
    try {
      const updated = await auditService.submitNoticingSheet(id, payload, token);
      setAuditList((prev) => {
        const next = sortAudits(prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
        saveStoredAudits(next);
        return next;
      });
      return updated;
    } catch (err) {
      console.error("submitNoticingSheet error:", err);
      throw err;
    }
  };

  const shareNCDocs = async (id, payload) => {
    try {
      const updated = await auditService.shareNCDocs(id, payload, token);
      setAuditList((prev) => {
        const next = sortAudits(prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
        saveStoredAudits(next);
        return next;
      });
      return updated;
    } catch (err) {
      console.error("shareNCDocs error:", err);
      throw err;
    }
  };

  const submitAuditeeClosure = async (id, payload) => {
    try {
      const updated = await auditService.auditeeClose(id, payload, token);
      setAuditList((prev) => {
        const next = sortAudits(prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
        saveStoredAudits(next);
        return next;
      });
      return updated;
    } catch (err) {
      console.error("submitAuditeeClosure error:", err);
      throw err;
    }
  };

  const finalCloseAudit = async (id, remarks) => {
    try {
      const updated = await auditService.finalCloseAudit(id, remarks, token);
      setAuditList((prev) => {
        const next = sortAudits(prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
        saveStoredAudits(next);
        return next;
      });
      return updated;
    } catch (err) {
      console.error("finalCloseAudit error:", err);
      throw err;
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

  const pushNotification = (title, text, targetRole = "all") => {
    const notif = {
      id: Date.now(),
      title,
      text,
      time: "Just now",
      read: false,
      targetRole
    };
    setNotifications((prev) => [notif, ...prev]);
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
        auditList,
        scheduleAudit,
        shareAuditSchedule,
        confirmAuditSchedule,
        submitNoticingSheet,
        shareNCDocs,
        submitAuditeeClosure,
        finalCloseAudit,
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
        uploadMoMFile,
        submitMRMForApproval,
        requestMRMApproval,
        approveMRM,
        requestChangesMRM,
        rejectMRM,
        resubmitMRM,
        shareMRM,
        shareMeetingEmail,
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
        pushNotification,
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
