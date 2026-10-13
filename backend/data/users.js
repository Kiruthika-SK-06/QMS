// Controlled user database for QMS
export let dummyUsers = [
  {
    id: "CC-208",
    username: "coursecoordinator",
    email: "coordinator@cdac.in",
    aliases: [
      "coursecoordinator",
      "processowner",
      "coordinator@cdac.in",
      "owner@cdac.in",
      "priya.sharma@cdac.in",
      "priya.nair@cdac.in",
      "owner"
    ],
    password: "1234",
    name: "Priya Sharma",
    role: "owner",
    roleTitle: "Course Coordinator",
    initials: "PS",
    employeeId: "CC001",
    department: "Advanced Computing Division",
    process: "Course Management",
    designation: "Principal Course Coordinator",
    status: "Active",
    joinDate: "15 Jan 2024",
    privileges: [
      "Manage Documents",
      "Draft Minutes of Meeting (MoM)",
      "Assign & Supervise Tasks"
    ]
  },
  {
    id: "QC-001",
    username: "qmcoordinator",
    email: "qm@cdac.in",
    aliases: [
      "qmcoordinator",
      "qmgroup",
      "qm@cdac.in",
      "qms@cdac.in",
      "rahul.kumar@cdac.in",
      "qm"
    ],
    password: "1234",
    name: "Rahul Kumar",
    role: "qm",
    roleTitle: "QMS Coordinator",
    initials: "RK",
    employeeId: "QC001",
    department: "Quality Assurance & Compliance",
    process: "All Quality Processes",
    designation: "Lead QMS Coordinator",
    status: "Active",
    joinDate: "01 Mar 2023",
    privileges: [
      "Manage Documents",
      "Review Documents",
      "Plan & Schedule MRM",
      "Share MRM with Coordinators",
      "User Management",
      "Assign & Supervise Tasks",
      "View Audit Logs & Reports"
    ]
  },
  {
    id: "TH-001",
    username: "trusthead",
    email: "head@cdac.in",
    aliases: [
      "trusthead",
      "qmhead",
      "head@cdac.in",
      "anita.rao@cdac.in",
      "head"
    ],
    password: "1234",
    name: "Anita Rao",
    role: "Head",
    roleTitle: "Trust Head",
    initials: "AR",
    employeeId: "TH001",
    department: "Trust Governance & Executive Board",
    process: "Trust Governance",
    designation: "Executive Director / Trust Head",
    status: "Active",
    joinDate: "10 Aug 2021",
    privileges: [
      "Approve MRM",
      "Review Documents",
      "View Audit Logs & Reports"
    ]
  },
  {
    id: "CC-210",
    username: "rajesh.verma",
    email: "rajesh.verma@cdac.in",
    aliases: ["rajesh.verma", "rajesh.verma@cdac.in"],
    password: "1234",
    name: "Dr. Rajesh Verma",
    role: "owner",
    roleTitle: "Course Coordinator",
    initials: "RV",
    employeeId: "CC002",
    department: "Artificial Intelligence Division",
    process: "AI & Data Science Course",
    designation: "Senior Course Coordinator",
    status: "Active",
    joinDate: "05 Jun 2024",
    privileges: [
      "Manage Documents",
      "Plan & Schedule MRM",
      "Draft Minutes of Meeting (MoM)",
      "Assign & Supervise Tasks"
    ]
  },
  {
    id: "CC-215",
    username: "sunita.patil",
    email: "sunita.patil@cdac.in",
    aliases: ["sunita.patil", "sunita.patil@cdac.in"],
    password: "1234",
    name: "Sunita Patil",
    role: "owner",
    roleTitle: "Course Coordinator",
    initials: "SP",
    employeeId: "CC003",
    department: "Cyber Security Division",
    process: "Cyber Defense Course",
    designation: "Associate Course Coordinator",
    status: "Active",
    joinDate: "18 Sep 2024",
    privileges: [
      "Manage Documents",
      "Plan & Schedule MRM",
      "Draft Minutes of Meeting (MoM)"
    ]
  }
];

// Helper to normalize role aliases
export const normalizeRole = (role) => {
  if (!role) return null;
  const map = {
    owner: "owner",
    coursecoordinator: "owner",
    course_coordinator: "owner",
    processowner: "owner",
    process_owner: "owner",
    cc: "owner",
    qm: "qm",
    qms: "qm",
    qmcoordinator: "qm",
    qms_coordinator: "qm",
    qmgroup: "qm",
    qm_group: "qm",
    qc: "qm",
    head: "Head",
    trusthead: "Head",
    trust_head: "Head",
    qmhead: "Head",
    qm_head: "Head",
    th: "Head"
  };
  return map[role.toLowerCase()] || role;
};
