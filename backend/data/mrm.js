// Management Review Meeting (MRM) Controlled Database
export let mrmData = [
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

