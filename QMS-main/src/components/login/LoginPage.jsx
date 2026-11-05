import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import LoginVisual from "./LoginVisual";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  const { currentUser } = useApp();
  const navigate = useNavigate();

  // If already authenticated, redirect directly to role dashboard
  useEffect(() => {
    const user = currentUser || (() => {
      try {
        const stored = localStorage.getItem("qms_user");
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    })();

    if (user && user.role) {
      const path =
        user.role === "owner"
          ? "/process-owner/dashboard"
          : user.role === "Head" || user.role === "auditor"
            ? "/Head/dashboard"
            : "/qm-group/dashboard";
      navigate(path, { replace: true });
    }
  }, [currentUser, navigate]);

  return (
    <div className="login-page">
      <LoginVisual />
      <LoginForm />
    </div>
  );
}
