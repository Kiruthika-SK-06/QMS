// External Quality Audit (ISO 9001:2015) Controlled Database
// Exact 5-Step Workflow:
// 1. External Auditor schedules and emails schedule to QMS Coordinator only.
// 2. QMS Coordinator shares scheduled meeting to all: Trust Head, Course Coord, and Internal Auditor.
//    External Auditor comes directly to the office to audit the system and gives NC doc in paper to QMS Coordinator.
// 3. QMS Coordinator uploads scanned copy of paper NC doc and shares it ONLY to Course Coordinators.
// 4. Course Coordinator downloads scanned NC docs and closes the NC resolution.
// 5. External Auditor communicates approval result to QMS Coordinator through email or directly coming to office.
//    Once QMS Coordinator gets approval, QMS Coordinator closes the entire process (ISO 9001 Certified).
// Constraint: Each step can only be performed after the previous step is completed. External Auditor has NO system login or dashboard.

export let externalAuditData = [
  {
    id: "EA-2026-001",
    title: "ISO 9001:2015 Annual Surveillance Audit - Academic Programs & Quality Operations",
    scope: "Annual surveillance evaluation of academic syllabus coverage, student feedback mechanisms, laboratory safety protocols, and institutional quality governance under ISO 9001:2015 Clauses 4 through 10.",
    externalAgency: "TÜV SÜD South Asia Certification Body",
    leadAuditor: {
      name: "Dr. Robert Vance",
      title: "Lead External Auditor (ISO 9001:2015)",
      agency: "TÜV SÜD South Asia",
      email: "robert.vance@tuvsud.com",
      phone: "+91 98230 45678"
    },
    targetPeriod: "December 2026",
    scheduledDate: "2026-12-10",
    scheduledTime: "09:30 AM",
    venue: "Main Boardroom (Executive Council) & In-Person Campus Audit",
    department: "Quality Assurance & Academic Governance",
    process: "All Processes (Comprehensive Academic Quality Review)",
    stage: 1,
    status: "Audit Schedule Received (via Email)",
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,

    // Step 1: External Auditor scheduled and sent email to QMS Coordinator
    incomingScheduleEmail: {
      received: true,
      receivedAt: "2026-11-04 10:15 AM",
      from: "Dr. Robert Vance <robert.vance@tuvsud.com>",
      to: "Rahul Kumar (QMS Coordinator) <qm@cdac.in>",
      subject: "Official Notice: ISO 9001:2015 Surveillance Audit Plan & Schedule - C-DAC",
      bodyHtml: "<p>Dear Mr. Rahul Kumar (Lead QMS Coordinator),</p><p>This is to confirm that the annual <strong>ISO 9001:2015 Surveillance Audit</strong> for C-DAC Academic Quality Programs is scheduled for <strong>2026-12-10 starting at 09:30 AM</strong>.</p><p>I will be visiting your campus in person to audit the system, interview course coordinators, inspect physical lab logs, and review institutional quality processes. Please find attached the formal timetable and share it with your division coordinators, Trust Head, and internal audit cell.</p><p>Sincerely,<br/><strong>Dr. Robert Vance</strong><br/>Lead Auditor, TÜV SÜD South Asia</p>",
      attachments: [
        {
          fileName: "TUV_ISO9001_Surveillance_Audit_Plan_2026.pdf",
          fileSize: "1.9 MB",
          fileType: "application/pdf"
        }
      ]
    },

    shareWithStakeholders: null,
    ncDocument: null,
    ncClosure: null,
    externalAuditorApproval: null,
    qmsClosure: null,

    timeline: [
      {
        action: "Audit Schedule Received via Email",
        actor: "Dr. Robert Vance (Lead External Auditor - TÜV SÜD)",
        timestamp: "2026-11-04 10:15 AM",
        details: "External audit schedule and official timetable received via email by QMS Coordinator Rahul Kumar. Ready to share to all stakeholders."
      }
    ]
  },
  {
    id: "EA-2026-002",
    title: "ISO 9001:2015 Quality & Laboratory Safety Compliance Audit",
    scope: "Evaluation of high-performance computing hardware labs, network infrastructure safety protocols, and student access logs under ISO 9001:2015 Clause 8.",
    externalAgency: "DNV GL Business Assurance",
    leadAuditor: {
      name: "Marcus Sterling",
      title: "Senior Lead External Auditor",
      agency: "DNV GL Business Assurance",
      email: "marcus.sterling@dnvgl.com",
      phone: "+91 98450 12345"
    },
    targetPeriod: "November 2026",
    scheduledDate: "2026-11-20",
    scheduledTime: "10:00 AM",
    venue: "Division Conference Hall & High Performance Computing Labs",
    department: "Academic Infrastructure & Computing",
    process: "Laboratory Safety & Facilities",
    stage: 2,
    status: "Schedule Shared (On-Site Audit in Progress)",
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,

    incomingScheduleEmail: {
      received: true,
      receivedAt: "2026-10-28 09:30 AM",
      from: "Marcus Sterling <marcus.sterling@dnvgl.com>",
      to: "Rahul Kumar (QMS Coordinator) <qm@cdac.in>",
      subject: "DNV GL External Quality Audit Timetable & Campus Visit",
      bodyHtml: "<p>Dear Rahul Kumar,</p><p>We confirm the upcoming on-site surveillance audit on 2026-11-20. The auditor team will arrive at 10:00 AM for physical inspection of labs and course delivery records.</p><p>Regards,<br/>Marcus Sterling, DNV GL</p>",
      attachments: [{ fileName: "DNVGL_Audit_Notification_Nov2026.pdf", fileSize: "1.6 MB" }]
    },

    // Step 2: Shared to all stakeholders
    shareWithStakeholders: {
      shared: true,
      sharedAt: "2026-10-28 02:00 PM",
      sharedBy: "Rahul Kumar (QMS Coordinator)",
      noticeSubject: "Announcement: ISO 9001:2015 External Audit Scheduled on 20-Nov-2026",
      noticeMessage: "All Course Coordinators, Trust Head, and Internal Auditor: External Auditor Marcus Sterling (DNV GL) will visit the office in person on 20-Nov-2026 to audit the system. Please prepare lab manuals, student registers, and course records.",
      recipients: [
        { role: "Trust Head", name: "Anita Rao", email: "head@cdac.in" },
        { role: "Course Coordinator", name: "Priya Sharma", email: "coordinator@cdac.in" },
        { role: "Course Coordinator", name: "Dr. Rajesh Verma", email: "rajesh.verma@cdac.in" },
        { role: "Internal Auditor", name: "Suresh Menon", email: "auditor@cdac.in" }
      ]
    },

    ncDocument: null,
    ncClosure: null,
    externalAuditorApproval: null,
    qmsClosure: null,

    timeline: [
      {
        action: "Audit Schedule Received via Email",
        actor: "Marcus Sterling (Lead Auditor - DNV GL)",
        timestamp: "2026-10-28 09:30 AM",
        details: "Audit timetable received via email by QMS Coordinator."
      },
      {
        action: "Schedule & Meeting Details Shared to All Stakeholders",
        actor: "Rahul Kumar (QMS Coordinator)",
        timestamp: "2026-10-28 02:00 PM",
        details: "Meeting schedule and notice dispatched to all Course Coordinators, Trust Head Anita Rao, and Internal Auditor Suresh Menon."
      }
    ]
  },
  {
    id: "EA-2026-003",
    title: "ISO 9001:2015 Recertification Audit - Advanced Computing & Cyber Security Curriculum",
    scope: "Evaluation of post-graduate curriculum delivery, practical cloud computing laboratory records, assessment transparency, and student grievance records.",
    externalAgency: "BSI Quality & Compliance Assurance",
    leadAuditor: {
      name: "Dr. Katherine Price",
      title: "Principal External Auditor",
      agency: "BSI Group International",
      email: "katherine.price@bsigroup.com",
      phone: "+91 99887 65432"
    },
    targetPeriod: "October 2026",
    scheduledDate: "2026-10-18",
    scheduledTime: "10:00 AM",
    venue: "Division Conference Room & Campus Labs",
    department: "Academic Quality & Compliance",
    process: "Curriculum Design & Review",
    stage: 3,
    status: "Scanned NC Doc Uploaded (Course Coord Only)",
    createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,

    incomingScheduleEmail: {
      received: true,
      receivedAt: "2026-10-05 09:00 AM",
      from: "Dr. Katherine Price <katherine.price@bsigroup.com>",
      to: "Rahul Kumar (QMS Coordinator) <qm@cdac.in>",
      subject: "BSI ISO 9001:2015 Recertification Audit Schedule Notice",
      bodyHtml: "<p>Dear Rahul Kumar,</p><p>Please find attached the schedule for the ISO 9001:2015 Recertification Audit on 2026-10-18. The audit will be conducted in person on campus.</p><p>Regards,<br/>Dr. Katherine Price</p>",
      attachments: [{ fileName: "BSI_Audit_Notification_Oct2026.pdf", fileSize: "1.4 MB" }]
    },

    shareWithStakeholders: {
      shared: true,
      sharedAt: "2026-10-05 11:30 AM",
      sharedBy: "Rahul Kumar (QMS Coordinator)",
      noticeSubject: "External Audit Notice: BSI Recertification Scheduled on 18-Oct-2026",
      noticeMessage: "External audit schedule received and shared to all Course Coordinators, Trust Head, and Internal Auditor.",
      recipients: [
        { role: "Course Coordinator", name: "Priya Sharma", email: "coordinator@cdac.in" },
        { role: "Course Coordinator", name: "Dr. Rajesh Verma", email: "rajesh.verma@cdac.in" },
        { role: "Trust Head", name: "Anita Rao", email: "head@cdac.in" },
        { role: "Internal Auditor", name: "Suresh Menon", email: "auditor@cdac.in" }
      ]
    },

    // Step 3: Auditor visited office in person, handed paper NC doc to QMS Coord; QMS Coord uploaded scanned copy & shared to Course Coordinators ONLY
    ncDocument: {
      receivedFromExternalAuditorInPerson: true,
      receivedAtOffice: "2026-10-18 04:30 PM",
      isScannedPaperCopy: true,
      uploadedAt: "2026-10-19 11:00 AM",
      uploadedBy: "Rahul Kumar (QMS Coordinator)",
      sharedWithCourseCoordinatorsOnly: true,
      fileName: "BSI_ISO9001_Scanned_Paper_NC_Report.pdf",
      fileSize: "2.3 MB",
      fileType: "application/pdf",
      summary: "Two minor non-conformances identified by External Auditor during physical office audit: practical exercise verification logs and version labelling on supplementary cyber lab manuals.",
      targetClosureDate: "2026-11-20",
      findings: [
        {
          id: "NC-EXT-01",
          type: "Minor Non-Conformance",
          clause: "ISO 9001:2015 Clause 8.5.1",
          description: "Lab log verification timestamps for week 6 experiments were not counter-signed by assigned instructors on physical registers.",
          assignedTo: "Priya Sharma (Course Coordinator)",
          deadline: "2026-11-15",
          status: "Pending Action"
        },
        {
          id: "NC-EXT-02",
          type: "Minor Non-Conformance",
          clause: "ISO 9001:2015 Clause 7.5.3",
          description: "Version stamp missing on practical module appendix documents in student repository.",
          assignedTo: "Dr. Rajesh Verma (Course Coordinator)",
          deadline: "2026-11-18",
          status: "Pending Action"
        }
      ]
    },

    ncClosure: null,
    externalAuditorApproval: null,
    qmsClosure: null,

    timeline: [
      {
        action: "Audit Schedule Received via Email",
        actor: "Dr. Katherine Price (Lead External Auditor - BSI)",
        timestamp: "2026-10-05 09:00 AM",
        details: "Audit timetable received via email from BSI Lead Auditor."
      },
      {
        action: "Schedule & Meeting Details Shared to All Stakeholders",
        actor: "Rahul Kumar (QMS Coordinator)",
        timestamp: "2026-10-05 11:30 AM",
        details: "Schedule details shared with all Course Coordinators, Trust Head, and Internal Auditor."
      },
      {
        action: "On-Site Audit Conducted & Paper NC Issued",
        actor: "Dr. Katherine Price (Lead External Auditor)",
        timestamp: "2026-10-18 04:30 PM",
        details: "External Auditor visited office in person to audit system, inspected records, and handed paper Non-Conformance document to QMS Coordinator."
      },
      {
        action: "Scanned Copy of Paper NC Uploaded & Shared to Course Coordinators Only",
        actor: "Rahul Kumar (QMS Coordinator)",
        timestamp: "2026-10-19 11:00 AM",
        details: "Scanned copy of physical paper NC document uploaded and shared exclusively to Course Coordinators for review and resolution closure."
      }
    ]
  },
  {
    id: "EA-2026-004",
    title: "ISO 9001:2015 Faculty Development & Evaluation Standards Audit",
    scope: "Evaluation of faculty development program records, peer observation checklists, and examination answer-sheet sample vetting.",
    externalAgency: "SGS India Quality Registrar",
    leadAuditor: {
      name: "Meera Krishnan",
      title: "Senior Lead External Auditor",
      agency: "SGS India Quality Registrar",
      email: "meera.krishnan@sgs.com",
      phone: "+91 97420 88990"
    },
    targetPeriod: "September 2026",
    scheduledDate: "2026-09-12",
    scheduledTime: "09:30 AM",
    venue: "Academic Council Room & Faculty Centre",
    department: "Academic Excellence & Training",
    process: "Training & Development",
    stage: 4,
    status: "NC Closed by Course Coordinator (Awaiting Auditor Approval)",
    createdAt: Date.now() - 50 * 24 * 60 * 60 * 1000,

    incomingScheduleEmail: {
      received: true,
      receivedAt: "2026-09-01 10:00 AM",
      from: "Meera Krishnan <meera.krishnan@sgs.com>",
      to: "Rahul Kumar (QMS Coordinator) <qm@cdac.in>",
      subject: "SGS ISO 9001:2015 External Audit Schedule - Academic Faculty Review",
      bodyHtml: "<p>Dear QMS Coordinator,</p><p>Please note the confirmed audit timetable for the faculty standards evaluation on 2026-09-12. The auditor will arrive at 09:30 AM.</p>",
      attachments: [{ fileName: "SGS_Audit_Schedule_Sep2026.pdf", fileSize: "1.2 MB" }]
    },

    shareWithStakeholders: {
      shared: true,
      sharedAt: "2026-09-01 01:30 PM",
      sharedBy: "Rahul Kumar (QMS Coordinator)",
      noticeSubject: "External Audit Notice: Faculty Development Standards on 12-Sep-2026",
      noticeMessage: "Shared to all Course Coordinators, Trust Head, and Internal Auditor.",
      recipients: [
        { role: "Trust Head", name: "Anita Rao", email: "head@cdac.in" },
        { role: "Course Coordinator", name: "Priya Sharma", email: "coordinator@cdac.in" },
        { role: "Internal Auditor", name: "Suresh Menon", email: "auditor@cdac.in" }
      ]
    },

    ncDocument: {
      receivedFromExternalAuditorInPerson: true,
      receivedAtOffice: "2026-09-12 04:00 PM",
      isScannedPaperCopy: true,
      uploadedAt: "2026-09-13 10:00 AM",
      uploadedBy: "Rahul Kumar (QMS Coordinator)",
      sharedWithCourseCoordinatorsOnly: true,
      fileName: "SGS_ISO9001_Scanned_Paper_NC_Report.pdf",
      fileSize: "1.9 MB",
      fileType: "application/pdf",
      summary: "1 minor observation regarding faculty workshop feedback archival counter-signatures.",
      targetClosureDate: "2026-09-28",
      findings: [
        {
          id: "NC-EXT-01",
          type: "Minor Non-Conformance",
          clause: "ISO 9001:2015 Clause 7.2",
          description: "Faculty workshop attendance logs lacked standard dual signature verification.",
          assignedTo: "Priya Sharma (Course Coordinator)",
          deadline: "2026-09-25",
          status: "Resolved"
        }
      ]
    },

    // Step 4: Course Coordinator downloaded scanned NC doc and submitted closure
    ncClosure: {
      closed: true,
      closedAt: "2026-09-24 03:15 PM",
      closedBy: "Priya Sharma (Course Coordinator)",
      remarks: "Scanned NC doc downloaded and verified. Standardized dual counter-signature protocol implemented across all academic departments. Archival verified.",
      actionPlan: "Standard Operating Procedure (SOP-ACA-04) revised. All instructors re-trained on digital counter-signature archiving."
    },

    externalAuditorApproval: null,
    qmsClosure: null,

    timeline: [
      {
        action: "Audit Schedule Received via Email",
        actor: "Meera Krishnan (Lead Auditor - SGS)",
        timestamp: "2026-09-01 10:00 AM",
        details: "Audit timetable received via email by QMS Coordinator."
      },
      {
        action: "Schedule & Details Shared to All Stakeholders",
        actor: "Rahul Kumar (QMS Coordinator)",
        timestamp: "2026-09-01 01:30 PM",
        details: "Shared to Course Coordinators, Trust Head, and Internal Auditor."
      },
      {
        action: "On-Site Audit Conducted & Paper NC Handed Over",
        actor: "Meera Krishnan (Lead Auditor)",
        timestamp: "2026-09-12 04:00 PM",
        details: "External Auditor conducted audit at office and gave paper NC doc to QMS Coordinator."
      },
      {
        action: "Scanned NC Document Uploaded (Course Coord Only)",
        actor: "Rahul Kumar (QMS Coordinator)",
        timestamp: "2026-09-13 10:00 AM",
        details: "Scanned paper NC uploaded and shared exclusively with Course Coordinators."
      },
      {
        action: "NC Document Downloaded & Closed by Course Coordinator",
        actor: "Priya Sharma (Course Coordinator)",
        timestamp: "2026-09-24 03:15 PM",
        details: "Course Coordinator downloaded scanned NC document, conducted root cause analysis, implemented corrective actions, and closed the NC."
      }
    ]
  },
  {
    id: "EA-2026-005",
    title: "ISO 9001:2015 Quality Management Governance & Strategic System Certification",
    scope: "Triennial ISO 9001:2015 system re-certification assessing academic administration, continuous improvement framework, customer satisfaction benchmarks, and trust leadership alignment.",
    externalAgency: "Bureau Veritas Certification Services",
    leadAuditor: {
      name: "Arthur Pendelton",
      title: "Senior Lead External Auditor",
      agency: "Bureau Veritas Certification",
      email: "arthur.pendelton@bureauveritas.com",
      phone: "+91 97654 32109"
    },
    targetPeriod: "May 2026",
    scheduledDate: "2026-05-15",
    scheduledTime: "09:30 AM",
    venue: "Executive Council Boardroom & Campus Facilities",
    department: "Quality Assurance & Compliance",
    process: "Quality Review & MRM",
    stage: 5,
    status: "Completed & Closed (ISO 9001 Certified)",
    createdAt: Date.now() - 170 * 24 * 60 * 60 * 1000,

    incomingScheduleEmail: {
      received: true,
      receivedAt: "2026-05-02 11:00 AM",
      from: "Arthur Pendelton <arthur.pendelton@bureauveritas.com>",
      to: "Rahul Kumar (QMS Coordinator) <qm@cdac.in>",
      subject: "Bureau Veritas ISO 9001:2015 Recertification Plan",
      bodyHtml: "<p>Dear QMS Coordinator,</p><p>Please find enclosed the confirmed schedule for the triennial ISO 9001:2015 system re-certification audit on 2026-05-15.</p>",
      attachments: [{ fileName: "BV_Recertification_Audit_Schedule.pdf", fileSize: "2.1 MB" }]
    },

    shareWithStakeholders: {
      shared: true,
      sharedAt: "2026-05-02 03:00 PM",
      sharedBy: "Rahul Kumar (QMS Coordinator)",
      noticeSubject: "Bureau Veritas Triennial Recertification Audit Schedule",
      noticeMessage: "Shared to all Course Coordinators, Trust Head, and Internal Auditor.",
      recipients: [
        { role: "Trust Head", name: "Anita Rao", email: "head@cdac.in" },
        { role: "Course Coordinator", name: "Priya Sharma", email: "coordinator@cdac.in" },
        { role: "Internal Auditor", name: "Suresh Menon", email: "auditor@cdac.in" }
      ]
    },

    ncDocument: {
      receivedFromExternalAuditorInPerson: true,
      receivedAtOffice: "2026-05-15 05:00 PM",
      isScannedPaperCopy: true,
      uploadedAt: "2026-05-16 10:30 AM",
      uploadedBy: "Rahul Kumar (QMS Coordinator)",
      sharedWithCourseCoordinatorsOnly: true,
      fileName: "BV_ISO9001_Scanned_Paper_NC_Report_Signed.pdf",
      fileSize: "1.8 MB",
      summary: "1 minor observation regarding documentation retention period in student grievance registry.",
      targetClosureDate: "2026-05-30",
      findings: [
        {
          id: "NC-EXT-01",
          type: "Opportunity for Improvement",
          clause: "ISO 9001:2015 Clause 9.1.2",
          description: "Archive retention policy for student satisfaction feedback standardized to 5 years.",
          assignedTo: "Priya Sharma (Course Coordinator)",
          deadline: "2026-05-28",
          status: "Resolved"
        }
      ]
    },

    ncClosure: {
      closed: true,
      closedAt: "2026-05-26 02:00 PM",
      closedBy: "Priya Sharma (Course Coordinator)",
      remarks: "Scanned paper NC downloaded. 5-year digital archival policy established and implemented.",
      actionPlan: "Standardized record retention schedule."
    },

    // Step 5: Approved by External Auditor (communicated in person at office) & Closed by QMS Coordinator
    externalAuditorApproval: {
      approved: true,
      approvedAt: "2026-05-29 03:30 PM",
      approvalMode: "Direct Office Visit (Auditor visited office in person)",
      decision: "Certified & Conformance Endorsed",
      certificateNumber: "ISO9001-BV-2026-9810",
      recommendation: "Unconditional recommendation for issuance and renewal of ISO 9001:2015 Quality Management Certificate.",
      remarks: "External Auditor visited the office in person, reviewed Course Coordinator corrective actions, accepted all resolutions, and endorsed ISO 9001:2015 certificate renewal.",
      externalLetterFileName: "BV_Certificate_Issuance_Recommendation.pdf"
    },

    qmsClosure: {
      closed: true,
      closedAt: "2026-05-30 11:00 AM",
      closedBy: "Rahul Kumar (QMS Coordinator)",
      remarks: "ISO 9001:2015 re-certification audit successfully completed and closed with full compliance certification following in-person auditor endorsement."
    },

    timeline: [
      {
        action: "Audit Schedule Received via Email",
        actor: "Arthur Pendelton (Senior External Auditor - Bureau Veritas)",
        timestamp: "2026-05-02 11:00 AM",
        details: "Audit schedule received via email by QMS Coordinator."
      },
      {
        action: "Schedule & Details Shared to All Stakeholders",
        actor: "Rahul Kumar (QMS Coordinator)",
        timestamp: "2026-05-02 03:00 PM",
        details: "Dispatched to all Course Coordinators, Trust Head, and Internal Auditor."
      },
      {
        action: "On-Site Audit Conducted & Paper NC Handed Over",
        actor: "Arthur Pendelton (Lead External Auditor)",
        timestamp: "2026-05-15 05:00 PM",
        details: "Full triennial ISO 9001 audit executed in person. Paper NC handed over to QMS Coordinator."
      },
      {
        action: "Scanned NC Document Uploaded (Course Coord Only)",
        actor: "Rahul Kumar (QMS Coordinator)",
        timestamp: "2026-05-16 10:30 AM",
        details: "Scanned copy of physical paper NC document uploaded and shared exclusively to Course Coordinators."
      },
      {
        action: "NC Document Downloaded & Closed by Course Coordinator",
        actor: "Priya Sharma (Course Coordinator)",
        timestamp: "2026-05-26 02:00 PM",
        details: "Course Coordinator downloaded scanned NC document, completed corrective actions, and submitted closure."
      },
      {
        action: "Audit Approved by External Auditor",
        actor: "Arthur Pendelton (Lead External Auditor)",
        timestamp: "2026-05-29 03:30 PM",
        details: "External Auditor visited office in person, verified all resolutions, and endorsed ISO 9001:2015 Certificate (ISO9001-BV-2026-9810)."
      },
      {
        action: "External Audit Process Officially Closed",
        actor: "Rahul Kumar (QMS Coordinator)",
        timestamp: "2026-05-30 11:00 AM",
        details: "Full process closed by QMS Coordinator. ISO 9001:2015 certification cycle successfully renewed."
      }
    ]
  }
];
