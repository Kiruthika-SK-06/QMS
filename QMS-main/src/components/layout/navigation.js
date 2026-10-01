import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Users,
  History,
  Bell,
  Activity,
  BookOpen,
  FileCheck2
} from "lucide-react";

// Each role's nav is a list of groups: [groupLabel, [ [label, path, Icon], ... ] ]
export const navByRole = {
  employee: [
    ["OVERVIEW", [
      ["Dashboard", "/employee/dashboard", LayoutDashboard]
    ]],
    ["MANAGEMENT", [
      ["Documents", "/documents", FileText],
      ["Tasks", "/tasks", ClipboardList]
    ]],
    ["MONITORING", [
      ["Notifications", "/notifications", Bell]
    ]],
    ["ACCOUNT", [
      ["Profile", "/profile", Users]
    ]]
  ],
  owner: [
    ["OVERVIEW", [
      ["Dashboard", "/process-owner/dashboard", LayoutDashboard]
    ]],
    ["MANAGEMENT", [
      ["Documents", "/documents", FileText],
      ["My Processes", "/processes", BookOpen],
      ["Employees", "/employees", Users],
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
      ["Documents", "/documents", FileText],
      ["Document Review", "/reviews", FileCheck2],
      ["Processes", "/processes", BookOpen],
      ["Employees", "/employees", Users],
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
  Head: [
    ["OVERVIEW", [
      ["Dashboard", "/Head/dashboard", LayoutDashboard]
    ]],
    ["MANAGEMENT", [
      ["Processes", "/processes", BookOpen]
    ]],
    ["MONITORING", [
      ["Notifications", "/notifications", Bell]
    ]],
    ["ACCOUNT", [
      ["Profile", "/profile", Users]
    ]]
  ]
};
