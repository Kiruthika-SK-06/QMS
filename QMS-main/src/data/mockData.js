const roles = {
  owner: "Course Coordinator",
  qm: "QMS Coordinator",
  Head: "Trust Head"
};

const users = {
  owner: {
    id: "CC-208",
    username: "coursecoordinator",
    name: "Priya Sharma",
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
    role: "owner",
    roleTitle: "Course Coordinator",
    initials: "PS",
    employeeId: "CC001",
    department: "Academic & Training Division",
    process: "Course Management",
    designation: "Principal Course Coordinator",
    status: "Active",
    joinDate: "15 Jan 2024",
    privileges: [
      "Manage Documents",
      "Plan & Schedule MRM",
      "Draft Minutes of Meeting (MoM)",
      "Assign & Supervise Tasks"
    ]
  },
  qm: {
    id: "QC-001",
    username: "qmcoordinator",
    name: "Rahul Kumar",
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
    role: "qm",
    roleTitle: "QMS Coordinator",
    initials: "RK",
    employeeId: "QC001",
    department: "Quality Assurance & Compliance",
    process: "All Processes",
    designation: "Lead QMS Coordinator",
    status: "Active",
    joinDate: "01 Mar 2023",
    privileges: [
      "Manage Documents",
      "Review Documents",
      "Share MRM with Coordinators",
      "User Management",
      "Assign & Supervise Tasks",
      "View Audit Logs & Reports"
    ]
  },
  Head: {
    id: "TH-001",
    username: "trusthead",
    name: "Anita Rao",
    email: "head@cdac.in",
    aliases: [
      "trusthead",
      "qmhead",
      "head@cdac.in",
      "anita.rao@cdac.in",
      "head"
    ],
    password: "1234",
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
  }
};

const initialDocuments = [
  {
    id: "DOC-001",
    name: "Course Student Feedback Form",
    type: "Forms",
    process: "Course Management",
    owner: "Priya Sharma",
    version: "3.0",
    updated: "18 Sep 2026",
    updatedBy: "Priya Sharma",
    status: "Approved",
    submittedBy: "Priya Sharma",
    versions: [
      { version: "3.0", date: "18 Sep 2026", author: "Priya Sharma", status: "Current" },
      { version: "2.0", date: "10 Sep 2026", author: "Priya Sharma", status: "Archived" },
      { version: "1.0", date: "02 Sep 2026", author: "Priya Sharma", status: "Archived" }
    ]
  },
  {
    id: "DOC-002",
    name: "Course Enrollment & Prerequisites Form",
    type: "Forms",
    process: "Course Administration",
    owner: "Priya Sharma",
    version: "2.0",
    updated: "15 Sep 2026",
    updatedBy: "Priya Sharma",
    status: "Changes Requested",
    submittedBy: "Priya Sharma",
    versions: [
      { version: "2.0", date: "15 Sep 2026", author: "Priya Sharma", status: "Current" },
      { version: "1.0", date: "04 Sep 2026", author: "Priya Sharma", status: "Archived" }
    ]
  },
  {
    id: "DOC-003",
    name: "Course Delivery Evaluation Template",
    type: "Templates",
    process: "Course Management",
    owner: "Priya Sharma",
    version: "1.0",
    updated: "11 Sep 2026",
    updatedBy: "Priya Sharma",
    status: "Under Review",
    submittedBy: "Priya Sharma",
    versions: [
      { version: "1.0", date: "11 Sep 2026", author: "Priya Sharma", status: "Current" }
    ]
  },
  {
    id: "DOC-004",
    name: "Academic Curriculum Revision Procedure",
    type: "Procedures",
    process: "Course Management",
    owner: "Priya Sharma",
    version: "4.0",
    updated: "08 Sep 2026",
    updatedBy: "Priya Sharma",
    status: "Approved",
    submittedBy: "Priya Sharma",
    versions: [
      { version: "4.0", date: "08 Sep 2026", author: "Priya Sharma", status: "Current" },
      { version: "3.0", date: "02 Sep 2026", author: "Priya Sharma", status: "Archived" },
      { version: "2.0", date: "26 Aug 2026", author: "Priya Sharma", status: "Archived" },
      { version: "1.0", date: "18 Aug 2026", author: "Priya Sharma", status: "Archived" }
    ]
  },
  {
    id: "DOC-005",
    name: "Lab Infrastructure Maintenance Procedure",
    type: "Procedures",
    process: "IT Support Management",
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
    title: "Update Course Curriculum Structure",
    description: "Review and update the course syllabus checklist, statutory accreditation guidelines, and lab exercises.",
    employee: "Priya Sharma",
    process: "Course Management",
    document: "Academic Curriculum Revision Procedure",
    assigned: "12 Sep 2026",
    due: "22 Sep 2026",
    status: "In Progress"
  },
  {
    id: "TASK-002",
    title: "Compile MRM Q3 Student Feedback",
    description: "Aggregate student satisfaction ratings for all academic modules and generate summary for MRM agenda.",
    employee: "Dr. Rajesh Verma",
    process: "Course Management",
    document: "Course Student Feedback Form",
    assigned: "14 Sep 2026",
    due: "24 Sep 2026",
    status: "Pending"
  },
  {
    id: "TASK-003",
    title: "Audit Lab Safety & Hardware Calibrations",
    description: "Validate the latest equipment log sheets against revised ISO 9001:2015 safety criteria.",
    employee: "Sunita Patil",
    process: "IT Support Management",
    document: "",
    assigned: "09 Sep 2026",
    due: "18 Sep 2026",
    status: "Completed"
  }
];

const initialNotifications = [
  { id: 1, title: "New MRM ready for distribution", text: "Q3 Academic Review Meeting was approved by Trust Head. QMS Coordinator can now distribute to Course Coordinators.", time: "15 minutes ago", read: false },
  { id: 2, title: "Course Feedback Form updated to Version 3", text: "The latest approved version is available in the controlled library.", time: "2 hours ago", read: false },
  { id: 3, title: "Document submitted for QMS review", text: "Course Delivery Evaluation Template is awaiting review.", time: "Yesterday", read: true },
  { id: 4, title: "Feedback provided on Course Form", text: "Please review notes regarding industry project requirements.", time: "Yesterday", read: true },
  { id: 5, title: "Document approved", text: "Academic Curriculum Revision Procedure was approved.", time: "2 days ago", read: true }
];

const processes = [
  { name: "Course Administration", owner: "Priya Sharma", employees: 12, active: 5, completed: 31, pending: 5, documents: 8, status: "Active" },
  { name: "Course Management", owner: "Priya Sharma", employees: 24, active: 8, completed: 46, pending: 9, documents: 11, status: "Active" },
  { name: "IT Support Management", owner: "Karthik Verma", employees: 9, active: 2, completed: 18, pending: 2, documents: 5, status: "Active" }
];

const initialUsersList = [
  {
    id: "CC-208",
    name: "Priya Sharma",
    email: "coordinator@cdac.in",
    username: "coursecoordinator",
    designation: "Principal Course Coordinator",
    department: "Advanced Computing Division",
    role: "owner",
    roleTitle: "Course Coordinator",
    status: "Active",
    initials: "PS",
    joinDate: "15 Jan 2024",
    privileges: [
      "Manage Documents",
      "Draft Minutes of Meeting (MoM)",
      "Assign & Supervise Tasks"
    ]
  },
  {
    id: "QC-001",
    name: "Rahul Kumar",
    email: "qm@cdac.in",
    username: "qmcoordinator",
    designation: "Lead QMS Coordinator",
    department: "Quality Assurance & Compliance",
    role: "qm",
    roleTitle: "QMS Coordinator",
    status: "Active",
    initials: "RK",
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
    name: "Anita Rao",
    email: "head@cdac.in",
    username: "trusthead",
    designation: "Executive Director / Trust Head",
    department: "Trust Governance & Executive Board",
    role: "Head",
    roleTitle: "Trust Head",
    status: "Active",
    initials: "AR",
    joinDate: "10 Aug 2021",
    privileges: [
      "Approve MRM",
      "Review Documents",
      "View Audit Logs & Reports"
    ]
  },
  {
    id: "IA-001",
    name: "Vikas Deshmukh",
    email: "auditor@cdac.in",
    username: "internalauditor",
    designation: "Lead Internal Auditor",
    department: "Internal Quality Audit Cell",
    role: "auditor",
    roleTitle: "Internal Auditor",
    status: "Active",
    initials: "VD",
    joinDate: "01 Feb 2024",
    privileges: [
      "View Audit Logs & Reports",
      "User Management",
      "Review Documents"
    ]
  },
  {
    id: "CC-210",
    name: "Dr. Rajesh Verma",
    email: "rajesh.verma@cdac.in",
    username: "rajesh.verma",
    designation: "Senior Course Coordinator",
    department: "Artificial Intelligence Division",
    role: "owner",
    roleTitle: "Course Coordinator",
    status: "Active",
    initials: "RV",
    joinDate: "05 Jun 2024",
    privileges: [
      "Manage Documents",
      "Draft Minutes of Meeting (MoM)",
      "Assign & Supervise Tasks"
    ]
  },
  {
    id: "CC-215",
    name: "Sunita Patil",
    email: "sunita.patil@cdac.in",
    username: "sunita.patil",
    designation: "Associate Course Coordinator",
    department: "Cyber Security Division",
    role: "owner",
    roleTitle: "Course Coordinator",
    status: "Active",
    initials: "SP",
    joinDate: "18 Sep 2024",
    privileges: [
      "Manage Documents",
      "Draft Minutes of Meeting (MoM)",
      "Assign & Supervise Tasks"
    ]
  }
];

const initialMRMList = [
  {
    id: "MRM-2026-001",
    title: "Q3 Academic Quality & Curriculum Review Meeting",
    description: "Quarterly review of syllabus coverage, course delivery metrics, student feedback, and lab infrastructure compliance.",
    version: "1.0",
    versionHistory: [],
    status: "Approved",
    scheduledDate: "2026-10-10",
    scheduledTime: "10:30 AM",
    venue: "Main Boardroom / Webex Video Conference",
    plannedBy: "Rahul Kumar",
    plannedByRole: "QMS Coordinator",
    department: "Quality Assurance & Compliance",
    agenda: [
      "Review of previous MRM action items & closure status",
      "Analysis of student semester feedback & satisfaction index",
      "Course delivery milestones and practical lab examination results",
      "Resource allocation, software licenses & computing server capacity",
      "Recommendations for continual curriculum modernization"
    ],
    attendees: [
      "Rahul Kumar (QMS Coordinator)",
      "Anita Rao (Trust Head)",
      "Priya Sharma (Course Coordinator)",
      "Dr. Rajesh Verma (Course Coordinator - AI)",
      "Sunita Patil (Course Coordinator - Cyber Security)"
    ],
    mom: {
      recordedBy: "Priya Sharma",
      recordedDate: "2026-10-10",
      summary: "Comprehensive review conducted for all academic and computing programs. Overall quality index reached 94.2%. Action items delegated for curriculum revision and server upgrades.",
      discussionPoints: [
        "Course delivery completion is on schedule across all 5 centers.",
        "Internal audit identified 2 minor document alignment gaps in course lab manuals.",
        "Student feedback showed 91.8% satisfaction rating in project guidance."
      ],
      actionItems: [
        {
          id: "ACT-01",
          task: "Incorporate Cloud Architecture module into Advanced Computing syllabus",
          assignee: "Priya Sharma (Course Coordinator)",
          deadline: "2026-10-25",
          status: "In Progress"
        },
        {
          id: "ACT-02",
          task: "Renew high-performance compute GPU cloud licenses",
          assignee: "IT Infrastructure Support",
          deadline: "2026-10-20",
          status: "Completed"
        }
      ],
      decisions: [
        "Approved addition of industry project mentorship sessions.",
        "Sanctioned budget for upcoming accreditation audit documentation."
      ]
    },
    submittedForApprovalAt: "2026-10-10 03:30 PM",
    trustHeadApproval: {
      decision: "Approved",
      approved: true,
      approvedBy: "Anita Rao",
      approvedAt: "2026-10-11 11:15 AM",
      remarks: "Thorough review. Action items and resource approvals ratified. Approved for distribution by QMS Coordinator.",
      versionReviewed: "1.0"
    },
    sharedWithAll: false,
    sharedAt: null,
    sharedBy: null,
    sharedVersion: null,
    recipients: ["All Course Coordinators"],
    acknowledgements: [],
    timeline: [
      {
        action: "Meeting Planned & Scheduled",
        actor: "Rahul Kumar (QMS Coordinator)",
        timestamp: "2026-10-05 10:00 AM",
        version: "1.0",
        details: "Meeting scheduled for 2026-10-10 in Main Boardroom"
      },
      {
        action: "Minutes of Meeting Recorded",
        actor: "Priya Sharma (Course Coordinator)",
        timestamp: "2026-10-10 02:00 PM",
        version: "1.0",
        details: "Documented discussions and 2 action items"
      },
      {
        action: "Submitted for Trust Head Approval",
        actor: "Priya Sharma (Course Coordinator)",
        timestamp: "2026-10-10 03:30 PM",
        version: "1.0",
        details: "Submitted complete record and MoM to Trust Head"
      },
      {
        action: "Approved by Trust Head",
        actor: "Anita Rao (Trust Head)",
        timestamp: "2026-10-11 11:15 AM",
        version: "1.0",
        details: "Ratified without modifications. Ready for QMS Coordinator distribution."
      }
    ]
  },
  {
    id: "MRM-2026-002",
    title: "AI & Emerging Technologies Course Quality Review",
    description: "Evaluation of specialized post-graduate diploma curriculum, lab hardware setup, and faculty training workshops.",
    version: "1.0",
    versionHistory: [],
    status: "Submitted for Approval",
    scheduledDate: "2026-10-14",
    scheduledTime: "02:30 PM",
    venue: "Division Seminar Hall & Virtual Meet",
    plannedBy: "Rahul Kumar",
    plannedByRole: "QMS Coordinator",
    department: "Quality Assurance & Compliance",
    agenda: [
      "GPU cluster usage and AI lab workload benchmarks",
      "Industry guest lecture integration status",
      "Mid-term student assessment trends and remediation plans",
      "ISO 9001:2015 Clause 7.2 Competency training for instructors"
    ],
    attendees: [
      "Rahul Kumar (QMS Coordinator)",
      "Anita Rao (Trust Head)",
      "Dr. Rajesh Verma (Course Coordinator)",
      "Priya Sharma (Course Coordinator)"
    ],
    mom: {
      recordedBy: "Dr. Rajesh Verma",
      recordedDate: "2026-10-14",
      summary: "Evaluated emerging tech lab setup and mid-term assessments. High student performance noted in Deep Learning practical modules.",
      discussionPoints: [
        "Lab infrastructure scaled to accommodate 60 concurrent researchers.",
        "Need for additional elective course in Generative AI tools agreed."
      ],
      actionItems: [
        {
          id: "ACT-101",
          task: "Draft syllabus for Generative AI elective course",
          assignee: "Dr. Rajesh Verma (Course Coordinator)",
          deadline: "2026-10-30",
          status: "Pending"
        }
      ],
      decisions: [
        "Recommended submitting syllabus draft for Trust Academic Council review."
      ]
    },
    submittedForApprovalAt: "2026-10-14 05:00 PM",
    trustHeadApproval: null,
    sharedWithAll: false,
    sharedAt: null,
    sharedBy: null,
    sharedVersion: null,
    recipients: ["All Course Coordinators"],
    acknowledgements: [],
    timeline: [
      {
        action: "Meeting Planned & Scheduled",
        actor: "Rahul Kumar (QMS Coordinator)",
        timestamp: "2026-10-08 09:30 AM",
        version: "1.0",
        details: "Scheduled for 2026-10-14"
      },
      {
        action: "Minutes of Meeting Recorded",
        actor: "Dr. Rajesh Verma (Course Coordinator)",
        timestamp: "2026-10-14 04:15 PM",
        version: "1.0",
        details: "MoM drafted with syllabus revision recommendations"
      },
      {
        action: "Submitted for Trust Head Approval",
        actor: "Dr. Rajesh Verma (Course Coordinator)",
        timestamp: "2026-10-14 05:00 PM",
        version: "1.0",
        details: "Sent to Trust Head for formal executive approval"
      }
    ]
  },
  {
    id: "MRM-2026-003",
    title: "Annual QMS Governance & System Performance Review",
    description: "Annual strategic meeting reviewing overall Quality Policy, course coordinator risk registers, and Trust objectives.",
    version: "1.0",
    versionHistory: [],
    status: "Scheduled",
    scheduledDate: "2026-10-28",
    scheduledTime: "11:00 AM",
    venue: "Trust Executive Council Room",
    plannedBy: "Rahul Kumar",
    plannedByRole: "QMS Coordinator",
    department: "Quality Assurance & Compliance",
    agenda: [
      "Annual review of QMS quality policy and measurable objectives",
      "Consolidated audit reports and root cause analysis of non-conformances",
      "Feedback from regulatory bodies, universities, and corporate sponsors",
      "Strategic direction for academic year 2026-2027"
    ],
    attendees: [
      "Rahul Kumar (QMS Coordinator)",
      "Anita Rao (Trust Head)",
      "Priya Sharma (Course Coordinator)",
      "Dr. Rajesh Verma (Course Coordinator)",
      "Sunita Patil (Course Coordinator)"
    ],
    mom: null,
    submittedForApprovalAt: null,
    trustHeadApproval: null,
    sharedWithAll: false,
    sharedAt: null,
    sharedBy: null,
    sharedVersion: null,
    recipients: ["All Course Coordinators"],
    acknowledgements: [],
    timeline: [
      {
        action: "Meeting Planned & Scheduled",
        actor: "Rahul Kumar (QMS Coordinator)",
        timestamp: "2026-10-01 11:00 AM",
        version: "1.0",
        details: "Scheduled annual meeting for 2026-10-28"
      }
    ]
  },
  {
    id: "MRM-2026-004",
    title: "Cybersecurity & Cloud Computing Lab Infrastructure Review",
    description: "Quality and infrastructure review of advanced networking, hands-on lab environments, and industry safety compliance.",
    version: "1.0",
    versionHistory: [],
    status: "Planned",
    targetMonth: "November 2026",
    scheduledDate: null,
    scheduledTime: null,
    venue: null,
    plannedBy: "Rahul Kumar",
    plannedByRole: "QMS Coordinator",
    department: "Quality Assurance & Compliance",
    agenda: [
      "Review lab server capacity & cloud virtualization licensing",
      "Student practical benchmark performance & mentor availability",
      "Industry certification alignment for cyber security cohorts",
      "Recommendations for dedicated student sandboxes"
    ],
    attendees: [
      "Rahul Kumar (QMS Coordinator)",
      "Anita Rao (Trust Head)",
      "Sunita Patil (Course Coordinator - Cyber Security)",
      "Dr. Rajesh Verma (Course Coordinator - AI)"
    ],
    mom: null,
    submittedForApprovalAt: null,
    trustHeadApproval: null,
    sharedWithAll: false,
    sharedAt: null,
    sharedBy: null,
    sharedVersion: null,
    recipients: ["All Course Coordinators"],
    acknowledgements: [],
    timeline: [
      {
        action: "Meeting Planned",
        actor: "Rahul Kumar (QMS Coordinator)",
        timestamp: "2026-10-12 09:30 AM",
        version: "1.0",
        details: "Meeting plan created for November 2026 review cycle. Awaiting scheduling."
      }
    ]
  },
  {
    id: "MRM-2026-005",
    title: "Q2 Semester Delivery & Course Accreditation Review",
    description: "Mid-year audit of student outcomes, accreditation documentation, and course revisions across all faculties.",
    version: "1.0",
    versionHistory: [],
    status: "Shared",
    targetMonth: "August 2026",
    scheduledDate: "2026-08-14",
    scheduledTime: "11:00 AM",
    venue: "Main Boardroom / Hybrid Video Conference",
    plannedBy: "Rahul Kumar",
    plannedByRole: "QMS Coordinator",
    department: "Quality Assurance & Compliance",
    agenda: [
      "Semester 2 examination outcomes and grade normalizations",
      "Faculty feedback on syllabus delivery pace and practical hours",
      "Accreditation agency self-study report progress"
    ],
    attendees: [
      "Rahul Kumar (QMS Coordinator)",
      "Anita Rao (Trust Head)",
      "Priya Sharma (Course Coordinator)",
      "Dr. Rajesh Verma (Course Coordinator)"
    ],
    mom: {
      recordedBy: "Rahul Kumar",
      recordedRole: "QMS Coordinator",
      recordedDate: "2026-08-14",
      summary: "Evaluated examination outcomes and accreditation files. Accreditation readiness evaluated at 96%. All action items distributed.",
      discussionPoints: [
        "All course coordinators completed semester syllabus files on schedule.",
        "Accreditation documentation passed internal spot checks."
      ],
      actionItems: [
        {
          id: "ACT-501",
          task: "Publish revised course outcome assessment rubrics",
          assignee: "Priya Sharma (Course Coordinator)",
          deadline: "2026-08-30",
          status: "Completed"
        }
      ],
      decisions: [
        "Ratified outcome assessment rubrics for immediate implementation."
      ]
    },
    submittedForApprovalAt: "2026-08-14 03:00 PM",
    trustHeadApproval: {
      decision: "Approved",
      approved: true,
      approvedBy: "Anita Rao",
      approvedAt: "2026-08-15 10:30 AM",
      remarks: "Fully approved. Executive signoff complete for immediate sharing.",
      versionReviewed: "1.0"
    },
    sharedWithAll: true,
    sharedAt: "2026-08-15 02:00 PM",
    sharedBy: "Rahul Kumar",
    sharedVersion: "1.0",
    recipients: ["All Course Coordinators"],
    acknowledgements: [
      {
        userId: "CC-208",
        name: "Dr. Rajesh Verma",
        role: "Course Coordinator",
        department: "AI & Data Science",
        acknowledgedAt: "2026-08-16 09:15 AM"
      }
    ],
    timeline: [
      {
        action: "Meeting Planned & Scheduled",
        actor: "Rahul Kumar (QMS Coordinator)",
        timestamp: "2026-08-01 10:00 AM",
        version: "1.0",
        details: "Scheduled for 2026-08-14"
      },
      {
        action: "Minutes of Meeting Recorded",
        actor: "Rahul Kumar (QMS Coordinator)",
        timestamp: "2026-08-14 02:00 PM",
        version: "1.0",
        details: "MoM recorded with 1 action item"
      },
      {
        action: "Approved by Trust Head",
        actor: "Anita Rao (Trust Head)",
        timestamp: "2026-08-15 10:30 AM",
        version: "1.0",
        details: "Executive signoff complete"
      },
      {
        action: "Shared with All Course Coordinators",
        actor: "Rahul Kumar (QMS Coordinator)",
        timestamp: "2026-08-15 02:00 PM",
        version: "1.0",
        details: "Distributed to all course coordinators"
      }
    ]
  }
];

const employees = initialUsersList;

const activities = [
  { text: "MRM MoM Approved by Trust Head", actor: "Anita Rao", time: "18 Sep 2026, 10:42 AM", tone: "green" },
  { text: "Document submitted for QMS review", actor: "Priya Sharma", time: "17 Sep 2026, 04:18 PM", tone: "amber" },
  { text: "QMS Coordinator reviewed Course Delivery Template", actor: "Rahul Kumar", time: "16 Sep 2026, 01:06 PM", tone: "blue" },
  { text: "Task assigned to Dr. Rajesh Verma", actor: "Priya Sharma", time: "14 Sep 2026, 09:30 AM", tone: "green" },
  { text: "Course Coordinator scheduled new MRM", actor: "Priya Sharma", time: "13 Sep 2026, 05:12 PM", tone: "blue" }
];

export {
  roles,
  users,
  initialDocuments,
  initialTasks,
  initialNotifications,
  processes,
  employees,
  initialUsersList,
  initialMRMList,
  activities
};
