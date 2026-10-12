const roles = {
  employee: "Employee",
  owner: "Process Owner",
  qm: "QM Group",
  Head: "QM Head"
};

const users = {
  employee: {
    id: "EMP-1042",
    username: "employee",
    name: "Aarav Mehta",
    email: "employee@cdac.in",
    aliases: [
      "employee@cdac.in",
      "aarav.mehta@cdac.in",
      "arun.kumar@cdac.in",
      "employee"
    ],
    password: "1234",
    role: "employee",
    roleTitle: "Employee",
    initials: "AM",
    employeeId: "EMP001",
    department: "Human Resources",
    process: "Employee Management"
  },
  owner: {
    id: "PO-208",
    username: "processowner",
    name: "Priya Nair",
    email: "owner@cdac.in",
    aliases: [
      "owner@cdac.in",
      "priya.nair@cdac.in",
      "priya.sharma@cdac.in",
      "processowner@cdac.in",
      "processowner"
    ],
    password: "1234",
    role: "owner",
    roleTitle: "Process Owner",
    initials: "PN",
    employeeId: "PO001",
    department: "Human Resources",
    process: "Employee Management"
  },
  qm: {
    id: "QM-001",
    username: "qmgroup",
    name: "Quality Management Group",
    email: "qm@cdac.in",
    aliases: [
      "qm@cdac.in",
      "qms@cdac.in",
      "qmgroup@cdac.in",
      "rahul.kumar@cdac.in",
      "qmgroup"
    ],
    password: "1234",
    role: "qm",
    roleTitle: "QM Group",
    initials: "QM",
    employeeId: "QM001",
    department: "Quality Management",
    process: "All Processes"
  },
  Head: {
    id: "QMH-001",
    username: "qmhead",
    name: "Anita Rao",
    email: "head@cdac.in",
    aliases: [
      "head@cdac.in",
      "qmhead@cdac.in",
      "anita.rao@cdac.in",
      "head",
      "qmhead"
    ],
    password: "1234",
    role: "Head",
    roleTitle: "QM Head",
    initials: "HQ",
    employeeId: "QMH001",
    department: "Quality Management",
    process: "All Processes"
  }
};

const initialDocuments = [
  {
    id: "DOC-001",
    name: "Feedback Form",
    type: "Forms",
    process: "Training & Development",
    owner: "Priya Nair",
    version: "3.0",
    updated: "18 Sep 2026",
    updatedBy: "Priya Nair",
    status: "Approved",
    submittedBy: "Priya Nair",
    versions: [
      { version: "3.0", date: "18 Sep 2026", author: "Priya Nair", status: "Current" },
      { version: "2.0", date: "10 Sep 2026", author: "Priya Nair", status: "Archived" },
      { version: "1.0", date: "02 Sep 2026", author: "Priya Nair", status: "Archived" }
    ]
  },
  {
    id: "DOC-002",
    name: "Joining Form",
    type: "Forms",
    process: "Employee Onboarding",
    owner: "Priya Nair",
    version: "2.0",
    updated: "15 Sep 2026",
    updatedBy: "Aarav Mehta",
    status: "Changes Requested",
    submittedBy: "Priya Nair",
    versions: [
      { version: "2.0", date: "15 Sep 2026", author: "Aarav Mehta", status: "Current" },
      { version: "1.0", date: "04 Sep 2026", author: "Priya Nair", status: "Archived" }
    ]
  },
  {
    id: "DOC-003",
    name: "Training Feedback Template",
    type: "Templates",
    process: "Training & Development",
    owner: "Priya Nair",
    version: "1.0",
    updated: "11 Sep 2026",
    updatedBy: "Priya Nair",
    status: "Under Review",
    submittedBy: "Priya Nair",
    versions: [
      { version: "1.0", date: "11 Sep 2026", author: "Priya Nair", status: "Current" }
    ]
  },
  {
    id: "DOC-004",
    name: "Employee Induction Procedure",
    type: "Procedures",
    process: "Employee Onboarding",
    owner: "Priya Nair",
    version: "4.0",
    updated: "08 Sep 2026",
    updatedBy: "Priya Nair",
    status: "Approved",
    submittedBy: "Priya Nair",
    versions: [
      { version: "4.0", date: "08 Sep 2026", author: "Priya Nair", status: "Current" },
      { version: "3.0", date: "02 Sep 2026", author: "Priya Nair", status: "Archived" },
      { version: "2.0", date: "26 Aug 2026", author: "Priya Nair", status: "Archived" },
      { version: "1.0", date: "18 Aug 2026", author: "Priya Nair", status: "Archived" }
    ]
  },
  {
    id: "DOC-005",
    name: "Course Management Procedure",
    type: "Procedures",
    process: "Training & Development",
    owner: "Rohan Desai",
    version: "2.0",
    updated: "06 Sep 2026",
    updatedBy: "Rohan Desai",
    status: "Approved",
    submittedBy: "Rohan Desai",
    versions: [
      { version: "2.0", date: "06 Sep 2026", author: "Rohan Desai", status: "Current" },
      { version: "1.0", date: "25 Aug 2026", author: "Rohan Desai", status: "Archived" }
    ]
  }
];

const initialTasks = [
  {
    id: "TASK-001",
    title: "Complete joining documentation",
    description: "Review and submit the employee joining checklist.",
    employee: "Aarav Mehta",
    process: "Employee Onboarding",
    document: "Joining Form",
    assigned: "12 Sep 2026",
    due: "22 Sep 2026",
    status: "In Progress"
  },
  {
    id: "TASK-002",
    title: "Submit training feedback",
    description: "Complete feedback for the advanced computing workshop.",
    employee: "Aarav Mehta",
    process: "Training & Development",
    document: "Feedback Form",
    assigned: "14 Sep 2026",
    due: "24 Sep 2026",
    status: "Pending"
  },
  {
    id: "TASK-003",
    title: "Review induction checklist",
    description: "Validate the latest employee induction checklist.",
    employee: "Neha Kulkarni",
    process: "Employee Onboarding",
    document: "",
    assigned: "09 Sep 2026",
    due: "18 Sep 2026",
    status: "Completed"
  }
];

const initialNotifications = [
  { id: 1, title: "New task assigned to you", text: "Complete joining documentation.", time: "15 minutes ago", read: false },
  { id: 2, title: "Feedback Form updated to Version 3", text: "The latest approved version is available.", time: "2 hours ago", read: false },
  { id: 3, title: "Document submitted for QM review", text: "Training Feedback Template is awaiting review.", time: "Yesterday", read: true },
  { id: 4, title: "Changes requested for Joining Form", text: "Please review QM comments.", time: "Yesterday", read: true },
  { id: 5, title: "Document approved", text: "Employee Induction Procedure was approved.", time: "2 days ago", read: true }
];

const processes = [
  { name: "Employee Onboarding", owner: "Priya Nair", employees: 12, active: 5, completed: 31, pending: 5, documents: 8, status: "Active" },
  { name: "Training & Development", owner: "Rohan Desai", employees: 24, active: 8, completed: 46, pending: 9, documents: 11, status: "Active" },
  { name: "Knowledge Management", owner: "Meera Shah", employees: 9, active: 2, completed: 18, pending: 2, documents: 5, status: "Active" }
];

const employees = [
  { name: "Aarav Mehta", id: "EMP-1042", process: "Employee Onboarding", assigned: 8, completed: 5, pending: 3, status: "Active" },
  { name: "Neha Kulkarni", id: "EMP-1048", process: "Training & Development", assigned: 11, completed: 9, pending: 2, status: "Active" },
  { name: "Vikram Rao", id: "EMP-1051", process: "Knowledge Management", assigned: 7, completed: 7, pending: 0, status: "Active" }
];

const activities = [
  { text: "Version 3.0 created for Feedback Form", actor: "Priya Nair", time: "18 Sep 2026, 10:42 AM", tone: "blue" },
  { text: "Document submitted for QM review", actor: "Priya Nair", time: "17 Sep 2026, 04:18 PM", tone: "amber" },
  { text: "QM Group requested changes for Joining Form", actor: "Quality Management Group", time: "16 Sep 2026, 01:06 PM", tone: "red" },
  { text: "Task assigned to Aarav Mehta", actor: "Priya Nair", time: "14 Sep 2026, 09:30 AM", tone: "green" },
  { text: "Employee completed task", actor: "Neha Kulkarni", time: "13 Sep 2026, 05:12 PM", tone: "green" }
];

export { roles, users, initialDocuments, initialTasks, initialNotifications, processes, employees, activities };
