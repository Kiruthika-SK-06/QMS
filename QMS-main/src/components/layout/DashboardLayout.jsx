import React, { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser } = useApp();

  if (!currentUser) return <Navigate to="/login" replace />;

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} close={() => setSidebarOpen(false)} />
      <div className="main-shell">
        <Header openMenu={() => setSidebarOpen(true)} />
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  );
}
