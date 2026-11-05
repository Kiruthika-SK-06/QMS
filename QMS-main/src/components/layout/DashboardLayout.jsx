import React, { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser } = useApp();

  // Resilient session fallback: read synchronously from localStorage if state is transitioning
  const effectiveUser = currentUser || (() => {
    try {
      const stored = localStorage.getItem("qms_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  if (!effectiveUser) return <Navigate to="/login" replace />;

  return (
    <div className="app-shell">
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
      <Sidebar open={sidebarOpen} close={() => setSidebarOpen(false)} />
      <div className="main-shell">
        <Header openMenu={() => setSidebarOpen(true)} />
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  );
}
