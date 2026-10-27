const roles = {
  owner: "Course Coordinator",
  qm: "QMS Coordinator",
  Head: "Trust Head",
  auditor: "Internal Auditor"
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
  },
  auditor: {
    id: "IA-001",
    username: "internalauditor",
    name: "Suresh Menon",
    email: "auditor@cdac.in",
    aliases: [
      "internalauditor",
      "auditor",
      "auditor@cdac.in",
      "suresh.menon@cdac.in",
      "suresh"
    ],
    password: "1234",
    role: "auditor",
    roleTitle: "Internal Auditor",
    initials: "SM",
    employeeId: "IA001",
    department: "Internal Quality Audit Division",
    process: "Quality System & ISO Audit",
    designation: "Lead Internal Auditor",
    status: "Active",
    joinDate: "12 Feb 2023",
    privileges: [
      "Review & Approve MRM Plans",
      "Verify Audit Compliance",
      "View All MoM Records",
      "Audit Trail & Logs"
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
    status: "MoM Uploaded",
    stage: 5,
    targetMonth: "October 2026",
    scheduledDate: "2026-10-10",
    scheduledTime: "10:30 AM",
    venue: "Main Boardroom / Webex Video Conference (Room 402)",
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
      "Suresh Menon (Internal Auditor)",
      "Priya Sharma (Course Coordinator)",
      "Dr. Rajesh Verma (Course Coordinator - AI)",
      "Sunita Patil (Course Coordinator - Cyber Security)"
    ],
    approvals: {
      teamHead: {
        status: "Approved",
        decision: "Approved",
        approverName: "Anita Rao",
        approverRole: "Trust Head",
        approvedAt: "2026-10-06 11:15 AM",
        remarks: "Meeting objectives, agenda, and participant list fully ratified. Proceed with scheduling."
      },
      internalAuditor: {
        status: "Approved",
        decision: "Approved",
        approverName: "Suresh Menon",
        approverRole: "Internal Auditor",
        approvedAt: "2026-10-06 02:40 PM",
        remarks: "Compliance with ISO 9001:2015 Clause 9.3 verified. Agenda meets audit requirements."
      }
    },
    emailNotification: {
      sent: true,
      sentAt: "2026-10-07 09:30 AM",
      sentBy: "Rahul Kumar (QMS Coordinator)",
      subject: "Official Notice: Q3 Academic Quality & Curriculum Review Meeting Scheduled",
      status: "Delivered",
      recipients: [
        { role: "Course Coordinator", name: "Priya Sharma", email: "coordinator@cdac.in" },
        { role: "Course Coordinator", name: "Dr. Rajesh Verma", email: "rajesh.verma@cdac.in" },
        { role: "Course Coordinator", name: "Sunita Patil", email: "sunita.patil@cdac.in" },
        { role: "Trust Head", name: "Anita Rao", email: "head@cdac.in" },
        { role: "Internal Auditor", name: "Suresh Menon", email: "auditor@cdac.in" }
      ],
      emailBodyHtml: "<p>Dear Coordinators and Leadership,</p><p>You are cordially invited to the <strong>Q3 Academic Quality & Curriculum Review Meeting</strong> scheduled on <strong>2026-10-10 at 10:30 AM</strong> in the Main Boardroom / Webex Video Conference.</p><p>Please review the agenda and be prepared with your division course delivery reports.</p><p>Regards,<br/><strong>QMS Quality Office</strong></p>"
    },
    momFile: {
      fileName: "Q3_Academic_Quality_MRM_MoM.pdf",
      fileSize: "2.4 MB",
      fileType: "application/pdf",
      uploadedBy: "Rahul Kumar",
      uploadedByRole: "QMS Coordinator",
      uploadedAt: "2026-10-10 03:30 PM",
      downloadUrl: "/api/mrm/MRM-2026-001/mom-download",
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
    mom: {
      recordedBy: "Rahul Kumar",
      recordedDate: "2026-10-10",
      summary: "Comprehensive review conducted for all academic and computing programs. Overall quality index reached 94.2%.",
      discussionPoints: [
        "Course delivery completion is on schedule across all 5 centers."
      ],
      actionItems: [],
      decisions: []
    },
    trustHeadApproval: {
      decision: "Approved",
      approved: true,
      approvedBy: "Anita Rao",
      approvedAt: "2026-10-06 11:15 AM",
      remarks: "Meeting objectives ratified."
    },
    sharedWithAll: true,
    sharedAt: "2026-10-07 09:30 AM",
    sharedBy: "Rahul Kumar",
    sharedVersion: "1.0",
    recipients: ["All Course Coordinators", "Trust Head", "Internal Auditor"],
    acknowledgements: [],
    timeline: [
      {
        action: "Meeting Planned by QMS Coordinator",
        actor: "Rahul Kumar (QMS Coordinator)",
        timestamp: "2026-10-05 10:00 AM",
        version: "1.0",
        details: "Meeting plan created for Q3 Academic Quality Review."
      },
      {
        action: "Submitted for Dual Approval",
        actor: "Rahul Kumar (QMS Coordinator)",
        timestamp: "2026-10-05 11:30 AM",
        version: "1.0",
        details: "Approval requested from Team Head (Anita Rao) and Internal Auditor (Suresh Menon)."
      },
      {
        action: "Approved by Team Head",
        actor: "Anita Rao (Trust Head)",
        timestamp: "2026-10-06 11:15 AM",
        version: "1.0",
        details: "Meeting objectives, agenda, and participant list ratified."
      },
      {
        action: "Approved by Internal Auditor",
        actor: "Suresh Menon (Internal Auditor)",
        timestamp: "2026-10-06 02:40 PM",
        version: "1.0",
        details: "ISO 9001 compliance verified. Meeting fully approved."
      },
      {
        action: "Meeting Notification Sent via Email",
        actor: "Rahul Kumar (QMS Coordinator)",
        timestamp: "2026-10-07 09:30 AM",
        version: "1.0",
        details: "Formal email notification distributed to all Course Coordinators, Trust Head, and Internal Auditor."
      },
      {
        action: "MoM File Uploaded (Public Access)",
        actor: "Rahul Kumar (QMS Coordinator)",
        timestamp: "2026-10-10 03:30 PM",
        version: "1.0",
        details: "Official Minutes of Meeting file (Q3_Academic_Quality_MRM_MoM.pdf) uploaded and published for everyone."
      }
    ]
  },
  {
    id: "MRM-2026-002",
    title: "AI & Emerging Technologies Course Quality Review",
    description: "Evaluation of specialized post-graduate diploma curriculum, lab hardware setup, and faculty training workshops.",
    version: "1.0",
    versionHistory: [],
    status: "Approved",
    stage: 3,
    targetMonth: "October 2026",
    scheduledDate: "2026-10-28",
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
      "Suresh Menon (Internal Auditor)",
      "Dr. Rajesh Verma (Course Coordinator - AI)",
      "Priya Sharma (Course Coordinator)"
    ],
    approvals: {
      teamHead: {
        status: "Approved",
        decision: "Approved",
        approverName: "Anita Rao",
        approverRole: "Trust Head",
        approvedAt: "2026-10-15 04:00 PM",
        remarks: "Approved. Excellent agenda addressing AI compute capacity."
      },
      internalAuditor: {
        status: "Approved",
        decision: "Approved",
        approverName: "Suresh Menon",
        approverRole: "Internal Auditor",
        approvedAt: "2026-10-16 10:15 AM",
        remarks: "Audit agenda item for faculty competency endorsed. Approved."
      }
    },
    emailNotification: null,
    momFile: null,
    mom: null,
    trustHeadApproval: {
      decision: "Approved",
      approved: true,
      approvedBy: "Anita Rao",
      approvedAt: "2026-10-15 04:00 PM",
      remarks: "Approved without modifications."
    },
    sharedWithAll: false,
    sharedAt: null,
    sharedBy: null,
    sharedVersion: null,
    recipients: ["All Course Coordinators", "Trust Head", "Internal Auditor"],
    acknowledgements: [],
    timeline: [
      {
        action: "Meeting Planned by QMS Coordinator",
        actor: "Rahul Kumar (QMS Coordinator)",
        timestamp: "2026-10-14 09:30 AM",
        version: "1.0",
        details: "Meeting plan drafted for AI & Emerging Tech Review."
      },
      {
        action: "Submitted for Dual Approval",
        actor: "Rahul Kumar (QMS Coordinator)",
        timestamp: "2026-10-14 11:00 AM",
        version: "1.0",
        details: "Submitted to Team Head and Internal Auditor."
      },
      {
        action: "Approved by Team Head",
        actor: "Anita Rao (Trust Head)",
        timestamp: "2026-10-15 04:00 PM",
        version: "1.0",
        details: "Executive signoff granted."
      },
      {
        action: "Approved by Internal Auditor",
        actor: "Suresh Menon (Internal Auditor)",
        timestamp: "2026-10-16 10:15 AM",
        version: "1.0",
        details: "Compliance verified. Ready to share meeting notification through email."
      }
    ]
  },
  {
    id: "MRM-2026-003",
    title: "Annual QMS Governance & System Performance Review",
    description: "Annual strategic meeting reviewing overall Quality Policy, course coordinator risk registers, and Trust objectives.",
    version: "1.0",
    versionHistory: [],
    status: "Pending Approval",
    stage: 2,
    targetMonth: "November 2026",
    scheduledDate: "2026-11-12",
    scheduledTime: "11:00 AM",
    venue: "Trust Executive Council Room & Hybrid Stream",
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
      "Suresh Menon (Internal Auditor)",
      "Priya Sharma (Course Coordinator)",
      "Dr. Rajesh Verma (Course Coordinator)",
      "Sunita Patil (Course Coordinator)"
    ],
    approvals: {
      teamHead: {
        status: "Approved",
        decision: "Approved",
        approverName: "Anita Rao",
        approverRole: "Trust Head",
        approvedAt: "2026-10-24 03:00 PM",
        remarks: "Approved. Awaiting internal auditor signoff."
      },
      internalAuditor: {
        status: "Pending",
        decision: null,
        approverName: null,
        approverRole: null,
        approvedAt: null,
        remarks: null
      }
    },
    emailNotification: null,
    momFile: null,
    mom: null,
    trustHeadApproval: null,
    sharedWithAll: false,
    sharedAt: null,
    sharedBy: null,
    sharedVersion: null,
    recipients: ["All Course Coordinators", "Trust Head", "Internal Auditor"],
    acknowledgements: [],
    timeline: [
      {
        action: "Meeting Planned by QMS Coordinator",
        actor: "Rahul Kumar (QMS Coordinator)",
        timestamp: "2026-10-23 10:00 AM",
        version: "1.0",
        details: "Plan prepared for 2026-11-12"
      },
      {
        action: "Submitted for Dual Approval",
        actor: "Rahul Kumar (QMS Coordinator)",
        timestamp: "2026-10-23 11:30 AM",
        version: "1.0",
        details: "Submitted to Team Head and Internal Auditor"
      },
      {
        action: "Approved by Team Head",
        actor: "Anita Rao (Trust Head)",
        timestamp: "2026-10-24 03:00 PM",
        version: "1.0",
        details: "Approved. Awaiting signoff from Internal Auditor."
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
    stage: 1,
    targetMonth: "November 2026",
    scheduledDate: "2026-11-20",
    scheduledTime: "10:00 AM",
    venue: "Cyber Security Lab Conference Hall",
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
      "Suresh Menon (Internal Auditor)",
      "Sunita Patil (Course Coordinator - Cyber Security)",
      "Dr. Rajesh Verma (Course Coordinator - AI)"
    ],
    approvals: {
      teamHead: {
        status: "Pending",
        decision: null,
        approverName: null,
        approverRole: null,
        approvedAt: null,
        remarks: null
      },
      internalAuditor: {
        status: "Pending",
        decision: null,
        approverName: null,
        approverRole: null,
        approvedAt: null,
        remarks: null
      }
    },
    emailNotification: null,
    momFile: null,
    mom: null,
    trustHeadApproval: null,
    sharedWithAll: false,
    sharedAt: null,
    sharedBy: null,
    sharedVersion: null,
    recipients: ["All Course Coordinators", "Trust Head", "Internal Auditor"],
    acknowledgements: [],
    timeline: [
      {
        action: "Meeting Planned by QMS Coordinator",
        actor: "Rahul Kumar (QMS Coordinator)",
        timestamp: "2026-10-25 09:30 AM",
        version: "1.0",
        details: "Meeting plan drafted. Ready to request approval from Team Head & Internal Auditor."
      }
    ]
  }
];

const employees = initialUsersList;

const activities = [
  { title: "MRM Approved", detail: "Trust Head Sign-off", text: "MRM MoM Approved by Trust Head", actor: "Anita Rao", time: "18 Sep 2026, 10:42 AM", tone: "green" },
  { title: "Document Submitted", detail: "Course Delivery Procedure", text: "Document submitted for QMS review", actor: "Priya Sharma", time: "17 Sep 2026, 04:18 PM", tone: "amber" },
  { title: "Document Reviewed", detail: "Course Delivery Template", text: "QMS Coordinator reviewed Course Delivery Template", actor: "Rahul Kumar", time: "16 Sep 2026, 01:06 PM", tone: "blue" },
  { title: "Task Assigned", detail: "Review syllabus checklist (Dr. Rajesh Verma)", text: "Task assigned to Dr. Rajesh Verma", actor: "Priya Sharma", time: "14 Sep 2026, 09:30 AM", tone: "green" },
  { title: "MRM Scheduled", detail: "Annual Curriculum Review", text: "Course Coordinator scheduled new MRM", actor: "Priya Sharma", time: "13 Sep 2026, 05:12 PM", tone: "blue" }
];

export const initialAuditList = [
  {
    id: "IA-2026-001",
    title: "Q4 Course Delivery & Curriculum Compliance Audit",
    process: "Course Management",
    processId: "PROC-01",
    auditDates: {
      startDate: "2026-11-05",
      endDate: "2026-11-06"
    },
    scheduledDate: "2026-11-05 to 2026-11-06",
    internalAuditor: {
      id: "IA001",
      name: "Vikas Deshmukh",
      role: "Internal Auditor",
      email: "vikas.deshmukh@cdac.in",
      department: "Internal Quality Audit Cell"
    },
    internalAuditee: {
      id: "CC001",
      name: "Priya Sharma",
      role: "Course Coordinator",
      email: "priya.sharma@cdac.in",
      department: "Academic Division"
    },
    scheduledBy: {
      name: "Rahul Kumar",
      role: "QMS Coordinator",
      scheduledAt: "2026-10-24 10:00 AM"
    },
    scope: "Evaluation of course delivery milestones, syllabus progress tracking, laboratory sessions, and compliance with ISO 9001:2015 Clause 8.5.",
    venue: "Academic Block - Room 204 & QMS Portal",
    status: "Closed",
    stage: 6,
    stageLabel: "Completed / Closed",

    scheduleShared: {
      shared: true,
      sharedAt: "2026-10-24 11:30 AM",
      sharedBy: "Rahul Kumar (QMS Coordinator)",
      docTitle: "Internal_Audit_Schedule_IA-2026-001.pdf",
      recipients: [
        { role: "Course Coordinator", name: "Priya Sharma", email: "priya.sharma@cdac.in" },
        { role: "Trust Head", name: "Anita Rao", email: "anita.rao@cdac.in" },
        { role: "Internal Auditor", name: "Vikas Deshmukh", email: "vikas.deshmukh@cdac.in" }
      ]
    },

    trustHeadConfirmation: {
      confirmed: true,
      confirmedBy: "Anita Rao",
      confirmedRole: "Trust Head",
      confirmedAt: "2026-10-25 02:15 PM",
      remarks: "Audit plan and schedule verified. Approved for execution across Academic Division."
    },

    noticingSheet: {
      submitted: true,
      sheetNo: "NS-2026-042",
      submittedBy: "Vikas Deshmukh (Internal Auditor)",
      submittedAt: "2026-11-06 04:30 PM",
      fileName: "Noticing_Sheet_IA-2026-001.pdf",
      summary: "Audit completed successfully. 1 Minor Non-Conformance observed regarding course logbook signatures for weeks 4 and 5.",
      findings: [
        {
          id: "NC-01",
          type: "Minor NC",
          clause: "ISO 9001:2015 Clause 8.5.1",
          description: "Weekly practical lab attendance and syllabus delivery logbook was not signed by the Course Coordinator for weeks 4 and 5.",
          targetDate: "2026-11-15"
        }
      ]
    },

    ncDocs: {
      shared: true,
      sharedBy: "Rahul Kumar (QMS Coordinator)",
      sharedAt: "2026-11-07 10:15 AM",
      fileName: "NC_Formal_Notice_IA-2026-001.pdf",
      remarks: "Noticing sheet verified. Formal NC-01 issued. Auditee requested to submit Root Cause Analysis and Corrective Action Plan by 2026-11-15.",
      sharedWith: [
        { role: "Internal Auditor", name: "Vikas Deshmukh" },
        { role: "Internal Auditee", name: "Priya Sharma (Course Coordinator)" }
      ]
    },

    auditeeClosure: {
      closed: true,
      closedBy: "Priya Sharma (Course Coordinator)",
      closedAt: "2026-11-12 03:45 PM",
      rootCause: "Manual paper sign-off workflow was delayed due to mid-semester exams and faculty travel schedule.",
      correctiveAction: "All pending logbook entries for weeks 4 and 5 have been verified and signed off. Implemented weekly digital attendance sign-off reminder on ERP portal.",
      evidenceFileName: "Signed_Lab_Logbooks_Weeks4_5.pdf",
      remarks: "Corrective actions completed. Evidence verified and submitted for QMS closure."
    },

    qmsFinalClosure: {
      closed: true,
      closedBy: "Rahul Kumar (QMS Coordinator)",
      closedAt: "2026-11-14 11:00 AM",
      remarks: "Evidence reviewed and cross-verified with ERP logs. Corrective action is satisfactory. NC-01 officially closed. Audit process completed.",
      completedAt: "2026-11-14 11:00 AM"
    },

    timeline: [
      { action: "Audit Scheduled", actor: "Rahul Kumar (QMS Coordinator)", timestamp: "2026-10-24 10:00 AM", details: "Audit scheduled for Course Management process" },
      { action: "Schedule Shared", actor: "Rahul Kumar (QMS Coordinator)", timestamp: "2026-10-24 11:30 AM", details: "Schedule docs shared with Auditee, Trust Head, and Auditor" },
      { action: "Schedule Confirmed", actor: "Anita Rao (Trust Head)", timestamp: "2026-10-25 02:15 PM", details: "Trust Head confirmed audit schedule" },
      { action: "Noticing Sheet Submitted", actor: "Vikas Deshmukh (Internal Auditor)", timestamp: "2026-11-06 04:30 PM", details: "Auditor uploaded noticing sheet with 1 Minor NC" },
      { action: "NC Docs Shared", actor: "Rahul Kumar (QMS Coordinator)", timestamp: "2026-11-07 10:15 AM", details: "QMS Coordinator reviewed and shared NC docs to Auditor & Auditee" },
      { action: "Auditee Closure Submitted", actor: "Priya Sharma (Course Coordinator)", timestamp: "2026-11-12 03:45 PM", details: "Auditee submitted CAPA and evidence" },
      { action: "Final Audit Closed", actor: "Rahul Kumar (QMS Coordinator)", timestamp: "2026-11-14 11:00 AM", details: "QMS Coordinator verified corrective actions and closed entire audit process" }
    ]
  },
  {
    id: "IA-2026-002",
    title: "Admissions & Student Enrollment Verification Audit",
    process: "Admissions & Enrollment",
    processId: "PROC-02",
    auditDates: {
      startDate: "2026-11-18",
      endDate: "2026-11-19"
    },
    scheduledDate: "2026-11-18 to 2026-11-19",
    internalAuditor: {
      id: "IA002",
      name: "Suresh Menon",
      role: "Internal Auditor",
      email: "suresh.menon@cdac.in",
      department: "Internal Quality Audit Cell"
    },
    internalAuditee: {
      id: "CC002",
      name: "Dr. Rajesh Verma",
      role: "Course Coordinator",
      email: "rajesh.verma@cdac.in",
      department: "AI & Advanced Computing"
    },
    scheduledBy: {
      name: "Rahul Kumar",
      role: "QMS Coordinator",
      scheduledAt: "2026-10-25 09:30 AM"
    },
    scope: "Review of student admission eligibility verification, fee receipts, registration registers, and ISO 9001:2015 Clause 8.2 conformity.",
    venue: "Admissions Center & Online ERP",
    status: "Closed by Auditee",
    stage: 5,
    stageLabel: "Closed by Auditee (Pending QMS Final Close)",

    scheduleShared: {
      shared: true,
      sharedAt: "2026-10-25 10:15 AM",
      sharedBy: "Rahul Kumar (QMS Coordinator)",
      docTitle: "Internal_Audit_Schedule_IA-2026-002.pdf",
      recipients: [
        { role: "Course Coordinator", name: "Dr. Rajesh Verma", email: "rajesh.verma@cdac.in" },
        { role: "Trust Head", name: "Anita Rao", email: "anita.rao@cdac.in" },
        { role: "Internal Auditor", name: "Suresh Menon", email: "suresh.menon@cdac.in" }
      ]
    },

    trustHeadConfirmation: {
      confirmed: true,
      confirmedBy: "Anita Rao",
      confirmedRole: "Trust Head",
      confirmedAt: "2026-10-25 03:00 PM",
      remarks: "Audit dates ratified. Ensure all admission registers are made available."
    },

    noticingSheet: {
      submitted: true,
      sheetNo: "NS-2026-045",
      submittedBy: "Suresh Menon (Internal Auditor)",
      submittedAt: "2026-11-19 05:00 PM",
      fileName: "Noticing_Sheet_IA-2026-002.pdf",
      summary: "Verification completed for 120 student admissions. 1 Observation noted regarding archival of transfer certificates.",
      findings: [
        {
          id: "NC-02",
          type: "Minor NC",
          clause: "ISO 9001:2015 Clause 7.5.3",
          description: "Digital scanned copies of transfer certificates for 3 lateral entry candidates were pending upload in ERP repository.",
          targetDate: "2026-11-26"
        }
      ]
    },

    ncDocs: {
      shared: true,
      sharedBy: "Rahul Kumar (QMS Coordinator)",
      sharedAt: "2026-11-20 11:00 AM",
      fileName: "NC_Formal_Notice_IA-2026-002.pdf",
      remarks: "NC-02 issued. Auditee requested to complete scanned uploads and submit closure.",
      sharedWith: [
        { role: "Internal Auditor", name: "Suresh Menon" },
        { role: "Internal Auditee", name: "Dr. Rajesh Verma (Course Coordinator)" }
      ]
    },

    auditeeClosure: {
      closed: true,
      closedBy: "Dr. Rajesh Verma (Course Coordinator)",
      closedAt: "2026-11-22 04:10 PM",
      rootCause: "Late document submission by candidates during spot counseling rounds.",
      correctiveAction: "All 3 transfer certificates scanned in high resolution, uploaded to student ERP profiles, and physically indexed in archive binder #12.",
      evidenceFileName: "Lateral_Entry_TC_Index_Receipts.pdf",
      remarks: "Documents verified and uploaded. Requesting final QMS sign-off."
    },

    qmsFinalClosure: null,

    timeline: [
      { action: "Audit Scheduled", actor: "Rahul Kumar (QMS Coordinator)", timestamp: "2026-10-25 09:30 AM", details: "Audit scheduled for Admissions & Enrollment" },
      { action: "Schedule Shared", actor: "Rahul Kumar (QMS Coordinator)", timestamp: "2026-10-25 10:15 AM", details: "Schedule docs shared with Auditee, Trust Head, and Auditor" },
      { action: "Schedule Confirmed", actor: "Anita Rao (Trust Head)", timestamp: "2026-10-25 03:00 PM", details: "Trust Head confirmed audit schedule" },
      { action: "Noticing Sheet Submitted", actor: "Suresh Menon (Internal Auditor)", timestamp: "2026-11-19 05:00 PM", details: "Auditor uploaded noticing sheet with 1 Minor NC" },
      { action: "NC Docs Shared", actor: "Rahul Kumar (QMS Coordinator)", timestamp: "2026-11-20 11:00 AM", details: "QMS Coordinator shared NC docs to Auditor & Auditee" },
      { action: "Auditee Closure Submitted", actor: "Dr. Rajesh Verma (Course Coordinator)", timestamp: "2026-11-22 04:10 PM", details: "Auditee uploaded evidence and closed NC" }
    ]
  },
  {
    id: "IA-2026-003",
    title: "Semester Examination & Evaluation Quality Audit",
    process: "Examination & Evaluation",
    processId: "PROC-03",
    auditDates: {
      startDate: "2026-11-25",
      endDate: "2026-11-26"
    },
    scheduledDate: "2026-11-25 to 2026-11-26",
    internalAuditor: {
      id: "IA001",
      name: "Vikas Deshmukh",
      role: "Internal Auditor",
      email: "vikas.deshmukh@cdac.in",
      department: "Internal Quality Audit Cell"
    },
    internalAuditee: {
      id: "CC001",
      name: "Priya Sharma",
      role: "Course Coordinator",
      email: "priya.sharma@cdac.in",
      department: "Academic Division"
    },
    scheduledBy: {
      name: "Rahul Kumar",
      role: "QMS Coordinator",
      scheduledAt: "2026-10-26 09:00 AM"
    },
    scope: "Verification of question paper moderation protocol, answer script double evaluation records, and marks tabulation security under ISO 9001:2015 Clause 9.1.",
    venue: "Confidential Examination Section",
    status: "NC Docs Shared",
    stage: 4,
    stageLabel: "NC Docs Shared (Action Required by Auditee)",

    scheduleShared: {
      shared: true,
      sharedAt: "2026-10-26 09:30 AM",
      sharedBy: "Rahul Kumar (QMS Coordinator)",
      docTitle: "Internal_Audit_Schedule_IA-2026-003.pdf",
      recipients: [
        { role: "Course Coordinator", name: "Priya Sharma", email: "priya.sharma@cdac.in" },
        { role: "Trust Head", name: "Anita Rao", email: "anita.rao@cdac.in" },
        { role: "Internal Auditor", name: "Vikas Deshmukh", email: "vikas.deshmukh@cdac.in" }
      ]
    },

    trustHeadConfirmation: {
      confirmed: true,
      confirmedBy: "Anita Rao",
      confirmedRole: "Trust Head",
      confirmedAt: "2026-10-26 11:45 AM",
      remarks: "Confirmed. Ensure strict adherence to question paper confidentiality protocols."
    },

    noticingSheet: {
      submitted: true,
      sheetNo: "NS-2026-049",
      submittedBy: "Vikas Deshmukh (Internal Auditor)",
      submittedAt: "2026-11-26 04:00 PM",
      fileName: "Noticing_Sheet_IA-2026-003.pdf",
      summary: "Evaluation system inspected. Moderation logs require formal sign-off sheet attachment.",
      findings: [
        {
          id: "NC-03",
          type: "Minor NC",
          clause: "ISO 9001:2015 Clause 8.5.2",
          description: "Moderation committee minutes lacked external expert countersignature on Form EX-04.",
          targetDate: "2026-12-05"
        }
      ]
    },

    ncDocs: {
      shared: true,
      sharedBy: "Rahul Kumar (QMS Coordinator)",
      sharedAt: "2026-11-27 10:30 AM",
      fileName: "NC_Formal_Notice_IA-2026-003.pdf",
      remarks: "Formal NC-03 communicated to Course Coordinator and Internal Auditor. Auditee closure due within 7 days.",
      sharedWith: [
        { role: "Internal Auditor", name: "Vikas Deshmukh" },
        { role: "Internal Auditee", name: "Priya Sharma (Course Coordinator)" }
      ]
    },

    auditeeClosure: null,
    qmsFinalClosure: null,

    timeline: [
      { action: "Audit Scheduled", actor: "Rahul Kumar (QMS Coordinator)", timestamp: "2026-10-26 09:00 AM", details: "Audit scheduled for Examination & Evaluation" },
      { action: "Schedule Shared", actor: "Rahul Kumar (QMS Coordinator)", timestamp: "2026-10-26 09:30 AM", details: "Schedule docs shared with Auditee, Trust Head, and Auditor" },
      { action: "Schedule Confirmed", actor: "Anita Rao (Trust Head)", timestamp: "2026-10-26 11:45 AM", details: "Trust Head confirmed audit schedule" },
      { action: "Noticing Sheet Submitted", actor: "Vikas Deshmukh (Internal Auditor)", timestamp: "2026-11-26 04:00 PM", details: "Auditor uploaded noticing sheet with 1 Minor NC" },
      { action: "NC Docs Shared", actor: "Rahul Kumar (QMS Coordinator)", timestamp: "2026-11-27 10:30 AM", details: "QMS Coordinator reviewed and shared NC docs to Auditor & Auditee" }
    ]
  },
  {
    id: "IA-2026-004",
    title: "Curriculum Modernization & Lab Infrastructure Audit",
    process: "Curriculum Design & Review",
    processId: "PROC-04",
    auditDates: {
      startDate: "2026-12-02",
      endDate: "2026-12-03"
    },
    scheduledDate: "2026-12-02 to 2026-12-03",
    internalAuditor: {
      id: "IA002",
      name: "Suresh Menon",
      role: "Internal Auditor",
      email: "suresh.menon@cdac.in",
      department: "Internal Quality Audit Cell"
    },
    internalAuditee: {
      id: "CC002",
      name: "Dr. Rajesh Verma",
      role: "Course Coordinator",
      email: "rajesh.verma@cdac.in",
      department: "Academic Division"
    },
    scheduledBy: {
      name: "Rahul Kumar",
      role: "QMS Coordinator",
      scheduledAt: "2026-10-26 02:00 PM"
    },
    scope: "Review of latest industry-aligned syllabus modules, GPU lab cluster availability, and software license records under ISO 9001 Clause 7.1.3.",
    venue: "High Performance Computing Lab",
    status: "Noticing Sheet Submitted",
    stage: 3,
    stageLabel: "Noticing Sheet Submitted (Pending QMS Review)",

    scheduleShared: {
      shared: true,
      sharedAt: "2026-10-26 02:30 PM",
      sharedBy: "Rahul Kumar (QMS Coordinator)",
      docTitle: "Internal_Audit_Schedule_IA-2026-004.pdf",
      recipients: [
        { role: "Course Coordinator", name: "Dr. Rajesh Verma", email: "rajesh.verma@cdac.in" },
        { role: "Trust Head", name: "Anita Rao", email: "anita.rao@cdac.in" },
        { role: "Internal Auditor", name: "Suresh Menon", email: "suresh.menon@cdac.in" }
      ]
    },

    trustHeadConfirmation: {
      confirmed: true,
      confirmedBy: "Anita Rao",
      confirmedRole: "Trust Head",
      confirmedAt: "2026-10-26 04:00 PM",
      remarks: "Schedule confirmed. Lab safety compliance must also be examined."
    },

    noticingSheet: {
      submitted: true,
      sheetNo: "NS-2026-052",
      submittedBy: "Suresh Menon (Internal Auditor)",
      submittedAt: "2026-12-03 04:30 PM",
      fileName: "Noticing_Sheet_IA-2026-004.pdf",
      summary: "Lab resources audited. GPU software updates recorded; identified missing periodic maintenance log for Server Node 04.",
      findings: [
        {
          id: "NC-04",
          type: "Minor NC",
          clause: "ISO 9001:2015 Clause 7.1.3",
          description: "Server Node 04 quarterly preventive maintenance log was not signed by system administrator.",
          targetDate: "2026-12-12"
        }
      ]
    },

    ncDocs: null,
    auditeeClosure: null,
    qmsFinalClosure: null,

    timeline: [
      { action: "Audit Scheduled", actor: "Rahul Kumar (QMS Coordinator)", timestamp: "2026-10-26 02:00 PM", details: "Audit scheduled for Curriculum Design & Review" },
      { action: "Schedule Shared", actor: "Rahul Kumar (QMS Coordinator)", timestamp: "2026-10-26 02:30 PM", details: "Schedule docs shared with Auditee, Trust Head, and Auditor" },
      { action: "Schedule Confirmed", actor: "Anita Rao (Trust Head)", timestamp: "2026-10-26 04:00 PM", details: "Trust Head confirmed audit schedule" },
      { action: "Noticing Sheet Submitted", actor: "Suresh Menon (Internal Auditor)", timestamp: "2026-12-03 04:30 PM", details: "Auditor shared noticing sheet to QMS Coordinator" }
    ]
  },
  {
    id: "IA-2026-005",
    title: "Student Feedback Analysis & Continual Improvement Audit",
    process: "Quality Management",
    processId: "PROC-05",
    auditDates: {
      startDate: "2026-12-10",
      endDate: "2026-12-11"
    },
    scheduledDate: "2026-12-10 to 2026-12-11",
    internalAuditor: {
      id: "IA001",
      name: "Vikas Deshmukh",
      role: "Internal Auditor",
      email: "vikas.deshmukh@cdac.in",
      department: "Internal Quality Audit Cell"
    },
    internalAuditee: {
      id: "CC001",
      name: "Priya Sharma",
      role: "Course Coordinator",
      email: "priya.sharma@cdac.in",
      department: "Academic Division"
    },
    scheduledBy: {
      name: "Rahul Kumar",
      role: "QMS Coordinator",
      scheduledAt: "2026-10-26 03:30 PM"
    },
    scope: "Verification of student grievance redressal records, mid-term course feedback surveys, and corrective actions under ISO 9001 Clause 9.1.2.",
    venue: "Quality Management Group Office",
    status: "Schedule Shared",
    stage: 2,
    stageLabel: "Schedule Shared (Awaiting Trust Head Confirmation)",

    scheduleShared: {
      shared: true,
      sharedAt: "2026-10-26 03:45 PM",
      sharedBy: "Rahul Kumar (QMS Coordinator)",
      docTitle: "Internal_Audit_Schedule_IA-2026-005.pdf",
      recipients: [
        { role: "Course Coordinator", name: "Priya Sharma", email: "priya.sharma@cdac.in" },
        { role: "Trust Head", name: "Anita Rao", email: "anita.rao@cdac.in" },
        { role: "Internal Auditor", name: "Vikas Deshmukh", email: "vikas.deshmukh@cdac.in" }
      ]
    },

    trustHeadConfirmation: null,
    noticingSheet: null,
    ncDocs: null,
    auditeeClosure: null,
    qmsFinalClosure: null,

    timeline: [
      { action: "Audit Scheduled", actor: "Rahul Kumar (QMS Coordinator)", timestamp: "2026-10-26 03:30 PM", details: "Audit scheduled for Student Feedback & Continual Improvement" },
      { action: "Schedule Shared", actor: "Rahul Kumar (QMS Coordinator)", timestamp: "2026-10-26 03:45 PM", details: "Schedule docs shared with Auditee, Trust Head, and Auditor" }
    ]
  },
  {
    id: "IA-2026-006",
    title: "Faculty Qualifications & Competency Verification Audit",
    process: "Faculty Development",
    processId: "PROC-06",
    auditDates: {
      startDate: "2026-12-15",
      endDate: "2026-12-16"
    },
    scheduledDate: "2026-12-15 to 2026-12-16",
    internalAuditor: {
      id: "IA002",
      name: "Suresh Menon",
      role: "Internal Auditor",
      email: "suresh.menon@cdac.in",
      department: "Internal Quality Audit Cell"
    },
    internalAuditee: {
      id: "CC002",
      name: "Dr. Rajesh Verma",
      role: "Course Coordinator",
      email: "rajesh.verma@cdac.in",
      department: "Academic Division"
    },
    scheduledBy: {
      name: "Rahul Kumar",
      role: "QMS Coordinator",
      scheduledAt: "2026-10-26 04:00 PM"
    },
    scope: "Review of faculty training records, certifications, peer evaluations, and compliance with ISO 9001:2015 Clause 7.2.",
    venue: "Academic Dean's Conference Room",
    status: "Scheduled",
    stage: 1,
    stageLabel: "Draft Scheduled (Ready to Share)",

    scheduleShared: null,
    trustHeadConfirmation: null,
    noticingSheet: null,
    ncDocs: null,
    auditeeClosure: null,
    qmsFinalClosure: null,

    timeline: [
      { action: "Audit Scheduled", actor: "Rahul Kumar (QMS Coordinator)", timestamp: "2026-10-26 04:00 PM", details: "Audit scheduled for Faculty Development & Competency" }
    ]
  }
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
