import React from "react";
import { useApp } from "../../context/AppContext";
import ProcessOwnerDashboard from "./ProcessOwnerDashboard";
import QMGroupDashboard from "./QMGroupDashboard";
import Head from "./Head";

export default function Dashboard() {
  const { currentUser } = useApp();
  if (!currentUser) return null;
  if (currentUser.role === "owner") return <ProcessOwnerDashboard />;
  if (currentUser.role === "Head") return <Head />;
  return <QMGroupDashboard />;
}
