import React from "react";
import { useApp } from "../../context/AppContext";
import ProcessOwnerDashboard from "./ProcessOwnerDashboard";
import QMGroupDashboard from "./QMGroupDashboard";
import Head from "./Head";

export default function Dashboard() {
  const { currentUser } = useApp();
  const effectiveUser = currentUser || (() => {
    try {
      const stored = localStorage.getItem("qms_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  if (!effectiveUser) return null;
  if (effectiveUser.role === "owner") return <ProcessOwnerDashboard />;
  if (effectiveUser.role === "Head" || effectiveUser.role === "auditor") return <Head />;
  return <QMGroupDashboard />;
}
