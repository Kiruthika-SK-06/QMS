// Dummy user database for QMS
export const dummyUsers = [
  {
    id: "EMP-1042",
    username: "employee",
    email: "employee@cdac.in",
    aliases: [
      "employee@cdac.in",
      "aarav.mehta@cdac.in",
      "arun.kumar@cdac.in",
      "employee"
    ],
    password: "1234",
    name: "Arun Kumar",
    role: "employee",
    roleTitle: "Employee",
    initials: "AK",
    employeeId: "EMP001",
    department: "Human Resources",
    process: "Employee Management"
  },
  {
    id: "PO-208",
    username: "processowner",
    email: "owner@cdac.in",
    aliases: [
      "owner@cdac.in",
      "priya.nair@cdac.in",
      "priya.sharma@cdac.in",
      "processowner@cdac.in",
      "processowner"
    ],
    password: "1234",
    name: "Priya Sharma",
    role: "owner",
    roleTitle: "Process Owner",
    initials: "PS",
    employeeId: "PO001",
    department: "Human Resources",
    process: "Employee Management"
  },
  {
    id: "QM-001",
    username: "qmgroup",
    email: "qm@cdac.in",
    aliases: [
      "qm@cdac.in",
      "qms@cdac.in",
      "qmgroup@cdac.in",
      "rahul.kumar@cdac.in",
      "qmgroup"
    ],
    password: "1234",
    name: "Rahul Kumar",
    role: "qm",
    roleTitle: "QM Group",
    initials: "RK",
    employeeId: "QM001",
    department: "Quality Management",
    process: "All Processes"
  },
  {
    id: "QMH-001",
    username: "qmhead",
    email: "head@cdac.in",
    aliases: [
      "head@cdac.in",
      "qmhead@cdac.in",
      "anita.rao@cdac.in",
      "head",
      "qmhead"
    ],
    password: "1234",
    name: "Anita Rao",
    role: "Head",
    roleTitle: "QM Head",
    initials: "AR",
    employeeId: "QMH001",
    department: "Quality Management",
    process: "All Processes"
  }
];

// Helper to normalize role aliases
export const normalizeRole = (role) => {
  if (!role) return null;
  const map = {
    employee: "employee",
    owner: "owner",
    processowner: "owner",
    process_owner: "owner",
    qm: "qm",
    qmgroup: "qm",
    qm_group: "qm",
    head: "Head",
    qmhead: "Head",
    qm_head: "Head"
  };
  return map[role.toLowerCase()] || role;
};
