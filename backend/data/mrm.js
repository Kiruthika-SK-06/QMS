// Management Review Meeting (MRM) Controlled Database
export let mrmData = [
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
    // Dual Approvals: Both Team Head and Internal Auditor
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
    // Email Notification Record
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
    // Uploaded Minutes of Meeting (MoM) File
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
    // Backward compatibility fields
    mom: {
      recordedBy: "Rahul Kumar",
      recordedDate: "2026-10-10",
      summary: "Comprehensive review conducted for all academic and computing programs. Overall quality index reached 94.2%.",
      discussionPoints: [
        "Course delivery completion is on schedule across all 5 centers.",
        "Internal audit identified 2 minor document alignment gaps in course lab manuals."
      ],
      actionItems: [
        {
          id: "ACT-01",
          task: "Incorporate Cloud Architecture module into Advanced Computing syllabus",
          assignee: "Priya Sharma (Course Coordinator)",
          deadline: "2026-10-25",
          status: "In Progress"
        }
      ],
      decisions: ["Approved addition of industry project mentorship sessions."]
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
    acknowledgements: [
      {
        userId: "CC-208",
        name: "Priya Sharma",
        role: "Course Coordinator",
        department: "Advanced Computing Division",
        acknowledgedAt: "2026-10-07 10:15 AM"
      }
    ],
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
