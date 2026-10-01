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
import Employees from "../pages/Employees";
import Reviews from "../pages/Reviews";
import VersionHistoryPage from "../pages/VersionHistoryPage";
import Notifications from "../pages/Notifications";
import ActivityPage from "../pages/ActivityPage";
import Profile from "../pages/Profile";

export default function AppRoutes() {
  const { currentUser } = useApp();

  const dashboardPath = currentUser
    ? `/${currentUser.role === "employee"
        ? "employee"
        : currentUser.role === "owner"
          ? "process-owner"
          : currentUser.role === "Head"
            ? "Head"
            : "qm-group"}/dashboard`
    : "/login";

  return (
    <Routes>
      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route path="/" element={<Navigate to={dashboardPath} replace />} />

      <Route element={<DashboardLayout />}>
        <Route path="/employee/dashboard" element={<Dashboard />} />
        <Route path="/process-owner/dashboard" element={<Dashboard />} />
        <Route path="/qm-group/dashboard" element={<Dashboard />} />
        <Route path="/Head/dashboard" element={<Dashboard />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/documents/:id" element={<DocumentDetails />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/processes" element={<Processes />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/version-history" element={<VersionHistoryPage />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
