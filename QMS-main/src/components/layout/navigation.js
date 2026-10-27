import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Users,
  History,
  Bell,
  Activity,
  BookOpen,
  FileCheck2,
  CalendarCheck,
  UserCheck,
  ShieldCheck,
  ClipboardCheck
} from "lucide-react";

// Each role's nav is a list of groups: [groupLabel, [ [label, path, Icon], ... ] ]
export const navByRole = {
  owner: [
    ["OVERVIEW", [
      ["Dashboard", "/process-owner/dashboard", LayoutDashboard]
    ]],
    ["COURSE MANAGEMENT", [
      ["Documents", "/documents", FileText],
      ["My Processes", "/processes", BookOpen],
      ["Management Review Meeting", "/mrm", CalendarCheck],
      ["Internal Audit", "/internal-audit", ClipboardCheck],
      ["Tasks", "/tasks", ClipboardList]
    ]],
    ["MONITORING", [
      ["Version History", "/version-history", History],
      ["Activity", "/activity", Activity],
      ["Notifications", "/notifications", Bell]
    ]],
    ["ACCOUNT", [
      ["Profile", "/profile", Users]
    ]]
  ],
  qm: [
    ["OVERVIEW", [
      ["Dashboard", "/qm-group/dashboard", LayoutDashboard]
    ]],
    ["MANAGEMENT", [
      ["Document Management", "/documents", FileText],
      ["Document Review Queue", "/reviews", FileCheck2],
      ["User Management", "/user-management", UserCheck],
      ["Internal Audit", "/internal-audit", ClipboardCheck],
      ["Management Review Meeting", "/mrm", CalendarCheck],
      ["Processes", "/processes", BookOpen],
      ["Tasks", "/tasks", ClipboardList]
    ]],
    ["MONITORING & AUDIT", [
      ["Audit Trail", "/version-history", History],
      ["Activity Logs", "/activity", Activity],
      ["Notifications", "/notifications", Bell]
    ]],
    ["ACCOUNT", [
      ["Profile", "/profile", Users]
    ]]
  ],
  Head: [
    ["OVERVIEW", [
      ["Dashboard", "/Head/dashboard", LayoutDashboard]
    ]],
    ["EXECUTIVE OVERSIGHT", [
      ["Internal Audit", "/internal-audit", ClipboardCheck],
      ["MRM Approvals", "/mrm", ShieldCheck],
      ["Approval History", "/mrm?filter=Approved", History],
      ["User Management", "/user-management", UserCheck],
      ["Document Oversight", "/documents", FileText],
      ["Processes", "/processes", BookOpen]
    ]],
    ["MONITORING", [
      ["Audit Trail", "/version-history", History],
      ["Notifications", "/notifications", Bell]
    ]],
    ["ACCOUNT", [
      ["Profile", "/profile", Users]
    ]]
  ],
  auditor: [
    ["OVERVIEW", [
      ["Dashboard", "/Head/dashboard", LayoutDashboard]
    ]],
    ["QUALITY AUDIT & MRM", [
      ["Internal Audit", "/internal-audit", ClipboardCheck],
      ["MRM Reviews & Approvals", "/mrm", ShieldCheck],
      ["Approval History", "/mrm?filter=Approved", History],
      ["User Management", "/user-management", UserCheck],
      ["Controlled Documents", "/documents", FileText],
      ["Processes Register", "/processes", BookOpen]
    ]],
    ["AUDIT & MONITORING", [
      ["Audit Trail", "/version-history", History],
      ["Activity Logs", "/activity", Activity],
      ["Notifications", "/notifications", Bell]
    ]],
    ["ACCOUNT", [
      ["Profile", "/profile", Users]
    ]]
  ]
};
