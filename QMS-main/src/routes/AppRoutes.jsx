import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useApp } from "../context/AppContext";
import DashboardLayout from "../components/layout/DashboardLayout";
import LoginPage from "../components/login/LoginPage";
import Dashboard from "../components/dashboard/Dashboard";
import Documents from "../pages/Documents";
import DocumentDetails from "../pages/DocumentDetails";
import Tasks from "../pages/Tasks";
import Processes from "../pages/Processes";
import UserManagement from "../pages/UserManagement";
import ManagementReviewMeeting from "../pages/ManagementReviewMeeting";
import InternalAudit from "../pages/InternalAudit";
import ExternalAudit from "../pages/ExternalAudit";
import Reviews from "../pages/Reviews";
import VersionHistoryPage from "../pages/VersionHistoryPage";
import Notifications from "../pages/Notifications";
import ActivityPage from "../pages/ActivityPage";
import Profile from "../pages/Profile";

export default function AppRoutes() {
  const { currentUser } = useApp();

  const effectiveUser = currentUser || (() => {
    try {
      const stored = localStorage.getItem("qms_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  const defaultDashboard = effectiveUser
    ? effectiveUser.role === "owner"
      ? "/process-owner/dashboard"
      : effectiveUser.role === "Head" || effectiveUser.role === "auditor"
        ? "/Head/dashboard"
        : "/qm-group/dashboard"
    : "/login";

  return (
    <Routes>
      <Route
        path="/login"
        element={<LoginPage />}
      />

      {/* Opening the website routes authenticated users to their dashboard, otherwise to login */}
      <Route path="/" element={<Navigate to={defaultDashboard} replace />} />

      <Route element={<DashboardLayout />}>
        {/* Dashboards with new semantic routes and backward-compatible aliases */}
        <Route path="/course-coordinator/dashboard" element={<Dashboard />} />
        <Route path="/process-owner/dashboard" element={<Dashboard />} />
        <Route path="/qms-coordinator/dashboard" element={<Dashboard />} />
        <Route path="/qm-group/dashboard" element={<Dashboard />} />
        <Route path="/trust-head/dashboard" element={<Dashboard />} />
        <Route path="/Head/dashboard" element={<Dashboard />} />

        {/* Feature Pages */}
        <Route path="/documents" element={<Documents />} />
        <Route path="/documents/:id" element={<DocumentDetails />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/processes" element={<Processes />} />
        <Route path="/user-management" element={<UserManagement />} />
        <Route path="/mrm" element={<ManagementReviewMeeting />} />
        <Route path="/internal-audit" element={<InternalAudit />} />
        <Route path="/external-audit" element={<ExternalAudit />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/version-history" element={<VersionHistoryPage />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/profile" element={<Profile />} />

        {/* Backward-compatibility redirect from /employees to /user-management */}
        <Route path="/employees" element={<Navigate to="/user-management" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
